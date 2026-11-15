import * as THREE from 'three';
import {createStreetSignage} from '../src/signage.js';

// A small local park connected to the existing southern footpath.  Dimensions
// and colliders are in the same metres as the rest of the street; all of the
// built elements are original geometry and use no paid assets.
export function addNeighborhoodPark(scene,{signage}={}) {
  const root=new THREE.Group();root.name='榕安公園';scene.add(root);
  const colliders=[],groundColliders=[],trees=[];
  const boxGeometry=new THREE.BoxGeometry(1,1,1);
  const cylinderGeometry=new THREE.CylinderGeometry(1,1,1,10);
  const stone=new THREE.MeshStandardMaterial({color:'#aaa99a',roughness:.94});
  const edging=new THREE.MeshStandardMaterial({color:'#aaa99c',roughness:.92});
  const paving=new THREE.MeshStandardMaterial({color:'#bebbad',roughness:.94});
  const lawn=new THREE.MeshStandardMaterial({color:'#708262',roughness:1});
  const lawnAlt=new THREE.MeshStandardMaterial({color:'#839073',roughness:1});
  const soil=new THREE.MeshStandardMaterial({color:'#625344',roughness:1});
  const steel=new THREE.MeshStandardMaterial({color:'#747e7b',roughness:.74,metalness:.27});
  const greenSteel=new THREE.MeshStandardMaterial({color:'#607e6e',roughness:.7,metalness:.2});
  const seatWood=new THREE.MeshStandardMaterial({color:'#9a6e48',roughness:.85});
  const bark=new THREE.MeshStandardMaterial({color:'#756b56',roughness:.98});
  const foliage=[
    new THREE.MeshStandardMaterial({color:'#2f5d3a',roughness:.88,side:THREE.DoubleSide}),
    new THREE.MeshStandardMaterial({color:'#3f7346',roughness:.86,side:THREE.DoubleSide}),
    new THREE.MeshStandardMaterial({color:'#54854e',roughness:.85,side:THREE.DoubleSide}),
    new THREE.MeshStandardMaterial({color:'#74a75e',roughness:.84,side:THREE.DoubleSide}),
  ];
  const rootBark=new THREE.MeshStandardMaterial({color:'#8a7a63',roughness:.95});
  const palmFrond=[
    new THREE.MeshStandardMaterial({color:'#4a7d43',roughness:.85,side:THREE.DoubleSide}),
    new THREE.MeshStandardMaterial({color:'#5c8f4e',roughness:.85,side:THREE.DoubleSide}),
    new THREE.MeshStandardMaterial({color:'#6fa356',roughness:.84,side:THREE.DoubleSide}),
  ];
  const palmDead=new THREE.MeshStandardMaterial({color:'#9a8a5c',roughness:.92,side:THREE.DoubleSide});
  const palmFruit=new THREE.MeshStandardMaterial({color:'#6b7a35',roughness:.8});
  const lampMaterial=new THREE.MeshStandardMaterial({color:'#f4ead1',roughness:.55,emissive:'#ffcf8c',emissiveIntensity:.04});
  const batches=new Map();
  const matrix=new THREE.Matrix4(),q=new THREE.Quaternion(),v=new THREE.Vector3();
  function pushTransform(geometry,material,transform) {
    const key=geometry.uuid+':'+material.uuid;
    if(!batches.has(key))batches.set(key,{geometry,material,transforms:[]});
    batches.get(key).transforms.push(transform.clone());
  }
  function batch(geometry,material,x,y,z,sx,sy,sz,rotation=0) {
    q.setFromAxisAngle(new THREE.Vector3(0,1,0),rotation);
    matrix.compose(v.set(x,y,z),q,new THREE.Vector3(sx,sy,sz));
    pushTransform(geometry,material,matrix);
  }
  function box(material,x,y,z,w,h,d,collision=false) {
    batch(boxGeometry,material,x,y,z,w,h,d);
    if(collision)colliders.push({position:[x,y,z],size:[w,h,d]});
  }
  function cyl(material,x,y,z,r,h) {batch(cylinderGeometry,material,x,y,z,r,h,r);}
  function poleBetween(material,a,b,r) {
    const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),direction=end.clone().sub(start);
    const length=direction.length(),rotation=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());
    matrix.compose(start.add(end).multiplyScalar(.5),rotation,new THREE.Vector3(r,length,r));
    pushTransform(cylinderGeometry,material,matrix);
  }

  // The southern footpath ends at z=21.6. This landing meets it and a 2.2m
  // entrance through the railing; the player is never forced onto the road.
  // The footpath is 0.14m high and the garden is almost at street level.
  // Small adjoining steps form one gently descending landing, mirrored by
  // ground colliders so the visible ramp and walkable surface agree.
  for(let i=0;i<8;i++){
    const z=21.60+(i+.5)*.175,height=.14-(i+.5)*(.115/8);
    box(paving,31,height/2,z,2,height,.175);
    groundColliders.push({position:[31,height/2,z],size:[2,height,.175]});
  }
  box(lawn,31,.009,27,10,.018,8);
  // Unevenly mown panels and a paved route give the park a used, maintained
  // ground surface without placing geometry across the route.
  for(const [x,z,w,d] of [[27.4,24.0,2.6,1.5],[34.4,24.8,2.4,2.0],[27.8,29.8,3.2,1.7],[34.3,29.4,2.6,2.2]])
    box(lawnAlt,x,.020,z,w,.008,d);
  box(paving,31,.024,26.4,2.0,.014,6.8);
  box(paving,31,.024,27.35,6.9,.014,2.0);
  for(let z=23.35;z<30;z+=.7)box(edging,31,.033,z,1.99,.004,.012);
  for(let x=28;x<34.5;x+=.7)box(edging,x,.033,27.35,.012,.004,1.98);
  // Low curb outlines planting beds; it remains low enough to step across.
  box(edging,26,.055,27,.12,.11,8);box(edging,36,.055,27,.12,.11,8);
  box(edging,31,.055,31,10,.11,.12);
  box(edging,27.9,.055,23,3.8,.11,.12);box(edging,34.1,.055,23,3.8,.11,.12);

  // Open front entry; three sides and two short front sections provide a
  // readable physical edge with matching simple Rapier collision boxes.
  for(const [x,z,w,d] of [[26,27,.06,8],[36,27,.06,8],[31,31,10,.06],[27.9,23,3.8,.06],[34.1,23,3.8,.06]]){
    box(greenSteel,x,.55,z,w,.055,d);box(greenSteel,x,.25,z,w,.045,d);
    colliders.push({position:[x,.39,z],size:[w,.78,d]});
  }
  for(const z of [23,24,25,26,27,28,29,30,31])for(const x of [26,36])cyl(greenSteel,x,.42,z,.035,.84);
  for(const x of [27,28,29,33,34,35]){cyl(greenSteel,x,.42,23,.035,.84);cyl(greenSteel,x,.42,31,.035,.84);}

  function bench(x,z){
    // Five narrow wooden slats over a compact metal frame; y=0.45 is a
    // plausible sitting height. The collision box covers the seating area.
    for(let i=0;i<4;i++)box(seatWood,x,.46,z+(i-1.5)*.115,1.45,.045,.10);
    for(let i=0;i<3;i++)box(seatWood,x,.64+i*.12,z+.245,1.45,.085,.045);
    for(const dx of [-.57,.57]){
      box(steel,x+dx,.24,z-.17,.055,.46,.055);box(steel,x+dx,.24,z+.17,.055,.46,.055);
      box(steel,x+dx,.59,z+.25,.055,.68,.055);
    }
    colliders.push({position:[x,.39,z],size:[1.5,.78,.54]});
  }
  bench(28.45,27.72);bench(33.55,27.72);

  // Small, fixed outdoor exercise fixtures: a chest-height rail and a pair
  // of waist-twister platforms. They are objects, not advertised as usable.
  for(const [x,z] of [[28.55,25.45],[33.45,25.45]]){
    cyl(stone,x,.06,z,.49,.12);cyl(greenSteel,x,.64,z,.055,1.18);
    box(greenSteel,x,1.17,z,.75,.06,.06);
    for(const dx of [-.28,.28])cyl(steel,x+dx,.15,z,.18,.055);
    colliders.push({position:[x,.64,z],size:[.82,1.28,.82]});
  }

  // Drinking fountain and small public bin belong beside the entrance, not
  // in the accessible route. Their surfaces are static street furniture.
  box(stone,33.15,.44,23.85,.42,.88,.36,true);
  box(steel,33.15,.90,23.85,.48,.045,.42);
  box(soil,33.15,.925,23.84,.27,.01,.22);
  cyl(steel,33.15,1.00,24.02,.025,.18);
  poleBetween(steel,[33.15,1.09,24.02],[33.15,1.09,23.87],.022);
  cyl(greenSteel,26.72,.26,23.85,.18,.52);cyl(steel,26.72,.53,23.85,.19,.025);
  colliders.push({position:[26.72,.26,23.85],size:[.36,.52,.36]});

  // Broadleaf park trees: a slightly leaning two-part trunk with root flare,
  // five tapered branches that reach into the crown, and leaves gathered in
  // puffs around the branch tips instead of one uniform spherical shell, so
  // branches and sky stay visible through the canopy. Three leaf shapes and
  // four colours are instanced per tree; only the crown group sways.
  function leafGeometryOf(halfWidth,tip,curve){
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute([
      0,0,-tip, -halfWidth,0,0, 0,curve,0, halfWidth,0,0, 0,0,tip,
    ],3));
    geometry.setIndex([0,1,2, 0,2,3, 2,1,4, 2,4,3]);geometry.computeVertexNormals();
    return geometry;
  }
  const leafGeometries=[leafGeometryOf(.5,.5,.08),leafGeometryOf(.62,.42,.12),leafGeometryOf(.36,.58,.05)];
  // One lathed trunk profile for all park trees: root flare at the base and
  // a smooth taper, so no segment seams ring the trunk like a pipe joint.
  const trunkGeometry=new THREE.LatheGeometry([
    new THREE.Vector2(.21,0),new THREE.Vector2(.175,.18),new THREE.Vector2(.155,.6),
    new THREE.Vector2(.14,1.2),new THREE.Vector2(.125,1.8),new THREE.Vector2(.105,2.32),new THREE.Vector2(.09,2.42),
  ],10);
  const soilGeometry=new THREE.CylinderGeometry(1,1,1,18);
  function tree(x,z,seed){
    const rnd=n=>{const s=Math.sin(n*127.1+seed*311.7)*43758.5453;return s-Math.floor(s);};
    const trunk=.12+(seed%2)*.025;
    pushTransform(soilGeometry,soil,new THREE.Matrix4().compose(new THREE.Vector3(x,.035,z),new THREE.Quaternion(),new THREE.Vector3(.47,.07,.47)));
    pushTransform(trunkGeometry,bark,new THREE.Matrix4().makeTranslation(x,0,z));
    const tips=[];
    for(let i=0;i<5;i++){
      const a=i*2.399963+seed*1.31,radius=.95+rnd(i+10)*.5;
      const startY=1.68+rnd(i+20)*.5,tipY=3.05+rnd(i+30)*.55;
      const sx=x,sz=z;
      const tx=x+Math.cos(a)*radius,tz=z+Math.sin(a)*radius;
      const mx=(sx+tx)/2+Math.cos(a+.9)*.07,mz=(sz+tz)/2+Math.sin(a+.9)*.07,my=(startY+tipY)/2-.05;
      poleBetween(bark,[sx,startY,sz],[mx,my,mz],.06);
      poleBetween(bark,[mx,my,mz],[tx,tipY,tz],.032);
      tips.push([Math.cos(a)*radius,tipY-2.45,Math.sin(a)*radius]);
    }
    colliders.push({position:[x,1.15,z],size:[trunk*2,2.3,trunk*2]});
    const crown=new THREE.Group();crown.name=`Park tree crown ${seed}`;crown.position.set(x,2.45,z);root.add(crown);trees.push({crown,seed});
    // Puff centres carry a tone: 0 = dark inner mass, 1 = mid green,
    // 2 = bright new growth on top. A banyan reads as a wide, flat
    // umbrella, so the outer ring and skirt puffs reach well past the
    // branch tips, and the leaf count is high enough that the canopy
    // reads as one lush mass instead of separate clusters.
    const puffs=tips.map(t=>({p:t,tone:1}));
    for(let i=0;i<6;i++){const a=i*1.0472+seed*.8,r=.95+rnd(i+45)*.45;puffs.push({p:[Math.cos(a)*r,.3+rnd(i+46)*.3,Math.sin(a)*r],tone:1});}
    for(let i=0;i<5;i++){const a=rnd(i+40)*Math.PI*2,r=.3+rnd(i+41)*.4;puffs.push({p:[Math.cos(a)*r,.95+rnd(i+42)*.35,Math.sin(a)*r],tone:2});}
    for(let i=0;i<3;i++){const a=rnd(i+55)*Math.PI*2;puffs.push({p:[Math.cos(a)*.3,.3+rnd(i+56)*.25,Math.sin(a)*.3],tone:0});}
    for(let i=0;i<4;i++){const a=rnd(i+50)*Math.PI*2,r=1.3+rnd(i+51)*.3;puffs.push({p:[Math.cos(a)*r,.02+rnd(i+52)*.18,Math.sin(a)*r],tone:1});}
    const leafCount=1500,buckets=new Map(),leafMatrix=new THREE.Matrix4();
    for(let i=0;i<leafCount;i++){
      const {p,tone}=puffs[i%puffs.length];
      const jx=(rnd(i*3+60)+rnd(i*3+61)-1)*.34,jy=(rnd(i*3+62)+rnd(i*3+63)-1)*.2,jz=(rnd(i*3+64)+rnd(i*3+65)-1)*.34;
      const position=new THREE.Vector3(p[0]+jx,p[1]+jy,p[2]+jz);
      const rotation=new THREE.Quaternion().setFromEuler(new THREE.Euler(-.5+rnd(i+70)*.9,rnd(i+71)*Math.PI*2,(rnd(i+72)-.5)*.6));
      const length=.32+rnd(i+73)*.18,width=.16+rnd(i+74)*.09;
      leafMatrix.compose(position,rotation,new THREE.Vector3(width,1,length));
      let colour=tone;if(rnd(i+75)<.3)colour=Math.min(3,Math.max(0,tone+(rnd(i+76)<.5?-1:1)));
      const key=colour+':'+(i*7+seed)%3;
      if(!buckets.has(key))buckets.set(key,[]);
      buckets.get(key).push(leafMatrix.clone());
    }
    for(const [key,transforms] of buckets){
      const [colour,shape]=key.split(':').map(Number);
      const mesh=new THREE.InstancedMesh(leafGeometries[shape],foliage[colour],transforms.length);
      transforms.forEach((transform,index)=>mesh.setMatrixAt(index,transform));mesh.instanceMatrix.needsUpdate=true;
      mesh.castShadow=true;mesh.receiveShadow=true;crown.add(mesh);
    }
    // Aerial roots are the banyan's signature: thin strands drop from the
    // crown underside and sway with it. Some stop mid-air; the grounded
    // ones land on the soil disc and read as young prop roots.
    const rootTransforms=[];
    for(let i=0;i<10;i++){
      const a=rnd(i+80)*Math.PI*2,rr=.45+rnd(i+81)*.95;
      const sx=Math.cos(a)*rr,sz=Math.sin(a)*rr,sy=.15+rnd(i+82)*.45;
      const grounded=rnd(i+83)<.45;
      const ey=grounded?-2.42+rnd(i+84)*.1:-(.7+rnd(i+85)*1.1);
      const start=new THREE.Vector3(sx,sy,sz),end=new THREE.Vector3(sx+(rnd(i+86)-.5)*.06,ey,sz+(rnd(i+87)-.5)*.06);
      const direction=end.clone().sub(start),length=direction.length();
      const quat=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());
      const r=grounded?.02:.013;
      rootTransforms.push(new THREE.Matrix4().compose(start.add(end).multiplyScalar(.5),quat,new THREE.Vector3(r,length,r)));
    }
    const rootsMesh=new THREE.InstancedMesh(cylinderGeometry,rootBark,rootTransforms.length);
    rootTransforms.forEach((transform,index)=>rootsMesh.setMatrixAt(index,transform));rootsMesh.instanceMatrix.needsUpdate=true;
    crown.add(rootsMesh);
  }
  // A palm frond: a tapered strip built along +Z with a downward arc and
  // a slight centre fold. Unit length, so instance scale sets the size;
  // the droop scales with the length and stays proportional.
  const frondGeometry=(()=>{
    const positions=[],indices=[],segs=7;
    for(let i=0;i<=segs;i++){
      const t=i/segs,w=.17*(1-t*.85)+.012,y=-.55*t*t;
      positions.push(-w,y-.03,t, 0,y,t, w,y-.03,t);
    }
    for(let i=0;i<segs;i++){const a=i*3;indices.push(a,a+3,a+1, a+1,a+3,a+4, a+1,a+4,a+2, a+2,a+4,a+5);}
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    geometry.setIndex(indices);geometry.computeVertexNormals();
    return geometry;
  })();
  const fruitGeometry=new THREE.SphereGeometry(1,8,6);
  function palmTree(x,z,seed){
    const rnd=n=>{const s=Math.sin(n*127.1+seed*311.7)*43758.5453;return s-Math.floor(s);};
    pushTransform(soilGeometry,soil,new THREE.Matrix4().compose(new THREE.Vector3(x,.035,z),new THREE.Quaternion(),new THREE.Vector3(.4,.07,.4)));
    const leanA=seed*2.39,lean=.3+rnd(3)*.2,height=5.1+rnd(4)*.5,steps=6;
    let px=x,pz=z,py=0;
    for(let i=0;i<steps;i++){
      const t=(i+1)/steps;
      const nx=x+Math.cos(leanA)*lean*t*t,nz=z+Math.sin(leanA)*lean*t*t,ny=height*t;
      poleBetween(bark,[px,py,pz],[nx,ny,nz],.088-i*.007);
      px=nx;pz=nz;py=ny;
    }
    colliders.push({position:[x,1.15,z],size:[.24,2.3,.24]});
    const crown=new THREE.Group();crown.name=`Palm crown ${seed}`;crown.position.set(px,py,pz);root.add(crown);trees.push({crown,seed});
    const frondBuckets=new Map(),frondMatrix=new THREE.Matrix4();
    function addFrond(yaw,pitch,length,width,tone){
      const rotation=new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch,yaw,0,'YXZ'));
      frondMatrix.compose(new THREE.Vector3(0,0,0),rotation,new THREE.Vector3(width,length,length));
      if(!frondBuckets.has(tone))frondBuckets.set(tone,[]);
      frondBuckets.get(tone).push(frondMatrix.clone());
    }
    for(let i=0;i<10;i++)addFrond(i*2.4+seed+rnd(i+11)*.4,-.05+(i%5)*.09+rnd(i+12)*.1,1.55+rnd(i+13)*.5,.85+rnd(i+14)*.3,i%3);
    for(let i=0;i<3;i++)addFrond(i*2.1+seed+.5,-.75-rnd(i+15)*.2,1.2+rnd(i+16)*.3,.7,1);
    for(let i=0;i<4;i++)addFrond(i*1.7+seed+1.2,.85+rnd(i+17)*.2,.95+rnd(i+18)*.2,.7,'dead');
    for(const [tone,transforms] of frondBuckets){
      const mesh=new THREE.InstancedMesh(frondGeometry,tone==='dead'?palmDead:palmFrond[tone],transforms.length);
      transforms.forEach((transform,index)=>mesh.setMatrixAt(index,transform));mesh.instanceMatrix.needsUpdate=true;
      mesh.castShadow=true;mesh.receiveShadow=true;crown.add(mesh);
    }
    const fruitTransforms=[];
    for(let i=0;i<4;i++){
      const a=rnd(i+20)*Math.PI*2;
      fruitTransforms.push(new THREE.Matrix4().compose(new THREE.Vector3(Math.cos(a)*.17,-.22,Math.sin(a)*.17),new THREE.Quaternion(),new THREE.Vector3(.085,.1,.085)));
    }
    const fruit=new THREE.InstancedMesh(fruitGeometry,palmFruit,fruitTransforms.length);
    fruitTransforms.forEach((transform,index)=>fruit.setMatrixAt(index,transform));fruit.instanceMatrix.needsUpdate=true;
    fruit.castShadow=true;crown.add(fruit);
  }
  tree(27,24.15,1);palmTree(35,24.5,2);palmTree(27.15,29.8,3);tree(35,29.8,4);

  // Reuse the shared street-sign atlas; all facilities can add their labels
  // before the caller finalizes it once, reducing duplicate texture memory.
  const sharedSigns=signage??createStreetSignage(root);
  sharedSigns.add({text:'榕安公園',detail:'鄰里休憩・運動空間',note:'請保持環境整潔',x:28.75,y:1.48,z:22.959,width:1.44,height:.60,yaw:Math.PI,bg:'#3b6453',fg:'#fbf7e5'});
  sharedSigns.add({text:'飲水處',x:33.15,y:.58,z:23.662,width:.30,height:.12,yaw:Math.PI,bg:'#dfe4d7',fg:'#405949'});
  if(!signage)sharedSigns.finalize();
  box(greenSteel,28.75,1.48,22.998,1.50,.66,.055);
  for(const x of [28.12,29.38]){cyl(greenSteel,x,.66,23,.035,1.32);colliders.push({position:[x,.65,23],size:[.08,1.3,.08]});}

  // One restrained lamp provides a local pool of light in the evening.
  const lamp=new THREE.PointLight('#ffddab',0,5,2);lamp.position.set(34.82,2.58,28.85);root.add(lamp);
  cyl(steel,34.82,1.23,28.85,.055,2.46);cyl(lampMaterial,34.82,2.50,28.85,.14,.18);
  cyl(greenSteel,34.82,2.63,28.85,.16,.07);colliders.push({position:[34.82,1.25,28.85],size:[.12,2.5,.12]});
  for(const {geometry,material,transforms} of batches.values()){
    const mesh=new THREE.InstancedMesh(geometry,material,transforms.length);
    transforms.forEach((transform,i)=>mesh.setMatrixAt(i,transform));
    mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);
  }
  let elapsed=0,evening=false,lightInRange=true;
  function update(dt,wind,camera){
    elapsed+=Math.min(Math.max(dt||0,0),.1);
    const x=Number.isFinite(wind?.x)?wind.x:.08,z=Number.isFinite(wind?.z)?wind.z:.02;
    for(const {crown,seed} of trees){
      const pulse=.55+.45*Math.sin(elapsed*.85+seed*1.7);
      crown.rotation.z=-x*.045*pulse;crown.rotation.x=z*.045*pulse;
    }
    // Avoid adding a distant point light to all visible park materials. The
    // small hysteresis band prevents visible flicker at the boundary.
    if(camera?.position){
      const radius=lightInRange?16:14;
      lightInRange=camera.position.distanceToSquared(lamp.position)<=radius*radius;
    }
    lamp.visible=evening&&lightInRange;
  }
  function setTime(mode){evening=mode==='evening';lamp.intensity=evening?6:0;lamp.visible=evening&&lightInRange;lampMaterial.emissiveIntensity=evening?1.4:.04;}
  setTime('day');
  const stats={name:'榕安公園',benches:2,exerciseStations:2,drinkingFountains:1,trees:trees.length,entry:[31,23],bounds:{minX:26,maxX:36,minZ:23,maxZ:31}};
  function getSnapshot(){return {...stats, lampIntensity:lamp.intensity, lampVisible:lamp.visible, canopySway:trees.map(({crown})=>[crown.rotation.x,crown.rotation.z])};}
  return {root,colliders,groundColliders,update,setTime,stats,getSnapshot};
}
