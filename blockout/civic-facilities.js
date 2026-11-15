import * as THREE from 'three';
import {createSurfaceMaterial} from '../src/surfaces.js';
import {createPaperLanternParts} from '../src/rain-festival-details.js';

// Two fictional neighbourhood services beside the south cross street.
// Dimensions are metres. These are local, original shapes and use the street's
// existing sign atlas and Taiwan font; they do not imitate a real clinic or deity.
export function addCivicFacilities(scene, {signage: signs}) {
  if (!signs?.add) throw new Error('Civic facilities need the shared street signage atlas');
  const root = new THREE.Group();
  root.name = 'Neighbourhood shrine and clinic';
  scene.add(root);
  const colliders = [], groundColliders = [];
  const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
  const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 1, 12);
  const sphereGeometry = new THREE.SphereGeometry(1, 16, 10);
  const offeringGeometry = new THREE.SphereGeometry(1, 10, 7);
  const materials = {
    pavement: createSurfaceMaterial('concrete','#c5c1b3',{roughness:.98}),
    seam: new THREE.MeshStandardMaterial({color:'#96968b', roughness:1}),
    templeWall: createSurfaceMaterial('plaster','#cbbba2',{roughness:.93}),
    brick: new THREE.MeshStandardMaterial({color:'#9b5541', roughness:.94}),
    templeRed: createSurfaceMaterial('paint','#923c31',{roughness:.82}),
    templeDark: createSurfaceMaterial('wood','#63302c',{roughness:.84}),
    tile: createSurfaceMaterial('concrete','#506259',{roughness:.83}),
    tileRidge: new THREE.MeshStandardMaterial({color:'#344941', roughness:.83}),
    gold: new THREE.MeshStandardMaterial({color:'#bc9a54', metalness:.36, roughness:.52}),
    clinicWall: createSurfaceMaterial('plaster','#d9d6c9',{roughness:.9}),
    clinicTrim: createSurfaceMaterial('paint','#517d76',{roughness:.73}),
    clinicDark: new THREE.MeshStandardMaterial({color:'#334b48', roughness:.72}),
    clinicGlass: new THREE.MeshStandardMaterial({color:'#98c2be', transparent:true, opacity:.30, depthWrite:false, roughness:.24, metalness:.08}),
    interior: createSurfaceMaterial('tile','#e8e4d8',{roughness:.93}),
    chair: new THREE.MeshStandardMaterial({color:'#8fae9f', roughness:.75}),
    steel: createSurfaceMaterial('metal','#a9ada6',{metalness:.62, roughness:.43}),
    ceramic: new THREE.MeshStandardMaterial({color:'#d8d2bc', roughness:.65}),
    foliage: new THREE.MeshStandardMaterial({color:'#587451', roughness:.95}),
    flower: new THREE.MeshStandardMaterial({color:'#d79175', roughness:.9}),
    orange: new THREE.MeshStandardMaterial({color:'#d89435', roughness:.72}),
    redFruit: new THREE.MeshStandardMaterial({color:'#a94835', roughness:.75}),
    candle: new THREE.MeshStandardMaterial({color:'#b33b2e', roughness:.75}),
    flame: new THREE.MeshStandardMaterial({color:'#f4be60',emissive:'#e58a2e',emissiveIntensity:.45,roughness:.55}),
    lantern: new THREE.MeshStandardMaterial({color:'#a82f24', emissive:'#b84021', emissiveIntensity:.15, roughness:.7}),
    lanternRib: new THREE.MeshStandardMaterial({color:'#98564b', roughness:.93}),
    lanternTassel: new THREE.MeshStandardMaterial({color:'#a74a3c', roughness:.94}),
    dark: new THREE.MeshStandardMaterial({color:'#353b35', roughness:.9}),
    // Only on exterior wall edges, never on glazing, signs or altar surfaces.
    runoff: new THREE.MeshStandardMaterial({color:'#68766c',transparent:true,opacity:.13,depthWrite:false,roughness:1}),
    damp: new THREE.MeshStandardMaterial({color:'#697268',transparent:true,opacity:.16,depthWrite:false,roughness:1}),
  };
  const batches = new Map();
  const transform = new THREE.Object3D();
  function add(geometry, material, x, y, z, w, h, d, rx=0, ry=0, rz=0) {
    const key = geometry.uuid + ':' + material.uuid;
    if (!batches.has(key)) batches.set(key, {geometry, material, matrices:[]});
    transform.position.set(x,y,z); transform.rotation.set(rx,ry,rz);
    transform.scale.set(w,h,d); transform.updateMatrix();
    batches.get(key).matrices.push(transform.matrix.clone());
  }
  function box(material,x,y,z,w,h,d) { add(boxGeometry,material,x,y,z,w,h,d); }
  function cylinder(material,x,y,z,r,h) { add(cylinderGeometry,material,x,y,z,r,h,r); }
  function collider(x,y,z,w,h,d) { colliders.push({position:[x,y,z],size:[w,h,d]}); }
  function solid(material,x,y,z,w,h,d) { box(material,x,y,z,w,h,d); collider(x,y,z,w,h,d); }
  function floor(material,x,z,w,d,height=.14) {
    box(material,x,height/2,z,w,height,d);
    groundColliders.push({position:[x,height/2,z],size:[w,height,d]});
  }

  // Extend the existing raised south sidewalk to two actual doorways.
  // Its north edge meets the existing sidewalk at z=21.6, with no drop.
  floor(materials.pavement,-27.55,22.36,17.9,1.52,.14);
  for (let x=-36.0;x<=-19.0;x+=.75) box(materials.seam,x,.142,22.36,.012,.003,1.48);
  box(materials.seam,-27.55,.142,22.34,17.85,.003,.012);

  // 榕安宮: a small streetside temple with a central clear doorway and an
  // interior altar. The detached tray and urn are beside, not on, the route.
  const shrineX=-31.75, shrineFront=23.10, shrineBack=29.70;
  floor(materials.pavement,shrineX,26.40,6.50,6.60,.14);
  solid(materials.templeWall,-34.94,1.85,26.40,.18,3.42,6.60);
  solid(materials.templeWall,-28.56,1.85,26.40,.18,3.42,6.60);
  solid(materials.templeWall,shrineX,1.85,29.61,6.30,3.42,.18);
  // Close the interior up to the walls: the tiled roof sits higher than the
  // masonry, so without a ceiling the sky showed as a bright horizontal slit.
  box(materials.templeWall,shrineX,3.63,26.40,6.30,.16,6.48);
  solid(materials.templeRed,-34.02,1.82,shrineFront,1.68,3.36,.22);
  solid(materials.templeRed,-29.48,1.82,shrineFront,1.68,3.36,.22);
  // Runoff begins at the eave; small damp marks collect at the wall foot.
  for(const x of [-34.70,-28.80])box(materials.runoff,x,2.58,22.977,.065,1.22,.004);
  for(const x of [-34.02,-29.48])box(materials.damp,x,.22,22.977,1.57,.16,.004);
  for(const x of [-32.82,-30.68]) solid(materials.templeDark,x,1.94,22.98,.20,3.58,.25);
  box(materials.templeDark,shrineX,3.35,22.99,6.65,.32,.40);
  box(materials.gold,shrineX,3.54,22.97,6.70,.07,.41);
  // Recessed open doors leave a 1.9m passage and show the interior.
  for(const x of [-33.45,-30.05]) {
    box(materials.templeDark,x,1.42,23.30,.72,2.55,.07);
    for(let y=.55;y<2.6;y+=.43) box(materials.gold,x,y,23.25,.61,.025,.035);
  }
  solid(materials.templeDark,shrineX,.62,28.82,2.85,.96,.76);
  box(materials.gold,shrineX,1.13,28.80,2.98,.10,.84);
  box(materials.templeDark,shrineX,2.05,29.48,1.48,1.63,.045);
  for(const x of [-32.52,-30.98])box(materials.gold,x,2.05,29.44,.045,1.70,.04);
  box(materials.gold,shrineX,2.92,29.44,1.60,.05,.04);
  // Ordinary offerings, not a depiction of a particular deity: a central
  // incense vessel, two flowers, two fruit dishes and red devotional candles.
  cylinder(materials.gold,shrineX,1.28,28.77,.13,.20);
  cylinder(materials.templeDark,shrineX,1.39,28.77,.14,.045);
  for(const dx of [-.04,0,.04])cylinder(materials.gold,shrineX+dx,1.52,28.77,.008,.25);
  for(const side of [-1,1]) {
    const vx=shrineX+side*1.02;
    cylinder(materials.ceramic,vx,1.29,28.87,.105,.23);
    for(const [dx,dz,h] of [[-.05,-.02,.36],[0,.025,.43],[.05,-.01,.33]]) {
      cylinder(materials.foliage,vx+dx,1.41+h/2,28.87+dz,.009,h);
      add(offeringGeometry,materials.flower,vx+dx,1.43+h,28.87+dz,.055,.05,.055);
    }
    const cx=shrineX+side*.72;
    cylinder(materials.gold,cx,1.19,28.58,.075,.035);
    cylinder(materials.candle,cx,1.38,28.58,.045,.34);
    add(offeringGeometry,materials.flame,cx,1.59,28.58,.022,.045,.022);
    const fx=shrineX+side*.38;
    cylinder(materials.ceramic,fx,1.19,28.55,.19,.045);
    for(const [dx,dz] of [[-.08,-.04],[.08,-.04],[0,.075]])
      add(offeringGeometry,side<0?materials.orange:materials.redFruit,fx+dx,1.28,28.55+dz,.075,.07,.075);
  }
  // A modest incense urn stands to the side of the approach, preserving the
  // central entrance. It is scenery, not an interaction or religious claim.
  cylinder(materials.dark,-34.25,.54,22.72,.29,.72);
  cylinder(materials.gold,-34.25,.92,22.72,.34,.08);
  for(const x of [-34.35,-34.25,-34.15]) cylinder(materials.gold,x,1.08,22.72,.008,.26);

  // Double-pitched roof with a modest upturn at the eaves. Each half is a
  // single indexed geometry; tile seams are shared low-poly cylinders.
  const roofPoints = [-3.42,-2.85,-1.9,-.95,0,.95,1.9,2.85,3.42];
  const roofVertices = [], roofIndices = [];
  const roofRows = [[22.65,3.80],[26.40,4.82],[30.05,3.80]];
  for(const [z,y] of roofRows) for(const x of roofPoints) {
    const upturn = .30 * Math.pow(Math.abs(x)/3.42,4);
    roofVertices.push(shrineX+x,y+upturn,z);
  }
  for(let row=0;row<2;row++)for(let i=0;i<roofPoints.length-1;i++){
    const a=row*roofPoints.length+i,b=a+1,c=a+roofPoints.length,d=c+1;
    roofIndices.push(a,c,b,b,c,d);
  }
  const roofGeometry = new THREE.BufferGeometry();
  roofGeometry.setAttribute('position',new THREE.Float32BufferAttribute(roofVertices,3));
  roofGeometry.setIndex(roofIndices); roofGeometry.computeVertexNormals();
  const roof = new THREE.Mesh(roofGeometry,materials.tile);
  roof.name='Temple tiled roof';roof.castShadow=true;roof.receiveShadow=true;roof.material.side=THREE.DoubleSide;root.add(roof);
  box(materials.tileRidge,shrineX,4.84,26.40,6.98,.14,.20);
  box(materials.tileRidge,shrineX,3.81,22.65,6.90,.12,.16);
  for(let i=-7;i<=7;i++) {
    const x=shrineX+i*.43, lift=.30*Math.pow(Math.abs(i*.43)/3.42,4);
    // narrow seams follow the pitch, lending the tiles readable scale
    add(cylinderGeometry,materials.tileRidge,x,4.32+lift,24.52,.018,3.87,.018,Math.PI/2-.27,0,0);
    add(cylinderGeometry,materials.tileRidge,x,4.32+lift,28.22,.018,3.76,.018,Math.PI/2+.27,0,0);
  }
  for(const x of [-34.95,-28.55]) {
    box(materials.gold,x,4.04,22.55,.13,.40,.13);
    cylinder(materials.gold,x,4.32,22.55,.10,.19);
  }

  // Fill the two side gables beneath the pitched roof. The exterior wall
  // follows the same roof profile rather than exposing daylight above it.
  const gableMaterial=materials.templeWall.clone(); gableMaterial.side=THREE.DoubleSide;
  for(const x of [-34.94,-28.56]) {
    const offset=.30*Math.pow(Math.abs(x-shrineX)/3.42,4);
    const frontRoof=3.80+(23.10-22.65)/(26.40-22.65)*1.02;
    const backRoof=3.80+(30.05-29.70)/(30.05-26.40)*1.02;
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute([
      x,3.54,23.10, x,3.54,26.40, x,3.54,29.70,
      x,frontRoof+offset,23.10, x,4.82+offset,26.40, x,backRoof+offset,29.70,
    ],3));
    geometry.setIndex([0,1,3, 1,4,3, 1,2,4, 2,5,4]);
    geometry.computeVertexNormals();
    const gable=new THREE.Mesh(geometry,gableMaterial);
    gable.name='Shrine roof gable'; gable.castShadow=true; gable.receiveShadow=true; root.add(gable);
  }

  // A small wall-mounted circulation fan is common in compact temples. Its
  // cage and bracket are stationary scenery and stay clear of the passage.
  const fanX=-34.76,fanY=2.48,fanZ=26.90;
  box(materials.steel,-34.84,fanY-.20,fanZ,.13,.32,.065);
  add(cylinderGeometry,materials.clinicDark,fanX,fanY,fanZ,.09,.22,.09,0,0,Math.PI/2);
  const fanRing=new THREE.TorusGeometry(1,.045,5,24);
  for(const radius of [.24,.16])add(fanRing,materials.steel,fanX+.13,fanY,fanZ,radius,radius,radius,0,Math.PI/2,0);
  for(const angle of [0,Math.PI/2,Math.PI/4,-Math.PI/4])
    add(boxGeometry,materials.steel,fanX+.132,fanY,fanZ,.014,.46,.012,angle,0,0);
  add(cylinderGeometry,materials.ceramic,fanX+.15,fanY,fanZ,.055,.035,.055,0,0,Math.PI/2);

  const swingingLanterns=[];
  const lanternParts=createPaperLanternParts();
  for(const x of [-33.00,-30.50]) {
    const pivot=new THREE.Group(); pivot.position.set(x,3.20,22.75); root.add(pivot);
    const string=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,.28,6),materials.dark);
    string.position.y=-.14;pivot.add(string);
    // Shared paper-lantern parts replace the plain sphere: lathed paper body
    // with bamboo ribs, gold caps at both ends and tassel strands. The parts
    // anchor at the pivot, so the body spans -.155 to -.755 like the old
    // sphere's -.14 to -.72 envelope.
    const body=new THREE.Mesh(lanternParts.body,materials.lantern);
    body.castShadow=true;pivot.add(body);
    pivot.add(new THREE.Mesh(lanternParts.ribs,materials.lanternRib));
    pivot.add(new THREE.Mesh(lanternParts.caps,materials.gold));
    pivot.add(new THREE.Mesh(lanternParts.cord,materials.dark));
    pivot.add(new THREE.Mesh(lanternParts.tassel,materials.lanternTassel));
    swingingLanterns.push(pivot);
  }

  // 榕安診所: a small community clinic with a real central entrance,
  // glass side panels, interior reception, waiting chairs and information.
  const clinicX=-22.55, clinicFront=23.08, clinicBack=29.55;
  floor(materials.pavement,clinicX,26.31,7.05,6.46,.14);
  floor(materials.interior,clinicX,26.38,6.68,6.18,.20);
  solid(materials.clinicWall,-26.04,1.80,26.30,.17,3.28,6.44);
  solid(materials.clinicWall,-19.06,1.80,26.30,.17,3.28,6.44);
  solid(materials.clinicWall,clinicX,1.80,29.48,6.90,3.28,.16);
  // Two glass panels either side of a 1.5m unobstructed opening.
  for(const [x,w] of [[-24.65,2.6],[-20.45,2.6]]) {
    solid(materials.clinicGlass,x,1.49,clinicFront,w,2.42,.07);
    for(const px of [x-w/2,x+w/2])box(materials.steel,px,1.50,clinicFront-.02,.045,2.54,.07);
    box(materials.steel,x,.25,clinicFront-.02,w,.055,.08);
    box(materials.steel,x,2.75,clinicFront-.02,w,.055,.08);
  }
  box(materials.clinicTrim,clinicX,3.05,clinicFront,7.08,.50,.22);
  box(materials.clinicWall,clinicX,3.38,26.3,7.14,.18,6.68);
  // Residential-looking second level reinforces the existing street scale.
  solid(materials.clinicWall,clinicX,4.54,26.30,7.10,2.18,6.58);
  for(const x of [-24.35,-22.55,-20.75]) {
    box(materials.clinicDark,x,4.58,22.96,1.25,1.32,.035);
    box(materials.clinicGlass,x,4.58,22.94,1.12,1.18,.025);
    box(materials.clinicWall,x,3.89,22.88,1.42,.10,.24);
    // Short streaks start under the sill and stop above the clean shop fascia.
    for(const side of [-1,1])box(materials.runoff,x+side*.64,3.66,23.006,.045,.38,.004);
  }
  box(materials.clinicTrim,clinicX,5.69,26.30,7.20,.18,6.70);
  // A small water tank and pipes make the upper floor feel occupied.
  cylinder(materials.steel,-20.35,6.14,28.35,.42,.90);
  for(const y of [5.78,6.07,6.36,6.57])cylinder(materials.clinicDark,-20.35,y,28.35,.435,.022);
  box(materials.steel,-19.90,5.98,28.35,.08,.76,.08);
  // Reception counter set toward the rear keeps a straight walking approach.
  solid(materials.clinicWall,-22.55,.66,27.62,3.10,.92,.72);
  box(materials.clinicTrim,-22.55,1.15,27.62,3.18,.08,.80);
  box(materials.clinicDark,-22.15,1.43,27.48,.48,.37,.05);
  // Waiting seats: three moulded shells on one shared steel beam, the usual
  // clinic arrangement. Each seat has a waterfall front lip and a slightly
  // reclined back; the beam frame replaces four separate thin legs per chair.
  box(materials.steel,-25.50,.34,25.20,.07,.07,3.30);
  for(const z of [23.90,26.50]) {
    box(materials.steel,-25.50,.27,z,.06,.40,.06);
    box(materials.steel,-25.50,.215,z,.52,.05,.30);
  }
  for(const z of [24.15,25.20,26.25]) {
    box(materials.steel,-25.52,.46,z,.05,.22,.09);
    add(boxGeometry,materials.chair,-25.47,.615,z,.58,.09,.58);
    add(boxGeometry,materials.chair,-25.205,.545,z,.15,.06,.58,0,0,-.72);
    add(boxGeometry,materials.chair,-25.755,.99,z,.075,.58,.58,0,0,.13);
    add(boxGeometry,materials.chair,-25.735,.665,z,.05,.10,.58,0,0,.13);
  }
  collider(-25.48,.58,25.20,.78,1.16,3.42);
  box(materials.clinicTrim,-19.18,2.05,27.9,.025,.30,.30);
  box(materials.clinicTrim,-19.18,2.05,27.9,.025,.11,.53);

  const frontSign=(text,detail,x,y,z,width,height,bg,fg,note='')=>
    signs.add({text,detail,note,x,y,z,width,height,yaw:Math.PI,bg,fg});
  frontSign('榕安宮','誠心參拜',shrineX,3.23,22.71,2.35,.48,'#7d2d26','#f3d58b');
  // Fictional addresses continue along the south side of 榕南路.
  signs.add({text:'榕南路',detail:'18號',x:-34.20,y:2.30,z:22.97,width:.30,height:.39,yaw:Math.PI,kind:'address',bg:'#235b49'});
  frontSign('祈福平安','',shrineX,2.10,29.40,1.12,1.05,'#6f3028','#f1d186');
  frontSign('參拜入口','請保持安靜',-29.66,1.75,22.94,.90,.47,'#eee2c5','#74402d');
  frontSign('榕安診所','內科・家庭醫學科',clinicX,3.05,22.93,5.95,.43,'#44776f','#f7f5e9');
  signs.add({text:'榕南路',detail:'20號',x:-19.40,y:2.30,z:23.00,width:.30,height:.39,yaw:Math.PI,kind:'address',bg:'#235b49'});
  frontSign('門診時間','09:00–12:00',-24.55,1.80,22.99,1.02,.55,'#eef0e8','#315b56','週一至週六・週日休診');
  frontSign('掛號','請至櫃檯',-22.55,1.78,27.20,.90,.35,'#dce8e2','#315b56');
  frontSign('掛號須知','先掛號・再候診',-20.63,2.03,29.37,1.05,.46,'#edf0e8','#315b56');
  frontSign('候診區','請依序等候',-25.84,1.72,25.22,.70,.36,'#e8e9df','#315b56');
  frontSign('診所入口','',clinicX,2.62,22.94,1.20,.22,'#e3ede7','#315b56');

  for(const batch of batches.values()) {
    const mesh=new THREE.InstancedMesh(batch.geometry,batch.material,batch.matrices.length);
    for(let i=0;i<batch.matrices.length;i++)mesh.setMatrixAt(i,batch.matrices[i]);
    mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=batch.material!==materials.clinicGlass;mesh.receiveShadow=true;
    mesh.name='Civic detail batch';root.add(mesh);
  }

  const templeLight=new THREE.PointLight('#ffbd74',0,7,2);
  templeLight.position.set(shrineX,2.45,25.35);root.add(templeLight);
  const clinicLight=new THREE.PointLight('#dcefe5',7,7,2);
  clinicLight.position.set(clinicX,2.66,26.1);root.add(clinicLight);
  let evening=false, elapsed=0;
  function setTime(mode) {
    evening=mode==='evening';
    templeLight.intensity=evening?8:0;
    clinicLight.intensity=evening?13:7;
    materials.lantern.emissiveIntensity=evening?.52:.15;
  }
  function update(dt,wind,camera) {
    elapsed += Math.min(Math.max(dt||0,0),.25);
    const t=Number.isFinite(wind?.time)?wind.time:elapsed;
    swingingLanterns.forEach((pivot,i)=>{pivot.rotation.z=.025*Math.sin(t*1.05+i*.8);});
    if(camera){
      templeLight.visible=evening && camera.position.distanceToSquared(templeLight.position)<144;
      clinicLight.visible=camera.position.distanceToSquared(clinicLight.position)<144;
    }
  }
  setTime('day');
  return {root,colliders,groundColliders,setTime,update,
    places:[{id:'shrine',name:'榕安宮',position:[shrineX,22.2],entrance:[shrineX,23.1]},
      {id:'clinic',name:'榕安診所',position:[clinicX,22.2],entrance:[clinicX,23.1]}]};
}
