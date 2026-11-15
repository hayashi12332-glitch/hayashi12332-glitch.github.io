import * as THREE from 'three';
import {createSurfaceMaterial} from '../src/surfaces.js';

// A small residence beside 28號, behind the existing scooter pull-in.
// The west entrance is reached via the clear strip beside the scooters.
// Furniture is scenery; it does not implement sleep, food or inventory.
export function addGirlHome(scene,{signage}={}){
  if(!signage?.add) throw new Error('Resident home needs shared signage');
  const root=new THREE.Group();root.name='佳寧的家';scene.add(root);
  const colliders=[],groundColliders=[];
  const boxGeo=new THREE.BoxGeometry(1,1,1);
  const cylinderGeo=new THREE.CylinderGeometry(1,1,1,12);
  const sphereGeo=new THREE.SphereGeometry(1,12,8);
  const ringGeo=new THREE.TorusGeometry(1,.095,8,24);
  const mats={
    plaster:createSurfaceMaterial('plaster','#c8c1b1',{roughness:.92}),
    trim:createSurfaceMaterial('plaster','#e1d9c9',{roughness:.87}),
    floor:createSurfaceMaterial('tile','#c8c5b8',{roughness:.90}),
    pavement:createSurfaceMaterial('concrete','#b8b5a9',{roughness:.94}),
    wood:createSurfaceMaterial('wood','#94755b',{roughness:.85}),
    darkWood:createSurfaceMaterial('wood','#715c4f',{roughness:.88}),
    dark:new THREE.MeshStandardMaterial({color:'#46514d',roughness:.84}),
    metal:createSurfaceMaterial('metal','#929c97',{metalness:.32,roughness:.68}),
    light:new THREE.MeshStandardMaterial({color:'#e5e1d3',roughness:.9}),
    glass:new THREE.MeshStandardMaterial({color:'#b8d0c6',transparent:true,opacity:.26,depthWrite:false,roughness:.25}),
    cloth:new THREE.MeshStandardMaterial({color:'#c6c4b4',roughness:1,side:THREE.DoubleSide}),
    blanket:new THREE.MeshStandardMaterial({color:'#8caaa2',roughness:.98}),
    pillow:new THREE.MeshStandardMaterial({color:'#e5decf',roughness:.99}),
    paper:new THREE.MeshStandardMaterial({color:'#e5dcc9',roughness:.94}),
    cover:new THREE.MeshStandardMaterial({color:'#b8786e',roughness:.94}),
    ink:new THREE.MeshStandardMaterial({color:'#62766f',roughness:.9}),
    orange:new THREE.MeshStandardMaterial({color:'#b86e47',roughness:.88}),
    leaf:new THREE.MeshStandardMaterial({color:'#65816b',roughness:.95}),
    blue:new THREE.MeshStandardMaterial({color:'#718e97',roughness:.95}),
    fadedRed:new THREE.MeshStandardMaterial({color:'#ae8375',roughness:.96}),
    glow:new THREE.MeshStandardMaterial({color:'#f0e8d7',emissive:'#ffdc9c',emissiveIntensity:.18,roughness:.8}),
  };
  const batches=new Map(),temp=new THREE.Object3D();
  function add(geometry,material,p,s,rotation=[0,0,0],cast=true){
    const key=geometry.uuid+':'+material.uuid+':'+cast;
    if(!batches.has(key))batches.set(key,{geometry,material,cast,matrices:[]});
    temp.position.set(...p);temp.rotation.set(...rotation);temp.scale.set(...s);temp.updateMatrix();
    batches.get(key).matrices.push(temp.matrix.clone());
  }
  function box(material,x,y,z,w,h,d,hit=false,cast=true){
    add(boxGeo,material,[x,y,z],[w,h,d],[0,0,0],cast);
    if(hit)colliders.push({position:[x,y,z],size:[w,h,d]});
  }
  const cyl=(material,x,y,z,r,h,cast=true)=>add(cylinderGeo,material,[x,y,z],[r,h,r],[0,0,0],cast);
  const orb=(material,x,y,z,sx,sy,sz)=>add(sphereGeo,material,[x,y,z],[sx,sy,sz]);
  function floor(x,z,w,d,material=mats.floor){
    box(material,x,.07,z,w,.14,d,false,false);
    groundColliders.push({position:[x,.07,z],size:[w,.14,d]});
  }
  // Join the original south sidewalk, scooter pull-in and house floor without
  // covering a parked scooter or leaving a step across the doorway.
  floor(10.05,22.925,1.40,2.65,mats.pavement);
  floor(13.50,23.875,5.50,.75,mats.pavement);
  floor(12.80,27.225,6.90,5.95);
  // Exterior envelope: solid party walls and rear, plus an open 1.2m doorway
  // at the west end of the front. The glazed window is separate from it.
  box(mats.plaster,9.43,1.72,27.22,.16,3.16,5.94,true);
  box(mats.plaster,16.17,1.72,27.22,.16,3.16,5.94,true);
  box(mats.plaster,12.80,1.72,30.12,6.90,3.16,.16,true);
  box(mats.plaster,9.70,1.72,24.25,.70,3.16,.18,true);
  box(mats.plaster,11.68,1.72,24.25,.86,3.16,.18,true);
  box(mats.plaster,15.70,1.72,24.25,1.10,3.16,.18,true);
  box(mats.plaster,13.58,.68,24.25,3.15,1.08,.18,true);
  box(mats.plaster,13.58,2.83,24.25,3.15,.94,.18,true);
  box(mats.glass,13.58,1.78,24.25,3.15,1.13,.035,true,false);
  for(const x of [12.02,13.58,15.14])box(mats.metal,x,1.78,24.21,.035,1.20,.04);
  box(mats.metal,13.58,1.20,24.21,3.15,.035,.04);
  box(mats.metal,13.58,2.35,24.21,3.15,.035,.04);
  // A wider curtain shields the sleeping area; the centre window still admits
  // daylight. Narrow framing marks a real entrance without closing the route.
  box(mats.cloth,12.28,1.79,24.39,.43,1.08,.016,false,false);
  box(mats.cloth,14.65,1.79,24.39,.98,1.08,.016,false,false);
  for(const x of [10.05,11.25])box(mats.darkWood,x,1.45,24.14,.05,2.60,.08);
  box(mats.darkWood,10.65,2.75,24.14,1.25,.06,.08);
  // A fixed-open security gate folds inward against the right jamb. The gate
  // has a thin physical collider and leaves the centre of the entry clear.
  for(const z of [24.28,25.10])box(mats.metal,11.22,1.31,z,.05,2.34,.05);
  for(const y of [.16,2.46])box(mats.metal,11.22,y,24.69,.05,.05,.87);
  for(const z of [24.43,24.58,24.73,24.88,25.03])
    box(mats.metal,11.22,1.31,z,.022,2.26,.022);
  for(const y of [.40,1.30,2.25])box(mats.metal,11.24,y,24.27,.08,.11,.06);
  box(mats.metal,11.19,1.18,25.06,.04,.25,.025);
  colliders.push({position:[11.22,1.31,24.69],size:[.06,2.34,.87]});
  // Upper-floor volume and arcade align with adjacent mixed-use houses.
  box(mats.plaster,12.80,5.25,27.22,6.90,3.88,5.94,true);
  box(mats.trim,12.80,3.24,23.17,6.90,.22,2.17);
  box(mats.trim,12.80,3.10,22.15,6.90,.32,.30);
  for(const x of [9.54,16.06])box(mats.trim,x,1.69,22.18,.32,3.10,.31,true);
  box(mats.trim,12.80,7.30,27.22,7.02,.16,6.08);
  for(const x of [11.50,14.18]){
    box(mats.dark,x,4.74,24.12,1.28,1.35,.04);
    box(mats.glass,x,4.74,24.09,1.14,1.20,.02,false,false);
    box(mats.metal,x,4.74,24.06,.025,1.20,.025);
    box(mats.trim,x,4.01,24.07,1.40,.10,.22);
  }
  box(mats.dark,11.54,1.92,24.10,.38,.45,.025,false,false);
  signage.add({text:'榕南路',detail:'30號',kind:'address',x:11.54,y:1.92,z:24.07,
    width:.35,height:.42,yaw:Math.PI,bg:'#286544',fg:'#fff9e9'});

  // Household kitchen and dining: surfaces are against walls, with a route
  // from the doorway along x≈10.65 clear of all furniture.
  box(mats.darkWood,10.45,.59,29.43,1.65,.90,.65,true);
  box(mats.light,10.45,1.06,29.43,1.70,.07,.70);
  box(mats.metal,10.68,1.105,29.39,.53,.03,.43);
  box(mats.dark,10.68,1.125,29.39,.42,.01,.31,false,false);
  box(mats.metal,10.83,1.26,29.68,.035,.31,.035);
  box(mats.metal,10.73,1.40,29.62,.22,.035,.035);
  // Upper cupboards, splashback, a hanging pan and a small kettle give the
  // work surface a lived-in scale without encroaching on the approach.
  box(mats.light,10.42,1.52,30.02,1.72,.68,.035,false,false);
  for(const x of [9.95,10.72]){
    box(mats.wood,x,2.20,29.91,.71,.63,.28);
    box(mats.metal,x+.24,2.15,29.76,.025,.16,.018);
  }
  box(mats.metal,11.14,1.67,29.96,.20,.35,.025);
  box(mats.dark,11.14,1.67,29.94,.15,.28,.02);
  cyl(mats.metal,9.92,1.18,29.38,.11,.22);
  cyl(mats.dark,9.92,1.305,29.38,.065,.035);
  // Refrigerator joins the kitchen at the rear, leaving the front-east
  // corner for an actual enclosed washroom.
  box(mats.light,11.82,.99,29.53,.83,1.70,.77,true);
  box(mats.metal,11.82,1.16,29.13,.65,.025,.025);
  box(mats.dark,12.15,1.45,29.10,.025,.23,.025);
  box(mats.darkWood,9.82,.30,24.95,.46,.32,.65);
  box(mats.dark,9.78,.19,25.43,.18,.10,.32);
  box(mats.blue,9.99,.19,25.43,.18,.10,.32);
  box(mats.metal,9.54,1.92,25.20,.02,.025,.55);
  for(const z of [25.05,25.35])box(mats.metal,9.58,1.84,z,.08,.14,.02);
  box(mats.fadedRed,9.57,1.38,25.05,.025,.70,.32,false,false);
  // Narrow wall-side bookshelf keeps the centre route free; individual books
  // and a folded bag make the shared room feel used rather than staged.
  box(mats.wood,9.72,.91,27.05,.38,1.52,1.04,true);
  for(const y of [.46,.86,1.26,1.65])box(mats.darkWood,9.94,y,27.05,.06,.035,1.04);
  for(const [i,z] of [26.70,26.84,26.99,27.16,27.31].entries())
    box([mats.paper,mats.blue,mats.cover,mats.light,mats.ink][i],9.96,1.09,z,.06,.37,.105);
  box(mats.blue,9.97,.58,27.21,.08,.22,.28);
  box(mats.wood,12.95,.86,26.80,1.22,.09,.78,true);
  for(const dx of [-.48,.48])for(const dz of [-.27,.27])box(mats.darkWood,12.95+dx,.48,26.80+dz,.065,.72,.065);
  for(const z of [26.10,27.50]){
    box(mats.wood,13.0,.57,z,.48,.07,.43);
    for(const dx of [-.19,.19])for(const dz of [-.16,.16])box(mats.darkWood,13+dx,.35,z+dz,.035,.43,.035);
    colliders.push({position:[13,.42,z],size:[.48,.58,.43]});
  }
  cyl(mats.light,12.73,.925,26.73,.105,.025);
  cyl(mats.light,13.14,.925,26.87,.08,.065);
  // One simple mattress and an open study desk suggest the girl's everyday
  // life: drawing materials and books, a ball set beside the bed.
  box(mats.darkWood,15.12,.38,28.20,1.45,.42,1.92,true);
  box(mats.pillow,15.12,.64,28.20,1.35,.16,1.82);
  box(mats.blanket,15.12,.74,28.61,1.33,.035,.91,false,false);
  box(mats.pillow,15.12,.76,27.55,.71,.12,.35);
  // Open-legged desk, allowing a chair and avoiding a shop-counter silhouette.
  box(mats.wood,13.24,1.06,29.63,1.40,.07,.75);
  for(const dx of [-.56,.56])for(const dz of [-.26,.26])box(mats.darkWood,13.24+dx,.60,29.63+dz,.06,.85,.06);
  box(mats.darkWood,13.24,.88,29.62,.76,.24,.46);
  colliders.push({position:[13.24,.63,29.63],size:[1.40,.88,.75]});
  box(mats.wood,13.24,.57,28.99,.45,.07,.42);
  for(const dx of [-.17,.17])for(const dz of [-.15,.15])box(mats.darkWood,13.24+dx,.34,28.99+dz,.035,.42,.035);
  colliders.push({position:[13.24,.42,28.99],size:[.45,.56,.42]});
  box(mats.paper,12.90,1.11,29.50,.42,.018,.31,false,false);
  box(mats.cover,13.36,1.12,29.52,.35,.035,.26);
  box(mats.paper,13.36,1.145,29.52,.32,.012,.235,false,false);
  for(let i=0;i<3;i++)box(mats.ink,12.90,1.124,29.43+i*.07,.29,.003,.009,false,false);
  cyl(mats.dark,13.71,1.17,29.62,.055,.18);
  for(let i=0;i<3;i++)cyl(i===1?mats.cover:mats.ink,13.67+i*.04,1.30,29.62,.006,.22);
  orb(mats.orange,14.12,.27,28.95,.13,.13,.13);
  // A drawing, a wall calendar and scattered family belongings are deliberately
  // unbranded; nothing implies a real address or real person.
  box(mats.darkWood,13.24,2.00,30.02,.92,.69,.035);
  box(mats.paper,13.24,2.00,29.997,.82,.59,.014,false,false);
  box(mats.blue,13.24,1.92,29.987,.68,.24,.006,false,false);
  box(mats.leaf,13.12,2.08,29.982,.22,.10,.006,false,false);
  orb(mats.orange,13.48,2.14,29.979,.055,.055,.01);
  box(mats.paper,14.03,1.96,30.01,.36,.46,.02,false,false);
  box(mats.fadedRed,14.03,2.12,29.997,.32,.08,.005,false,false);
  for(let row=0;row<3;row++)for(let col=0;col<4;col++)
    box(mats.ink,13.93+col*.065,1.98-row*.07,29.99,.025,.025,.004,false,false);
  box(mats.blanket,14.55,.149,26.33,.80,.008,.58,false,false);
  box(mats.paper,11.76,1.39,29.13,.18,.22,.007,false,false);
  box(mats.fadedRed,11.75,1.41,29.12,.10,.08,.004,false,false);
  // Enclosed washroom in the front-east corner. The west-facing doorway is
  // genuinely open, from z=25.15 to 26.04, with no decorative fake door or
  // collider across it. Fixture bounds stay at the far eastern wall.
  box(mats.light,15.20,1.46,26.16,1.90,2.64,.12,true);
  box(mats.light,14.25,1.46,24.78,.12,2.64,.66,true);
  box(mats.light,14.25,2.71,25.60,.12,.18,1.10);
  for(const z of [25.14,26.06])box(mats.darkWood,14.18,1.38,z,.09,2.46,.05);
  box(mats.darkWood,14.18,2.61,25.60,.09,.05,.97);
  // A physical open door rests against the inside wall, clear of the opening.
  box(mats.wood,14.65,1.40,26.02,.88,2.44,.045,true);
  box(mats.metal,15.00,1.25,25.985,.045,.075,.025);
  // Toilet and small hand basin, both on the shared 0.14m floor.
  box(mats.light,15.50,.35,24.76,.45,.42,.54);
  orb(mats.light,15.50,.61,24.86,.30,.16,.35);
  box(mats.light,15.50,.79,24.55,.48,.52,.20);
  add(cylinderGeo,mats.dark,[15.50,.744,24.88],[.205,.012,.252],[0,0,0],false);
  add(cylinderGeo,mats.light,[15.50,.757,24.88],[.154,.009,.194],[0,0,0],false);
  add(ringGeo,mats.light,[15.50,.767,24.88],[.23,.275,.23],[Math.PI/2,0,0],false);
  cyl(mats.metal,15.5,1.065,24.55,.033,.012,false);
  colliders.push({position:[15.50,.61,24.79],size:[.60,.94,.76]});
  box(mats.light,15.64,.91,25.83,.58,.13,.42);
  box(mats.dark,15.64,.982,25.80,.40,.008,.26,false,false);
  box(mats.metal,15.63,1.11,26.00,.035,.25,.035);
  box(mats.metal,15.63,1.23,25.94,.035,.035,.15);
  colliders.push({position:[15.64,.85,25.83],size:[.58,.64,.42]});
  box(mats.metal,16.07,1.76,25.81,.025,.60,.46);
  box(mats.glass,16.05,1.76,25.81,.015,.53,.39,false,false);
  box(mats.metal,15.93,.92,25.35,.025,.22,.08);
  add(cylinderGeo,mats.paper,[15.91,.92,25.35],[.07,.11,.07],[0,0,Math.PI/2],false);
  // A potted plant at the window catches daylight without blocking the door.
  cyl(mats.darkWood,14.51,.37,24.77,.11,.26);
  for(let i=0;i<5;i++){
    const a=i*2.4;orb(mats.leaf,14.51+Math.cos(a)*.09,.55+(i%2)*.05,24.77+Math.sin(a)*.09,.07,.11,.05);
  }
  box(mats.glow,12.85,3.04,27.25,1.20,.035,.12,false,false);
  for(const {geometry,material,cast,matrices} of batches.values()){
    const mesh=new THREE.InstancedMesh(geometry,material,matrices.length);
    matrices.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));
    mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=cast;mesh.receiveShadow=true;
    mesh.computeBoundingSphere();root.add(mesh);
  }
  // A single, distance-culled warm lamp prevents a dark box at dusk.
  const lamp=new THREE.PointLight('#ffe0ad',0,5.4,2);lamp.position.set(12.9,2.78,27.2);lamp.visible=false;root.add(lamp);
  let evening=false,lastCamera=null;const p=new THREE.Vector3();
  function refresh(camera){
    if(camera?.isCamera)lastCamera=camera;
    if(!lastCamera){lamp.visible=false;return;}
    lastCamera.getWorldPosition(p);lamp.visible=p.distanceToSquared(lamp.position)<225;
  }
  return {root,colliders,groundColliders,
    setTime(mode){evening=mode==='evening';lamp.intensity=evening?8:2;mats.glow.emissiveIntensity=evening?.85:.18;refresh(lastCamera);},
    update(_dt,_wind,camera){refresh(camera);},
    stats:{name:'榕南路30號',resident:'蔡佳寧',entrance:[10.65,24.25],washroom:1},
  };
}
