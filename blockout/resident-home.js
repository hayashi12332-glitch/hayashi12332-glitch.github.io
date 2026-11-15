import * as THREE from 'three';
import {createSurfaceMaterial} from '../src/surfaces.js';

// The ground floor of fictional 榕南路28號 is an inhabited home for
// 林怡君 and her son 子安. All dimensions are metres. The furniture is static
// scenery: it does not represent functioning cooking, sleeping or plumbing.
// The existing building supplies walls, the entrance, floor and roof.
export function addResidentHome(scene) {
  const root = new THREE.Group();
  root.name = '榕南路28號 / 林家';
  scene.add(root);
  const colliders = [];
  const cube = new THREE.BoxGeometry(1, 1, 1);
  const cylinder = new THREE.CylinderGeometry(1, 1, 1, 12);
  const leaf = new THREE.SphereGeometry(1, 7, 4);
  const m = {
    pale: createSurfaceMaterial('paint', '#ddd8c7', {roughness:.92}),
    wall: createSurfaceMaterial('plaster', '#c7c1af', {roughness:.95}),
    wood: createSurfaceMaterial('wood', '#967b5c', {roughness:.88}),
    darkWood: createSurfaceMaterial('wood', '#6d5b4a', {roughness:.90}),
    textile: createSurfaceMaterial('canvas', '#d1c8b6', {roughness:.97}),
    blueCloth: createSurfaceMaterial('canvas', '#7b969a', {roughness:.97}),
    roseCloth: createSurfaceMaterial('canvas', '#b49b8d', {roughness:.97}),
    dark: new THREE.MeshStandardMaterial({color:'#455651', roughness:.86}),
    green: new THREE.MeshStandardMaterial({color:'#66865d', roughness:.9}),
    plant: new THREE.MeshStandardMaterial({color:'#698457', roughness:.95}),
    white: new THREE.MeshStandardMaterial({color:'#e8e4d8', roughness:.75}),
    steel: new THREE.MeshStandardMaterial({color:'#929a94',metalness:.5,roughness:.5}),
    black: new THREE.MeshStandardMaterial({color:'#303936',roughness:.7}),
    orange: new THREE.MeshStandardMaterial({color:'#ba805f',roughness:.9}),
    warm: new THREE.MeshStandardMaterial({color:'#f3e4c5',emissive:'#f6d5a0',emissiveIntensity:.3,roughness:.7}),
    mirror: new THREE.MeshStandardMaterial({color:'#9db2ae',metalness:.55,roughness:.25}),
  };
  const batches = new Map();
  const transform = new THREE.Object3D();
  function part(geometry,material,x,y,z,w,h,d,rx=0,ry=0,rz=0,cast=true) {
    const key=geometry.uuid+':'+material.uuid+':'+cast;
    if (!batches.has(key)) batches.set(key,{geometry,material,cast,matrices:[]});
    transform.position.set(x,y,z); transform.rotation.set(rx,ry,rz);
    transform.scale.set(w,h,d); transform.updateMatrix();
    batches.get(key).matrices.push(transform.matrix.clone());
  }
  const box=(material,x,y,z,w,h,d,cast=true)=>part(cube,material,x,y,z,w,h,d,0,0,0,cast);
  const cyl=(material,x,y,z,r,h,cast=true)=>part(cylinder,material,x,y,z,r,h,r,0,0,0,cast);
  const hit=(x,y,z,w,h,d)=>colliders.push({position:[x,y,z],size:[w,h,d]});
  const F=.14;

  // Close the small gap between the ground-floor walls and the upper storey.
  // The original shell was intended as a shopfront and had no interior ceiling.
  box(m.wall,6.55,3.31,27.20,4.93,.10,5.86,false);

  // Curtains cover the ground-floor glazing from inside but leave the central
  // 1.3m doorway clear. At night the room still reads as inhabited.
  for (const x of [5.03,8.07]) {
    box(m.textile,x,1.64,24.34,1.52,2.56,.025,false);
    for(const dx of [-.50,0,.50])box(m.roseCloth,x+dx,1.64,24.37,.012,2.48,.012,false);
    box(m.darkWood,x,2.96,24.36,1.60,.035,.035,false);
  }
  // An inward-open door leaf distinguishes the dwelling from an open shop;
  // its hinge sits at the right of the entrance and the central route is clear.
  box(m.darkWood,7.14,1.28,24.77,.055,2.28,1.04);
  box(m.wood,7.105,1.57,24.75,.015,.72,.54,false);
  // Raised wooden stiles and rails give the existing open leaf depth.
  for(const z of [24.31,25.22])box(m.darkWood,7.095,1.28,z,.02,2.12,.06,false);
  for(const y of [.25,1.04,2.30])box(m.darkWood,7.095,y,24.77,.02,.06,.91,false);
  for(const y of [.39,1.27,2.19])box(m.steel,7.12,y,24.27,.055,.10,.06,false);
  box(m.steel,7.10,1.18,25.14,.025,.16,.035,false);
  hit(7.14,1.28,24.77,.07,2.28,1.04);
  // Shoes, umbrellas and the child's small school bag: these stay outside the
  // centre of the entrance and do not obstruct a wheelchair-width route.
  box(m.darkWood,8.57,.25,24.87,.65,.20,.55);
  hit(8.57,.25,24.87,.65,.23,.55);
  for(const [x,z,material] of [[8.39,24.78,m.dark],[8.59,24.78,m.dark],[8.36,24.97,m.blueCloth],[8.56,24.97,m.blueCloth]])
    box(material,x,.38,z,.12,.08,.20);
  box(m.blueCloth,7.64,.65,24.48,.35,.48,.14);
  box(m.dark,7.64,.67,24.395,.25,.31,.035);
  box(m.dark,7.64,.94,24.48,.11,.07,.06);
  cyl(m.wood,8.84,.50,25.33,.095,.70);
  for(const dx of [-.04,0,.04])cyl(m.dark,8.84+dx,.92,25.33,.012,.85);

  // Two beds share a compact sleeping area. Their ends face the wall; a
  // fabric divider gives privacy without closing off the entrance.
  for(const [z,cover,pillow,book] of [[25.62,m.roseCloth,m.textile,false],[27.67,m.blueCloth,m.white,true]]) {
    box(m.darkWood,4.72,F+.16,z,.99,.32,1.90);
    box(m.textile,4.72,F+.36,z,.95,.12,1.83);
    box(cover,4.72,F+.43,z+.22,.94,.045,1.25,false);
    box(pillow,4.72,F+.46,z-.70,.67,.14,.30,false);
    hit(4.72,F+.24,z,.99,.48,1.90);
    if(book){box(m.green,4.93,F+.49,z+.58,.18,.035,.24,false);box(m.white,4.93,F+.51,z+.58,.15,.008,.20,false);}
  }
  // Two narrow curtain panels with a usable opening between them. Their solid
  // posts, not the cloth, receive colliders; fabric remains a visual divider.
  for(const [z,d] of [[25.58,1.06],[28.02,1.12]]){
    box(m.textile,5.43,1.80,z,.035,1.65,d,false);
    box(m.darkWood,5.43,2.65,z,.045,.035,d+.05,false);
  }
  for(const z of [25.04,26.12,27.46,28.58]){
    cyl(m.darkWood,5.43,1.42,z,.022,2.56);
    hit(5.43,1.40,z,.07,2.45,.07);
  }

  // Small shared dining area. The table sits right of the entry axis, leaving
  // a clear path from the door to the kitchen at the back.
  box(m.wood,7.53,F+.75,26.96,.96,.07,.74);
  for(const x of [7.13,7.93])for(const z of [26.69,27.23])box(m.darkWood,x,F+.38,z,.045,.73,.045);
  hit(7.53,F+.40,26.96,.96,.80,.74);
  for(const [x,z] of [[8.23,26.96],[7.65,26.19]]){
    box(m.wood,x,F+.44,z,.40,.065,.40);
    for(const dx of [-.15,.15])for(const dz of [-.15,.15])box(m.darkWood,x+dx,F+.22,z+dz,.035,.42,.035);
    box(m.darkWood,x,F+.73,z+.18,.40,.54,.04);
    hit(x,F+.38,z,.42,.76,.42);
  }
  // A sketchbook and pencil are the child's own everyday belongings.
  box(m.white,7.38,F+.80,26.95,.27,.015,.20,false);
  box(m.green,7.56,F+.815,26.95,.012,.012,.23,false);
  cyl(m.white,7.76,F+.87,26.85,.055,.13,false);

  // Rear kitchen: work surface, sink, taps, small stove and rice cooker.
  box(m.pale,6.15,F+.43,29.67,2.55,.86,.70);
  hit(6.15,F+.43,29.67,2.55,.86,.70);
  box(m.steel,6.15,F+.89,29.67,2.60,.06,.73);
  for(const x of [5.23,5.83,6.44,7.05]){
    box(m.darkWood,x,F+.47,29.295,.55,.69,.022,false);
    box(m.steel,x+.20,F+.45,29.276,.025,.18,.025,false);
  }
  box(m.dark,5.47,F+.93,29.61,.62,.018,.43,false);
  cyl(m.steel,5.47,F+.95,29.61,.17,.025,false);
  cyl(m.black,5.47,F+.98,29.61,.11,.025,false);
  box(m.steel,6.27,F+.93,29.62,.58,.025,.42,false);
  box(m.dark,6.27,F+.947,29.62,.42,.012,.29,false);
  box(m.steel,6.51,F+1.08,29.91,.035,.30,.035,false);
  box(m.steel,6.41,F+1.22,29.82,.20,.035,.035,false);
  cyl(m.white,7.04,F+1.10,29.57,.17,.28);
  cyl(m.dark,7.04,F+1.25,29.57,.18,.04);
  // Tall cupboards / a compact fridge are distinct from the shop displays.
  box(m.darkWood,4.40,1.30,29.27,.62,2.32,1.12);
  box(m.wood,4.725,1.29,29.27,.035,2.20,1.04,false);
  hit(4.40,1.30,29.27,.62,2.32,1.12);
  box(m.white,7.38,1.05,29.56,.68,1.82,.66);
  box(m.steel,7.38,1.50,29.205,.63,.018,.025,false);
  box(m.steel,7.61,1.30,29.19,.025,.25,.04,false);
  hit(7.38,1.05,29.56,.68,1.82,.66);

  // A small washroom at the rear-right is screened from the living area. The
  // .75m opening faces the room; a toilet and basin are represented visually.
  box(m.wall,7.70,1.43,29.50,.10,2.58,1.33);
  hit(7.70,1.43,29.50,.10,2.58,1.33);
  box(m.wall,8.77,1.43,28.84,.55,2.58,.10);
  hit(8.77,1.43,28.84,.55,2.58,.10);
  box(m.darkWood,8.11,2.65,28.84,.47,.05,.10);
  // A short, movable-look curtain gives privacy while keeping the passage
  // physically traversable; it is scenery and has no collision box.
  box(m.blueCloth,8.12,1.67,28.79,.74,2.18,.018,false);
  box(m.white,8.72,F+.35,29.59,.50,.70,.64);
  cyl(m.white,8.72,F+.69,29.42,.25,.15);
  cyl(m.dark,8.72,F+.775,29.42,.17,.012,false);
  hit(8.72,F+.36,29.54,.50,.72,.69);
  box(m.white,8.17,F+.81,29.88,.40,.18,.34);
  box(m.mirror,8.17,1.66,30.09,.38,.54,.025,false);

  // A plant and a small drawing lend the room its particular inhabitants.
  cyl(m.orange,8.76,F+.13,27.85,.12,.25);
  for(let i=0;i<7;i++){
    const a=i*2.399963;
    part(leaf,m.plant,8.76+Math.cos(a)*.07,F+.38+i*.018,27.85+Math.sin(a)*.07,.055,.012,.12,-.4,a,0,false);
  }
  box(m.white,6.12,1.85,30.09,.44,.32,.025,false);
  box(m.green,6.12,1.85,30.07,.22,.13,.008,false);
  box(m.warm,6.55,3.10,27.25,.72,.025,.12,false);

  for(const {geometry,material,cast,matrices} of batches.values()) {
    const mesh=new THREE.InstancedMesh(geometry,material,matrices.length);
    matrices.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));
    mesh.instanceMatrix.needsUpdate=true; mesh.castShadow=cast; mesh.receiveShadow=true;
    mesh.computeBoundingSphere(); root.add(mesh);
  }

  const lamp=new THREE.PointLight('#ffdfb0',0,5.4,2);
  lamp.position.set(6.55,2.9,27.25); root.add(lamp);
  const cameraWorld=new THREE.Vector3(),lampWorld=new THREE.Vector3();
  let evening=false,lastCamera=null;
  function updateLight(camera){
    if(camera?.isCamera)lastCamera=camera;
    if(!lastCamera){lamp.visible=false;return;}
    lastCamera.getWorldPosition(cameraWorld); lamp.getWorldPosition(lampWorld);
    const cutoff=lamp.visible?13:11;
    lamp.visible=cameraWorld.distanceToSquared(lampWorld)<cutoff*cutoff;
  }
  // The already-vendored CC0 cutting-board prototype may be reused without
  // another asset request or changing the original stall.
  function attachBoard(prototype){
    if(!prototype)return false;
    const board=prototype.clone(true);
    board.updateMatrixWorld(true);
    const bounds=new THREE.Box3().setFromObject(board);
    const size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
    if(bounds.isEmpty() || !(size.x>0 && size.z>0))return false;
    const sx=.35/size.x,sz=.22/size.z;
    const holder=new THREE.Group(); holder.name='Kitchen cutting board / CC0 reuse';
    holder.scale.set(sx,1,sz);
    holder.position.set(6.73-center.x*sx,F+.924-bounds.min.y,29.61-center.z*sz);
    board.traverse(n=>{if(n.isMesh){n.castShadow=true;n.receiveShadow=true;}});
    holder.add(board);root.add(holder);return true;
  }
  return {
    root,colliders,attachBoard,
    setTime(mode){evening=mode==='evening';lamp.intensity=evening?8:2;m.warm.emissiveIntensity=evening?1:.3;updateLight(lastCamera);},
    update(_dt,_wind,camera){updateLight(camera);},
    stats:{beds:2,diningTables:1,kitchen:1,washroom:1,entrance:[6.55,24.25]},
  };
}
