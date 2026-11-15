import * as THREE from 'three';
import {createSurfaceMaterial} from '../src/surfaces.js';

// Fictional neighbourhood school beyond the original playable block. The
// yard and shared classroom are static scenery, not a functioning school.
// The caller opens the r187 north boundary and removes the former backdrop
// directly across the road. Nothing in the original r180 world is changed.
export function addResidentSchool(scene,{signage}={}) {
  if(!signage?.add)throw new Error('Resident school requires shared signage');
  const root=new THREE.Group();root.name='榕安國小 / school';scene.add(root);
  const colliders=[],groundColliders=[];
  const geo={box:new THREE.BoxGeometry(1,1,1),cylinder:new THREE.CylinderGeometry(1,1,1,10),leaf:new THREE.SphereGeometry(1,8,5),ring:new THREE.TorusGeometry(1,.04,6,24)};
  const m={
    road:createSurfaceMaterial('asphalt','#5d6260',{roughness:.96}),
    concrete:createSurfaceMaterial('concrete','#bcb9ab',{roughness:.96}),
    wall:createSurfaceMaterial('plaster','#d1c8b4',{roughness:.92}),
    trim:createSurfaceMaterial('paint','#e2ddcf',{roughness:.88}),
    courtyard:createSurfaceMaterial('concrete','#b4aaa0',{roughness:.95}),
    floor:createSurfaceMaterial('tile','#d3cfc1',{roughness:.9}),
    wood:createSurfaceMaterial('wood','#9b7959',{roughness:.84}),
    darkWood:createSurfaceMaterial('wood','#705b49',{roughness:.88}),
    paint:new THREE.MeshStandardMaterial({color:'#e8e3d5',roughness:.95}),
    chalkboard:new THREE.MeshStandardMaterial({color:'#315e50',roughness:.9}),
    metal:new THREE.MeshStandardMaterial({color:'#6d7b76',metalness:.34,roughness:.7}),
    glass:new THREE.MeshStandardMaterial({color:'#a5c5bd',transparent:true,opacity:.22,depthWrite:false,roughness:.27}),
    leaf:new THREE.MeshStandardMaterial({color:'#708d65',roughness:.95}),
    paper:new THREE.MeshStandardMaterial({color:'#eee6d0',roughness:.97}),
    blue:new THREE.MeshStandardMaterial({color:'#79969b',roughness:.9}),
    red:new THREE.MeshStandardMaterial({color:'#bc8073',roughness:.92}),
    yellow:new THREE.MeshStandardMaterial({color:'#dbbc7d',roughness:.94}),
    dark:new THREE.MeshStandardMaterial({color:'#38443f',roughness:.88}),
    lamp:new THREE.MeshStandardMaterial({color:'#efe6ce',emissive:'#f5d39e',emissiveIntensity:.25,roughness:.6}),
  };
  const batches=new Map(),temp=new THREE.Object3D();
  function part(shape,material,p,s,rot=[0,0,0],cast=true){
    const geometry=geo[shape],key=geometry.uuid+':'+material.uuid+':'+cast;
    if(!batches.has(key))batches.set(key,{geometry,material,cast,matrices:[]});
    temp.position.set(...p);temp.rotation.set(...rot);temp.scale.set(...s);temp.updateMatrix();batches.get(key).matrices.push(temp.matrix.clone());
  }
  function box(material,x,y,z,w,h,d,hit=false,cast=true){
    part('box',material,[x,y,z],[w,h,d],[0,0,0],cast);
    if(hit)colliders.push({position:[x,y,z],size:[w,h,d]});
  }
  const cyl=(material,x,y,z,r,h,cast=true)=>part('cylinder',material,[x,y,z],[r,h,r],[0,0,0],cast);
  const leaf=(material,x,y,z,sx,sy,sz,angle=0)=>part('leaf',material,[x,y,z],[sx,sy,sz],[0,angle,0],false);
  function floor(x,z,w,d,top,material){
    box(material,x,top/2,z,w,top,d,false,false);
    groundColliders.push({position:[x,top/2,z],size:[w,top,d]});
  }
  // The original visible street already extends to z=-88, but its physics
  // ended at -45. Continue the walkable ground without overlapping the old
  // ground collider. The visible road extension starts at the old road end.
  groundColliders.push({position:[0,-.15,-79.5],size:[76,.30,69]});
  box(m.concrete,0,-.09,-108,76,.18,14,false,false);
  box(m.road,0,.015,-90.20,5.8,.06,4.4,false,false);
  for(const side of [-1,1]){
    floor(side*3.47,-89.75,1.14,3.5,.14,m.concrete);
    box(m.trim,side*2.99,.09,-89.75,.18,.18,3.5);
  }
  // Quiet school frontage and low walls enclose an open yard. The entry is
  // central and aligned with the road, with a gentle continuous ramp.
  floor(0,-96.93,19.0,8.75,.14,m.courtyard);
  for(const side of [-1,1]){
    box(m.wall,side*5.85,.60,-92.52,7.30,1.18,.18,true);
    box(m.trim,side*5.85,1.21,-92.52,7.32,.10,.22);
    box(m.wall,side*9.42,.67,-96.85,.18,1.34,8.60,true);
    for(const x of [side*2.23,side*9.40])box(m.trim,x,1.14,-92.52,.34,2.28,.36,true);
  }
  box(m.trim,0,2.75,-92.52,4.80,.20,.35);
  signage.add({text:'榕安國小',detail:'榕安國民小學',x:0,y:2.77,z:-92.32,width:3.20,height:.45,bg:'#496a5d',fg:'#fff7df'});
  // Pedestrian ramp from the road (z=-91.85) up to the yard (z=-92.58).
  const ramp=new THREE.BufferGeometry();
  ramp.setAttribute('position',new THREE.Float32BufferAttribute([-2,.04,-91.85,2,.04,-91.85,2,.14,-92.58,-2,.14,-92.58],3));
  ramp.setIndex([0,1,2,0,2,3]);ramp.computeVertexNormals();
  const rampMesh=new THREE.Mesh(ramp,m.concrete);rampMesh.material.side=THREE.DoubleSide;rampMesh.receiveShadow=true;root.add(rampMesh);
  for(let i=0;i<8;i++){
    const t=(i+.5)/8,h=.04+.10*t;
    groundColliders.push({position:[0,h/2,-91.85-.73*t],size:[4,h,.73/8+.003]});
  }
  // A small painted play area, seating and shade convey use without claiming
  // this compact courtyard is a full-size sports field.
  for(const z of [-94.45,-99.40])box(m.paint,0,.148,z,11,.008,.045,false,false);
  for(const x of [-5.5,5.5])box(m.paint,x,.148,-96.93,.045,.008,5,false,false);
  for(const side of [-1,1]){
    box(m.wood,side*7.65,.48,-98.3,1.70,.09,.42);
    for(const dx of [-.65,.65])box(m.metal,side*7.65+dx,.25,-98.3,.06,.45,.36);
    colliders.push({position:[side*7.65,.30,-98.3],size:[1.72,.58,.48]});
    cyl(m.darkWood,side*7.75,1.15,-95.0,.11,2.1);
    for(let i=0;i<9;i++){
      const a=i*2.399963,rr=.20+(i%3)*.11;
      leaf(m.leaf,side*7.75+Math.cos(a)*rr,2.27+(i%3)*.13,-95+Math.sin(a)*rr,.50,.25,.38,a);
    }
  }
  // A two-storey facade contains one genuinely walkable shared classroom on
  // the first floor. The upper floor remains an exterior architectural volume.
  floor(0,-106.55,18.4,10.90,.14,m.floor);
  box(m.wall,-9.12,1.78,-106.55,.18,3.28,10.90,true);
  box(m.wall,9.12,1.78,-106.55,.18,3.28,10.90,true);
  box(m.wall,0,1.78,-111.91,18.4,3.28,.18,true);
  // Front window bands flank a 2.2m open doorway at x=0.
  for(const side of [-1,1]){
    box(m.wall,side*5.16,.60,-101.19,8.0,.92,.18,true);
    box(m.wall,side*5.16,2.99,-101.19,8.0,.88,.18,true);
    box(m.glass,side*5.16,1.78,-101.19,8.0,1.44,.045,true,false);
    for(let i=0;i<5;i++)box(m.metal,side*(1.20+i*1.96),1.78,-101.08,.045,1.46,.055);
    box(m.metal,side*5.16,1.78,-101.08,8.0,.045,.055);
  }
  box(m.wall,0,3.30,-101.19,2.35,.30,.18);
  box(m.trim,0,3.45,-106.55,18.6,.18,11.10,false);
  box(m.wall,0,5.17,-106.55,18.4,3.28,10.90,false);
  box(m.trim,0,6.88,-106.55,18.55,.16,11.05);
  for(const x of [-6.6,-3.3,0,3.3,6.6]){
    box(m.dark,x,5.02,-101.02,2.28,1.35,.035);
    box(m.glass,x,5.02,-100.99,2.10,1.19,.025,false,false);
    box(m.metal,x,5.02,-100.96,.035,1.19,.025);
    box(m.trim,x,4.31,-100.93,2.45,.10,.23);
  }
  signage.add({text:'綜合教室',detail:'請保持整潔',x:0,y:3.12,z:-101.04,width:2.08,height:.34,bg:'#e8e4d6',fg:'#405b52'});

  // A shared room for art and study. The middle approach stays at least
  // 2m wide; desks, chairs and shelving have matching collision proxies.
  box(m.chalkboard,0,2.10,-111.78,5.5,1.50,.055);
  box(m.darkWood,0,1.30,-111.72,5.70,.075,.12);
  signage.add({text:'今日課程',detail:'閱讀・美術',x:0,y:2.10,z:-111.73,width:4.65,height:1.20,bg:'#315e50',fg:'#f0ead8'});
  signage.add({text:'作品欣賞',x:6.35,y:2.69,z:-111.74,width:2.30,height:.25,bg:'#e9e3d2',fg:'#4a5b52'});
  // A fixed wall clock and fan make the classroom read as a used room. The
  // time is decorative; it is not a simulation of the world's clock.
  part('cylinder',m.dark,[-3.85,2.63,-111.72],[.28,.045,.28],[Math.PI/2,0,0],false);
  part('cylinder',m.paper,[-3.85,2.63,-111.685],[.235,.025,.235],[Math.PI/2,0,0],false);
  box(m.dark,-3.85,2.69,-111.665,.018,.14,.008,false,false);
  box(m.dark,-3.78,2.63,-111.66,.15,.018,.008,false,false);
  box(m.metal,9.00,2.68,-108.50,.12,.34,.08);
  part('ring',m.metal,[8.86,2.70,-108.50],[.26,.26,.26],[0,Math.PI/2,0],false);
  for(const a of [0,Math.PI/2,Math.PI/4,-Math.PI/4])
    part('box',m.metal,[8.85,2.70,-108.50],[.012,.48,.012],[a,0,0],false);
  part('cylinder',m.dark,[8.83,2.70,-108.50],[.055,.08,.055],[0,0,Math.PI/2],false);
  // The teacher's desk is offset to leave the entrance and centre aisle clear.
  box(m.wood,-1.85,.89,-109.84,1.42,.09,.70);
  for(const dx of [-.56,.56])for(const dz of [-.24,.24])box(m.metal,-1.85+dx,.51,-109.84+dz,.045,.72,.045);
  colliders.push({position:[-1.85,.51,-109.84],size:[1.42,.78,.70]});
  box(m.paper,-1.97,.95,-109.84,.42,.02,.31,false,false);
  box(m.blue,-1.58,.96,-109.86,.28,.035,.23,false,false);
  for(const side of [-1,1])for(const z of [-103.25,-105.35,-107.45]){
    const x=side*3.15;
    box(m.wood,x,.83,z,1.24,.08,.75);
    for(const dx of [-.5,.5])for(const dz of [-.27,.27])box(m.metal,x+dx,.47,z+dz,.035,.70,.035);
    colliders.push({position:[x,.48,z],size:[1.24,.78,.75]});
    box(m.wood,x,.53,z+.77,.45,.055,.42);
    for(const dx of [-.17,.17])for(const dz of [-.15,.15])box(m.metal,x+dx,.31,z+.77+dz,.03,.42,.03);
    box(m.wood,x,.83,z+.95,.45,.55,.035);
    colliders.push({position:[x,.42,z+.77],size:[.46,.62,.42]});
    box(m.paper,x,.88,z,.35,.012,.25,false,false);
    box(side<0?m.blue:m.red,x+.20,.89,z,.018,.012,.20,false,false);
    if(z===-105.35){
      box(side<0?m.blue:m.red,x+.42,.35,z+.39,.24,.33,.14);
      box(m.dark,x+.42,.39,z+.47,.13,.15,.018,false,false);
    }
  }
  for(const x of [-6.9,-5.95,-5.0]){
    box(m.wood,x,.80,-111.35,.82,1.27,.75,true);
    for(const y of [.47,.85,1.23])box(m.darkWood,x,y,-110.96,.75,.035,.035);
  }
  for(let i=0;i<6;i++){
    const x=5.03+i*.52;
    box(m.paper,x,2.18,-111.79,.43,.55,.016,false,false);
    box([m.blue,m.yellow,m.red][i%3],x,2.18,-111.77,.28,.22,.008,false,false);
  }
  box(m.lamp,0,3.19,-106.5,3.0,.035,.12,false,false);
  for(const {geometry,material,cast,matrices} of batches.values()){
    const mesh=new THREE.InstancedMesh(geometry,material,matrices.length);
    matrices.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));
    mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=cast;mesh.receiveShadow=true;mesh.computeBoundingSphere();root.add(mesh);
  }
  const light=new THREE.PointLight('#ffe7c2',0,9,2);light.position.set(0,3.05,-106.5);light.visible=false;root.add(light);
  let evening=false,lastCamera=null;const position=new THREE.Vector3();
  function refresh(camera){if(camera?.isCamera)lastCamera=camera;if(!lastCamera){light.visible=false;return;}
    lastCamera.getWorldPosition(position);light.visible=position.distanceToSquared(light.position)<16*16;}
  return {root,colliders,groundColliders,
    setTime(mode){evening=mode==='evening';light.intensity=evening?9:2;m.lamp.emissiveIntensity=evening?.85:.25;refresh(lastCamera);},
    update(_dt,_wind,camera){refresh(camera);},
    stats:{name:'榕安國小',gate:[0,-92.52],classroomEntrance:[0,-101.19],sharedClassrooms:1},
  };
}
