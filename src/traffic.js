import * as THREE from 'three';
import {createSurfaceMaterial} from './surfaces.js';

// Original junction furniture, informed by the Dihua / Minsheng photo reference.
// Dimensions are metres. This is a reconstructed block, not surveyed road data.
const PHASES = [
  {name:'main-green',duration:14,main:'green',cross:'red',pedestrians:'red'},
  {name:'main-amber',duration:3,main:'amber',cross:'red',pedestrians:'red'},
  {name:'clear-main',duration:1.5,main:'red',cross:'red',pedestrians:'red'},
  {name:'cross-green',duration:16,main:'red',cross:'green',pedestrians:'red'},
  {name:'cross-amber',duration:3,main:'red',cross:'amber',pedestrians:'red'},
  {name:'clear-cross',duration:1.5,main:'red',cross:'red',pedestrians:'red'},
  {name:'pedestrian-green',duration:12,main:'red',cross:'red',pedestrians:'green'},
  {name:'pedestrian-clearance',duration:4,main:'red',cross:'red',pedestrians:'flashing-green'},
  {name:'clear-pedestrians',duration:2,main:'red',cross:'red',pedestrians:'red'},
];
export const SIGNAL_CYCLE_SECONDS=PHASES.reduce((sum,phase)=>sum+phase.duration,0);

export function signalStateAt(seconds) {
  const cycleTime=((seconds%SIGNAL_CYCLE_SECONDS)+SIGNAL_CYCLE_SECONDS)%SIGNAL_CYCLE_SECONDS;
  let remaining=cycleTime;
  for(const phase of PHASES){
    if(remaining<phase.duration)return {phase:phase.name,main:phase.main,cross:phase.cross,pedestrians:phase.pedestrians,phaseSeconds:remaining,cycleSeconds:cycleTime};
    remaining-=phase.duration;
  }
  return {phase:PHASES[0].name,main:'green',cross:'red',pedestrians:'red',phaseSeconds:0,cycleSeconds:0};
}

