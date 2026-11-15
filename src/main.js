import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {createDaylight} from './daylight.js';
import {createAtmosphere} from './atmosphere.js';
import {buildTraffic} from './traffic.js';
import {applyShelterOcclusion} from './shelter.js';
import {refinePropPrototype} from './props.js';
import {loadSignFont} from './typography.js';
import {loadBuildingDetails} from './building-details.js';
import {addCondensation} from './condensation.js';
import {createWind} from './wind.js';
import {WOODEN_CUTTING_BOARD_URL} from './optional-assets.js';
import {attachCuttingBoard} from './cutting-board.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import RAPIER from '@dimforge/rapier3d-compat';
import {buildWorld,spawn} from './world.js';
import {ASSETS,STORAGE_KEY,MAX_OBJECTS,PLACEMENT_BOUNDS,validateLayout,makeLayout,newId} from './state.js';

const $ = id => document.getElementById(id);
let toastTimer;
function toast(message) { $('toast').textContent=message; $('toast').classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>{$('toast').classList.remove('show');$('toast').textContent='';},3500); }
function fail(error) {console.error(error); $('loading').hidden=true; $('error-panel').hidden=false; $('error-panel').querySelector('p').textContent='街を読み込めませんでした。通信とブラウザの3D表示設定を確認して、もう一度開いてください。';}

