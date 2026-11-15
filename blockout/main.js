import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import {createFinished} from './finished.js';

const $=id=>document.getElementById(id);
const canvas=$('world');
const places={
  'visit-arcade':[-5.4,7.7,0],
  'visit-tea':[2.4,-1.5,Math.atan2(5.62,6.9),Math.atan2(2.93,Math.hypot(5.62,6.9))],
  'visit-junction':[-1.25,-9.5,0],
  'visit-store':[-2.6,1.13,-Math.PI/2,.15],
  // Arrive on the public street looking toward each northern storefront.
  // The points retain the shared visit() input-reset and menu-close behavior.
  'visit-lottery':[2.6,-47.35,Math.PI/2,.14],
  'visit-drugstore':[-2.6,-49.85,-Math.PI/2,.14],
  'visit-carrefour':[-2.6,-61.65,-Math.PI/2,.14],
  'visit-backstreet':[-23,-32.8,-1.95],
  // Arrive on the public sidewalk far enough back to see each entrance.
  'visit-clinic':[-22.55,20.55,Math.PI,.15],
  'visit-shrine':[-31.75,20.55,Math.PI,.25],
  'visit-park':[31,20.55,Math.PI],
  'visit-resident-home':[6.55,20.65,Math.PI],
  'visit-girl-home':[10.65,20.65,Math.PI],
  'visit-breakfast':[3.8,11.8,-Math.PI/2],
  'visit-school':[0,-89.0,0,.15],
};
let appReady=false;

