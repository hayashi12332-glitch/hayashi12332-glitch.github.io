import * as THREE from 'three';

// r187 only: the fictional residents' route between the south-side housing,
// the breakfast shop and 榕安街. Distances are in metres. The signs identify
// directions beyond the original block; no bus service is simulated.
export function addResidentRoutes(scene, {signage} = {}) {
  if (!signage) throw new Error('Resident routes require the shared sign atlas');
  const root = new THREE.Group();
  root.name = 'Neighbourhood school crossing';
  scene.add(root);
  // The full width clears the breakfast shop's arcade column at x≈4.77.
  // Its covered shop floor continues east beyond the ordinary sidewalk.
  const crossingX = 6.35, crossingWidth = 2.72;
  const box = new THREE.BoxGeometry(1, 1, 1);
  const dot = new THREE.CylinderGeometry(1, 1, 1, 8);
  const mats = {
    paint:new THREE.MeshStandardMaterial({color:'#e8e5d8',roughness:.98}),
    pavement:new THREE.MeshStandardMaterial({color:'#b7b9b1',roughness:.95}),
    tactile:new THREE.MeshStandardMaterial({color:'#bc9f5a',roughness:.89}),
    raised:new THREE.MeshStandardMaterial({color:'#d7c88f',roughness:.96}),
    sign:new THREE.MeshStandardMaterial({color:'#126649',roughness:.8}),
  };
  const batches = new Map(), transform = new THREE.Object3D();
  function piece(geometry, material, position, scale) {
    const key = geometry.uuid + ':' + material.uuid;
    if (!batches.has(key)) batches.set(key,{geometry,material,matrices:[]});
    transform.position.set(...position); transform.rotation.set(0,0,0);
    transform.scale.set(...scale); transform.updateMatrix();
    batches.get(key).matrices.push(transform.matrix.clone());
  }
  const block=(material,x,y,z,w,h,d)=>piece(box,material,[x,y,z],[w,h,d]);

  // The zebra stripes sit on the existing east-west road, east of its
  // intersection with 榕安街. Ends remain clear for the curb ramps.
  for(let i=-2;i<=2;i++)block(mats.paint,crossingX+i*.49,.052,17.20,.32,.006,5.30);
  // Warning surface stays on the existing sidewalk, not in the road.
  for(const z of [13.28,20.52]) {
    block(mats.tactile,crossingX,.145,z,2.50,.012,.44);
    for(let col=-5;col<=5;col++)for(let row=-1;row<=1;row++)
      piece(dot,mats.raised,[crossingX+col*.21,.155,z+row*.13],[.018,.008,.018]);
  }

  const groundColliders=[];
  function slope(z0,z1,y0,y1) {
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute([
      crossingX-crossingWidth/2,y0,z0, crossingX+crossingWidth/2,y0,z0,
      crossingX+crossingWidth/2,y1,z1, crossingX-crossingWidth/2,y1,z1,
    ],3));
    geometry.setIndex([0,2,1,0,3,2]);geometry.computeVertexNormals();
    const mesh=new THREE.Mesh(geometry,mats.pavement);
    mesh.name='Accessible crossing ramp';mesh.receiveShadow=true;root.add(mesh);
    // Rapier controller has an autostep; small slices approximate the
    // incline while retaining a continuous approach from both directions.
    const steps=8;
    for(let i=0;i<steps;i++) {
      const t=(i+.5)/steps, height=y0+(y1-y0)*t;
      groundColliders.push({position:[crossingX,height/2,z0+(z1-z0)*t],
        size:[crossingWidth,height,(z1-z0)/steps+.002]});
    }
  }
  // The north pavement ends at z=13.60. The south sidewalk starts at
  // z=20.10; the r187 world can cut the curb to fit this 2.72m ramp.
  slope(13.60,14.30,.14,.047);
  slope(19.84,20.11,.047,.14);

  // Reuse the existing 榕南路 pole at x=3.40. The label faces south toward
  // someone leaving the 28號 home; arrows indicate directions only.
  block(mats.sign,3.40,2.58,20.17,1.28,.37,.055);
  signage.add({text:'學校・圖書館',detail:'↑ 街區外',x:3.40,y:2.58,z:20.21,
    width:1.22,height:.33,yaw:0,bg:'#126649',fg:'#fff9e7'});
  block(mats.sign,3.40,2.17,20.17,1.28,.32,.055);
  signage.add({text:'公車站 →',x:3.40,y:2.17,z:20.21,
    width:1.22,height:.28,yaw:0,bg:'#126649',fg:'#fff9e7'});
  // North faces of the same two boards (observation round 1, R1-4): from
  // the main street they otherwise read as blank green backs. They point
  // to what lies south of the pole — the market, the park, the temple.
  signage.add({text:'市場・公園',detail:'↓ 街區南',x:3.40,y:2.58,z:20.13,
    width:1.22,height:.33,yaw:Math.PI,bg:'#126649',fg:'#fff9e7'});
  signage.add({text:'榕安宮 →',x:3.40,y:2.17,z:20.13,
    width:1.22,height:.28,yaw:Math.PI,bg:'#126649',fg:'#fff9e7'});

  for(const {geometry,material,matrices} of batches.values()) {
    const mesh=new THREE.InstancedMesh(geometry,material,matrices.length);
    matrices.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));
    mesh.instanceMatrix.needsUpdate=true;mesh.receiveShadow=true;
    mesh.computeBoundingSphere();root.add(mesh);
  }
  return {root,colliders:[],groundColliders,
    stats:{schoolCrossings:1,crossingX,crossingWidth,school:'榕安國小',library:'outside playable area'}};
}
