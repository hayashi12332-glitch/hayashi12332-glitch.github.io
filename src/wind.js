import * as THREE from 'three';

// One shared, mild westerly breeze for small scenery and rising vapour.
// Potted plants, walls and collisions stay fixed. Moving leaves and lantern
// fittings retain their original per-instance matrices for reversible motion.
export function createWind(scene){
  const leaves=[],lanterns=[],lanternParts=[],fixtures=[];
  const work=new THREE.Matrix4(),original=new THREE.Matrix4(),point=new THREE.Vector3();
  const close=(a,b)=>Math.abs(a-b)<.018;
  const colorHex=material=>material?.color?.getHexString?.()??'';

  scene.traverse(mesh=>{
    if(!mesh.isInstancedMesh)return;
    const params=mesh.geometry?.parameters;
    if(mesh.geometry.type==='SphereGeometry'&&params?.widthSegments===7&&params?.heightSegments===4){
      const matrices=Array.from({length:mesh.count},(_,i)=>{mesh.getMatrixAt(i,work);return work.clone();});
      if(matrices.length){mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);if(mesh.boundingSphere)mesh.boundingSphere.radius+=.08;leaves.push({mesh,matrices});}
    }
    if(mesh.geometry.type==='SphereGeometry'&&params?.widthSegments===16&&
       mesh.material?.emissive?.getHexString?.()==='b84021'){
      const matrices=Array.from({length:mesh.count},(_,i)=>{
        mesh.getMatrixAt(i,work);const matrix=work.clone();point.setFromMatrixPosition(matrix);
        lanterns.push({x:point.x,y:point.y,z:point.z});return matrix;
      });
      if(matrices.length){mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);if(mesh.boundingSphere)mesh.boundingSphere.radius+=.08;fixtures.push({mesh,matrices,role:'lantern'});}
    }
  });
  // Companion cap, tassel and suspension belong to larger shared cylinder
  // batches. Select only instances matching the recorded lantern positions;
  // all other objects in those batches keep their original matrices.
  scene.traverse(mesh=>{
    if(!mesh.isInstancedMesh||mesh.geometry.type!=='CylinderGeometry')return;
    const hex=colorHex(mesh.material);
    if(!['c9b68b','ad493c','3c5350'].includes(hex))return;
    const selected=[];
    for(let i=0;i<mesh.count;i++){
      mesh.getMatrixAt(i,work);point.setFromMatrixPosition(work);
      for(const lantern of lanterns){
        if(!close(point.x,lantern.x)||!close(point.z,lantern.z))continue;
        const dy=point.y-lantern.y;
        const role=hex==='c9b68b'&&close(dy,-.28)?'cap':
          hex==='ad493c'&&close(dy,-.41)?'tassel':
          hex==='3c5350'&&close(dy,.30)?'string':null;
        if(role){selected.push({index:i,matrix:work.clone(),lantern,role});break;}
      }
    }
    if(selected.length){mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);lanternParts.push({mesh,selected});}
  });

  // Small, generic canvas flags are attached to existing shop facades above
  // head height. No logo, invented business text or paid texture is used.
  const flagGroup=new THREE.Group();flagGroup.name='Fabric signs in the breeze';scene.add(flagGroup);
  const flagSpecs=[
    {x:-3.31,y:4.35,z:-4.65,yaw:0,color:'#a95749',phase:.3},
    {x:-3.31,y:4.20,z:9.10,yaw:0,color:'#5b7e6d',phase:1.7},
    {x:3.10,y:4.35,z:-9.55,yaw:Math.PI,color:'#a95749',phase:2.6},
  ];
  const clothMaterials=new Map(),flags=[];
  const poleMaterial=new THREE.MeshStandardMaterial({color:'#9fa7a0',metalness:.67,roughness:.58});
  const poleGeometry=new THREE.CylinderGeometry(.018,.018,.72,8);
  const poles=new THREE.InstancedMesh(poleGeometry,poleMaterial,flagSpecs.length);
  const poleObject=new THREE.Object3D();
  flagSpecs.forEach((spec,i)=>{
    let material=clothMaterials.get(spec.color);
    if(!material){material=new THREE.MeshStandardMaterial({color:spec.color,roughness:.94,side:THREE.DoubleSide});clothMaterials.set(spec.color,material);}
    const geometry=new THREE.PlaneGeometry(.78,.52,12,4);geometry.translate(.39,0,0);
    const coordinates=geometry.getAttribute('position'),rest=new Float32Array(coordinates.array);
    const mesh=new THREE.Mesh(geometry,material);mesh.position.set(spec.x,spec.y,spec.z);mesh.rotation.y=spec.yaw;
    mesh.name='Plain cloth flag';mesh.castShadow=false;mesh.receiveShadow=true;mesh.frustumCulled=false;flagGroup.add(mesh);
    flags.push({geometry,coordinates,rest,phase:spec.phase});
    poleObject.position.set(spec.x,spec.y,spec.z);poleObject.scale.set(1,1,1);poleObject.updateMatrix();poles.setMatrixAt(i,poleObject.matrix);
  });
  poles.instanceMatrix.needsUpdate=true;poles.castShadow=false;poles.receiveShadow=true;flagGroup.add(poles);

  let time=0,elapsedSinceUpdate=0;
  // x/z are in world-space metres per second, with gentle time-varying gusts.
  function sample(){
    const strength=.72+.16*Math.sin(time*.31)+.07*Math.sin(time*.87+.5);
    return {x:.14*strength,z:.045*strength,speed:strength,time};
  }
  function waveAt(x,z){
    const phase=time*1.05+x*.21+z*.17;
    const gust=.78+.16*Math.sin(time*.31+x*.06);
    return {x:(.024*Math.sin(phase)+.008*Math.sin(phase*2.2+.4))*gust,
      z:(.010*Math.sin(phase+.65)+.004*Math.sin(phase*1.8))*gust};
  }
  function update(dt){
    if(!Number.isFinite(dt)||dt<=0)return;
    time+=Math.min(dt,.25);elapsedSinceUpdate+=Math.min(dt,.25);
    if(elapsedSinceUpdate<1/24)return;
    elapsedSinceUpdate=0;
    for(const {mesh,matrices} of leaves){
      for(let i=0;i<matrices.length;i++){
        original.copy(matrices[i]);const e=original.elements,w=waveAt(e[12],e[14]);
        e[12]+=w.x;e[14]+=w.z;mesh.setMatrixAt(i,original);
      }
      mesh.instanceMatrix.needsUpdate=true;
    }
    for(const {mesh,matrices} of fixtures){
      for(let i=0;i<matrices.length;i++){
        original.copy(matrices[i]);const e=original.elements,w=waveAt(e[12],e[14]);
        e[12]+=w.x*1.2;e[14]+=w.z*1.2;mesh.setMatrixAt(i,original);
      }
      mesh.instanceMatrix.needsUpdate=true;
    }
    for(const {mesh,selected} of lanternParts){
      for(const item of selected){
        original.copy(item.matrix);const e=original.elements,w=waveAt(item.lantern.x,item.lantern.z);
        const amount=item.role==='string'?.25:item.role==='cap'?1.25:1.45;
        e[12]+=w.x*amount;e[14]+=w.z*amount;mesh.setMatrixAt(item.index,original);
      }
      mesh.instanceMatrix.needsUpdate=true;
    }
    for(const flag of flags){
      const {coordinates,rest,phase}=flag;
      for(let i=0;i<coordinates.count;i++){
        const x=rest[i*3],y=rest[i*3+1],t=x/.78;
        coordinates.setXYZ(i,x,y+.018*t*Math.sin(time*1.3+phase+x*4),
          .065*t*Math.sin(time*1.55+phase+x*5+y*2));
      }
      coordinates.needsUpdate=true;flag.geometry.computeVertexNormals();
    }
  }
  return {update,sample,stats:{leafBatches:leaves.length,leafInstances:leaves.reduce((n,x)=>n+x.matrices.length,0),lanterns:lanterns.length,lanternPartBatches:lanternParts.length,flags:flags.length}};
}