async function boot() {
  const canvas=$('world');
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<600?1.35:1.6));
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.15;
  let mode='orbit';
  const scene=new THREE.Scene();
  const atmosphere=createAtmosphere(scene);
  const camera=new THREE.PerspectiveCamera(45,1,0.1,150);
  const controls=new OrbitControls(camera,canvas);
  controls.enableDamping=true; controls.dampingFactor=.08;
  controls.minDistance=4; controls.maxDistance=95; controls.maxPolarAngle=Math.PI/2-.025;
  controls.target.set(0,1,0);
  function home(){camera.position.set(17,32,24).multiplyScalar(innerWidth<600?1.25:1);controls.target.set(0,2,-3);controls.update();}
  home();
  function resize(){const w=innerWidth,h=innerHeight; renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=mode==='walk'?(w<600?78:58):(w<600?55:45);camera.updateProjectionMatrix();}
  addEventListener('resize',resize);resize();
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault(); $('error-panel').hidden=false; $('error-panel').querySelector('p').textContent='3D表示が一時停止しました。復帰しない場合は再読み込みしてください。';});
  canvas.addEventListener('webglcontextrestored',()=>location.reload());

  await loadSignFont();
  const environment=buildWorld(scene);
  const wind=createWind(scene);
  const condensation=addCondensation(scene);
  const traffic=buildTraffic(scene,environment.floorHeight);
  if(innerWidth<600)environment.lights.sun.shadow.mapSize.set(1024,1024);
  const daylight=createDaylight(scene,renderer,environment.lights);
  $('loading-text').textContent='街のパーツを読み込んでいます…';
  const loader=new GLTFLoader(); const prototypes=new Map();
  let loaded=0,buildingDetails={stats:{available:false}},buildingDetailsFailed=false;
  // The optional board is fetched in parallel, but never delays street boot.
  const cuttingBoardRequest=WOODEN_CUTTING_BOARD_URL
    ? loader.loadAsync(WOODEN_CUTTING_BOARD_URL).then(gltf=>gltf.scene)
      .catch(error=>{console.warn('Optional cutting board could not be loaded.',error);return null;})
    : null;
  await Promise.all([
    RAPIER.init(),
    loadBuildingDetails(scene,loader).then(detail=>{buildingDetails=detail;environment.colliders.push(...detail.colliders);})
      .catch(error=>{buildingDetailsFailed=true;console.warn('Some building equipment could not be loaded.',error);}),
    ...Object.entries(ASSETS).map(async ([kind,asset])=>{
      const gltf=await loader.loadAsync(`/assets/${asset.file}`);
      refinePropPrototype(gltf.scene,kind);
      gltf.scene.traverse(node=>{if(node.isMesh){node.castShadow=true;node.receiveShadow=true;}});
      prototypes.set(kind,gltf.scene);
      $('loading-text').textContent=`街のパーツ ${++loaded} / ${Object.keys(ASSETS).length}`;
    })
  ]);
  const physics=new RAPIER.World({x:0,y:-9.81,z:0});
  const fixedBox=(position,size,rotation=0)=>{
    const shape=RAPIER.ColliderDesc.cuboid(size[0]/2,size[1]/2,size[2]/2).setTranslation(...position);
    shape.setRotation({x:0,y:Math.sin(rotation/2),z:0,w:Math.cos(rotation/2)});
    return physics.createCollider(shape);
  };
  (environment.groundColliders??[{position:[0,-.15,0],size:[28,.3,24]}]).forEach(c=>fixedBox(c.position,c.size));
  environment.colliders.forEach(c=>fixedBox(c.position,c.size,c.rotation??0));
  traffic.colliders.forEach(c=>fixedBox(c.position,c.size,c.rotation??0));
  const bounds=environment.bounds??{minX:-14,maxX:14,minZ:-12,maxZ:12};
  const bw=bounds.maxX-bounds.minX,bd=bounds.maxZ-bounds.minZ,bx=(bounds.minX+bounds.maxX)/2,bz=(bounds.minZ+bounds.maxZ)/2;
  [[bounds.minX,1,bz,.25,4,bd],[bounds.maxX,1,bz,.25,4,bd],[bx,1,bounds.minZ,bw,4,.25],[bx,1,bounds.maxZ,bw,4,.25]].forEach(c=>fixedBox(c.slice(0,3),c.slice(3)));
  const player=physics.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(spawn.x,.87,spawn.z));
  const playerCollider=physics.createCollider(RAPIER.ColliderDesc.capsule(.62,.23),player);
  const controller=physics.createCharacterController(.015);
  controller.enableAutostep(.24,.15,false); controller.enableSnapToGround(.35); controller.setSlideEnabled(true);
  let evening=false,yaw=spawn.yaw,pitch=-.03,verticalVelocity=0;
  let orbitPosition=camera.position.clone(),orbitTarget=controls.target.clone();
  let records=[],selected=null,pendingKind=null;
  const instances=new Map(),propColliders=new Map();
  renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
  const selectionBox=new THREE.BoxHelper(new THREE.Object3D(),0xec913d);selectionBox.visible=false;scene.add(selectionBox);
  const defaults=makeLayout(environment.placements).objects;

  function addCollider(record){const size=ASSETS[record.kind].size;propColliders.set(record.id,fixedBox([record.x,record.y+size[1]/2,record.z],size,record.rotation));}
  function refreshCollider(record){const old=propColliders.get(record.id);if(old)physics.removeCollider(old,true);addCollider(record);}
  function syncTransform(record){renderer.shadowMap.needsUpdate=true;const object=instances.get(record.id);object.position.set(record.x,record.y,record.z);object.rotation.y=record.rotation;object.updateMatrixWorld(true);if(selected===record.id)selectionBox.setFromObject(object);}
  function addInstance(record){const object=prototypes.get(record.kind).clone(true);object.userData.propId=record.id;scene.add(object);instances.set(record.id,object);syncTransform(record);addCollider(record);}
  function persist(){atmosphere.sync(records);try{localStorage.setItem(STORAGE_KEY,JSON.stringify(makeLayout(records)));$('status').textContent='このブラウザに保存済み';}catch{$('status').textContent='保存できませんでした。配置を書き出してください';}}
  function select(id){selected=id; const record=records.find(r=>r.id===id);selectionBox.visible=!!record && mode==='edit';if(record)selectionBox.setFromObject(instances.get(id));$('selected-name').textContent=record?ASSETS[record.kind].name:'パーツを選ぶか、下から追加';['rotate-left','rotate-right','delete-object'].forEach(k=>$(k).disabled=!record);}
  function loadLayout(objects){select(null);for(const object of instances.values())scene.remove(object);for(const collider of propColliders.values())physics.removeCollider(collider,true);instances.clear();propColliders.clear();records=objects.map(o=>({...o}));records.forEach(addInstance);atmosphere.sync(records);renderer.shadowMap.needsUpdate=true;}
  let initial=defaults;
  try{const saved=localStorage.getItem(STORAGE_KEY);if(saved)initial=validateLayout(JSON.parse(saved)).objects;}catch{toast('保存データを読み込めないため、最初の配置を表示します');}
  loadLayout(initial);
  applyShelterOcclusion(scene);
  physics.step();
  // When the optional download completes, decorate the prototype for future
  // clones and attach equivalent clones to every currently placed stall. All
  // clones share geometry/materials. If a load fails, the original stall stays.
  if(cuttingBoardRequest)cuttingBoardRequest.then(board=>{
    if(!board)return;
    try{
      const prototype=prototypes.get('stall');
      const holder=attachCuttingBoard(prototype,board);
      // Apply this also when a saved layout happens to contain no stalls.
      applyShelterOcclusion(prototype);
      for(const record of records)if(record.kind==='stall'){
        const instance=instances.get(record.id);
        if(instance)instance.add(holder.clone(true));
      }
      renderer.shadowMap.needsUpdate=true;
    }catch(error){console.warn('Optional cutting board could not be attached.',error);}
  });

  function resetInput(){if(dragging){const record=records.find(r=>r.id===dragging.id);if(record){refreshCollider(record);persist();}}keys.clear();joystick.x=0;joystick.y=0;$('joystick-thumb').style.transform='translate(-50%,-50%)';lookPointer=null;dragging=null;controls.enabled=mode!=='walk';}
  function setMode(next){
    resetInput(); pendingKind=null;document.querySelectorAll('[data-kind]').forEach(b=>b.classList.remove('active'));
    if(mode!=='walk' && next==='walk'){orbitPosition.copy(camera.position);orbitTarget.copy(controls.target);}
    if(mode==='walk' && next!=='walk'){
      camera.position.copy(orbitPosition);controls.target.copy(orbitTarget);
      if(next==='edit'){
        // Place the editing camera around the location the visitor was just
        // exploring, so outlying shops and rear lanes are reachable on mobile.
        const playerPosition=player.translation();
        const target=new THREE.Vector3(playerPosition.x,.35,playerPosition.z);
        // Stay within the lane rather than looking down through the roofs of
        // the neighbouring buildings. The target stays directly below us.
        camera.position.set(target.x-Math.sin(yaw)*6,7,target.z-Math.cos(yaw)*6);
        controls.target.copy(target);
      }
      controls.update();
    }
    mode=next;environment.setViewMode?.(mode);renderer.shadowMap.needsUpdate=true;resize();controls.enabled=mode!=='walk';
    $('edit-panel').hidden=mode!=='edit';$('walk-controls').hidden=mode!=='walk';$('crosshair').hidden=mode!=='walk';
    $('street-stops').hidden=mode!=='walk';
    for(const kind of ['orbit','walk','edit']){$(`${kind}-mode`).classList.toggle('active',mode===kind);$(`${kind}-mode`).setAttribute('aria-pressed',String(mode===kind));}
    $('mode-label').textContent={orbit:'街を見渡す',walk:'小巷を歩く',edit:'自分の街をつくる'}[mode];
    $('status').textContent={orbit:'ドラッグで回転 · ピンチで拡大',walk:'左で移動 · 右で見回す / WASDで移動',edit:'パーツを選んで追加 · ドラッグで移動'}[mode];
    selectionBox.visible=!!selected&&mode==='edit';
    if(mode==='walk')toast('左のスティックで移動。画面をドラッグして見回せます');
    if(mode==='edit')toast('下のパーツを選んで、街の地面をタップすると追加できます');
  }
  for(const name of ['orbit','walk','edit'])$(`${name}-mode`).addEventListener('click',()=>setMode(name));
  $('home-camera').addEventListener('click',()=>{if(mode==='walk'){player.setTranslation({x:spawn.x,y:.87,z:spawn.z},true);player.setNextKinematicTranslation({x:spawn.x,y:.87,z:spawn.z});yaw=spawn.yaw;pitch=-.03;verticalVelocity=0;}else home();});
  function visitStreetStop(x,z,heading,label){
    // Keep saved furniture intact and avoid arriving inside a user-placed prop.
    const positions=[0,.7,-.7,1.4,-1.4].map(offset=>({x,z:z+offset}));
    const destination=positions.find(p=>!records.some(r=>{
      const size=ASSETS[r.kind].size,dx=p.x-r.x,dz=p.z-r.z,c=Math.cos(r.rotation),s=Math.sin(r.rotation);
      return Math.abs(dx*c-dz*s)<size[0]/2+.3&&Math.abs(dx*s+dz*c)<size[2]/2+.3&&r.y<1.9;
    }));
    if(!destination){toast('この場所にはパーツが置かれています。歩いて近づいてみてください');return;}
    resetInput();const position={...destination,y:floorHeight(destination.x,destination.z)+.87};
    player.setTranslation(position,true);player.setNextKinematicTranslation(position);yaw=heading;pitch=-.015;verticalVelocity=0;
    toast(label);
  }
  $('visit-arcade').addEventListener('click',()=>visitStreetStop(-5.4,7.7,0,'騎樓 — 軒下を通って店先を歩けます'));
  $('visit-junction').addEventListener('click',()=>visitStreetStop(-1.25,-9.5,0,'交差点 — 迪化街の街角を参考にしています'));
  $('visit-shops').addEventListener('click',()=>visitStreetStop(-11.9,-20.2,0,'長和路 — 銀行・通訊行から、熱炒・麵包坊まで歩けます'));
  $('visit-backstreet').addEventListener('click',()=>visitStreetStop(-23,-32.8,-1.95,'裏路地 — 建物の背面や非常階段を見られます'));
  $('time-toggle').addEventListener('click',()=>{evening=!evening;environment.setTime(evening?'evening':'day');daylight.setTime(evening?'evening':'day');renderer.shadowMap.needsUpdate=true;$('time-toggle').textContent=evening?'昼にする':'夕暮れ';$('time-toggle').setAttribute('aria-pressed',String(evening));});
  $('help-toggle').addEventListener('click',()=>{$('help-panel').hidden=!$('help-panel').hidden;$('help-toggle').setAttribute('aria-expanded',String(!$('help-panel').hidden));});
  document.querySelectorAll('[data-kind]').forEach(button=>button.addEventListener('click',()=>{pendingKind=button.dataset.kind;select(null);document.querySelectorAll('[data-kind]').forEach(b=>b.classList.toggle('active',b===button));toast(`${ASSETS[pendingKind].name}を置く場所をタップ`);}));
  function rotate(direction){const record=records.find(r=>r.id===selected);if(!record)return;record.rotation=(record.rotation+direction*Math.PI/4)%(Math.PI*2);syncTransform(record);refreshCollider(record);persist();}
  $('rotate-left').addEventListener('click',()=>rotate(-1));$('rotate-right').addEventListener('click',()=>rotate(1));
  function removeSelected(){if(!selected)return;renderer.shadowMap.needsUpdate=true;scene.remove(instances.get(selected));instances.delete(selected);physics.removeCollider(propColliders.get(selected),true);propColliders.delete(selected);records=records.filter(r=>r.id!==selected);select(null);persist();}
  $('delete-object').addEventListener('click',removeSelected);
  $('reset-layout').addEventListener('click',()=>{if(confirm('配置を最初の状態に戻しますか？ 今の配置は上書きされます。')){loadLayout(defaults);persist();toast('最初の配置に戻しました');}});
  $('export-layout').addEventListener('click',()=>{const blob=new Blob([JSON.stringify(makeLayout(records),null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='taiwan-lane-layout.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('配置ファイルを書き出しました');});
  $('import-layout').addEventListener('click',()=>$('import-file').click());
  $('import-file').addEventListener('change',async event=>{const file=event.target.files[0];if(!file)return;try{if(file.size>100000)throw new Error('配置ファイルは100KB以下にしてください。');const data=validateLayout(JSON.parse(await file.text()));loadLayout(data.objects);persist();toast('配置を読み込みました');}catch(error){toast(error.message||'配置を読み込めませんでした');}finally{event.target.value='';}});

  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),groundPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
  function cast(event){camera.updateMatrixWorld(true);const bounds=canvas.getBoundingClientRect();pointer.set((event.clientX-bounds.left)/bounds.width*2-1,-(event.clientY-bounds.top)/bounds.height*2+1);raycaster.setFromCamera(pointer,camera);}
  function groundPoint(event){cast(event);const point=new THREE.Vector3();return raycaster.ray.intersectPlane(groundPlane,point);}
  function getProp(event){cast(event);for(const hit of raycaster.intersectObjects([...instances.values()],true)){let obj=hit.object;while(obj){if(obj.userData.propId)return obj.userData.propId;obj=obj.parent;}}return null;}
  function floorHeight(x,z){return environment.floorHeight?.(x,z)??(x>4.4&&x<10.6&&z>-3.8&&z<4.8?.20:Math.abs(x)>3.0?.14:.015);}
  // A pot can rest on a horizontal surface, not the side of a shelf or the
  // vertical face of a package. Mesh hit normals are local to their object.
  function isUpwardSurface(hit){return !!hit.face&&hit.face.normal.clone().applyNormalMatrix(new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld)).y>.75;}
  const inPlacementBounds=point=>point.x>=PLACEMENT_BOUNDS.minX&&point.x<=PLACEMENT_BOUNDS.maxX&&point.z>=PLACEMENT_BOUNDS.minZ&&point.z<=PLACEMENT_BOUNDS.maxZ;
  function place(event){if(records.length>=MAX_OBJECTS){toast('パーツは60個まで配置できます');return;}const point=groundPoint(event);if(!point||!inPlacementBounds(point)){toast('街区の地面を選んでください');return;}let y=floorHeight(point.x,point.z);if(pendingKind==='teaEgg'){cast(event);const hit=raycaster.intersectObjects([...instances.values()],true)[0];if(hit&&hit.point.y<2&&inPlacementBounds(hit.point)){if(!isUpwardSurface(hit)){toast('鍋は台の上か地面に置いてください');return;}point.copy(hit.point);y=point.y+.015;}}
    const record={id:newId(),kind:pendingKind,x:Math.round(point.x*10)/10,y,z:Math.round(point.z*10)/10,rotation:0};records.push(record);addInstance(record);select(record.id);pendingKind=null;document.querySelectorAll('[data-kind]').forEach(b=>b.classList.remove('active'));persist();}
  let pointerStart=null,dragging=null,lookPointer=null;
  canvas.addEventListener('pointerdown',event=>{
    pointerStart={x:event.clientX,y:event.clientY,id:event.pointerId};
    if(mode==='walk'){lookPointer={id:event.pointerId,x:event.clientX,y:event.clientY};canvas.setPointerCapture(event.pointerId);return;}
    if(mode==='edit'&&!pendingKind&&event.button===0){const id=getProp(event);if(id){select(id);const p=groundPoint(event);const record=records.find(r=>r.id===id);dragging={id,pointerId:event.pointerId,dx:record.x-(p?.x??record.x),dz:record.z-(p?.z??record.z),moved:false};controls.enabled=false;canvas.setPointerCapture(event.pointerId);}}
  });
  canvas.addEventListener('pointermove',event=>{
    if(mode==='walk'&&lookPointer?.id===event.pointerId){yaw-=(event.clientX-lookPointer.x)*.004;pitch=THREE.MathUtils.clamp(pitch-(event.clientY-lookPointer.y)*.004,-1.25,1.25);lookPointer.x=event.clientX;lookPointer.y=event.clientY;}
    if(mode==='edit'&&dragging?.pointerId===event.pointerId){if(pointerStart&&Math.hypot(event.clientX-pointerStart.x,event.clientY-pointerStart.y)<4)return;const p=groundPoint(event);if(!p)return;const r=records.find(r=>r.id===dragging.id);r.x=Math.round(THREE.MathUtils.clamp(p.x+dragging.dx,PLACEMENT_BOUNDS.minX,PLACEMENT_BOUNDS.maxX)*10)/10;r.z=Math.round(THREE.MathUtils.clamp(p.z+dragging.dz,PLACEMENT_BOUNDS.minZ,PLACEMENT_BOUNDS.maxZ)*10)/10;r.y=floorHeight(r.x,r.z);if(r.kind==='teaEgg'){const downRay=new THREE.Raycaster(new THREE.Vector3(r.x,4,r.z),new THREE.Vector3(0,-1,0));const supports=downRay.intersectObjects([...instances.entries()].filter(([id])=>id!==r.id).map(([,obj])=>obj),true);const support=supports.find(hit=>hit.point.y<2&&isUpwardSurface(hit));if(support)r.y=support.point.y+.015;}dragging.moved=true;syncTransform(r);}
  });
  function pointerEnd(event,cancel=false){if(lookPointer?.id===event.pointerId)lookPointer=null;if(dragging?.pointerId===event.pointerId){const r=records.find(r=>r.id===dragging.id);refreshCollider(r);if(dragging.moved)persist();dragging=null;controls.enabled=mode!=='walk';}else if(!cancel&&mode==='edit'&&pointerStart?.id===event.pointerId&&Math.hypot(event.clientX-pointerStart.x,event.clientY-pointerStart.y)<6){if(pendingKind)place(event);else select(getProp(event));}pointerStart=null;}
  canvas.addEventListener('pointerup',event=>pointerEnd(event));canvas.addEventListener('pointercancel',event=>pointerEnd(event,true));canvas.addEventListener('contextmenu',event=>event.preventDefault());

  const keys=new Set(),joystick={x:0,y:0};let joystickPointer=null;
  addEventListener('keydown',event=>{if(event.target.matches('input,textarea,select'))return;if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft'].includes(event.code)){if(mode==='walk')event.preventDefault();keys.add(event.code);}if(event.code==='Escape'){pendingKind=null;select(null);$('help-panel').hidden=true;}if(mode==='edit'&&event.code==='Delete')removeSelected();});
  addEventListener('keyup',event=>keys.delete(event.code));addEventListener('blur',resetInput);document.addEventListener('visibilitychange',resetInput);
  const joyElement=$('joystick');
  function moveJoystick(event){const r=joyElement.getBoundingClientRect(),radius=r.width*.31;let dx=event.clientX-r.left-r.width/2,dy=event.clientY-r.top-r.height/2;const d=Math.hypot(dx,dy);if(d>radius){dx*=radius/d;dy*=radius/d;}joystick.x=dx/radius;joystick.y=dy/radius;$('joystick-thumb').style.transform=`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`;}
  joyElement.addEventListener('pointerdown',event=>{joystickPointer=event.pointerId;joyElement.setPointerCapture(event.pointerId);moveJoystick(event);});
  joyElement.addEventListener('pointermove',event=>{if(joystickPointer===event.pointerId)moveJoystick(event);});
  function endJoystick(){joystickPointer=null;joystick.x=0;joystick.y=0;$('joystick-thumb').style.transform='translate(-50%,-50%)';}
  joyElement.addEventListener('pointerup',endJoystick);joyElement.addEventListener('pointercancel',endJoystick);
  function simulate(dt){let side=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)+joystick.x;let forward=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-joystick.y;const len=Math.hypot(side,forward);if(len>1){side/=len;forward/=len;}const speed=keys.has('ShiftLeft')?2.8:1.6;verticalVelocity=Math.max(verticalVelocity-9.81*dt,-12);
    controller.computeColliderMovement(playerCollider,{x:(side*Math.cos(yaw)-forward*Math.sin(yaw))*speed*dt,y:verticalVelocity*dt,z:(-side*Math.sin(yaw)-forward*Math.cos(yaw))*speed*dt});
    const movement=controller.computedMovement(),p=player.translation();player.setNextKinematicTranslation({x:p.x+movement.x,y:p.y+movement.y,z:p.z+movement.z});if(controller.computedGrounded())verticalVelocity=0;physics.timestep=dt;physics.step();const pos=player.translation();camera.position.set(pos.x,pos.y+.80,pos.z);camera.rotation.set(pitch,yaw,0,'YXZ');
  }
  setMode('walk');
  // The first frame must use the walking eye, not the saved overhead camera;
  // otherwise rear-only details can flash into view until the first physics tick.
  const initialPlayer=player.translation();
  camera.position.set(initialPlayer.x,initialPlayer.y+.80,initialPlayer.z);
  camera.rotation.set(pitch,yaw,0,'YXZ');
  if(buildingDetails.update?.(camera))renderer.shadowMap.needsUpdate=true;
  $('loading').hidden=true;
  const clock=new THREE.Clock();let accumulator=0;
  renderer.setAnimationLoop(()=>{const dt=Math.min(clock.getDelta(),.25);if(document.hidden){accumulator=0;return;}if(mode==='walk'){accumulator+=dt;while(accumulator>=1/60){simulate(1/60);accumulator-=1/60;}}else{accumulator=0;controls.update();}wind.update(dt);atmosphere.update(dt,camera,wind.sample());environment.update?.(dt);environment.retailLighting.update(camera,dt);if(buildingDetails.update?.(camera))renderer.shadowMap.needsUpdate=true;daylight.update(dt);traffic.update(dt);renderer.render(scene,camera);});
  // A read-only diagnostics boundary for smoke tests; never part of persisted state.
  function cuttingBoardSnapshot(){
    const result=[];
    for(const [id,instance] of instances){
      const board=instance.getObjectByName('Wooden cutting board');
      if(board){
        let meshes=0,standardMaterials=0,castsShadow=true,shelterShaded=true;
        board.traverse(node=>{
          if(!node.isMesh)return;
          meshes++;castsShadow&&=node.castShadow;
          for(const material of Array.isArray(node.material)?node.material:[node.material])
            if(material?.isMeshStandardMaterial){standardMaterials++;if(!material.userData.shelterOcclusion)shelterShaded=false;}
        });
        result.push({id,position:board.getWorldPosition(new THREE.Vector3()).toArray(),quaternion:board.getWorldQuaternion(new THREE.Quaternion()).toArray(),localPosition:board.position.toArray(),castsShadow:meshes>0&&castsShadow,shelterShaded:standardMaterials>0&&shelterShaded});
      }
    }
    return result;
  }
  window.taiwanWorld={getSnapshot:()=>({ready:true,mode,evening,fov:camera.fov,bounds:{...bounds},traffic:traffic.getSnapshot(),signage:environment.signage,buildingDetails:{...buildingDetails.stats,rearVisible:buildingDetails.group?.getObjectByName('Rear wall equipment')?.visible??false},wind:{...wind.stats,sample:wind.sample()},condensation:condensation.stats,atmosphere:atmosphere.getSnapshot?.(),cuttingBoards:cuttingBoardSnapshot(),objects:records.map(r=>({...r})),player:{...player.translation()},camera:camera.position.toArray(),drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles}),project:(x,y,z)=>{camera.updateMatrixWorld(true);const v=new THREE.Vector3(x,y,z).project(camera);return {x:(v.x+1)*innerWidth/2,y:(1-v.y)*innerHeight/2};}};
  if(buildingDetailsFailed)toast('一部の建物設備を読み込めませんでした');
}
boot().catch(fail);
