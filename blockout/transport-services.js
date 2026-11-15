import * as THREE from 'three';
import {createStreetSignage} from '../src/signage.js';

// 榕南路 crosses the fictional 榕安街. The common signage atlas may
// be supplied by the caller so neighbouring facilities share one texture.
// All dimensions are metres; the 1.5m sidewalk stays clear of shelter seats.
export function addTransportServices(scene, {signage, scooterFactory = null} = {}) {
  const root=new THREE.Group();
  root.name='社區交通與公共設施';
  scene.add(root);
  const ownSigns=!signage;
  const signs=signage??createStreetSignage(root);
  const colliders=[];
  const boxGeo=new THREE.BoxGeometry(1,1,1);
  const cylinderGeo=new THREE.CylinderGeometry(1,1,1,12);
  const sphereGeo=new THREE.SphereGeometry(1,12,8);
  const materials={
    pole:new THREE.MeshStandardMaterial({color:'#879391',metalness:.62,roughness:.58}),
    dark:new THREE.MeshStandardMaterial({color:'#303c3b',metalness:.32,roughness:.68}),
    paint:new THREE.MeshStandardMaterial({color:'#ece9dc',roughness:.94}),
    tactile:new THREE.MeshStandardMaterial({color:'#bc9f5a',roughness:.89}),
    concrete:new THREE.MeshStandardMaterial({color:'#b3b4a9',roughness:.93}),
    paving:new THREE.MeshStandardMaterial({color:'#b7b9b1',roughness:.95}),
    green:new THREE.MeshStandardMaterial({color:'#436c58',roughness:.8}),
    blue:new THREE.MeshStandardMaterial({color:'#3f6675',roughness:.75}),
    white:new THREE.MeshStandardMaterial({color:'#e5e2d7',roughness:.8}),
    black:new THREE.MeshStandardMaterial({color:'#1e282a',roughness:.78}),
    scooterMint:new THREE.MeshStandardMaterial({color:'#8da9a2',metalness:.18,roughness:.45}),
    scooterCream:new THREE.MeshStandardMaterial({color:'#b7aa8e',metalness:.18,roughness:.45}),
    tail:new THREE.MeshStandardMaterial({color:'#9d4239',roughness:.62}),
    lamp:new THREE.MeshStandardMaterial({color:'#f9edcb',emissive:'#f6d5a0',emissiveIntensity:.4,roughness:.6}),
  };
  const batches=new Map(),temp=new THREE.Object3D();
  function primitive(geometry,material,position,scale,rotation=[0,0,0],shadow=true) {
    const key=geometry.uuid+':'+material.uuid+':'+shadow;
    if(!batches.has(key))batches.set(key,{geometry,material,shadow,matrices:[]});
    temp.position.set(...position);temp.rotation.set(...rotation);temp.scale.set(...scale);temp.updateMatrix();
    batches.get(key).matrices.push(temp.matrix.clone());
  }
  const box=(m,x,y,z,w,h,d,ry=0,shadow=true)=>primitive(boxGeo,m,[x,y,z],[w,h,d],[0,ry,0],shadow);
  const cyl=(m,x,y,z,r,h,rotation=[0,0,0],shadow=true)=>primitive(cylinderGeo,m,[x,y,z],[r,h,r],rotation,shadow);
  const ball=(m,x,y,z,sx,sy,sz,ry=0)=>primitive(sphereGeo,m,[x,y,z],[sx,sy,sz],[0,ry,0]);
  const hit=(x,y,z,w,h,d,rotation=0)=>colliders.push({position:[x,y,z],size:[w,h,d],rotation});

  // Two crossings connect the southern sidewalk to the neighbourhood's
  // clinic and park. The road itself already exists at z=17.2. These are
  // unsignalised markings, not a claim about any real-world street.
  for(const x of [-23.6,30.7]){
    for(let i=-2;i<=2;i++)box(materials.paint,x+i*.53,.052,17.2,.34,.006,5.55,0,false);
    // Short pieces of north-side landing, adjacent to the existing road.
    box(materials.paving,x,.065,13.79,3.6,.13,1.05);
    hit(x,.065,13.79,3.6,.13,1.05);
    // Tactile paving marks the crossing on both pedestrian approaches.
    for(const z of [20.54,13.79]){
      box(materials.tactile,x,.139,z,2.72,.018,.53,0,false);
      for(let col=-5;col<=5;col++)for(let row=-1;row<=1;row++)
        cyl(materials.white,x+col*.22,.153,z+row*.14,.019,.009,[0,0,0],false);
    }
    // A continuous surface meets the curb. The four low colliders below
    // approximate its slope for the existing character controller.
    const rampGeometry=new THREE.BufferGeometry();
    rampGeometry.setAttribute('position',new THREE.Float32BufferAttribute([
      x-1.36,.047,19.67, x+1.36,.047,19.67,
      x+1.36,.18,20.11, x-1.36,.18,20.11,
    ],3));
    rampGeometry.setIndex([0,2,1,0,3,2]);rampGeometry.computeVertexNormals();
    const ramp=new THREE.Mesh(rampGeometry,materials.paving);ramp.receiveShadow=true;root.add(ramp);
    for(let i=0;i<4;i++){
      const height=.035+i*.024,z=19.72+i*.095;
      hit(x,.046+height/2,z,2.72,height,.098);
    }
  }

  // Fictional cross-street name at the corner of 榕安街. Its pole stands
  // close to the curb and both faces can be read without mirrored lettering.
  cyl(materials.pole,3.40,1.68,20.17,.045,3.28);
  hit(3.40,1.65,20.17,.10,3.20,.10);
  box(materials.green,3.40,3.17,20.17,1.34,.46,.055);
  signs.add({text:'榕南路',detail:'Rongnan Rd.',x:3.40,y:3.17,z:20.13,width:1.28,height:.41,yaw:Math.PI,bg:'#126649'});
  signs.add({text:'榕南路',detail:'Rongnan Rd.',x:3.40,y:3.17,z:20.21,width:1.28,height:.41,yaw:0,bg:'#126649'});

  // One sheltered stop on the south side of the street. Its rear and seats
  // sit beyond the sidewalk (z>21.6); slender roof posts stand on its edge.
  const bx=19.45, front=21.72, back=23.08;
  for(const x of [17.55,21.35])for(const z of [front,back]){
    box(materials.pole,x,1.34,z,.07,2.52,.07);
    hit(x,1.3,z,.11,2.45,.11);
  }
  box(materials.pole,bx,2.62,22.40,4.12,.12,1.64);
  box(materials.white,bx,2.70,22.40,4.22,.06,1.74);
  box(materials.dark,bx,2.55,front,4.05,.12,.10);
  box(materials.pole,bx,.56,22.75,2.75,.09,.55);
  for(const x of [18.35,20.55])box(materials.pole,x,.32,22.75,.07,.52,.44);
  box(materials.pole,bx,1.02,23.05,2.75,.52,.055);
  hit(bx,.55,22.77,2.75,1.08,.58);
  // The stops and destination are illustrative, not an actual operating route.
  // Keep them on separate rows so a person at the shelter can read their order.
  cyl(materials.pole,20.95,1.36,21.62,.045,2.45);
  hit(20.95,1.25,21.62,.12,2.50,.12);
  box(materials.blue,20.95,2.34,21.62,.65,.83,.075);
  signs.add({text:'公車站',detail:'榕安街口',x:20.95,y:2.34,z:21.575,width:.60,height:.78,yaw:Math.PI,bg:'#295d6e',fg:'#fffbea'});
  box(materials.white,18.12,1.75,22.02,.93,1.10,.07);
  signs.add({text:'社區接駁',detail:'往市場',note:'路線示意',x:18.12,y:2.035,z:21.974,width:.87,height:.43,yaw:Math.PI,bg:'#f0eee3',fg:'#314d47'});
  signs.add({text:'榕安街口 → 診所',detail:'公園 → 市場',x:18.12,y:1.60,z:21.974,width:.87,height:.38,yaw:Math.PI,bg:'#f0eee3',fg:'#314d47'});
  signs.add({text:'本站：榕安街口',x:18.12,y:1.31,z:21.974,width:.87,height:.18,yaw:Math.PI,bg:'#f0eee3',fg:'#314d47'});
  box(materials.lamp,bx,2.55,22.33,2.55,.035,.10,0,false);
  const busLight=new THREE.PointLight('#f2e2bd',0,4.3,2);
  busLight.position.set(bx,2.46,22.25);busLight.visible=false;root.add(busLight);
  let evening=false,lastCamera=null;
  const cameraPosition=new THREE.Vector3(),lightPosition=new THREE.Vector3();
  function updateLight(camera){
    if(camera?.isCamera)lastCamera=camera;
    if(!evening||!lastCamera){busLight.visible=false;return;}
    lastCamera.getWorldPosition(cameraPosition);busLight.getWorldPosition(lightPosition);
    // Hysteresis prevents lights from flickering as the viewer crosses the
    // threshold, while keeping the point light out of distant street shaders.
    const cutoff=busLight.visible?17:14;
    busLight.visible=cameraPosition.distanceToSquared(lightPosition)<cutoff*cutoff;
  }

  // Existing street scooters use the same original simple shapes and sizes.
  // A small pull-in behind the sidewalk keeps parked vehicles out of the bus
  // lane and leaves the pedestrian strip open.
  // Long parking bays run towards the building, with the bikes centred
  // between the lines and enough depth for their body and rear plate.
  box(materials.concrete,13.4,.07,22.78,5.3,.14,2.34);
  hit(13.4,.07,22.78,5.3,.14,2.34);
  for(const x of [11.72,13.50,15.28])box(materials.paint,x,.144,22.72,.035,.006,2.18,0,false);
  function scooter(x,z,body,angle=Math.PI/2){
    if (scooterFactory) {
      const replacement = scooterFactory(x,z,angle,.14,body.color.getHexString());
      root.add(replacement.object);
      colliders.push(replacement.collider);
      return;
    }
    const pos=(lx,lz)=>[x+Math.cos(angle)*lx+Math.sin(angle)*lz,z-Math.sin(angle)*lx+Math.cos(angle)*lz];
    const b=(m,lx,y,lz,w,h,d)=>{const [px,pz]=pos(lx,lz);box(m,px,y+.14,pz,w,h,d,angle);};
    const s=(m,lx,y,lz,w,h,d)=>{const [px,pz]=pos(lx,lz);ball(m,px,y+.14,pz,w,h,d,angle);};
    const c=(m,lx,y,lz,r,h,rx)=>{const [px,pz]=pos(lx,lz);cyl(m,px,y+.14,pz,r,h,[rx,angle,Math.PI/2]);};
    for(const lz of [-.56,.55]){c(materials.black,0,.25,lz,.25,.15,0);c(materials.pole,.085,.25,lz,.13,.165,0);}
    s(body,0,.56,-.34,.27,.30,.44);s(materials.black,0,.84,-.23,.24,.065,.43);
    b(body,0,.31,.16,.44,.10,.68);s(body,0,.70,.53,.27,.42,.13);
    s(body,0,.40,.60,.23,.11,.32);b(materials.pole,0,1.06,.56,.045,.37,.045);
    s(body,0,1.19,.56,.33,.12,.14);b(materials.dark,0,1.20,.56,.72,.05,.065);
    b(materials.white,0,1.20,.70,.28,.14,.026);
    for(const side of [-1,1]){b(materials.pole,side*.27,1.35,.56,.018,.27,.018);s(materials.dark,side*.31,1.48,.56,.10,.06,.035);}
    s(materials.black,.015,.97,-.47,.19,.18,.19);
    // Rear lamp and plate make each parked scooter read from the street too.
    b(materials.tail,0,.60,-.765,.20,.095,.035);
    b(materials.white,0,.45,-.78,.24,.12,.025);
    hit(x,.80,z,.85,1.35,1.60,angle);
  }
  if (scooterFactory) {
    scooter(12.61,22.72,materials.scooterMint,0);
    scooter(14.39,22.72,materials.scooterCream,0);
  } else {
    // Keep the previously authored fallback if the GLB cannot be loaded.
    scooter(12.40,22.52,materials.scooterMint);
    scooter(14.37,22.52,materials.scooterCream);
  }
  cyl(materials.pole,15.92,1.18,21.88,.045,2.15);
  signs.add({text:'機車停車區',detail:'請依序停放',x:15.92,y:1.96,z:21.83,width:.62,height:.46,yaw:Math.PI,bg:'#e6e9df',fg:'#34544c'});

  // A shallow gutter grate lies flush with the road near the curb. It adds a
  // practical street detail without becoming a step or obstructing a crossing.
  box(materials.dark,16.85,.051,19.94,.78,.007,.28,0,false);
  for(let i=-5;i<=5;i++)box(materials.pole,16.85+i*.063,.056,19.94,.018,.004,.25,0,false);

  // A small, clearly marked pair of receptacles at the stop.
  for(const [x,material] of [[22.40,materials.dark],[23.03,materials.green]]){
    box(material,x,.55,22.11,.50,.82,.48);
    box(materials.pole,x,.99,22.11,.55,.08,.53);
    hit(x,.55,22.11,.52,.90,.50);
  }
  signs.add({text:'一般垃圾',x:22.40,y:.60,z:21.864,width:.43,height:.18,yaw:Math.PI,bg:'#ebe9df',fg:'#30483f'});
  signs.add({text:'資源回收',x:23.03,y:.60,z:21.864,width:.43,height:.18,yaw:Math.PI,bg:'#e9eee2',fg:'#315b48'});

  for(const {geometry,material,shadow,matrices} of batches.values()){
    const mesh=new THREE.InstancedMesh(geometry,material,matrices.length);
    matrices.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));
    mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=shadow;mesh.receiveShadow=true;
    mesh.computeBoundingSphere();root.add(mesh);
  }
  const signsInfo=ownSigns?signs.finalize():null;
  return {
    root,colliders,signsInfo,
    setTime(mode){
      evening=mode==='evening';
      busLight.intensity=evening?8:0;
      materials.lamp.emissiveIntensity=evening?1.05:.35;
      updateLight(lastCamera);
    },
    update(_dt,_wind,camera){updateLight(camera);},
    stats:{busStops:1,parkedScooters:2,crossings:2,recyclingBins:2},
  };
}
