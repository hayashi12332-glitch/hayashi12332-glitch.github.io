import * as THREE from 'three';

// Public CC0 models, exported through Blender; see licenses/BUILDING_ASSETS.txt.
// Identical submeshes share geometry, materials and an instanced draw call.
const BASE='/assets/vendor/';
const FILES={
  staircase:BASE+'modular_fire_escape/model.glb',
  aircon:BASE+'exterior_aircon_unit_lite/model.glb',
  duct:BASE+'modular_airduct_circular_01/model.glb',
  antenna:BASE+'tv_antenna/model.glb',
};
const BUILDINGS=[{name:'銀行',x:-18.1},{name:'熱炒',x:18.6}];

/** Load ordinary glTF geometry once; caller supplies the product's GLTFLoader.
 * Returns geometry and low-level fixed colliders separately so the caller can
 * register them in its own physics world before creating the player.
 */
export async function loadBuildingDetails(scene,loader){
  const results=await Promise.all(Object.entries(FILES).map(async([name,path])=>{
    try{return [name,(await loader.loadAsync(path)).scene];}
    catch(error){throw new Error(`Building detail ${name} (${path}) failed to load: ${error.message}`,{cause:error});}
  }));
  const sources=Object.fromEntries(results),group=new THREE.Group();
  // The fire-escape's authored texture is near-black steel; in the shaded
  // rear lane it crushes to a flat silhouette even with the colour lifted.
  // Swap in the plain galvanised steel used elsewhere so the flights read
  // as metalwork in shade. Geometry and placement are unchanged.
  const galvanized=new THREE.MeshStandardMaterial({color:'#79827c',metalness:.38,roughness:.58});
  sources.staircase.traverse(child=>{if(child.isMesh)child.material=galvanized;});
  group.name='Occupied roofs and rear service lanes';
  const rearGroup=new THREE.Group(),streetGroup=new THREE.Group();
  rearGroup.name='Rear wall equipment';streetGroup.name='Street-facing equipment';
  // A pedestrian starts in front of the solid north row. Rear equipment is
  // fully sheltered by those buildings until the central lane approaches the
  // back; an elevated orbit can see over the roof and must keep it visible.
  rearGroup.visible=false;group.add(rearGroup,streetGroup);
  for(const source of Object.values(sources))source.updateMatrixWorld(true);
  const batches=new Map(),placements=[],geometryCenters=new Map();
  let primitiveTriangles=0;

  // One city-wide instance batch stays visible whenever any one of its
  // members intersects the view. Bin each actual transformed mesh centre so
  // off-screen building details can be culled without duplicating GLB meshes,
  // texture memory, or materials. Back lots and street fronts are separate.
  function sectorFor(point,kind){
    // Northern front-facing AC units are visible from the approach, unlike
    // equipment behind the solid row. Keep their bodies and wall stays in
    // street sectors so neither appears suddenly at the rear-lane threshold.
    if(kind==='neighbor-air-conditioner')return `north-street-${Math.floor(-point.z/12)}`;
    // Roof antennas can be seen above the north row from the main street;
    // they must not inherit the rear wall's camera visibility restriction.
    if(kind==='tv-antenna')return point.z < -20 ? `roof-north-${point.x<0?'west':'east'}` : 'roof-main';
    if(point.z < -20)return `rear-${Math.floor((point.x+28)/7)}`;
    return `${point.x<0?'street-west':'street-east'}-${Math.floor((point.z+13)/5)}`;
  }

  // The node coordinates are those authored in the CC0 glTF. Applying each
  // authored node world matrix retains all primitive/material transforms.
  function addNode(root,nodeName,world,kind){
    const node=root.getObjectByName(nodeName);
    if(!node)throw new Error(`Building detail is missing expected node: ${nodeName}`);
    let found=0;
    node.traverse(child=>{
      if(!child.isMesh)return;
      found++;
      const transform=world.clone().multiply(child.matrixWorld);
      const geometry=child.geometry;
      if(!geometryCenters.has(geometry.uuid)){
        if(!geometry.boundingBox)geometry.computeBoundingBox();
        geometryCenters.set(geometry.uuid,geometry.boundingBox.getCenter(new THREE.Vector3()));
      }
      const sector=sectorFor(geometryCenters.get(geometry.uuid).clone().applyMatrix4(transform),kind);
      const key=sector+':'+geometry.uuid+':'+(Array.isArray(child.material)?child.material.map(x=>x.uuid).join(','):child.material.uuid);
      if(!batches.has(key))batches.set(key,{geometry,material:child.material,sector,matrices:[]});
      batches.get(key).matrices.push(transform);
      const g=child.geometry;primitiveTriangles+=(g.index?.count??g.attributes.position.count)/3;
    });
    if(!found)throw new Error(`Building detail node has no mesh: ${nodeName}`);
    placements.push({kind,node:nodeName});
  }
  function matrix(x,y,z,scale=1,yaw=0,pitch=0){
    const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch,yaw,0,'YXZ'));
    return new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),q,new THREE.Vector3(scale,scale,scale));
  }
  function nodeBox(root,name){
    const node=root.getObjectByName(name);
    if(!node)throw new Error(`Building detail is missing expected node: ${name}`);
    const box=new THREE.Box3().setFromObject(node);
    if(box.isEmpty())throw new Error(`Building detail node has empty bounds: ${name}`);
    return box;
  }
  function addCentered(root,name,x,y,z,scale,yaw,pitch,kind){
    const center=nodeBox(root,name).getCenter(new THREE.Vector3());
    const pose=matrix(x,y,z,scale,yaw,pitch).multiply(new THREE.Matrix4().makeTranslation(-center.x,-center.y,-center.z));
    addNode(root,name,pose,kind);
  }

  // The Poly Haven file is a display of individual modules with gaps, not an
  // assembled escape. Place two mirrored flights and level the landings at the
  // actual walkable treads rather than laying the supplied scene on the wall.
  // At .82 scale, a flight rises ~3 m and the entire assembly fits below the
  // parapets. The highest railing is ~7.0 m; the low flight starts at .14 m.
  const stair=sources.staircase,scale=.82,wall=-29,firstFloor=3.11,secondFloor=6.10;
  const components={
    stairs:'modular_fire_escape_stairs',
    landing1:'modular_fire_escape_platform_middle',
    rail1:'modular_fire_escape_railing_middle',
    landing2:'modular_fire_escape_platform_bottom',
    rail2:'modular_fire_escape_railing_bottom',
  };
  const colliders=[];
  for(const {name,x} of BUILDINGS){
    // The supplied stairs extend local z=-.767..+.605. Face their near side to
    // the rear wall; the mirrored flight gets a separately computed offset.
    const frontZ=wall-.03-.605*scale;
    const flippedZ=wall-.03-.767*scale;
    addNode(stair,components.stairs,matrix(x,.14+.897*scale,frontZ,scale),'fire-escape-lower');
    addNode(stair,components.landing1,matrix(x,firstFloor-4.124*scale,frontZ,scale),'fire-escape-landing');
    addNode(stair,components.rail1,matrix(x,firstFloor-5.124*scale,frontZ,scale),'fire-escape-railing');
    addNode(stair,components.stairs,matrix(x,firstFloor+.897*scale,flippedZ,scale,Math.PI),'fire-escape-upper');
    addNode(stair,components.landing2,matrix(x,secondFloor+2.876*scale,frontZ,scale),'fire-escape-landing');
    addNode(stair,components.rail2,matrix(x,secondFloor+1.876*scale,frontZ,scale),'fire-escape-railing');
    // A closed collision footprint belongs to the lower flight only. It stays
    // in the 1.4 m zone adjacent to the wall; the rear lane remains open.
    colliders.push({position:[x,1.13,wall-.61],size:[2.70,1.98,1.16]});
  }

  // Thin steel doors connect the landings visually to their building. They are
  // closed scenery and do not create an entrance into the solid building.
  const boxGeometry=new THREE.BoxGeometry(1,1,1);
  const doorMaterial=new THREE.MeshStandardMaterial({color:'#63716a',roughness:.78,metalness:.28});
  const edgeMaterial=new THREE.MeshStandardMaterial({color:'#a7a89b',roughness:.78,metalness:.42});
  const handleMaterial=new THREE.MeshStandardMaterial({color:'#313d38',roughness:.5,metalness:.65});
  const windowMaterial=new THREE.MeshStandardMaterial({color:'#455e5b',roughness:.30,metalness:.10});
  const fixedParts=[];
  for(const {x} of BUILDINGS){
    for(const [dx,floor] of [[1.18,firstFloor],[-1.18,secondFloor]]){
      const y=floor+.99,z=wall-.055;
      fixedParts.push({m:doorMaterial,x:x+dx,y,z,w:.83,h:1.98,d:.055});
      for(const edge of [-1,1])fixedParts.push({m:edgeMaterial,x:x+dx+edge*.43,y,z:z-.035,w:.035,h:2.06,d:.04});
      fixedParts.push({m:edgeMaterial,x:x+dx,y:y+1.03,z:z-.035,w:.90,h:.04,d:.04});
      fixedParts.push({m:handleMaterial,x:x+dx+.29,y:floor+.99,z:z-.05,w:.035,h:.19,d:.035});
    }
  }
  // Rear residential windows are modest, unevenly spaced and have aluminium
  // frames and restrained security grilles. They sit against the back wall;
  // they do not pretend to expose rooms within the existing solid building.
  const rearWindows=[
    {x:-24.85,y:4.70,w:1.23,h:1.30,bars:3},
    {x:-12.03,y:4.68,w:1.12,h:1.25,bars:3},
    {x:-6.45,y:4.73,w:1.34,h:1.30,bars:4},
    {x:6.42,y:4.67,w:1.12,h:1.25,bars:3},
    {x:12.38,y:4.70,w:1.22,h:1.30,bars:3},
    {x:25.12,y:4.67,w:1.14,h:1.25,bars:3},
    {x:-25.35,y:7.35,w:1.25,h:1.22,bars:3},
    {x:-6.75,y:7.30,w:1.17,h:1.20,bars:3},
    {x:12.05,y:7.25,w:1.25,h:1.22,bars:4},
  ];
  for(const {x,y,w,h,bars} of rearWindows){
    fixedParts.push({m:windowMaterial,x,y,z:wall-.025,w,h,d:.04});
    // Narrow metal frame, centre mullion, window sill and protective bars.
    for(const side of [-1,1]){
      fixedParts.push({m:edgeMaterial,x:x+side*w/2,y,z:wall-.070,w:.045,h:h+.08,d:.04});
      fixedParts.push({m:edgeMaterial,x,y:y+side*h/2,z:wall-.070,w:w+.09,h:.045,d:.04});
    }
    fixedParts.push({m:edgeMaterial,x,y:y-h/2-.065,z:wall-.135,w:w+.18,h:.09,d:.22});
    fixedParts.push({m:handleMaterial,x,y,z:wall-.095,w:.026,h:h-.04,d:.028});
    for(let i=0;i<bars;i++){
      const dx=bars===1?0:(i/(bars-1)-.5)*w*.72;
      fixedParts.push({m:handleMaterial,x:x+dx,y,z:wall-.117,w:.022,h:h-.04,d:.025});
    }
    for(const dy of [-h*.23,h*.23])fixedParts.push({m:handleMaterial,x,y:y+dy,z:wall-.117,w:w-.04,h:.022,d:.025});
  }
  // The CC0 lightweight derivative contains one clean unit, with source
  // textures and normal maps reduced for mobile use. Its original node is
  // rebased to bottom/centre; the bounding-box centre preserves placement.
  const aircon=sources.aircon,airNode='aircon';
  // The source's second material supplies a black/white opacity mask for the
  // fan grille, but its glTF binds that image as the visible base colour. This
  // paints opaque white fragments on the fan and hides the mesh openings.
  // Interpret only this specific CC0 mask as opacity; retain its texture/UVs,
  // original normal map, double-sided geometry and the casing material.
  let grilleFixed=false;
  aircon.traverse(object=>{
    if(!object.isMesh)return;
    for(const material of Array.isArray(object.material)?object.material:[object.material]){
      if(material.name!=='exterior_aircon_unit_02'||grilleFixed)continue;
      if(!material.map)throw new Error('Air conditioner grille is missing its opacity mask');
      material.alphaMap=material.map;material.alphaMap.colorSpace=THREE.NoColorSpace;
      material.alphaMap.needsUpdate=true;material.map=null;
      material.color.set('#727b75');material.alphaTest=.38;material.transparent=false;
      material.depthWrite=true;material.roughness=.62;material.metalness=.25;material.needsUpdate=true;
      grilleFixed=true;
    }
  });
  if(!grilleFixed)throw new Error('Air conditioner grille material was not found');
  const airBox=nodeBox(aircon,airNode),airCenter=airBox.getCenter(new THREE.Vector3());
  const rearAC=[{x:-20.9,y:5.3,z:wall-.21,yaw:Math.PI,scale:1},
    {x:21.35,y:5.1,z:wall-.21,yaw:Math.PI,scale:1}];
  const streetAC=[
    {x:-3.08,y:6.15,z:-6.456,yaw:Math.PI/2,scale:.70},
    {x:-3.08,y:6.15,z:-.634,yaw:Math.PI/2,scale:.70},
    {x:-3.08,y:6.15,z:5.094,yaw:Math.PI/2,scale:.70},
    {x:2.83,y:6.15,z:-10.216,yaw:-Math.PI/2,scale:.70},
    {x:4.23,y:6.15,z:9.82,yaw:-Math.PI/2,scale:.70},
  ];
  // Reuse the admitted CC0 model on the three existing neighbouring mounts.
  // The authored cabinet spans y=.406503..926503m; its loose drain hose makes
  // the overall bbox centre unsuitable for setting the visible case height.
  const neighborACScale=.52/(airBox.max.x-airBox.min.x);
  const neighborCaseCentreY=.666503241;
  const neighborUnit=(x,caseY,z,yaw)=>({x,y:caseY-(neighborCaseCentreY-airCenter.y)*neighborACScale,z,yaw,scale:neighborACScale});
  const neighborAC=[
    neighborUnit(8.1825,3.51,-33.20,0),
    neighborUnit(3.50,3.51,-74.5606,-Math.PI/2),
    neighborUnit(3.50,6.21,-74.5606,-Math.PI/2),
  ];
  const acPlaces=[...rearAC,...streetAC,...neighborAC];
  for(const unit of acPlaces){
    const {x,y,z,yaw,scale:unitScale}=unit;
    const pose=matrix(x,y,z,unitScale,yaw).multiply(new THREE.Matrix4().makeTranslation(-airCenter.x,-airCenter.y,-airCenter.z));
    addNode(aircon,airNode,pose,neighborAC.includes(unit)?'neighbor-air-conditioner':'air-conditioner');
  }
  // The source already includes two perforated mounting brackets. Its lowest
  // point is the loose drain hose, so using the overall bounding box for the
  // bracket height would create visibly floating struts. These coordinates
  // were measured at the wall-facing ends of the two original brackets.
  const sourceBrackets=[[-.2665,.368,.015],[.2485,.368,.015]];
  function mountedPoint(unit,source){
    return new THREE.Vector3(...source).sub(airCenter).multiplyScalar(unit.scale)
      .applyAxisAngle(new THREE.Vector3(0,1,0),unit.yaw)
      .add(new THREE.Vector3(unit.x,unit.y,unit.z));
  }
  for(const unit of streetAC){
    const outward=Math.sin(unit.yaw),wallX=unit.x-outward*.2725;
    for(const source of sourceBrackets){
      const p=mountedPoint(unit,source);
      // Extend only from the facade to the existing bracket's rear edge.
      fixedParts.push({m:edgeMaterial,x:(wallX+p.x)/2,y:p.y,z:p.z,w:Math.abs(p.x-wallX)+.02,h:.035,d:.04});
      fixedParts.push({m:edgeMaterial,x:wallX+outward*.012,y:p.y,z:p.z,w:.025,h:.08,d:.05});
    }
  }
  // Back units sit within a few centimetres of the wall. Small back plates
  // close that gap at the original bracket ends without moving the equipment.
  for(const unit of rearAC){
    for(const source of sourceBrackets){
      const p=mountedPoint(unit,source);
      fixedParts.push({m:edgeMaterial,x:p.x,y:p.y,z:(wall+p.z)/2,w:.05,h:.08,d:Math.abs(wall-p.z)+.02});
    }
  }
  for(const unit of neighborAC){
    // The body sits below the original sill, 30cm out from its own wall.
    // Extend the model's actual bracket ends to that plane in either yaw.
    const nx=Math.sin(unit.yaw),nz=Math.cos(unit.yaw);
    for(const source of sourceBrackets){
      const p=mountedPoint(unit,source);
      const distance=(p.x-unit.x)*nx+(p.z-unit.z)*nz+.30;
      const wallX=p.x-nx*distance,wallZ=p.z-nz*distance;
      fixedParts.push({m:edgeMaterial,alwaysStreet:true,x:(p.x+wallX)/2,y:p.y,z:(p.z+wallZ)/2,
        w:Math.abs(p.x-wallX)+.035,h:.035,d:Math.abs(p.z-wallZ)+.035});
      fixedParts.push({m:edgeMaterial,alwaysStreet:true,x:wallX+nx*.012,y:p.y,z:wallZ+nz*.012,
        w:Math.abs(nx)>.5?.025:.065,h:.09,d:Math.abs(nz)>.5?.025:.065});
    }
  }

  // An original CC0 Yagi model replaces the previous primitive masts. Its
  // local y=0 is the foot and its 1.8m mast projects above the roofline.
  const antenna=sources.antenna,antennaNode='Television_antenna_-_Yagi_rooftop';
  const antennaPlaces=[
    [-8.65,8.9,-7.32,Math.PI/2],[-8.65,9.2,-1.53,Math.PI/2],
    [9.5,8.6,10.7,-Math.PI/2],[-26.24,10.2,-25.65,0],
    [-12.98,8.3,-25.65,0],[11.04,8.5,-25.65,0],[24.1,8.1,-25.65,0],
  ];
  for(const [x,roofHeight,z,yaw] of antennaPlaces){
    addNode(antenna,antennaNode,matrix(x,roofHeight+.12,z,1,yaw),'tv-antenna');
  }

  // The original round sections are joined into vertical exhaust runs. Each
  // starts at a wall penetration and terminates above its own roof parapet.
  // The source is a 16-piece catalogue, not a ready-made duct run.
  const duct=sources.duct,ductNode='modular_airduct_circular_single';
  const ductBox=nodeBox(duct,ductNode),ductSize=ductBox.getSize(new THREE.Vector3());
  const ductPitch=ductSize.z*.92,ductCenter=ductBox.getCenter(new THREE.Vector3());
  const ductLocations=[[-23.3,10.2],[-10.2,8.3],[8.1,9.8],[15.6,9.3],[23.5,8.1]];
  const supportRings=[],roofCaps=[];
  for(const [x,roofHeight] of ductLocations){
    const base=3.10,top=roofHeight+.35,centerZ=wall-.20;
    // A final shortened section reaches the correct height without gaps.
    for(let bottom=base;bottom<top-.0001;){
      const length=Math.min(ductPitch,top-bottom);
      const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI/2,0,0,'YXZ'));
      const pose=new THREE.Matrix4().compose(new THREE.Vector3(x,bottom+length/2,centerZ),q,
        new THREE.Vector3(.92,.92,length/ductSize.z));
      pose.multiply(new THREE.Matrix4().makeTranslation(-ductCenter.x,-ductCenter.y,-ductCenter.z));
      addNode(duct,ductNode,pose,'duct');bottom+=length;
    }
    // The inlet turns into the wall. Both the short horizontal connection and
    // curved coupling are existing CC0 modules, not new fake end caps.
    addCentered(duct,ductNode,x,base,wall-.11,.92,0,0,'duct-wall-inlet');
    addCentered(duct,'modular_airduct_circular_bend_half',x,base+.045,centerZ,.92,0,-Math.PI/2,'duct-elbow');
    fixedParts.push({m:edgeMaterial,x,y:base,z:wall-.04,w:.43,h:.43,d:.035});
    // Wall plates and clamp rings visibly support the pipe at three heights.
    for(const y of [base+.38,(base+top)/2,top-.50]){
      fixedParts.push({m:edgeMaterial,x,y,z:wall-.105,w:.045,h:.055,d:.17});
      fixedParts.push({m:edgeMaterial,x,y,z:wall-.036,w:.13,h:.13,d:.035});
      supportRings.push({x,y,z:centerZ});
    }
    // A small raised rain hood leaves the outlet at the roofline open.
    for(const dx of [-.15,.15])fixedParts.push({m:edgeMaterial,x:x+dx,y:top+.09,z:centerZ,w:.025,h:.17,d:.025});
    roofCaps.push({x,y:top+.185,z:centerZ});
  }
  let fixedBatches=0;
  for(const material of [doorMaterial,edgeMaterial,handleMaterial,windowMaterial]){
    for(const rear of [true,false]){
      const parts=fixedParts.filter(p=>p.m===material&&(p.z < -20&&!p.alwaysStreet)===rear);
      if(!parts.length)continue;
      const mesh=new THREE.InstancedMesh(boxGeometry,material,parts.length),o=new THREE.Object3D();
      parts.forEach((p,i)=>{o.position.set(p.x,p.y,p.z);o.scale.set(p.w,p.h,p.d);o.updateMatrix();mesh.setMatrixAt(i,o.matrix);});
      mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=true;mesh.receiveShadow=true;mesh.computeBoundingSphere();
      (rear?rearGroup:streetGroup).add(mesh);fixedBatches++;
    }
  }
  const ringGeometry=new THREE.TorusGeometry(.175,.014,6,16);
  const rings=new THREE.InstancedMesh(ringGeometry,edgeMaterial,supportRings.length),ringObject=new THREE.Object3D();
  ringObject.rotation.x=Math.PI/2;
  supportRings.forEach((p,i)=>{ringObject.position.set(p.x,p.y,p.z);ringObject.updateMatrix();rings.setMatrixAt(i,ringObject.matrix);});
  rings.instanceMatrix.needsUpdate=true;rings.castShadow=true;rings.receiveShadow=true;rings.computeBoundingSphere();rearGroup.add(rings);
  const capGeometry=new THREE.CylinderGeometry(.245,.245,.035,16);
  const caps=new THREE.InstancedMesh(capGeometry,edgeMaterial,roofCaps.length),capObject=new THREE.Object3D();
  roofCaps.forEach((p,i)=>{capObject.position.set(p.x,p.y,p.z);capObject.updateMatrix();caps.setMatrixAt(i,capObject.matrix);});
  caps.instanceMatrix.needsUpdate=true;caps.castShadow=true;caps.receiveShadow=true;caps.computeBoundingSphere();rearGroup.add(caps);

  for(const batch of batches.values()){
    const instanced=new THREE.InstancedMesh(batch.geometry,batch.material,batch.matrices.length);
    instanced.name=`Building details / ${batch.sector}`;
    batch.matrices.forEach((m,i)=>instanced.setMatrixAt(i,m));
    instanced.instanceMatrix.needsUpdate=true;instanced.castShadow=true;instanced.receiveShadow=true;
    instanced.computeBoundingSphere();(batch.sector.startsWith('rear-')?rearGroup:streetGroup).add(instanced);
  }
  scene.add(group);
  function update(camera){
    const shouldShowRear=camera.position.z < -27.5 || camera.position.y > 9;
    if(rearGroup.visible===shouldShowRear)return false;
    rearGroup.visible=shouldShowRear;return true;
  }
  const extraTriangles=fixedParts.length*12+(ringGeometry.index.count/3)*supportRings.length+(capGeometry.index.count/3)*roofCaps.length;
  return {group,colliders,update,stats:{available:true,drawCalls:batches.size+fixedBatches+2,sectors:new Set([...batches.values()].map(batch=>batch.sector)).size,triangles:Math.round(primitiveTriangles+extraTriangles),fireEscapes:BUILDINGS.length,airConditioners:acPlaces.length,antennas:antennaPlaces.length,ductStacks:ductLocations.length,rearWindows:rearWindows.length,placements:placements.length}};
}
