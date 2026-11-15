import * as THREE from 'three';

export const RAIN_VEHICLE_URL='/assets/vendor/silver_compact_hatchback_lite/model.glb';

// The canonical model remains at its real metre scale. Its front is local -X;
// -PI/2 turns that toward north (-Z), in the northbound curb lane.
export async function loadRainVehicle(scene,loader){
  const gltf=await loader.loadAsync(RAIN_VEHICLE_URL);
  const car=gltf.scene;car.name='Parked silver compact hatchback — free CC0 model';
  car.rotation.y=-Math.PI/2;car.updateMatrixWorld(true);
  const before=new THREE.Box3().setFromObject(car),size=before.getSize(new THREE.Vector3());
  if(before.isEmpty()||size.x<2.0||size.x>2.3||size.z<4.1||size.z>4.5||size.y<1.45||size.y>1.75)throw new Error('Parked hatchback has unexpected real-world dimensions');
  const centre=before.getCenter(new THREE.Vector3()),ground=.045;
  car.position.set(1.82-centre.x,ground-before.min.y,-30-centre.z);
  const adjustedMaterials=new Map();
  car.traverse(object=>{
    if(!object.isMesh)return;
    object.castShadow=true;object.receiveShadow=true;
    const adjust=material=>{
      if(adjustedMaterials.has(material))return adjustedMaterials.get(material);
      const next=material.clone();next.name='Parked hatchback '+(material.name||'surface');
      // Parked, unoccupied car: neutral opaque tinted windows avoid a costly
      // transmission framebuffer and let the actual window geometry reflect.
      const glass=/glass|window|windscreen/i.test(material.name);
      const lens=/lens/i.test(material.name);
      if(glass||lens||(material.transmission??0)>.05){next.transmission=0;next.transparent=false;next.opacity=1;next.depthWrite=true;}
      if(glass){next.color.set('#32474c');next.roughness=.16;next.metalness=0;next.envMapIntensity=1.1;}
      // Clear headlamp and red tail-lamp covers retain their own source
      // colours; a transmissive lamp cover is not a blue window pane.
      if(lens){next.roughness=Math.max(.14,Math.min(.28,next.roughness));next.envMapIntensity=1.0;next.transparent=true;next.opacity=/red/i.test(material.name)?.56:.16;next.depthWrite=false;}
      if(next.emissive){next.emissive.multiplyScalar(0);next.emissiveIntensity=0;}
      next.needsUpdate=true;adjustedMaterials.set(material,next);return next;
    };
    object.material=Array.isArray(object.material)?object.material.map(adjust):adjust(object.material);
  });
  scene.add(car);car.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(car),actual=bounds.getSize(new THREE.Vector3());
  const box={position:[1.82,ground+.77,-30],size:[1.84,1.54,4.12],rotation:0};
  if(bounds.max.x>2.90+.002||bounds.min.x<.72||Math.abs(bounds.min.y-ground)>.002)throw new Error('Parked hatchback touches the curb incorrectly');
  let triangles=0,primitives=0;
  car.traverse(o=>{if(!o.isMesh)return;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;primitives+=Math.max(1,o.geometry.groups.length);});
  const snapshot={loaded:true,people:0,source:RAIN_VEHICLE_URL,scale:1,frontDirection:[0,0,-1],centre:[1.82,ground+actual.y/2,-30],size:actual.toArray(),bounds:{min:bounds.min.toArray(),max:bounds.max.toArray()},groundTop:ground,curbX:2.9,curbGap:2.9-bounds.max.x,triangles,primitives,materials:adjustedMaterials.size,glass:'Opaque parked-car tint applied only by runtime adapter; original canonical PBR retained in GLB',collider:box,remainingRoadWidth:bounds.min.x+2.9};
  car.userData.rainStreetVehicle=snapshot;
  return {group:car,colliders:[box],getSnapshot:()=>({...snapshot,bounds:{min:[...snapshot.bounds.min],max:[...snapshot.bounds.max]}})};
}
