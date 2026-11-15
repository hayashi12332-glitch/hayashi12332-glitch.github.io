import * as THREE from 'three';

// Original cloud texture, painted at startup; no image or runtime network fetch.
// A single instanced draw keeps the soft sky practical for mobile browsers.
function makeCloudTexture(){
  const canvas=document.createElement('canvas');
  canvas.width=512;canvas.height=256;
  const ctx=canvas.getContext('2d');
  // Many slightly overlapping, individually softened lobes avoid hard
  // circular edges. The silhouette is elongated and irregular like cumulus.
  const lobes=[
    [79,157,67,.18],[127,133,77,.23],[184,142,82,.21],
    [226,105,83,.26],[271,133,87,.23],[326,116,76,.24],
    [380,143,75,.21],[431,159,58,.16],[170,171,94,.14],
    [253,170,112,.16],[351,169,100,.14],[210,79,47,.11],
    [298,92,49,.11],[363,97,42,.09]
  ];
  for(const [x,y,r,alpha] of lobes){
    const grad=ctx.createRadialGradient(x,y,0,x,y,r);
    grad.addColorStop(0,`rgba(255,255,255,${Math.min(alpha*2.0,.65)})`);
    grad.addColorStop(.36,`rgba(255,255,255,${Math.min(alpha*1.65,.55)})`);
    grad.addColorStop(.72,`rgba(255,255,255,${alpha*.64})`);
    grad.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=grad;ctx.fillRect(x-r,y-r,r*2,r*2);
  }
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  return texture;
}

export function createOrganicClouds(scene){
  const root=new THREE.Group();root.name='Slow high clouds';scene.add(root);
  const texture=makeCloudTexture();
  const material=new THREE.MeshBasicMaterial({
    map:texture,color:'#fff8ed',transparent:true,opacity:.88,
    depthWrite:false,depthTest:true,side:THREE.DoubleSide,
    fog:false,toneMapped:false
  });
  const geometry=new THREE.PlaneGeometry(1,1);
  // Azimuth / altitude / size vary so the distribution is not a repeated ring.
  // North-facing clouds are visible between the rows at walking height.
  const specs=[
    [-.48,95,37,27,13],[-.20,105,48,31,14],[.13,97,34,25,12],
    [.39,108,52,30,14],[.72,96,42,25,12],[1.06,103,54,32,15],
    [1.38,96,34,24,11],[1.71,106,46,29,14],[2.04,95,58,29,14],
    [2.35,105,38,26,12],[2.68,96,49,30,13],[2.96,105,32,25,11],
    [3.28,96,46,27,13],[3.60,103,57,30,14],[3.92,96,37,24,11],
    [4.25,105,49,30,13],[4.57,94,34,26,12],[4.91,103,56,30,14],
    [5.24,95,42,26,12],[5.60,106,52,29,13],[5.93,97,36,27,12]
  ];
  const mesh=new THREE.InstancedMesh(geometry,material,specs.length);
  mesh.name='Original procedural cumulus';mesh.frustumCulled=false;
  const dummy=new THREE.Object3D();
  specs.forEach(([angle,radius,y,w,h],i)=>{
    const x=Math.sin(angle)*radius,z=-Math.cos(angle)*radius;
    dummy.position.set(x,y,z);
    // A vertical billboard faces the centre of the neighbourhood, not the
    // camera, so it stays spatially stable as the player moves.
    dummy.rotation.set(0,Math.atan2(-x,-z),0);
    dummy.scale.set(w,h,1);dummy.updateMatrix();
    mesh.setMatrixAt(i,dummy.matrix);
  });
  mesh.instanceMatrix.needsUpdate=true;root.add(mesh);
  let evening=false;
  function setTime(mode){
    evening=mode==='evening';
    material.color.set(evening?'#ffd6bd':'#fff9f2');
    material.opacity=evening?.70:.88;
  }
  function update(dt){root.rotation.y+=Math.min(Math.max(dt,0),.25)*.00014;}
  setTime('day');
  return {setTime,update};
}
