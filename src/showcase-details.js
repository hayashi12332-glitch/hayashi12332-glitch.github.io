import * as THREE from 'three';

// Restrained, fixed contact wear for the convenience-store / noodle-shop
// example block. It is visual only and stays outside the walking collision
// graph. All patches share one tiny procedural texture, material and draw call.
export function addShowcaseWear(root){
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=256;
  const ctx=canvas.getContext('2d');
  const gradient=ctx.createRadialGradient(128,128,9,128,128,120);
  gradient.addColorStop(0,'rgba(73,69,58,0.19)');
  gradient.addColorStop(.48,'rgba(86,79,66,0.09)');
  gradient.addColorStop(1,'rgba(86,79,66,0)');
  ctx.fillStyle=gradient;ctx.fillRect(0,0,256,256);
  // Stable stippling softens the artificial circular edge. The seed never
  // changes between frames, reloads or walking and edit modes.
  let seed=29317;
  const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<600;i++){
    const x=rand()*256,y=rand()*256,d=Math.hypot(x-128,y-128)/128;
    if(d>=.9)continue;
    ctx.fillStyle=`rgba(78,74,63,${(1-d)*.08*rand()})`;
    ctx.fillRect(x,y,.7+rand()*2,.7+rand()*1.8);
  }
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  const material=new THREE.MeshStandardMaterial({map:texture,transparent:true,depthWrite:false,roughness:1,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
  const patches=[
    [3.27,.143,-3.75,.55,.58],[3.27,.143,-.20,.53,.53],
    [3.27,.143,4.70,.58,.55],[3.27,.143,5.94,.54,.54],
    [8.95,.003,5.94,.59,.57],[10.52,.003,5.94,.61,.58],
    [-3.62,.143,.63,.61,.56],[-3.62,.143,5.67,.55,.62],
    // Moisture and fine sediment accumulate around existing curb drains.
    [-2.73,.047,2.80,.47,.88],[2.73,.047,2.80,.46,.86]
  ];
  const mesh=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),material,patches.length);
  mesh.name='Subtle contact and drain wear — showcase block';
  mesh.castShadow=false;mesh.receiveShadow=true;
  const transform=new THREE.Object3D();
  patches.forEach(([x,y,z,w,d],i)=>{
    transform.position.set(x,y,z);transform.rotation.set(-Math.PI/2,0,(i%4)*.36);
    transform.scale.set(w,d,1);transform.updateMatrix();mesh.setMatrixAt(i,transform.matrix);
  });
  mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();root.add(mesh);
  return mesh;
}
