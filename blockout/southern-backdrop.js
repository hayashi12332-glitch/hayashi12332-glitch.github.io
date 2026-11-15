import * as THREE from 'three';
import {createSurfaceMaterial} from '../src/surfaces.js';

// A modest continuation of the existing street, built in metres.  The actual
// clinic, temple, bus stop and park are separate; their footpaths stay clear.
export function addSouthernBackdrop(scene,{signage}={}) {
  if (!signage?.add) throw new Error('Southern street needs shared signage');
  const root=new THREE.Group();root.name='南街商住街屋';scene.add(root);
  const colliders=[],groundColliders=[],batches=new Map();
  const cube=new THREE.BoxGeometry(1,1,1);
  const cylinder=new THREE.CylinderGeometry(1,1,1,10);
  // The same low-poly ellipsoid leaf shape used by the existing street plants.
  const leafGeometry=new THREE.SphereGeometry(1,7,4);
  const m={
    floor:createSurfaceMaterial('concrete','#bab7ab',{roughness:.95}),
    grout:new THREE.MeshStandardMaterial({color:'#9c9c92',roughness:1}),
    road:createSurfaceMaterial('asphalt','#595e60',{roughness:.96}),
    wall0:createSurfaceMaterial('plaster','#c2bcae',{roughness:.9}),
    wall1:createSurfaceMaterial('plaster','#b4b7a9',{roughness:.92}),
    wall2:createSurfaceMaterial('plaster','#c5b19d',{roughness:.9}),
    wall3:createSurfaceMaterial('plaster','#c4c6b9',{roughness:.92}),
    trim:createSurfaceMaterial('plaster','#dbd8c9',{roughness:.89}),
    tile:createSurfaceMaterial('tile','#aebbb1',{roughness:.85}),
    dark:new THREE.MeshStandardMaterial({color:'#394744',roughness:.78}),
    glass:new THREE.MeshStandardMaterial({color:'#b2cbc4',transparent:true,opacity:.28,depthWrite:false,roughness:.25,metalness:.06}),
    metal:createSurfaceMaterial('metal','#788681',{metalness:.42,roughness:.65}),
    wood:createSurfaceMaterial('wood','#907356',{roughness:.87}),
    red:new THREE.MeshStandardMaterial({color:'#a8543f',roughness:.84}),
    green:new THREE.MeshStandardMaterial({color:'#668369',roughness:.9}),
    cream:new THREE.MeshStandardMaterial({color:'#ddd5be',roughness:.91}),
    // Subdued, sun-faded household colours rather than identical black
    // windows: curtains, a security grille and clothes can be read from the park.
    curtain:new THREE.MeshStandardMaterial({color:'#9caa9b',roughness:.95}),
    clothBlue:new THREE.MeshStandardMaterial({color:'#758d96',roughness:1,side:THREE.DoubleSide}),
    clothRose:new THREE.MeshStandardMaterial({color:'#b59b8d',roughness:1,side:THREE.DoubleSide}),
    clothLight:new THREE.MeshStandardMaterial({color:'#c9c6b5',roughness:1,side:THREE.DoubleSide}),
    shade:createSurfaceMaterial('metal','#969e91',{metalness:.22,roughness:.8}),
    litWindow:new THREE.MeshStandardMaterial({color:'#837b69',emissive:'#e6ae69',emissiveIntensity:.02,roughness:.8}),
    amber:new THREE.MeshStandardMaterial({color:'#e6d3a6',emissive:'#ffca78',emissiveIntensity:.06,roughness:.6}),
  };
  const transform=new THREE.Object3D();
  function instance(geometry,material,x,y,z,w,h,d,rotation=0,cast=true,tiltX=0,tiltZ=0){
    const key=geometry.uuid+':'+material.uuid+':'+cast;
    if(!batches.has(key))batches.set(key,{geometry,material,cast,matrices:[]});
    transform.position.set(x,y,z);transform.rotation.set(tiltX,rotation,tiltZ);
    transform.scale.set(w,h,d);transform.updateMatrix();batches.get(key).matrices.push(transform.matrix.clone());
  }
  function box(material,x,y,z,w,h,d,hit=false,cast=true){
    instance(cube,material,x,y,z,w,h,d,0,cast);
    if(hit)colliders.push({position:[x,y,z],size:[w,h,d]});
  }
  function cyl(material,x,y,z,r,h){instance(cylinder,material,x,y,z,r,h,r);}
  function flowerPot(x,base,z,seed,scale=1){
    // Rounded leaves and a few blooms make the stock legible as real plants
    // at close range; all leaves and petals share instanced geometry/materials.
    cyl(seed%2?m.wood:m.cream,x,base+.095*scale,z,.095*scale,.19*scale);
    cyl(m.dark,x,base+.192*scale,z,.085*scale,.014*scale);
    cyl(m.green,x,base+.27*scale,z,.008*scale,.16*scale);
    for(let j=0;j<5;j++){
      const angle=j*2.399963+seed*.63;
      const reach=(.035+.006*(j%2))*scale;
      instance(leafGeometry,m.green,x+Math.cos(angle)*reach,
        base+(.23+.022*(j%3))*scale,z+Math.sin(angle)*reach,
        .035*scale,.009*scale,.075*scale,angle,true,-.40,.08*Math.sin(angle));
    }
    if(seed%3!==0){
      const flower=seed%2?m.red:m.cream;
      for(let j=0;j<5;j++){
        const angle=j*Math.PI*2/5;
        instance(leafGeometry,flower,x+Math.cos(angle)*.027*scale,
          base+.36*scale,z+Math.sin(angle)*.027*scale,
          .022*scale,.012*scale,.034*scale,angle,true,-.15);
      }
      instance(leafGeometry,m.cream,x,base+.368*scale,z,.018*scale,.014*scale,.018*scale);
    }
  }
  function floor(x,z,w,d){
    box(m.floor,x,.07,z,w,.14,d,false,false);
    groundColliders.push({position:[x,.07,z],size:[w,.14,d]});
  }
  // Existing north-south road ends at z=23; preserve the axis as a street,
  // keeping a clear corridor instead of blocking it with a shopfront.
  box(m.road,0,.015,30.4,5.8,.06,14.8,false,false);
  for(const side of [-1,1]){
    floor(side*3.50,30.2,1.0,14.4);
    box(m.trim,side*2.98,.085,30.2,.12,.17,14.4,false,false);
  }
  const lots=[
    {x:-15.65,w:4.5,h:8.1,wall:m.wall0,name:'順益五金',detail:'居家・日用',kind:'hardware',address:'22號'},
    {x:-10.98,w:4.5,h:8.9,wall:m.wall1,name:'花木小舖',detail:'鮮花・盆栽',kind:'flowers',address:'24號'},
    {x:-6.31,w:4.5,h:7.6,wall:m.wall2,name:'家常小館',detail:'麵食・飯類',kind:'food',address:'26號'},
    {x:6.55,w:5.1,h:8.5,wall:m.wall3,name:'',detail:'',kind:'home',address:'28號'},
  ];
  const lightPositions=[];
  for(const [i,lot] of lots.entries()){
    const {x,w,h,wall,kind}=lot;
    const front=24.25,back=30.2,roofZ=(front+back)/2;
    // Raised arcade connects directly to the existing south sidewalk at
    // z=21.6.  The recessed entry is 1.3m wide with its own walkable floor.
    floor(x,25.875,w,8.55);
    box(wall,x,(h+3.32)/2,roofZ,w,h-3.32,back-front,true);
    box(wall,x,1.7,back-.08,w,3.14,.16,true);
    for(const side of [-1,1]){
      box(wall,x+side*(w/2-.08),1.7,27.2,.16,3.14,5.9,true);
      box(m.tile,x+side*(w/2-.19),1.7,22.18,.29,3.15,.31,true);
      box(m.trim,x+side*(w/2-.19),3.22,23.23,.29,.20,2.15);
    }
    box(m.trim,x,3.27,23.16,w,.22,2.18);
    box(m.trim,x,3.10,22.15,w,.34,.30);
    box(m.trim,x,h+.08,roofZ,w+.12,.16,back-front+.15);
    box(m.trim,x,h+.32,front-.10,w+.10,.45,.23);
    // Front glazing flanks the central opening.  The partial glass uses a
    // matching thin collision box, while the middle remains truly open.
    const sideWidth=(w-1.30)/2;
    for(const side of [-1,1]){
      const px=x+side*(.65+sideWidth/2);
      box(m.glass,px,1.52,front,sideWidth,2.52,.035,true,false);
      for(const py of [.24,2.78])box(m.dark,px,py,front-.035,sideWidth,.04,.055);
      for(const xx of [px-sideWidth/2,px+sideWidth/2])box(m.dark,xx,1.52,front-.035,.04,2.55,.055);
    }
    box(m.dark,x,2.89,front,w-.22,.18,.20);
    // Individual window bays, metal frames, air-conditioner housings and a
    // modest balcony make the upper floors read as lived-in housing.
    for(const y of [4.56,7.15])if(y<h-.70){
      for(const dx of [-w*.24,w*.24]){
        box(m.trim,x+dx,y,front-.07,1.30,1.50,.09);
        box(m.dark,x+dx,y,front-.13,1.08,1.27,.04);
        box(m.metal,x+dx,y,front-.16,.025,1.27,.03);
        box(m.metal,x+dx,y-.19,front-.16,1.08,.025,.03);
        box(m.trim,x+dx,y-.82,front-.17,1.48,.10,.23);
      }
      if((i+Math.round(y))%2===0){
        box(m.metal,x+w*.28,y-.65,front-.31,.61,.43,.34);
        for(let row=0;row<4;row++)box(m.dark,x+w*.28,y-.76+row*.065,front-.49,.45,.012,.02);
      }
    }
    // Upper side windows facing the southern street (observation round 1,
    // R1-4): the upper mass's street side was a full blank wall from the
    // street even though the front face is fully dressed.
    {
      const sSide = x < 0 ? 1 : -1, fx = x + sSide * (w / 2);
      for (const wz of [25.9, 28.5]) {
        box(m.trim, fx + sSide * .05, 5.4, wz, .1, 1.3, 1.1);
        box(m.dark, fx + sSide * .1, 5.4, wz, .05, 1.12, .92);
        box(m.trim, fx + sSide * .08, 4.68, wz, .16, .08, 1.3);
      }
      if (i % 2 === 0) box(m.metal, fx + sSide * .2, 4.5, 25.9, .38, .5, .8);
    }
    // Rear wall displays are distinct to each small business and remain
    // behind the counter so the centre of the shop stays traversable.
    if(kind!=='home'){
      for(const y of [1.25,1.67,2.09]){
        box(m.wood,x,y,30.02,w-.50,.055,.32);
        for(let item=0;item<7;item++){
          const px=x+(item-3)*(w-.85)/7;
          if(kind==='flowers'){
            flowerPot(px,y+.028,29.96,item+Math.round(y*100),.82);
          }else if(kind==='food'){
            cyl(item%2?m.cream:m.red,px,y+.10,30.0,.11,.15);
          }else{
            box(item%3===0?m.red:item%3===1?m.cream:m.green,px,y+.13,30.0,.21,.20,.19);
          }
        }
      }
      lightPositions.push([x,2.76,26.4]);
    }
    if(i%2===1){
      box(m.trim,x,5.32,front-.42,w-.30,.10,.88);
      box(m.metal,x,5.83,front-.81,w-.40,.045,.05);
      for(let dx=-w*.42;dx<=w*.43;dx+=.32)box(m.metal,x+dx,5.59,front-.81,.035,.46,.035);
    }
    // A drain along one party wall ends just above the paved footway.
    box(m.metal,x+w/2-.24,(h+3.4)/2,front-.20,.055,h-3.4,.055);
    // Only shops have display counters; the home's furniture and collisions
    // are provided by the resident home, leaving its entrance traversable.
    if(kind!=='home'){
      box(m.wood,x,.58,29.32,w-1.05,.88,.62,true);
      box(m.dark,x,1.05,29.32,w-1.0,.06,.70);
      for(const side of [-1,1]){
        const sx=x+side*(w/2-.58);
        box(m.wood,sx,.72,27.4,.66,1.14,1.5,true);
        for(const z of [26.96,27.38,27.80]){
          if(kind==='flowers')flowerPot(sx,1.29,z,Math.round(z*10)+side,1.15);
          else {
            const material=kind==='food'?m.cream:(side<0?m.red:m.green);
            box(material,sx,1.43,z,.36,.31,.28);
          }
        }
      }
    }
    // Eatery seating (observation round 2): the food shop had a counter
    // and shelves but nowhere to eat — two small tables with stools,
    // bowls and a sauce bottle make it read as a working 小館. Tables
    // sit off the centre line so the shop stays traversable.
    if(kind==='food'){
      for(const [tx,tz] of [[x-.95,26.7],[x+.95,27.9]]){
        box(m.wood,tx,.73,tz,.72,.05,.72,true);
        cyl(m.dark,tx,.36,tz,.05,.72);
        for(const [sx,sz] of [[tx-.52,tz+.3],[tx+.52,tz-.3]])
          box(m.red,sx,.225,sz,.34,.45,.34,false);
        cyl(m.cream,tx-.15,.79,tz+.08,.07,.05);
        cyl(m.cream,tx+.14,.79,tz-.1,.07,.05);
        cyl(m.red,tx+.02,.84,tz+.16,.03,.13);
      }
    }
    for(const dx of [-w*.27,w*.27])box(m.amber,x+dx,3.12,25.45,.78,.025,.10,false,false);
    if(lot.name){
      const back=kind==='flowers'?'#507163':kind==='food'?'#96574b':'#5e6e65';
      box(m.dark,x,3.0,front-.12,w-.20,.48,.10);
      signage.add({text:lot.name,detail:lot.detail,x,y:3.0,z:front-.19,width:w-.35,height:.42,yaw:Math.PI,bg:back,fg:'#f5efe0'});
    }
    // Consecutive even numbers on the same side of this fictional street.
    // Set into the fixed glazing beside the doorway, away from the passage.
    box(m.dark,x+.94,1.75,front-.13,.39,.45,.025,false,false);
    signage.add({text:'榕南路',detail:lot.address,kind:'address',x:x+.94,y:1.75,
      z:front-.16,width:.36,height:.42,yaw:Math.PI,bg:'#286544',fg:'#fff9e9'});
    if(i%2===0){
      cyl(m.metal,x+w*.26,h+.58,28.9,.37,.92);
      for(const y of [h+.23,h+.60,h+.90])cyl(m.dark,x+w*.26,y,28.9,.385,.025);
    }
  }

  // A low row beyond the walkable southern limit continues past the bus stop
  // and behind the park. A small paved setback leaves daylight and greenery
  // visible through the fence; no park path or collision geometry is changed.
  const rearFront=41.0,rearCenter=43.5;
  box(m.floor,30.3,.005,36.0,20.0,.01,10.0,false,false);
  for(let x=21;x<40;x+=1.2)box(m.grout,x,.011,36.0,.012,.002,9.95,false,false);
  // A quiet cross street and its sidewalk give the homes a believable
  // relationship to the park. Both are outside the walkable boundary.
  box(m.road,30.3,.025,36.5,20.0,.04,4.8,false,false);
  for(let x=22;x<40;x+=4.0)box(m.cream,x,.047,36.5,1.8,.003,.09,false,false);
  box(m.floor,30.3,.035,39.85,20.0,.07,2.3,false,false);
  for(const [i,[x,w,h,wall]] of [
    [16.8,5.2,7.35,m.wall0],[22.2,5.3,6.8,m.wall1],
    [27.5,5.2,6.45,m.wall2],[32.8,5.2,6.8,m.wall0],[38.1,5.2,6.2,m.wall3],
  ].entries()){
    box(wall,x,h/2,rearCenter,w,h,5.0);
    box(m.trim,x,h+.12,rearFront-.05,w+.08,.24,.15);
    box(m.trim,x,3.24,rearFront-.06,w-.10,.12,.18);
    // An ordinary doorway and window make the lower floors read as houses or
    // small shops, without suggesting that these out-of-bounds facades open.
    box(m.dark,x-w*.25,1.32,rearFront-.12,1.12,2.34,.035);
    box(m.metal,x-w*.25+.46,1.32,rearFront-.16,.025,2.25,.03);
    box(i%2?m.litWindow:m.dark,x+w*.19,1.76,rearFront-.11,1.65,1.40,.035);
    box(m.metal,x+w*.19,1.76,rearFront-.15,.035,1.34,.025);
    box(m.metal,x+w*.19,1.43,rearFront-.15,1.60,.025,.025);
    for(const y of [4.5,6.8])for(const [bay,dx] of [-w*.23,w*.23].entries())if(y<h-.5){
      const width=(i===2&&bay===1)?1.42:1.22;
      const pane=(i+bay)%3===0?m.litWindow:((i+bay)%3===1?m.curtain:m.dark);
      box(m.trim,x+dx,y,rearFront-.05,width,1.48,.08);
      box(pane,x+dx,y,rearFront-.11,width-.20,1.27,.035);
      box(m.metal,x+dx,y-.12,rearFront-.15,.024,1.20,.025);
      box(m.metal,x+dx,y+.12,rearFront-.15,width-.22,.025,.025);
      box(m.trim,x+dx,y-.80,rearFront-.19,width+.12,.10,.22);
      // A few shallow sun/rain hoods and security grilles: varied by home,
      // with windows still legible as independent apartments.
      if((i+bay)%3===1){
        instance(cube,m.shade,x+dx,y+.80,rearFront-.28,width+.14,.045,.45,0,true,-.16);
      }
      if((i+bay)%3===2){
        for(const offset of [-.32,.32])box(m.metal,x+dx+offset,y,rearFront-.18,.018,1.22,.025);
        box(m.metal,x+dx,y-.43,rearFront-.18,width-.22,.018,.025);
      }
    }
    if(i%2===0){
      box(m.trim,x,3.61,rearFront-.27,w-.3,.10,.58);
      for(const dx of [-w*.30,w*.30])flowerPot(x+dx,3.68,rearFront-.39,i+Math.round(dx*10),.65);
    }else{
      // A shallow balcony and cage bars break up the repeated windows and
      // reflect common mixed residential facades without using a brand.
      box(m.trim,x,3.61,rearFront-.30,w-.30,.10,.65);
      box(m.metal,x,4.14,rearFront-.61,w-.40,.035,.04);
      for(let dx=-w*.4;dx<w*.41;dx+=.34)box(m.metal,x+dx,3.88,rearFront-.61,.025,.52,.025);
      box(m.metal,x+w*.32,4.15,rearFront-.30,.60,.40,.31);
      for(let row=0;row<4;row++)box(m.dark,x+w*.32,4.04+row*.06,rearFront-.47,.44,.012,.018);
      // Clothes hang behind the balcony rail, clear of the sidewalk.  Use
      // small cloth panels in faded colours rather than bright repeated flags.
      box(m.metal,x-.45,4.70,rearFront-.46,1.65,.025,.025);
      const laundry=[m.clothLight,m.clothBlue,m.clothRose];
      for(let piece=0;piece<3;piece++){
        const lx=x-1.00+piece*.48;
        box(m.metal,lx,4.62,rearFront-.47,.015,.13,.015);
        box(laundry[(piece+i)%laundry.length],lx,4.38,rearFront-.47,
          piece===1?.34:.40,piece===1?.40:.48,.012,false,false);
      }
    }
    // Neighbours use their thresholds differently: a pot near one door,
    // an outdoor unit on another and a simple projecting entrance canopy.
    if(i===0||i===2||i===4)flowerPot(x+w*.34,.07,rearFront-.48,i+8,1.35);
    if(i===2){
      box(m.metal,x+w*.34,3.58,rearFront-.30,.60,.40,.31);
      for(let row=0;row<4;row++)box(m.dark,x+w*.34,3.47+row*.06,rearFront-.47,.44,.012,.018);
    }
    if(i===0||i===4){
      instance(cube,m.shade,x-w*.25,2.60,rearFront-.33,1.42,.055,.55,0,true,-.16);
      for(const dx of [-.53,.53])box(m.metal,x-w*.25+dx,2.48,rearFront-.37,.022,.23,.022);
    }
    if(i===3){
      cyl(m.metal,x+1.35,h+.49,rearCenter+.7,.35,.76);
      for(const y of [h+.19,h+.48,h+.79])cyl(m.dark,x+1.35,y,rearCenter+.7,.365,.022);
    }
  }
  // Small planting outside the park fence softens the paved strip without
  // changing any entrance, interior path or physical collision geometry.
  for(const [x,z,seed] of [[25.5,32.0,1],[27.5,32.6,2],[29.3,33.15,3],[32.4,32.8,4],[34.3,33.0,5],[37.2,32.1,6]]){
    cyl(m.wood,x,.11,z,.28,.22);
    for(let j=0;j<11;j++){
      const a=j*2.399963+seed;
      instance(leafGeometry,m.green,x+Math.cos(a)*.12,.28+(j%3)*.055,z+Math.sin(a)*.12,
        .10,.025,.19,a,true,-.45,.05*Math.sin(a));
    }
  }
  for(const {geometry,material,cast,matrices} of batches.values()){
    const mesh=new THREE.InstancedMesh(geometry,material,matrices.length);
    matrices.forEach((matrix,index)=>mesh.setMatrixAt(index,matrix));
    mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=cast;mesh.receiveShadow=true;
    mesh.computeBoundingSphere();root.add(mesh);
  }
  // A single camera-aware shared lamp provides bounce in whichever shop is
  // nearby. This keeps evening interiors visible without adding one dynamic
  // light to every material across the whole street.
  const shopLight=new THREE.PointLight('#ffe6c5',0,6.5,2);root.add(shopLight);
  let evening=false;
  function setTime(mode){evening=mode==='evening';m.amber.emissiveIntensity=evening?1:.06;m.litWindow.emissiveIntensity=evening?.48:.02;}
  function update(dt,wind,camera){
    if(!camera){shopLight.visible=false;return;}
    let best=null,bestDistance=Infinity;
    for(const pos of lightPositions){
      const distance=(camera.position.x-pos[0])**2+(camera.position.y-pos[1])**2+(camera.position.z-pos[2])**2;
      if(distance<bestDistance){bestDistance=distance;best=pos;}
    }
    shopLight.visible=!!best&&bestDistance<144;
    if(best){shopLight.position.set(...best);shopLight.intensity=evening?12:7;}
  }
  return {root,colliders,groundColliders,setTime,update,stats:{shops:3,residences:1,backgroundBuildings:5}};
}
