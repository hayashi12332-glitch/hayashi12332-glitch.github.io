import * as THREE from 'three';
import {createSurfaceMaterial} from './surfaces.js';
import {SIGN_FONT} from './typography.js';

// Original rain fittings for the two occupied west-side shophouses. Units are
// metres. This replaces ONLY their old striped outer shades; their structural
// arcade, signs, counters, doors and existing plant positions stay untouched.
// Water/cloth here is an inexpensive visible approximation, not fluid/cloth
// collision. No resident, character or new third-party asset is constructed.
export function createRainStreetDetails(parent){
  const root=new THREE.Group();root.name='Rain-responsive occupied shopfronts';parent.add(root);
  const geom={box:new THREE.BoxGeometry(1,1,1),cylinder:new THREE.CylinderGeometry(1,1,1,16),drop:new THREE.SphereGeometry(1,6,4)};
  const mats={
    metal:createSurfaceMaterial('metal','#9da7a0',{metalness:.74,roughness:.45}),
    dark:createSurfaceMaterial('paint','#344b47',{roughness:.63}),
    rubber:createSurfaceMaterial('rubber','#293230',{roughness:.82}),
    wood:createSurfaceMaterial('wood','#9b835f',{roughness:.83}),
    paper:createSurfaceMaterial('canvas','#ad906a',{roughness:.94}),
    tape:createSurfaceMaterial('plastic','#b9a47f',{roughness:.68}),
    teal:createSurfaceMaterial('canvas','#52776d',{roughness:.86}),
    burgundy:createSurfaceMaterial('canvas','#89534b',{roughness:.90}),
    charcoal:createSurfaceMaterial('canvas','#626965',{roughness:.90}),
  };
  for(const [name,m] of Object.entries(mats))m.name='Rain street '+name;
  const batches=new Map(),dummy=new THREE.Object3D(),up=new THREE.Vector3(0,1,0);
  const measuredBounds=new Map();let feature='supports';
  function measure(g,matrix){
    if(!g.boundingBox)g.computeBoundingBox();
    const bounds=g.boundingBox.clone().applyMatrix4(matrix);
    if(!measuredBounds.has(feature))measuredBounds.set(feature,new THREE.Box3());
    measuredBounds.get(feature).union(bounds);
  }
  function piece(g,m,p,s,r=[0,0,0]){
    const key=g.uuid+':'+m.uuid;
    if(!batches.has(key))batches.set(key,{g,m,matrices:[]});
    dummy.position.set(...p);dummy.scale.set(...s);dummy.rotation.set(...r);dummy.updateMatrix();measure(g,dummy.matrix);batches.get(key).matrices.push(dummy.matrix.clone());
  }
  const b=(m,x,y,z,w,h,d)=>piece(geom.box,m,[x,y,z],[w,h,d]);
  const c=(m,x,y,z,r,h,rotation=[0,0,0])=>piece(geom.cylinder,m,[x,y,z],[r,h,r],rotation);
  function rod(m,a,b,r=.018){
    const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),v=end.clone().sub(start),length=v.length();
    dummy.position.copy(start).add(end).multiplyScalar(.5);dummy.quaternion.setFromUnitVectors(up,v.normalize());dummy.scale.set(r,length,r);dummy.updateMatrix();
    const key=geom.cylinder.uuid+':'+m.uuid;
    if(!batches.has(key))batches.set(key,{g:geom.cylinder,m,matrices:[]});
    measure(geom.cylinder,dummy.matrix);batches.get(key).matrices.push(dummy.matrix.clone());
  }
  function curvedRod(m,points,r=.021){
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
    const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,14,r,8,false),m);mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);measure(mesh.geometry,new THREE.Matrix4());return mesh;
  }
  function clothMap(color){
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=128;const q=canvas.getContext('2d');q.fillStyle=color;q.fillRect(0,0,256,128);
    let seed=color.length*127;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    for(let i=0;i<310;i++){q.fillStyle=`rgba(232,224,202,${.018+rand()*.027})`;q.fillRect(rand()*256,rand()*128,5+rand()*17,1+rand()*3);}
    q.strokeStyle='rgba(42,52,45,.32)';q.lineWidth=1;for(const x of [6,84,170,250]){q.beginPath();q.moveTo(x,0);q.lineTo(x,128);q.stroke();}
    q.strokeStyle='rgba(219,218,192,.64)';q.lineWidth=3;q.strokeRect(3,3,250,122);
    const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.name='Original rain canopy sewn weathered cloth';return t;
  }
  const dripSources=[],canopies=[];
  function canopy({id,z,width,back,front,rearY,frontY,color,pipeZ}){
    feature=id+'-canopy';
    const geometry=new THREE.PlaneGeometry(width,1,20,5),position=geometry.attributes.position,uv=geometry.attributes.uv;
    // +u runs along the street; +v runs outwards. The mild sag is supported
    // by rear/front tubes and two stays, not a freestanding floating sheet.
    for(let i=0;i<position.count;i++){
      const u=uv.getX(i),v=uv.getY(i),x=back+(front-back)*v;
      const yy=rearY+(frontY-rearY)*v-.024*Math.sin(v*Math.PI)*Math.sin(u*Math.PI);
      position.setXYZ(i,x,yy,z+(u-.5)*width);
    }
    geometry.computeVertexNormals();
    const material=new THREE.MeshStandardMaterial({map:clothMap(color),color:'#ffffff',roughness:.83,side:THREE.DoubleSide});material.name=id+' waterproof sewn canopy';
    const mesh=new THREE.Mesh(geometry,material);mesh.name=id+' supported rain canopy';mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);
    const lateral=[z-width/2+.13,z+width/2-.13];
    rod(mats.metal,[back,rearY-.025,z-width/2],[back,rearY-.025,z+width/2],.020);
    rod(mats.metal,[front,frontY-.028,z-width/2],[front,frontY-.028,z+width/2],.022);
    for(const zz of lateral){
      // Rear hangers end inside the existing full soffit (underside3.14m).
      rod(mats.metal,[back,rearY-.03,zz],[back,3.21,zz],.016);
      b(mats.metal,back,3.155,zz,.12,.025,.12);
      rod(mats.metal,[back,rearY-.044,zz],[front,frontY-.052,zz],.019);
      // Front hanger meets the actual street-side beam at x≈-3.60.
      rod(mats.metal,[front,frontY-.025,zz],[-3.60,3.07,zz],.015);
      b(mats.metal,-3.60,3.065,zz,.12,.055,.10);
    }
    b(material,front,frontY-.095,z,.018,.15,width);
    // An open U-channel, with closed end plates, collects water at the lip.
    const section=new THREE.Shape(),radius=.040,inner=.034;
    section.moveTo(-radius,0);section.absarc(0,0,radius,Math.PI,Math.PI*2,false);section.lineTo(inner,0);section.absarc(0,0,inner,Math.PI*2,Math.PI,true);section.closePath();
    const gutterGeometry=new THREE.ExtrudeGeometry(section,{depth:width+.035,bevelEnabled:false,steps:1,curveSegments:12});gutterGeometry.translate(front+.030,frontY-.015,z-width/2-.018);
    const gutter=new THREE.Mesh(gutterGeometry,mats.metal);gutter.name=id+' open supported rain gutter';gutter.castShadow=true;gutter.receiveShadow=true;root.add(gutter);
    for(const zz of [z-width/2-.014,z+width/2+.014])b(mats.metal,front+.030,frontY-.035,zz,.080,.040,.010);
    const columnZ=pipeZ,sideFaceZ=columnZ+.17;pipeZ=columnZ+.215;
    const pipeX=-3.56,pipeTop=frontY-.09,pipeBottom=.34;
    curvedRod(mats.metal,[[front+.030,frontY-.035,z-width/2+.020],[front+.055,frontY-.07,(z-width/2+.020+pipeZ)/2],[pipeX,pipeTop,pipeZ]],.024);
    rod(mats.metal,[pipeX,pipeBottom,pipeZ],[pipeX,pipeTop,pipeZ],.024);
    for(const yy of [.66,1.63,2.34].filter(y=>y<pipeTop-.05)){
      b(mats.dark,pipeX,yy,sideFaceZ-.002,.09,.055,.024);
      rod(mats.metal,[pipeX,yy,sideFaceZ],[pipeX,yy,pipeZ+.003],.010);
    }
    curvedRod(mats.metal,[[pipeX,.37,pipeZ],[pipeX+.020,.27,pipeZ],[pipeX+.16,.24,pipeZ]],.024);
    dripSources.push({x:front+.043,y:frontY-.06,z:z+width*.28,bottom:.17,phase:.13},{x:pipeX+.16,y:.22,z:pipeZ,bottom:.146,phase:.62});
    canopies.push({id,center:[(front+back)/2,(rearY+frontY)/2,z],bounds:{x:[back,front+.076],z:[z-width/2-.03,z+width/2+.03]},minimumValanceY:frontY-.17,supports:'slab hangers at3.21m + existing front beam at3.07m +2metal stays',downpipe:{x:pipeX,z:pipeZ,bottom:.216,top:pipeTop}});
  }
  canopy({id:'dry-goods',z:-2.65,width:4.88,back:-4.48,front:-3.48,rearY:3.01,frontY:2.77,color:'#986455',pipeZ:-5.27});
  canopy({id:'noodle-shop',z:3.15,width:4.68,back:-4.43,front:-3.49,rearY:2.89,frontY:2.62,color:'#4c6d60',pipeZ:.63});

  // A short rain screen beside the dry-goods north display bay. It is at the
  // street edge,1.97m outboard of the walking centreline, and never closes a
  // shop entrance. Its visible top is physically held by a roller and2loops.
  const curtainGroup=new THREE.Group();curtainGroup.name='Dry shop partial rain screen';root.add(curtainGroup);
  const curtainX=-3.425,curtainZ=-4.48,curtainTop=2.65,curtainBottom=.90,curtainWidth=.78;
  c(mats.metal,curtainX,curtainTop+.035,curtainZ,.027,curtainWidth+.08,[Math.PI/2,0,0]);
  for(const zz of [curtainZ-curtainWidth/2+.035,curtainZ+curtainWidth/2-.035])rod(mats.metal,[curtainX,curtainTop+.035,zz],[-3.48,2.742,zz],.010);
  const sheetGeometry=new THREE.PlaneGeometry(curtainWidth,curtainTop-curtainBottom,18,9),sheetPosition=sheetGeometry.attributes.position,sheetUV=sheetGeometry.attributes.uv;
  for(let i=0;i<sheetPosition.count;i++){
    const u=sheetUV.getX(i),v=sheetUV.getY(i);sheetPosition.setXYZ(i,curtainX+.007*Math.sin(u*12*Math.PI)*(1-v),curtainBottom+v*(curtainTop-curtainBottom),curtainZ+(u-.5)*curtainWidth);
  }
  sheetGeometry.computeVertexNormals();
  const sheetMaterial=new THREE.MeshStandardMaterial({color:'#c5d0c9',transparent:true,opacity:.17,roughness:.25,metalness:0,side:THREE.DoubleSide,depthWrite:false,envMapIntensity:1.25});sheetMaterial.name='Thin flexible clear PVC rain screen approximation';
  const sheet=new THREE.Mesh(sheetGeometry,sheetMaterial);sheet.name='Dry shop transparent rain-only sheet';sheet.receiveShadow=true;sheet.castShadow=false;curtainGroup.add(sheet);
  const screenEdge=new THREE.MeshStandardMaterial({color:'#a9b4ab',transparent:true,opacity:.60,roughness:.6});
  const edgeGeo=new THREE.BoxGeometry(1,1,1);
  for(const zz of [curtainZ-curtainWidth/2,curtainZ+curtainWidth/2]){const edge=new THREE.Mesh(edgeGeo,screenEdge);edge.position.set(curtainX+.002,(curtainTop+curtainBottom)/2,zz);edge.scale.set(.009,curtainTop-curtainBottom,.012);curtainGroup.add(edge);}
  const weightedRail=new THREE.Mesh(new THREE.CylinderGeometry(.013,.013,curtainWidth+.026,10),mats.metal);weightedRail.rotation.x=Math.PI/2;weightedRail.position.set(curtainX,curtainBottom,curtainZ);curtainGroup.add(weightedRail);
  for(const u of [.24,.63]){const crease=new THREE.Mesh(edgeGeo,screenEdge);crease.position.set(curtainX+.007,(curtainTop+curtainBottom)/2,curtainZ+(u-.5)*curtainWidth);crease.scale.set(.002,curtainTop-curtainBottom,.003);crease.material=screenEdge.clone();crease.material.opacity=.12;curtainGroup.add(crease);}

  function cartonPrint(){
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=128;const q=canvas.getContext('2d');q.fillStyle='#b9a17c';q.fillRect(0,0,256,128);q.fillStyle='#464c3e';q.font=`700 42px ${SIGN_FONT}`;q.textAlign='center';q.textBaseline='middle';q.fillText('南北貨',128,47,230);
    // Original keep-dry pictogram, not a copied brand or undocumented SKU.
    q.lineWidth=4;q.strokeStyle='#464c3e';q.beginPath();q.arc(128,96,17,Math.PI,0);q.moveTo(111,96);q.lineTo(145,96);q.moveTo(128,81);q.lineTo(128,111);q.quadraticCurveTo(128,118,135,114);q.stroke();
    for(const x of [35,215]){q.beginPath();q.moveTo(x,113);q.lineTo(x,84);q.moveTo(x-7,91);q.lineTo(x,84);q.lineTo(x+7,91);q.stroke();}
    const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.name='Original carton 南北貨 keep-dry print';const m=new THREE.MeshStandardMaterial({map,roughness:.92});m.name='Rain delivery carton print';return m;
  }
  const cartonLabel=cartonPrint(),labelGeo=new THREE.PlaneGeometry(1,1);
  feature='delivery-handcart';
  const cart={x:-4.12,z:-4.64,floor:.14,width:.57,depth:.42};
  // Four swivel casters: rubber contacts the existing .14m arcade floor.
  for(const dx of [-.14,.14])for(const dz of [-.245,.245]){
    c(mats.rubber,cart.x+dx,.210,cart.z+dz,.070,.036,[Math.PI/2,0,0]);
    c(mats.metal,cart.x+dx,.210,cart.z+dz,.026,.042,[Math.PI/2,0,0]);
    for(const side of [-1,1])b(mats.metal,cart.x+dx,.250,cart.z+dz+side*.026,.065,.083,.012);
    c(mats.metal,cart.x+dx,.290,cart.z+dz,.017,.041);
  }
  b(mats.dark,cart.x,.321,cart.z,.43,.043,.60);
  b(mats.wood,cart.x,.349,cart.z,.398,.015,.565);
  for(const dz of [-.254,.254]){
    rod(mats.metal,[cart.x-.165,.339,cart.z+dz],[cart.x-.165,1.04,cart.z+dz],.017);
    rod(mats.metal,[cart.x-.165,.34,cart.z+dz],[cart.x+.15,.34,cart.z+dz],.015);
  }
  rod(mats.rubber,[cart.x-.165,1.04,cart.z-.254],[cart.x-.165,1.04,cart.z+.254],.022);
  rod(mats.metal,[cart.x-.165,.68,cart.z-.254],[cart.x-.165,.68,cart.z+.254],.012);
  for(const [xx,zz,y,w,h,d] of [[cart.x+.018,cart.z,.486,.31,.258,.43],[cart.x+.006,cart.z+.018,.729,.29,.228,.38]]){
    b(mats.paper,xx,y,zz,w,h,d);b(mats.tape,xx,y+h/2+.002,zz,.050,.004,d+.003);
    b(mats.tape,xx+w/2+.002,y,zz,.004,h,.046);
    b(mats.tape,xx,y+h/2+.003,zz-.10,w-.012,.002,.005);
    const label=new THREE.Mesh(labelGeo,cartonLabel);label.rotation.y=Math.PI/2;label.position.set(xx+w/2+.003,y,zz);label.scale.set(d*.81,h*.72,1);label.updateMatrix();measure(labelGeo,label.matrix);root.add(label);
  }
  // A steel rain-umbrella rack is kept behind a column-side bay, not across
  // the food shop's real entry (x≈-6.15,z≈5.2) or the cart/stall at z3.15.
  feature='umbrella-rack';
  const rack={x:-4.02,z:1.18,floor:.14,width:.28,depth:.28};
  b(mats.dark,rack.x,.158,rack.z,.28,.036,.28);
  b(mats.metal,rack.x,.182,rack.z,.24,.012,.24);
  for(const xx of [rack.x-.119,rack.x+.119])for(const zz of [rack.z-.119,rack.z+.119])c(mats.metal,xx,.414,zz,.009,.464);
  for(const yy of [.220,.638]){
    for(const xx of [rack.x-.125,rack.x+.125])rod(mats.metal,[xx,yy,rack.z-.125],[xx,yy,rack.z+.125],.009);
    for(const zz of [rack.z-.125,rack.z+.125])rod(mats.metal,[rack.x-.125,yy,zz],[rack.x+.125,yy,zz],.009);
  }
  const foldGeo=new THREE.LatheGeometry([[0,.08],[.015,.14],[.031,.32],[.038,.54],[.026,.66],[.009,.72],[0,.73]].map(p=>new THREE.Vector2(...p)),12);
  for(const [i,dx,dz,lift,m] of [[0,-.052,-.040,.0,mats.burgundy],[1,.056,-.025,.065,mats.teal],[2,-.005,.063,.02,mats.charcoal]]){
    const x=rack.x+dx,z=rack.z+dz,tip=.188,stretch=1+lift;
    c(mats.metal,x,tip+.40*stretch,z,.004,.80*stretch);
    piece(foldGeo,m,[x,tip,z],[1,stretch,1]);c(mats.dark,x,tip+.43*stretch,z,.039,.015);
    curvedRod(mats.rubber,[[x,tip+.79*stretch,z],[x,tip+.87*stretch,z],[x+.035,tip+.88*stretch,z],[x+.053,tip+.85*stretch,z],[x+.051,tip+.81*stretch,z]],.010);
    for(const a of [0,Math.PI*2/3,Math.PI*4/3])rod(mats.dark,[x+Math.cos(a)*.010,tip+.17*stretch,z+Math.sin(a)*.010],[x+Math.cos(a)*.033,tip+.51*stretch,z+Math.sin(a)*.033],.0017);
  }

  let staticPieces=0;
  for(const {g,m,matrices} of batches.values()){
    const mesh=new THREE.InstancedMesh(g,m,matrices.length);mesh.name='Rain street static fittings '+m.name;matrices.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=true;mesh.receiveShadow=true;mesh.computeBoundingSphere();root.add(mesh);staticPieces+=matrices.length;
  }
  const dropMaterial=new THREE.MeshBasicMaterial({color:'#b9c4c3',transparent:true,opacity:.25,depthWrite:false});dropMaterial.name='Small rain gutter drops';
  const count=20,drops=new THREE.InstancedMesh(geom.drop,dropMaterial,count);drops.name='Rain-only supported gutter and outlet drips';drops.instanceMatrix.setUsage(THREE.DynamicDrawUsage);drops.frustumCulled=false;root.add(drops);
  const colliders=[
    {id:'rain-delivery-handcart',position:[cart.x,.65,cart.z],size:[.48,1.02,.68]},
    {id:'rain-umbrella-rack',position:[rack.x,.70,rack.z],size:[.30,1.12,.30]},
  ];
  let raining=false,time=0,elapsed=1;
  function setWeather(mode){raining=mode===true||mode==='rain'||mode==='rainy';curtainGroup.visible=raining;drops.visible=raining;elapsed=1;if(raining)update(0);}
  function update(dt){
    if(!raining)return;time+=Math.min(Math.max(dt||0,0),.25);elapsed+=Math.min(Math.max(dt||0,0),.25);if(elapsed<1/20)return;elapsed=0;
    for(let i=0;i<count;i++){
      const source=dripSources[i%dripSources.length],f=(time*(source.y<.4?1.5:.65)+i*.137+source.phase)%1;
      dummy.position.set(source.x+.003*Math.sin(i*4.1),source.y-(source.y-source.bottom)*f,source.z+.007*Math.cos(i*1.7));dummy.rotation.set(0,0,.035);dummy.scale.set(.0035,source.y<.4?.008:.018,.0035);dummy.updateMatrix();drops.setMatrixAt(i,dummy.matrix);
    }
    drops.instanceMatrix.needsUpdate=true;
  }
  function getSnapshot(){return {raining,canopies:canopies.length,rainCurtainVisible:curtainGroup.visible,gutterDropsVisible:drops.visible,handcarts:1,storedUmbrellas:3,umbrellaRacks:1,stockCartons:2,people:0,staticPieces,staticBatches:batches.size};}
  const diagnostics={
    units:'metres',floorY:.14,canopies,
    measuredPropGeometryBounds:Object.fromEntries([...measuredBounds].filter(([id])=>id==='delivery-handcart'||id==='umbrella-rack').map(([id,b])=>[id,{min:b.min.toArray(),max:b.max.toArray()}])),
    curtain:{x:curtainX,z:curtainZ,width:curtainWidth,top:curtainTop,bottom:curtainBottom,rainOnly:true,softSheetCollider:false,clearanceFromArcadeCentreline:Math.abs(curtainX+5.4),support:'roller and2loops to new dry canopy front tube'},
    props:[{id:'rain-delivery-handcart',footprint:{x:[cart.x-.24,cart.x+.24],z:[cart.z-.34,cart.z+.34]},floor:.14,loadBase:.356,cartonBottoms:[.357,.615],height:1.062},{id:'rain-umbrella-rack',footprint:{x:[rack.x-.15,rack.x+.15],z:[rack.z-.15,rack.z+.15]},floor:.14,height:1.153}],
    preservedRoutes:[{name:'West continuous qilou',x:-5.4,z:[-10,10],clearWidth:1.05},{name:'dry-goods entry',x:-6.15,z:-.50},{name:'noodle-shop entry',x:-6.15,z:5.20}],
    limits:['Support, dimensions and foot clearances here are authored metadata; actual scene/physics/visual QA remains required.','Rain screen is thin alpha-blended flexible PVC approximation, not refractive transmission or cloth physics.','Drips visually indicate drainage only; no fluid simulation or wetness accumulation model.','The existing frontage floor height .14m is retained; hidden joins need near/side images.'],
  };
  root.userData.rainStreetDiagnostics=diagnostics;setWeather('clear');
  return {root,group:root,colliders,groundColliders:[],setWeather,update,getSnapshot,diagnostics};
}
