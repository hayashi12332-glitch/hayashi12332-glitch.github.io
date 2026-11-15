import * as THREE from 'three';

// Everyday preparation at 美好早餐, an r187-only addition to the existing shop.
// In the original shop local +Z faces the street; its front counter already
// has a collider. Everything here stays on that counter or on the back wall,
// leaving the entrance and the continuous covered walkway clear.
export function addBreakfastLife(scene, {signage} = {}) {
  const root = new THREE.Group();
  root.name = '美好早餐 - daily preparation';
  scene.add(root);
  const geo = {
    box: new THREE.BoxGeometry(1, 1, 1),
    cylinder: new THREE.CylinderGeometry(1, 1, 1, 12),
    sphere: new THREE.SphereGeometry(1, 12, 8),
  };
  const mat = {
    steel: new THREE.MeshStandardMaterial({color:'#a0aaa4', metalness:.66, roughness:.49}),
    dark: new THREE.MeshStandardMaterial({color:'#3b4140', metalness:.20, roughness:.78}),
    white: new THREE.MeshStandardMaterial({color:'#e9e5d8', roughness:.8}),
    food: new THREE.MeshStandardMaterial({color:'#d9b576', roughness:.88}),
    cooked: new THREE.MeshStandardMaterial({color:'#b8814e', roughness:.87}),
    filling: new THREE.MeshStandardMaterial({color:'#e8d49b', roughness:.9}),
    egg: new THREE.MeshStandardMaterial({color:'#c59a79', roughness:.88}),
    paper: new THREE.MeshStandardMaterial({color:'#c9b38c', roughness:.95}),
    green: new THREE.MeshStandardMaterial({color:'#708864', roughness:.91}),
    light: new THREE.MeshBasicMaterial({color:'#fff1d7'}),
  };
  const batches = new Map(), object = new THREE.Object3D();
  const cx=9, cz=11.8, yaw=-Math.PI/2;
  function part(shape, material, lx, y, lz, w, h, d, spin=0, tilt=0) {
    const key=shape+':'+material.uuid;
    if (!batches.has(key)) batches.set(key,{geometry:geo[shape],material,matrices:[]});
    // Local shop X follows the frontage; local Z points toward the street.
    object.position.set(cx-lz,y,cz+lx);
    object.rotation.set(tilt,yaw+spin,0,'YXZ');object.scale.set(w,h,d);object.updateMatrix();
    batches.get(key).matrices.push(object.matrix.clone());
  }
  const box=(m,x,y,z,w,h,d,spin=0)=>part('box',m,x,y,z,w,h,d,spin);
  const cyl=(m,x,y,z,r,h)=>part('cylinder',m,x,y,z,r,h,r);
  const oval=(m,x,y,z,w,h,d)=>part('sphere',m,x,y,z,w,h,d);

  // Rolled egg pancakes on a shallow stainless tray. Their open ends have
  // a pale egg filling and a little scallion, instead of rectangular blocks.
  // No new geometry enters the customer aisle.
  box(mat.steel,-1.18,1.075,1.30,.67,.025,.39);
  for(const z of [1.105,1.495])box(mat.steel,-1.18,1.105,z,.67,.040,.012);
  for(const x of [-1.51,-.85])box(mat.steel,x,1.105,1.30,.012,.040,.39);
  for (const x of [-1.38,-1.20,-1.02]) {
    part('cylinder',mat.cooked,x,1.135,1.30,.048,.25,.048,0,Math.PI/2);
    part('cylinder',mat.food,x,1.135,1.429,.042,.008,.042,0,Math.PI/2);
    part('cylinder',mat.filling,x,1.135,1.434,.030,.004,.030,0,Math.PI/2);
    oval(mat.green,x-.011,1.143,1.438,.007,.004,.003);
    oval(mat.green,x+.010,1.128,1.438,.005,.007,.003);
    oval(mat.green,x+.001,1.134,1.438,.004,.003,.003);
    box(mat.paper,x,1.132,1.245,.106,.10,.07);
  }
  // Paper cups with lids, an order pad and takeaway paper bags. Existing
  // countertop and pan positions are avoided rather than hidden or replaced.
  for (const x of [1.79,1.93,2.07]) {
    cyl(mat.white,x,1.16,1.34,.055,.18);
    cyl(mat.paper,x,1.16,1.34,.056,.075);
    cyl(mat.dark,x,1.255,1.34,.057,.018);
    cyl(mat.white,x,1.266,1.34,.039,.007);
  }
  box(mat.paper,2.25,1.105,1.23,.22,.075,.18,-.10);
  box(mat.white,2.23,1.148,1.23,.17,.009,.13,-.10);
  box(mat.paper,1.68,1.21,1.05,.18,.30,.13);
  box(mat.dark,1.68,1.37,1.05,.08,.025,.13);

  // Back wall rail and two stacked shelves, with a small bottle, ingredient
  // containers and bowls. They are overhead so they do not constrict the
  // already narrow working area behind the counter.
  for(const y of [1.64,2.03]) box(mat.steel,-.38,y,.05,1.45,.035,.18);
  for(const x of [-.84,-.57,-.30]){
    cyl(mat.white,x,1.76,.09,.09,.19);
    cyl(mat.dark,x,1.865,.09,.095,.025);
  }
  cyl(mat.green,.06,2.15,.09,.065,.22);
  cyl(mat.dark,.06,2.275,.09,.035,.035);
  for(const x of [-.90,-.71,-.52]) {
    oval(mat.egg,x,2.10,.09,.035,.05,.035);
  }
  // A warm fluorescent tube makes the working counter legible even in the
  // covered arcade. The nearby point light is culled when the viewer is far.
  box(mat.light,0,2.93,1.04,1.58,.025,.065);
  const light = new THREE.PointLight('#ffe7c7', 5.5, 4.8, 2);
  light.position.set(cx-1.04,2.76,cz);light.visible=false;root.add(light);
  const eye=new THREE.Vector3(),lamp=new THREE.Vector3();
  let lastCamera=null, time='day';
  const update=(_dt,_wind,camera)=>{
    if (camera?.isCamera) lastCamera=camera;
    if (!lastCamera || time==='evening') {light.visible=false;return;}
    lastCamera.getWorldPosition(eye);light.getWorldPosition(lamp);
    const cutoff=light.visible?10:8;
    light.visible=eye.distanceToSquared(lamp)<cutoff*cutoff;
  };
  const setTime=mode=>{
    time=mode==='evening'?'evening':'day';
    // The fictional shop advertises 06:00–13:00 opening hours; switch off
    // the added work lamp in the evening rather than imply active service.
    mat.light.color.set(time==='evening'?'#706e66':'#fff1d7');
    update(0,null,lastCamera);
  };

  // The sign describes the order collection point rather than an invented
  // function: buying and receiving food are not yet interactive in the world.
  signage?.add({text:'點餐・取餐',detail:'請稍候',x:8.93,y:2.42,z:11.05,
    width:.78,height:.38,yaw,bg:'#eee6d2',fg:'#564c3d'});

  for(const {geometry,material,matrices} of batches.values()) {
    const mesh=new THREE.InstancedMesh(geometry,material,matrices.length);
    matrices.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));
    mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=material!==mat.light;
    mesh.receiveShadow=true;mesh.computeBoundingSphere();root.add(mesh);
  }
  return {root,colliders:[],setTime,update};
}