async function boot(){
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<600?1.35:1.6));
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();showError('3D表示が一時停止しました。再読み込みしてください。');});
  canvas.addEventListener('webglcontextrestored',()=>location.reload());
  const camera=new THREE.PerspectiveCamera(58,1,.1,150);
  function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.fov=innerWidth<600?78:58;camera.updateProjectionMatrix();}
  addEventListener('resize',resize);resize();
  // Load only the finished world. It owns no persistent layout, and reports
  // missing optional models without preventing the rest of the scene opening.
  const finishedScene=new THREE.Scene();
  const finished=createFinished(finishedScene,renderer);
  await Promise.all([RAPIER.init(),finished.ready]);
  finished.setViewMode('walk');finished.setTime('day');
  if(finished.warnings.length)$('asset-notice').hidden=false;
  const physics=new RAPIER.World({x:0,y:-9.81,z:0});
  const player=physics.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0,.87,8));
  const playerCollider=physics.createCollider(RAPIER.ColliderDesc.capsule(.62,.23),player);
  const controller=physics.createCharacterController(.015);
  controller.enableAutostep(.24,.15,false);controller.enableSnapToGround(.35);controller.setSlideEnabled(true);
  let fixtures=[],yaw=0,pitch=-.03,velocity=0,evening=false,rainy=false;
  function addFixed(c){
    const shape=RAPIER.ColliderDesc.cuboid(c.size[0]/2,c.size[1]/2,c.size[2]/2).setTranslation(...c.position);
    const angle=c.rotation??0;shape.setRotation({x:0,y:Math.sin(angle/2),z:0,w:Math.cos(angle/2)});
    fixtures.push(physics.createCollider(shape));
  }
  function setFixtures(source){
    for(const fixture of fixtures)physics.removeCollider(fixture,true);fixtures=[];
    for(const c of source.groundColliders??[])addFixed(c);
    for(const c of source.colliders??[])addFixed(c);
    const bounds=source.bounds??{minX:-28,maxX:28,minZ:-37,maxZ:21};
    const bw=bounds.maxX-bounds.minX,bd=bounds.maxZ-bounds.minZ,bx=(bounds.minX+bounds.maxX)/2,bz=(bounds.minZ+bounds.maxZ)/2;
    for(const c of [[bounds.minX,1,bz,.25,4,bd],[bounds.maxX,1,bz,.25,4,bd],[bx,1,bounds.minZ,bw,4,.25],[bx,1,bounds.maxZ,bw,4,.25]])
      addFixed({position:c.slice(0,3),size:c.slice(3)});
    velocity=0;physics.step();
  }
  setFixtures(finished);
  $('time-toggle').addEventListener('click',()=>{
    evening=!evening;finished.setTime(evening?'evening':'day');
    const button=$('time-toggle');button.setAttribute('aria-pressed',String(evening));
    button.setAttribute('aria-label',evening?'昼に切り替える':'夕暮れに切り替える');
    button.querySelector('span').textContent=evening?'昼にする':'夕暮れ';
    renderer.shadowMap.needsUpdate=true;canvas.focus({preventScroll:true});
  });
  function setRainy(value){
    rainy=Boolean(value);finished.setWeather(rainy?'rain':'clear');
    const button=$('weather-toggle'),label=rainy?'晴れに切り替える':'雨天に切り替える';
    button.setAttribute('aria-pressed',String(rainy));button.setAttribute('aria-label',label);button.title=label;
    button.querySelector('i').textContent=rainy?'☀':'☂';button.querySelector('span').textContent=rainy?'晴れにする':'雨にする';
    renderer.shadowMap.needsUpdate=true;canvas.focus({preventScroll:true});
  }
  $('weather-toggle').addEventListener('click',()=>setRainy(!rainy));

  const keys=new Set(),joystick={x:0,y:0};let joystickPointer=null,lookPointer=null;
  const accepted=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft'];
  addEventListener('keydown',event=>{
    if(event.target instanceof HTMLElement && event.target.matches('input,textarea,select,button,a'))return;
    if(accepted.includes(event.code)){event.preventDefault();keys.add(event.code);}
  });
  addEventListener('keyup',event=>keys.delete(event.code));
  function resetInput(){keys.clear();joystick.x=0;joystick.y=0;lookPointer=null;joystickPointer=null;$('joystick-thumb').style.transform='translate(-50%,-50%)';}
  addEventListener('blur',resetInput);document.addEventListener('visibilitychange',resetInput);
  canvas.addEventListener('pointerdown',event=>{if(event.button!==0)return;lookPointer={id:event.pointerId,x:event.clientX,y:event.clientY};canvas.setPointerCapture(event.pointerId);canvas.focus({preventScroll:true});});
  canvas.addEventListener('pointermove',event=>{
    if(lookPointer?.id!==event.pointerId)return;
    yaw-=(event.clientX-lookPointer.x)*.004;pitch=THREE.MathUtils.clamp(pitch-(event.clientY-lookPointer.y)*.004,-1.25,1.25);
    lookPointer.x=event.clientX;lookPointer.y=event.clientY;
  });
  const endLook=event=>{if(lookPointer?.id===event.pointerId)lookPointer=null;};
  canvas.addEventListener('pointerup',endLook);canvas.addEventListener('pointercancel',endLook);canvas.addEventListener('contextmenu',event=>event.preventDefault());
  const joy=$('joystick');
  function moveJoystick(event){const r=joy.getBoundingClientRect(),radius=r.width*.31;let dx=event.clientX-r.left-r.width/2,dy=event.clientY-r.top-r.height/2;const d=Math.hypot(dx,dy);if(d>radius){dx*=radius/d;dy*=radius/d;}joystick.x=dx/radius;joystick.y=dy/radius;$('joystick-thumb').style.transform=`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`;}
  joy.addEventListener('pointerdown',event=>{joystickPointer=event.pointerId;joy.setPointerCapture(event.pointerId);moveJoystick(event);});
  joy.addEventListener('pointermove',event=>{if(joystickPointer===event.pointerId)moveJoystick(event);});
  function endJoystick(event){if(joystickPointer!==event.pointerId)return;joystickPointer=null;joystick.x=0;joystick.y=0;$('joystick-thumb').style.transform='translate(-50%,-50%)';}
  joy.addEventListener('pointerup',endJoystick);joy.addEventListener('pointercancel',endJoystick);
  function visit(x,z,heading,look=-.03){
    resetInput();player.setTranslation({x,y:.87,z},true);player.setNextKinematicTranslation({x,y:.87,z});
    yaw=heading;pitch=look;velocity=0;physics.step();camera.position.set(x,1.67,z);camera.rotation.set(pitch,yaw,0,'YXZ');
    $('places-list').hidden=true;$('places-toggle').setAttribute('aria-expanded','false');canvas.focus({preventScroll:true});
  }
  $('go-home').addEventListener('click',()=>visit(0,8,0));
  $('places-toggle').addEventListener('click',()=>{const expanded=$('places-list').hidden;$('places-list').hidden=!expanded;$('places-toggle').setAttribute('aria-expanded',String(expanded));});
  for(const [id,position] of Object.entries(places))$(id).addEventListener('click',()=>visit(...position));
  $('visit-rain-street').addEventListener('click',()=>{setRainy(true);visit(0,8,0,.04);});

  function simulate(dt){
    let side=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)+joystick.x;
    let forward=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-joystick.y;
    const length=Math.hypot(side,forward);if(length>1){side/=length;forward/=length;}
    const speed=keys.has('ShiftLeft')?2.8:1.6;velocity=Math.max(velocity-9.81*dt,-12);
    controller.computeColliderMovement(playerCollider,{x:(side*Math.cos(yaw)-forward*Math.sin(yaw))*speed*dt,y:velocity*dt,z:(-side*Math.sin(yaw)-forward*Math.cos(yaw))*speed*dt});
    const movement=controller.computedMovement(),position=player.translation();
    player.setNextKinematicTranslation({x:position.x+movement.x,y:position.y+movement.y,z:position.z+movement.z});
    if(controller.computedGrounded())velocity=0;physics.timestep=dt;physics.step();
    const p=player.translation();camera.position.set(p.x,p.y+.8,p.z);camera.rotation.set(pitch,yaw,0,'YXZ');
  }
  camera.position.set(0,1.67,8);camera.rotation.set(pitch,yaw,0,'YXZ');
  $('loading').hidden=true;appReady=true;
  window.blockoutWorld={getSnapshot:()=>({ready:appReady,stage:3,finishedReady:true,finishedFailure:false,finishedAssets:finished.assets,finishedWarnings:finished.warnings,community:finished.getCommunitySnapshot(),rainStreet:finished.getRainStreetSnapshot(),evening,rainy,weather:rainy?'rain':'clear',player:{...player.translation()},yaw,pitch,camera:camera.position.toArray(),drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles})};
  const timer=new THREE.Timer();timer.connect(document);timer.reset();let accumulator=0;
  renderer.setAnimationLoop(timestamp=>{
    timer.update(timestamp);
    const dt=Math.min(Math.max(0,timer.getDelta()),.25);if(document.hidden){accumulator=0;return;}
    accumulator+=dt;while(accumulator>=1/60){simulate(1/60);accumulator-=1/60;}
    finished.update?.(dt,camera);
    renderer.render(finishedScene,camera);
  });
}
function showError(message){$('loading').hidden=true;$('error').hidden=false;$('error-message').textContent=message;}
boot().catch(error=>{console.error(error);showError('通信とブラウザの3D表示設定を確認して、もう一度開いてください。');});
