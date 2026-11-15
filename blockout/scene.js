import * as THREE from 'three';

// A metre in this study is one world unit. Every collider below is generated
// from the same dimensions as its visible volume; no hidden street-wide boxes.
export function createBlockout(scene) {
  const white=new THREE.Group(),structure=new THREE.Group();
  white.name='街路と建物の量塊';structure.name='窓・庇・屋上設備';
  scene.add(white,structure);
  const geometry=new THREE.BoxGeometry(1,1,1);
  const materials={
    plaster:new THREE.MeshStandardMaterial({color:'#f2f1eb',roughness:.88}),
    white:new THREE.MeshStandardMaterial({color:'#f9f8f3',roughness:.88}),
    street:new THREE.MeshStandardMaterial({color:'#aeb5b5',roughness:.94}),
    ground:new THREE.MeshStandardMaterial({color:'#d8dcd8',roughness:.96}),
    glass:new THREE.MeshStandardMaterial({color:'#9ca9aa',roughness:.55}),
    frame:new THREE.MeshStandardMaterial({color:'#d8dcda',roughness:.8}),
    marking:new THREE.MeshStandardMaterial({color:'#f6f5f0',roughness:.88}),
    metal:new THREE.MeshStandardMaterial({color:'#bbc5c2',roughness:.68}),
  };
  const colliders=[];
  const groundColliders=[{position:[0,-.14,-8],size:[90,.28,85]}];
  function box(parent,material,x,y,z,w,h,d,angle=0,collision=false) {
    const object=new THREE.Mesh(geometry,material);
    object.position.set(x,y,z);object.scale.set(w,h,d);object.rotation.y=angle;
    object.castShadow=true;object.receiveShadow=true;parent.add(object);
    if(collision)colliders.push({position:[x,y,z],size:[w,h,d],rotation:angle});
    return object;
  }
  const B=(...args)=>box(white,...args);
  const D=(...args)=>box(structure,...args);
  const local=(cx,cz,lx,lz,a)=>[cx+Math.cos(a)*lx+Math.sin(a)*lz,cz-Math.sin(a)*lx+Math.cos(a)*lz];
  function localBox(parent,material,cx,cz,a,lx,y,lz,w,h,d,collision=false){
    const [x,z]=local(cx,cz,lx,lz,a);
    return box(parent,material,x,y,z,w,h,d,a,collision);
  }
  // Overall roads and pavements match the existing street's 5.8m carriageway,
  // 0.14m raised sidewalks and z=-16.5m intersection.
  B(materials.ground,0,-.08,-28,100,.16,148);
  B(materials.street,0,.015,-32.5,5.8,.03,111);
  B(materials.street,0,.018,-16.5,56,.035,5.8);
  B(materials.street,0,.018,17.2,56,.035,5.8);
  for(const side of [-1,1]){
    B(materials.white,side*5.05,.065,.15,4.1,.13,26.9);
    groundColliders.push({position:[side*5.05,.065,.15],size:[4.1,.13,26.9]});
    B(materials.white,side*19.65,.065,-20.25,32.7,.13,1.7);
    groundColliders.push({position:[side*19.65,.065,-20.25],size:[32.7,.13,1.7]});
    B(materials.white,side*3.45,.065,-29.6,1.1,.13,17.6);
    groundColliders.push({position:[side*3.45,.065,-29.6],size:[1.1,.13,17.6]});
  }
  B(materials.white,0,.065,20.85,56,.13,1.5);
  // Visible crossings are simple at first, with individual stripes in the
  // structure stage. Curbs are 0.13m and can be stepped up by the controller.
  for(const z of [-12.25,-20.75]){
    B(materials.ground,0,.036,z,5.5,.008,2);
    for(let x=-2.35;x<2.5;x+=.8)D(materials.marking,x,.047,z,.39,.008,1.8);
  }
  for(const x of [-5.7,5.7]){
    B(materials.ground,x,.036,-16.5,2,.008,5.5);
    for(let z=-18.8;z< -14;z+=.8)D(materials.marking,x,.047,z,1.8,.008,.39);
  }

  function frontBuilding(cx,cz,width,depth,height,angle,store=false) {
    const front=depth/2+1.45,shopFront=depth/2-1.30,rear=-depth/2,shopBack=shopFront-1.8;
    const b=(material,lx,y,lz,w,h,d,collision=false)=>localBox(white,material,cx,cz,angle,lx,y,lz,w,h,d,collision);
    const d=(material,lx,y,lz,w,h,depth)=>localBox(structure,material,cx,cz,angle,lx,y,lz,w,h,depth);
    // The back volume and side walls leave the entire recessed ground-floor
    // storefront open. The overhead volume and columns support the arcade.
    b(materials.plaster,0,(height+3.35)/2,(front+rear)/2,width,height-3.35,front-rear,true);
    b(materials.white,0,1.73,(rear+shopBack)/2,width,3.18,shopBack-rear,true);
    for(const side of [-1,1]){
      b(materials.white,side*(width/2-.08),1.73,(shopFront+shopBack)/2,.16,3.18,shopFront-shopBack,true);
      b(materials.white,side*(width/2-.18),1.73,front-.22,.34,3.18,.4,true);
      b(materials.white,side*(width/2-.18),3.08,(shopFront+front)/2,.22,.34,front-shopFront);
    }
    b(materials.white,0,3.26,(shopFront+front)/2,width,.24,front-shopFront);
    b(materials.white,0,3.08,front-.20,width,.34,.42);
    const [floorX,floorZ]=local(cx,cz,0,(shopBack+front)/2,angle);
    const c=Math.abs(Math.cos(angle)),s=Math.abs(Math.sin(angle));
    const fw=c*width+s*(front-shopBack),fd=s*width+c*(front-shopBack);
    groundColliders.push({position:[floorX,.07,floorZ],size:[fw,.14,fd]});
    // One or two levels of individual windows and sill relief.
    const levels=height>8.3?[4.55,7.0]:[4.70];
    for(const y of levels)for(const x of [-width*.25,width*.25]){
      d(materials.frame,x,y,front+.025,Math.min(1.5,width*.37),1.75,.09);
      d(materials.glass,x,y,front+.075,Math.min(1.25,width*.31),1.48,.035);
      d(materials.white,x,y-.91,front+.10,Math.min(1.7,width*.40),.10,.25);
    }
    d(materials.white,0,height+.12,front-.04,width+.15,.24,.25);
    d(materials.white,0,3.47,front-.04,width+.15,.12,.25);
    // Recessed shop fascia and a rolled-up shutter do not block the entry.
    d(materials.frame,0,2.83,shopFront+.02,width-.22,.20,.20);
    d(materials.white,0,2.55,front+.15,width-.28,.28,.08);
    const [tx,tz]=local(cx,cz,width*.24,rear+1.2,angle);
    D(materials.metal,tx,height+.52,tz,.8,1.04,.8);
  }
  for(const [z,w,h] of [[-8.4,5.4,8.9],[-2.65,5.6,9.2],[3.15,5.4,8.7],[7.275,2.8,7.2],[11.6,5.8,9.1]])
    frontBuilding(-8.15,z,w,6.6,h,Math.PI/2);
  frontBuilding(7.7,-8.2,5.6,6.2,8.8,-Math.PI/2);
  frontBuilding(9,11.8,5.5,6,8.6,-Math.PI/2);

  // The corner store deliberately leaves the front and west entrances open.
  B(materials.white,7.5,.095,.5,6,.19,8.5);
  groundColliders.push({position:[7.5,.095,.5],size:[6,.19,8.5]});
  B(materials.white,7.5,1.7,-3.8,6.2,3.2,.18,0,true);
  B(materials.white,10.6,1.7,.5,.20,3.2,8.8,0,true);
  B(materials.plaster,6.90,5.15,1.08,7.58,3.40,10.06,0,true);
  for(const [x,z] of [[3.27,-3.75],[3.27,-.2],[3.27,4.7],[3.27,5.94],[8.95,5.94],[10.52,5.94],[4.42,-3.8],[4.42,4.8],[10.6,4.8]])
    B(materials.white,x,1.75,z,.30,3.22,.32,0,true);
  B(materials.white,3.27,3.21,1.08,.34,.32,10.06);
  B(materials.white,6.90,3.21,5.94,7.58,.32,.34);
  // Mark glass frontage as separate surfaces and maintain both door gaps.
  for(const [x,w] of [[4.975,.95],[7.85,1.6],[9.6,1.7]]) {
    B(materials.ground,x,1.5,4.82,w,2.65,.07,0,true);
    D(materials.glass,x,1.55,4.86,w,2.42,.025);
  }
  for(const [z,d] of [[-1.67,4.04],[3.42,2.72]]) {
    B(materials.ground,4.415,1.5,z,.07,2.65,d,0,true);
    D(materials.glass,4.38,1.55,z,.025,2.42,d);
  }
  for(const z of [-2.1,.95,3.95])D(materials.glass,3.045,5.15,z,.035,1.62,1.38);
  for(const x of [4.5,7.1,9.6])D(materials.glass,x,5.15,6.20,1.38,1.62,.035);
  D(materials.frame,6.90,3.46,1.08,7.72,.16,10.20);
  D(materials.frame,6.90,6.91,1.08,7.76,.18,10.22);

  // Cross-street row: solid rear and upper rooms, columns and a recessed
  // ground floor. Each bay's entrance is left open for a meaningful walk.
  for(const [cx,w,h] of [[-25,6.2,10.2],[-18.1,7.1,9.1],[-11.9,5.4,8.3],[-6.6,5.2,9.8],[6.6,5.2,9.8],[12.2,5.8,8.5],[18.6,6.7,9.3],[25.2,5.5,8.1]]){
    const back=-29,front=-21,shopBack=-25.6;
    B(materials.plaster,cx,(h+3.3)/2,(front+back)/2,w,h-3.3,front-back,0,true);
    B(materials.white,cx,1.7,(back+shopBack)/2,w,3.25,shopBack-back,0,true);
    for(const side of [-1,1])B(materials.white,cx+side*(w/2-.18),1.7,front-.22,.34,3.2,.4,0,true);
    B(materials.white,cx,3.20,(front+shopBack)/2,w,.22,front-shopBack);
    for(const side of [-1,1])for(const y of [4.75,7.1])if(y<h-.7){
      D(materials.glass,cx+side*w*.24,y,front+.055,Math.min(1.4,w*.30),1.5,.06);
      D(materials.white,cx+side*w*.24,y-.8,front+.13,Math.min(1.6,w*.35),.09,.23);
    }
    D(materials.frame,cx,2.85,-22.25,w-.2,.22,.22);
    D(materials.white,cx,h+.12,front,w+.15,.24,.25);
  }
  // The existing street visually continues past the playable boundary.
  // Distant volumes preserve the same vanishing point in every stage; they
  // are scenery only and add no obstacles to the walkable neighborhood.
  for(const side of [-1,1])for(const [i,z] of [-48.6,-60.4,-72.2].entries()){
    const x=side*7.2,h=8+i*.65;
    B(materials.plaster,x,h/2,z,6.8,h,11.6);
    for(const dy of [4.6,7.0])for(const dz of [-3,0,3])if(dy<h-.6)
      D(materials.glass,side*3.77,dy,z+dz,.05,1.45,1.4);
  }
  for(const [i,x] of [-14,-7,0,7,14].entries()){
    const h=9.5+(i%3)*1.4;
    B(materials.plaster,x,h/2,-86,6.8,h,8);
    for(const dy of [4.6,7.0])for(const dx of [-1.8,0,1.8])
      D(materials.glass,x+dx,dy,-81.97,1.2,1.45,.06);
  }
  // Rear service lane, with rear walls and a simple exterior emergency stair.
  for(const [cx,w,h] of [[-25,6.2,10],[-18.1,7.1,9],[-11.9,5.4,8.3],[6.6,5.2,9.8],[12.2,5.8,8.5],[18.6,6.7,9.3],[25.2,5.5,8.1]]){
    B(materials.plaster,cx,(h+3.2)/2,-38,w,h-3.2,7,0,true);
    B(materials.white,cx,1.6,-38,w,3.2,7,0,true);
  }
  for(const x of [-20.9,21.35]){
    D(materials.metal,x,4.2,-29.8,1.8,.12,1.0);
    for(let i=0;i<8;i++)D(materials.metal,x,1.0+i*.4,-30.4+i*.11,1.7,.07,.25);
    D(materials.metal,x-.85,2.65,-29.95,.05,3.2,.05);
    D(materials.metal,x+.85,2.65,-29.95,.05,3.2,.05);
  }
  function setStage(stage){white.visible=stage!==3;structure.visible=stage===2;}
  setStage(1);
  return {white,structure,colliders,groundColliders,setStage};
}