export function buildTraffic(scene,floorHeight=()=>.14) {
  const root=new THREE.Group();root.name='Dihua-inspired intersection signals and crossings';scene.add(root);
  const colliders=[];
  const crossings=[
    {name:'south',center:[0,-12.25],size:[5.5,2.0],direction:'east-west'},
    {name:'north',center:[0,-20.75],size:[5.5,2.0],direction:'east-west'},
    {name:'west',center:[-5.7,-16.5],size:[2.0,5.5],direction:'north-south'},
    {name:'east',center:[5.7,-16.5],size:[2.0,5.5],direction:'north-south'},
  ];
  const dark=createSurfaceMaterial('paint','#263333',{roughness:.57,metalness:0});
  const steel=createSurfaceMaterial('metal','#a3aaa6',{roughness:.47,metalness:.82});
  const paint=createSurfaceMaterial('paint','#ddd9c9',{roughness:.91,metalness:0});
  // Road paint retains its approved dimensions and its nearly flush geometry.
  // World-space, gently blended wear adds flecks in the painted film without
  // stacking extra decals over crossings or changing their traffic meaning.
  if(!paint.userData.streetPaintWearApplied){
    const paintCompile=paint.onBeforeCompile,paintKey=paint.customProgramCacheKey();
    paint.onBeforeCompile=(shader,renderer)=>{
      paintCompile(shader,renderer);
      shader.fragmentShader=shader.fragmentShader.replace('void main() {',/* glsl */`
      float taiwanLaneHash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453);
      }
      float taiwanLaneNoise(vec2 p) {
        vec2 cell=floor(p), t=fract(p); t=t*t*(3.0-2.0*t);
        return mix(mix(taiwanLaneHash(cell),taiwanLaneHash(cell+vec2(1.0,0.0)),t.x),
                   mix(taiwanLaneHash(cell+vec2(0.0,1.0)),taiwanLaneHash(cell+vec2(1.0,1.0)),t.x),t.y);
      }
      void main() {
    `);
      shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',/* glsl */`
      #include <color_fragment>
      vec2 twLaneUV=mat2(0.866,0.5,-0.5,0.866)*(vTaiwanSurfaceWorld.xz*18.0);
      float twRoadWear=0.65*taiwanLaneNoise(twLaneUV)+
                       0.35*taiwanLaneNoise(twLaneUV*2.37+vec2(11.3,7.2));
      diffuseColor.rgb*=mix(0.93,1.0,smoothstep(0.20,0.78,twRoadWear));
      `);
    };
    paint.customProgramCacheKey=()=>paintKey+'|street-paint-wear-v1';
    paint.userData.streetPaintWearApplied=true;
  }
  const recess=new THREE.MeshStandardMaterial({color:'#111b1b',roughness:.88});
  const redFigure=new THREE.MeshBasicMaterial({color:'#f84c3e',toneMapped:false});
  const greenFigure=new THREE.MeshBasicMaterial({color:'#36e594',toneMapped:false});
  const geometries={box:new THREE.BoxGeometry(1,1,1),cylinder:new THREE.CylinderGeometry(1,1,1,12),sphere:new THREE.SphereGeometry(1,10,7),hood:new THREE.CylinderGeometry(1,1,1,16,1,true)};
  const batches=new Map(),dummy=new THREE.Object3D();
  function primitive(type,material,position,scale,rotation=[0,0,0]){
    const key=type+material.uuid;
    if(!batches.has(key))batches.set(key,{geometry:geometries[type],material,matrices:[]});
    dummy.position.set(...position);dummy.scale.set(...scale);dummy.rotation.set(...rotation);dummy.updateMatrix();
    batches.get(key).matrices.push(dummy.matrix.clone());
  }
  const box=(material,x,y,z,w,h,d,ry=0)=>primitive('box',material,[x,y,z],[w,h,d],[0,ry,0]);
  const localPoint=(cx,cz,x,z,angle)=>[cx+Math.cos(angle)*x+Math.sin(angle)*z,cz-Math.sin(angle)*x+Math.cos(angle)*z];

  // A crossing is aligned with each connected sidewalk, rather than placed midblock.
  for(const crossing of crossings){
    const [cx,cz]=crossing.center;
    for(let i=0;i<8;i++){
      const offset=-2.45+i*.7;
      if(crossing.direction==='east-west')box(paint,cx+offset,.049,cz,.38,.004,2);
      else box(paint,cx,.049,cz+offset,2,.004,.38);
    }
  }
  // Taiwan uses right-hand traffic. Stop lines precede the pedestrian crossings.
  box(paint,1.45,.049,-10.85,2.75,.004,.24);
  box(paint,-1.45,.049,-22.15,2.75,.004,.24);
  box(paint,-7.1,.049,-15.05,.24,.004,2.75);
  box(paint,7.1,.049,-17.95,.24,.004,2.75);

  const poles=new Map();
  function pole(x,z,height){
    const key=x+':'+z;
    const old=poles.get(key);if(old&&old.height>=height)return;
    // All pole calls are made with their final height before attaching heads.
    poles.set(key,{x,z,height});
  }
  // Vehicle heads are on the far side of their approach, not facing the sidewalk.
  const heads=[
    {axis:'main',x:1.45,z:-21.65,angle:0,pole:[3.4,-21.65]},
    {axis:'main',x:-1.45,z:-11.35,angle:Math.PI,pole:[-3.4,-11.35]},
    {axis:'cross',x:7.65,z:-15.05,angle:-Math.PI/2,pole:[7.65,-13.15]},
    {axis:'cross',x:-7.65,z:-17.95,angle:Math.PI/2,pole:[-7.65,-19.9]},
  ];
  const lenses=[];
  for(const head of heads){
    const [px,pz]=head.pole;pole(px,pz,5.15);
    if(Math.abs(px-head.x)>.1)box(steel,(px+head.x)/2,4.94,pz,Math.abs(px-head.x)+.10,.105,.105);
    else box(steel,px,4.94,(pz+head.z)/2,.105,.105,Math.abs(pz-head.z)+.10);
    const b=(m,lx,y,lz,w,h,d)=>{const [x,z]=localPoint(head.x,head.z,lx,lz,head.angle);box(m,x,y,z,w,h,d,head.angle);};
    b(dark,0,4.67,0,1.12,.43,.22);
    b(steel,0,4.95,-.07,.065,.23,.06);
    // Horizontal red-amber-green layout is characteristic of the local reference.
    ['red','amber','green'].forEach((lamp,i)=>{
      const lx=(i-1)*.345;
      let [x,z]=localPoint(head.x,head.z,lx,.17,head.angle);
      primitive('hood',dark,[x,4.67,z],[.145,.22,.145],[Math.PI/2,0,-head.angle]);
      [x,z]=localPoint(head.x,head.z,lx,.145,head.angle);
      dummy.position.set(x,4.67,z);dummy.rotation.set(Math.PI/2,0,-head.angle);dummy.scale.set(.124,.025,.124);dummy.updateMatrix();
      lenses.push({matrix:dummy.matrix.clone(),axis:head.axis,lamp});
      b(steel,lx,4.67,-.125,.07,.07,.03);
    });
  }

  const pedestrianHeads=[];
  // Masts sit beside each crossing, leaving its straight walking line clear.
  for(const z of [-11.35,-21.65])for(const side of [-1,1])pedestrianHeads.push({x:side*3.4,z,angle:-side*Math.PI/2});
  for(const x of [-6.6,6.6]){
    pedestrianHeads.push({x,z:-13.15,angle:Math.PI});
    pedestrianHeads.push({x,z:-19.9,angle:0});
  }
  for(const head of pedestrianHeads){
    const tallPole=heads.find(v=>v.pole[0]===head.x&&v.pole[1]===head.z);
    pole(head.x,head.z,tallPole?5.15:3.06);
    const b=(m,lx,y,lz,w,h,d)=>{const [x,z]=localPoint(head.x,head.z,lx,lz,head.angle);box(m,x,y,z,w,h,d,head.angle);};
    b(steel,0,2.54,.08,.055,.07,.22);
    b(dark,0,2.51,.21,.37,.77,.18);
    for(const y of [2.70,2.33]){
      b(recess,0,y,.31,.305,.315,.025);
      b(dark,0,y+.17,.365,.37,.026,.16);
    }
    function limb(m,ax,ay,bx,by,thickness){
      const mx=(ax+bx)/2,my=(ay+by)/2,[x,z]=localPoint(head.x,head.z,mx,.332,head.angle);
      dummy.position.set(x,my,z);dummy.scale.set(thickness,Math.hypot(bx-ax,by-ay),.012);
      const faceRotation=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),head.angle);
      const limbRotation=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),-Math.atan2(bx-ax,by-ay));
      dummy.quaternion.copy(faceRotation.multiply(limbRotation));dummy.updateMatrix();
      const key='box'+m.uuid;if(!batches.has(key))batches.set(key,{geometry:geometries.box,material:m,matrices:[]});
      batches.get(key).matrices.push(dummy.matrix.clone());
    }
    function iconHead(m,lx,y){const [x,z]=localPoint(head.x,head.z,lx,.34,head.angle);primitive('sphere',m,[x,y,z],[.033,.033,.011],[0,head.angle,0]);}
    // Recognisable standing and walking people, not generic coloured squares.
    iconHead(redFigure,0,2.80);
    limb(redFigure,0,2.755,0,2.665,.055);
    limb(redFigure,-.045,2.75,-.048,2.665,.022);limb(redFigure,.045,2.75,.048,2.665,.022);
    limb(redFigure,-.017,2.67,-.021,2.585,.025);limb(redFigure,.017,2.67,.021,2.585,.025);
    iconHead(greenFigure,.018,2.43);
    limb(greenFigure,.012,2.392,-.016,2.305,.048);
    limb(greenFigure,-.001,2.38,-.062,2.344,.021);limb(greenFigure,.015,2.378,.063,2.333,.021);
    limb(greenFigure,-.016,2.311,-.055,2.222,.026);limb(greenFigure,-.012,2.307,.037,2.27,.026);
    limb(greenFigure,.037,2.27,.064,2.225,.023);
  }
  for(const {x,z,height} of poles.values()){
    const base=floorHeight(x,z);
    primitive('cylinder',steel,[x,base+height/2,z],[.055,height,.055]);
    primitive('cylinder',dark,[x,base+.21,z],[.09,.42,.09]);
    box(steel,x,base+.025,z,.23,.05,.23);
    colliders.push({position:[x,base+height/2,z],size:[.15,height,.15]});
  }
  for(const batch of batches.values()){
    const mesh=new THREE.InstancedMesh(batch.geometry,batch.material,batch.matrices.length);
    batch.matrices.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));mesh.instanceMatrix.needsUpdate=true;
    mesh.castShadow=true;mesh.receiveShadow=true;mesh.computeBoundingSphere();root.add(mesh);
  }
  const lensMesh=new THREE.InstancedMesh(geometries.cylinder,new THREE.MeshBasicMaterial({color:0xffffff,toneMapped:false}),lenses.length);
  lenses.forEach((lens,i)=>lensMesh.setMatrixAt(i,lens.matrix));lensMesh.instanceMatrix.needsUpdate=true;lensMesh.computeBoundingSphere();root.add(lensMesh);
  const lit={red:new THREE.Color('#ff4838'),amber:new THREE.Color('#ffc532'),green:new THREE.Color('#2ce593')};
  const unlit={red:new THREE.Color('#432e2b'),amber:new THREE.Color('#413b28'),green:new THREE.Color('#203f35')};
  let elapsed=0,previousDisplay='';
  function update(dt){
    if(Number.isFinite(dt)&&dt>0)elapsed=(elapsed+dt)%SIGNAL_CYCLE_SECONDS;
    const state=signalStateAt(elapsed);
    const walking=state.pedestrians==='green'||(state.pedestrians==='flashing-green'&&Math.floor(state.phaseSeconds*2)%2===0);
    const display=state.main+state.cross+state.pedestrians+walking;
    if(display===previousDisplay)return;
    previousDisplay=display;
    lenses.forEach((lens,i)=>lensMesh.setColorAt(i,(state[lens.axis]===lens.lamp?lit:unlit)[lens.lamp]));
    lensMesh.instanceColor.needsUpdate=true;
    redFigure.color.set(state.pedestrians==='red'?'#f84c3e':'#34201d');
    greenFigure.color.set(walking?'#36e594':'#173a2c');
  }
  update(0);
  return {root,colliders,update,getSnapshot:()=>({...signalStateAt(elapsed),crossings:crossings.map(c=>({...c,center:[...c.center],size:[...c.size]})),vehicleHeadCount:heads.length,pedestrianHeadCount:pedestrianHeads.length})};
}
