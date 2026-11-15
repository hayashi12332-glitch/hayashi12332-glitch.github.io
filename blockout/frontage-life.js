import * as THREE from 'three';
import {createSurfaceMaterial} from '../src/surfaces.js';

// Stock and delivery details belong to the r187 street only.  The piles sit
// close to the shopfront and clear of the continuous arcade and entrances.
// Materials, geometry and dimensions are original and shared by instances.
export function addFrontageLife(scene) {
  const root = new THREE.Group();
  root.name = 'Arcade shopfront stock';
  scene.add(root);
  const geo = {box:new THREE.BoxGeometry(1,1,1), cylinder:new THREE.CylinderGeometry(1,1,1,12), sphere:new THREE.SphereGeometry(1,12,8)};
  const mat = {
    cardboard:createSurfaceMaterial('canvas','#b59a71',{roughness:.96}),
    boxEdge:createSurfaceMaterial('canvas','#9a7e58',{roughness:.96}),
    tape:new THREE.MeshStandardMaterial({color:'#d5c5a0',roughness:.9}),
    wood:createSurfaceMaterial('wood','#86603d',{roughness:.84}),
    bamboo:createSurfaceMaterial('wood','#a7875d',{roughness:.9}),
    cloth:createSurfaceMaterial('canvas','#d0c2a1',{roughness:.96}),
    dark:new THREE.MeshStandardMaterial({color:'#535246',roughness:.94}),
    leaf:new THREE.MeshStandardMaterial({color:'#687b50',roughness:.95}),
  };
  const batches = new Map(), temp = new THREE.Object3D();
  function part(shape, material, p, s, rotation=[0,0,0]) {
    const geometry=geo[shape], key=shape+':'+material.uuid;
    if (!batches.has(key)) batches.set(key,{geometry,material,matrices:[]});
    temp.position.set(...p); temp.rotation.set(...rotation); temp.scale.set(...s); temp.updateMatrix();
    batches.get(key).matrices.push(temp.matrix.clone());
  }
  const box=(material,x,y,z,w,h,d)=>part('box',material,[x,y,z],[w,h,d]);
  const cylinder=(material,x,y,z,r,h)=>part('cylinder',material,[x,y,z],[r,h,r]);
  const colliders=[];
  function carton(x,y,z,w,h,d) {
    box(mat.cardboard,x,y,z,w,h,d);
    box(mat.tape,x,y+h/2+.002,z,.075,.004,d*.97);
    box(mat.boxEdge,x-w/2+.008,y,z,.012,h*.96,d*.98);
    box(mat.boxEdge,x+w/2-.008,y,z,.012,h*.96,d*.98);
  }
  function crate(x,y,z,w,h,d) {
    box(mat.wood,x,y,z,w,h,d);
    for(const yy of [-.33,.33]) {
      box(mat.bamboo,x+w/2+.004,y+yy*h,z,.012,.028,d*.98);
      box(mat.bamboo,x-w/2-.004,y+yy*h,z,.012,.028,d*.98);
    }
    for(const xx of [-.33,.33])box(mat.bamboo,x+xx*w,y,z+d/2+.004,.028,h*.98,.012);
  }
  // Dry-goods shop: deliveries stacked on the end of the counter, while the
  // opposite end and the centre of the covered walking route remain clear.
  crate(-5.78,.31,-4.69,.54,.34,.73);
  carton(-5.78,.65,-4.70,.51,.34,.70);
  carton(-5.78,.92,-4.72,.44,.20,.59);
  colliders.push({position:[-5.78,.58,-4.70],size:[.54,.88,.73]});
  // Tea shop: one shallow crate holds small sacks next to the storefront.
  crate(-5.78,.27,-10.36,.51,.26,.68);
  for(const [z,r] of [[-10.56,.14],[-10.30,.15],[-10.09,.12]]){
    part('sphere',mat.cloth,[-5.78,.52,z],[r,.19,r*.80]);
    cylinder(mat.dark,-5.78,.70,z,.024,.045);
  }
  colliders.push({position:[-5.78,.40,-10.36],size:[.51,.53,.68]});
  // Herbal shop across the road: two reed-toned lidded storage baskets.
  for(const [z,r,h] of [[-6.27,.22,.37],[-6.73,.19,.31]]){
    cylinder(mat.bamboo,5.50,.14+h/2,z,r,h);
    cylinder(mat.wood,5.50,.14+h+.018,z,r+.015,.036);
    cylinder(mat.dark,5.50,.14+h+.048,z,.024,.04);
  }
  colliders.push({position:[5.50,.34,-6.50],size:[.45,.40,.86]});
  for (const {geometry,material,matrices} of batches.values()) {
    const mesh=new THREE.InstancedMesh(geometry,material,matrices.length);
    matrices.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));
    mesh.instanceMatrix.needsUpdate=true;
    mesh.castShadow=true; mesh.receiveShadow=true; mesh.computeBoundingSphere();
    root.add(mesh);
  }
  return {root,colliders};
}
