import * as THREE from 'three';
import {SIGN_FONT} from './typography.js';

// Original commercial-street decoration. Every dimension is in metres.
// The lines attach to existing solid storey bands or repaired plaster, never windows,
// traffic lights, free-standing invisible poles, or a new collision surface.
export const RAIN_FESTIVAL_ROWS = Object.freeze([
  {id:'corner-return',z:-25,wallSurface:3.84,y:5.78,sag:.37,count:5,bannerZ:-24.52,bannerX:3.25,bannerHeight:1.70},
  {id:'rear-corner-return',z:-38,wallSurface:3.84,y:5.78,sag:.42,count:4,bannerZ:-37.45,bannerX:3.25,bannerHeight:1.62},
  {id:'north-shop-front',z:-49,wallSurface:3.715,eastWallSurface:3.7415,y:5.77,sag:.35,count:5,bannerZ:-48.22,bannerX:3.10,bannerHeight:1.73},
]);

// These original texts describe the existing fictional street. No real event,
// date, actual district identity, photograph, or third-party logo is copied.
const BANNER_TEXT='榕安商圈';
const BANNER_DETAIL='巷弄好生活';
const LANTERN_TEXT='榕安街';

function mergeParts(parts){
  const nonIndexed=parts.map(g=>g.index?g.toNonIndexed():g);
  const count=nonIndexed.reduce((n,g)=>n+g.attributes.position.count,0);
  const positions=new Float32Array(count*3),normals=new Float32Array(count*3),uvs=new Float32Array(count*2);
  let offset=0;
  for(const g of nonIndexed){
    positions.set(g.attributes.position.array,offset*3);
    normals.set(g.attributes.normal.array,offset*3);
    if(g.attributes.uv)uvs.set(g.attributes.uv.array,offset*2);
    offset+=g.attributes.position.count;
  }
  const result=new THREE.BufferGeometry();
  result.setAttribute('position',new THREE.BufferAttribute(positions,3));
  result.setAttribute('normal',new THREE.BufferAttribute(normals,3));
  result.setAttribute('uv',new THREE.BufferAttribute(uvs,2));
  for(const g of new Set([...parts,...nonIndexed]))g.dispose();
  return result;
}

function rodGeometry(a,b,r=.008,segments=6){
  const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),delta=bv.clone().sub(av);
  const geometry=new THREE.CylinderGeometry(r,r,delta.length(),segments);
  geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize()));
  geometry.translate(...av.add(bv).multiplyScalar(.5).toArray());
  return geometry;
}

function rngFor(seed){
  let state=seed>>>0;
  return()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
}

function clothPrint(palette,index){
  const canvas=document.createElement('canvas');canvas.width=384;canvas.height=1152;
  const c=canvas.getContext('2d'),rng=rngFor(9307+index*43),w=canvas.width,h=canvas.height;
  c.fillStyle=palette;c.fillRect(0,0,w,h);
  // A small amount of original fabric wear leaves the type consistently clear.
  c.fillStyle='#eee3cb';
  for(let i=0;i<850;i++){c.globalAlpha=.015+rng()*.022;c.fillRect(rng()*w,rng()*h,1+rng()*3,1+rng()*7);}
  c.globalAlpha=.72;c.strokeStyle='#e6dcc4';c.lineWidth=3;c.strokeRect(16,17,w-32,h-34);
  c.globalAlpha=.90;c.strokeStyle='#ede4ca';c.lineWidth=2;
  c.beginPath();c.arc(w/2,100,36,0,Math.PI*2);c.stroke();
  c.beginPath();c.moveTo(w/2-15,114);c.quadraticCurveTo(w/2-2,71,w/2+22,85);c.quadraticCurveTo(w/2+18,110,w/2-15,114);c.stroke();
  c.fillStyle='#f2e8d2';c.textAlign='center';c.textBaseline='middle';
  c.font=`700 112px ${SIGN_FONT}`;
  [...BANNER_TEXT].forEach((char,i)=>c.fillText(char,w/2,230+i*145,148));
  c.font=`700 43px ${SIGN_FONT}`;c.fillText(BANNER_DETAIL,w/2,885,w-59);
  c.globalAlpha=.35;c.lineWidth=4;
  for(let y=969;y<1050;y+=24){c.beginPath();c.moveTo(58,y);c.bezierCurveTo(125,y-22,239,y+22,326,y-4);c.stroke();}
  c.globalAlpha=.85;c.fillStyle='#d1c4aa';c.fillRect(12,h-19,w-24,8);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
  texture.name=`Rain street original banner print ${index}: ${BANNER_TEXT} / ${BANNER_DETAIL}`;
  return texture;
}

function lanternPrint(color,index){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;
  const c=canvas.getContext('2d'),rng=rngFor(4027+index*61);
  c.fillStyle=color;c.fillRect(0,0,512,512);
  const glow=c.createLinearGradient(0,0,0,512);
  glow.addColorStop(0,'rgba(64,30,22,.23)');glow.addColorStop(.22,'rgba(244,206,146,.05)');glow.addColorStop(.70,'rgba(245,211,156,.08)');glow.addColorStop(1,'rgba(69,31,24,.25)');
  c.fillStyle=glow;c.fillRect(0,0,512,512);
  for(let i=0;i<1200;i++){c.globalAlpha=.015+rng()*.025;c.fillStyle=i%2?'#f4d0a2':'#63382c';c.fillRect(rng()*512,rng()*512,1+rng()*2,2+rng()*3);}
  c.globalAlpha=.80;c.fillStyle='#4e332c';c.textAlign='center';c.textBaseline='middle';c.font=`700 74px ${SIGN_FONT}`;
  // Front/back text columns; drawing at both texture edges joins the front
  // print through the ordinary cylindrical UV seam without a blank stripe.
  for(const x of [0,256,512])
    [...LANTERN_TEXT].forEach((char,i)=>c.fillText(char,x,160+i*93,88));
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
  texture.name=`Rain street original lantern print ${index}: ${LANTERN_TEXT}`;
  return texture;
}

function bannerGeometry(width,height){
  const front=new THREE.PlaneGeometry(width,height,10,24);front.translate(0,-height/2,0);
  const p=front.attributes.position,u=front.attributes.uv,vertices=p.count;
  const positions=new Float32Array(vertices*6),uvs=new Float32Array(vertices*4),indices=[];
  positions.set(p.array);positions.set(p.array,vertices*3);uvs.set(u.array);
  for(let i=0;i<vertices;i++){uvs[(i+vertices)*2]=1-u.getX(i);uvs[(i+vertices)*2+1]=u.getY(i);}
  for(let i=0;i<front.index.count;i+=3){
    const a=front.index.getX(i),b=front.index.getX(i+1),cc=front.index.getX(i+2);
    indices.push(a,b,cc,a+vertices,cc+vertices,b+vertices);
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  geometry.setAttribute('uv',new THREE.BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();
  geometry.computeBoundingSphere();geometry.boundingSphere.radius+=.08;front.dispose();return geometry;
}

// Shared paper-lantern parts, anchored at the hanging point: the cord runs
// 0 to -.137, the lathed paper body -.155 to -.755, the caps sit just outside
// the body ends and the tassel strands reach -.985. One definition is reused
// by every lantern in the world so a part upgrade reaches all of them.
export function createPaperLanternParts(){
  const profile=[[-.30,.10],[-.26,.135],[-.18,.18],[0,.20],[.18,.18],[.26,.135],[.30,.09]];
  const body=new THREE.LatheGeometry(profile.map(([y,r])=>new THREE.Vector2(r,y-.455)),20);
  const cord=new THREE.CylinderGeometry(.006,.006,.137,6);cord.translate(0,-.0685,0);
  const topCap=new THREE.CylinderGeometry(.094,.094,.018,14);topCap.translate(0,-.146,0);
  const bottomCap=new THREE.CylinderGeometry(.104,.104,.018,14);bottomCap.translate(0,-.764,0);
  const caps=mergeParts([topCap,bottomCap]);
  const ribParts=[];
  for(let j=0;j<10;j++){
    const angle=j/10*Math.PI*2,points=profile.map(([y,r])=>new THREE.Vector3((r+.0015)*Math.sin(angle),y-.455,(r+.0015)*Math.cos(angle)));
    ribParts.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),12,.0018,3,false));
  }
  const ribs=mergeParts(ribParts),tasselParts=[rodGeometry([0,-.773,0],[0,-.832,0],.005)];
  for(let j=0;j<6;j++){
    const a=j/6*Math.PI*2,r=.011;
    tasselParts.push(rodGeometry([r*Math.cos(a),-.831,r*Math.sin(a)],[r*1.2*Math.cos(a),-.985,r*1.2*Math.sin(a)],.0022,4));
  }
  const tassel=mergeParts(tasselParts);
  return {body,cord,caps,ribs,tassel};
}

export function createRainFestivalDetails(parent){
  const group=new THREE.Group();group.name='Supported commercial-street lantern rows and cloth banners';parent.add(group);
  const iron=new THREE.MeshStandardMaterial({color:'#656962',metalness:.58,roughness:.68});
  const cord=new THREE.MeshStandardMaterial({color:'#484940',roughness:.91});
  const bamboo=new THREE.MeshStandardMaterial({color:'#98564b',roughness:.93});
  const cap=new THREE.MeshStandardMaterial({color:'#a18b59',metalness:.40,roughness:.74});
  const tassel=new THREE.MeshStandardMaterial({color:'#a74a3c',roughness:.94});
  const staticBatches=new Map(),animatedBatches=new Map(),lanterns=[],banners=[],cables=[],mounts=[];
  const unitBox=new THREE.BoxGeometry(1,1,1),unitCylinder=new THREE.CylinderGeometry(1,1,1,8),eyeGeometry=new THREE.TorusGeometry(.030,.0045,5,10);
  const pose=new THREE.Object3D();
  function fixed(geometry,material,position,scale=[1,1,1],rotation=[0,0,0]){
    const key=geometry.uuid+material.uuid;
    if(!staticBatches.has(key))staticBatches.set(key,{geometry,material,matrices:[]});
    pose.position.set(...position);pose.rotation.set(...rotation);pose.scale.set(...scale);pose.updateMatrix();
    staticBatches.get(key).matrices.push(pose.matrix.clone());
  }
  const box=(x,y,z,w,h,d)=>fixed(unitBox,iron,[x,y,z],[w,h,d]);
  function bar(a,b,r=.009){
    const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),direction=bv.clone().sub(av);
    pose.position.copy(av.add(bv).multiplyScalar(.5));pose.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.clone().normalize());
    pose.scale.set(r,direction.length(),r);pose.updateMatrix();
    const key=unitCylinder.uuid+iron.uuid;
    if(!staticBatches.has(key))staticBatches.set(key,{geometry:unitCylinder,material:iron,matrices:[]});
    staticBatches.get(key).matrices.push(pose.matrix.clone());
  }
  function wallPlate(side,surface,y,z,role){
    // Back face exactly touches the exposed existing storey-band surface.
    box(side*(surface-.018),y,z,.036,.14,.19);
    for(const dy of [-.035,.035])for(const dz of [-.058,.058])
      fixed(unitCylinder,cap,[side*(surface-.038),y+dy,z+dz],[.007,.008,.007],[0,0,Math.PI/2]);
    mounts.push({side,surface_x:side*surface,plate_contact_x:side*surface,y,z,role});
    return side*(surface-.036);
  }

  const lanternParts=createPaperLanternParts();
  const bodyGeometry=lanternParts.body;
  const cordGeometry=lanternParts.cord;
  const capGeometry=lanternParts.caps;
  const ribGeometry=lanternParts.ribs;
  const tasselGeometry=lanternParts.tassel;
  const paperMaterials=['#bd5144','#ad5848','#c4614d'].map((color,i)=>{
    const map=lanternPrint(color,i);
    return new THREE.MeshStandardMaterial({map,emissive:'#efbc7e',emissiveMap:map,emissiveIntensity:.025,roughness:.94});
  });
  function moving(geometry,material,item){
    const key=geometry.uuid+material.uuid;
    if(!animatedBatches.has(key))animatedBatches.set(key,{geometry,material,items:[]});
    animatedBatches.get(key).items.push(item);
  }

  const bannerMaterials=['#79606e','#607766','#987d58'].map((color,i)=>
    new THREE.MeshStandardMaterial({map:clothPrint(color,i),roughness:.95,side:THREE.FrontSide}));

  RAIN_FESTIVAL_ROWS.forEach((row,rowIndex)=>{
    const surfaceAt=side=>side>0?(row.eastWallSurface??row.wallSurface):row.wallSurface;
    const west=-(surfaceAt(-1)-.036),east=surfaceAt(1)-.036,middle=(west+east)/2;
    for(const side of [-1,1]){
      const front=wallPlate(side,surfaceAt(side),row.y,row.z,'lantern cable');
      fixed(eyeGeometry,iron,[front-side*.020,row.y,row.z],[1,1,1],[0,Math.PI/2,0]);
      bar([front,row.y,row.z],[front-side*.027,row.y,row.z],.007);
    }
    const curve=new THREE.CatmullRomCurve3([
      new THREE.Vector3(west,row.y,row.z),new THREE.Vector3(west*.48+middle*.52,row.y-row.sag*.76,row.z+.025),
      new THREE.Vector3(middle,row.y-row.sag,row.z+.045),new THREE.Vector3(east*.48+middle*.52,row.y-row.sag*.76,row.z+.025),
      new THREE.Vector3(east,row.y,row.z),
    ]);
    const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,40,.008,5,false),cord);mesh.name=`Rain festival cable ${row.id}`;mesh.castShadow=false;mesh.receiveShadow=true;group.add(mesh);
    cables.push({id:row.id,z:row.z,endpoints:[[west,row.y,row.z],[east,row.y,row.z]],minimum_y:row.y-row.sag});
    for(let i=0;i<row.count;i++){
      const anchor=curve.getPoint((i+1)/(row.count+1));
      const item={row:row.id,anchor:anchor.toArray(),phase:rowIndex*1.71+i*1.37,yaw:(i%3-1)*.13,scale:.93+((i+rowIndex)%4)*.035};
      lanterns.push(item);
      moving(bodyGeometry,paperMaterials[(i+rowIndex)%3],item);moving(cordGeometry,cord,item);
      moving(capGeometry,cap,item);moving(ribGeometry,bamboo,item);moving(tasselGeometry,tassel,item);
    }

    for(const side of [-1,1]){
      const width=.58,height=row.bannerHeight+(side<0?.025:-.025),center=side*row.bannerX,top=row.y-.08;
      const z=row.bannerZ+(side>0?.18:0),surface=surfaceAt(side),front=wallPlate(side,surface,row.y,z,'cloth banner cantilever');
      const inner=center-side*.35;
      bar([front,row.y,z],[inner,row.y,z],.012);
      box(side*(surface-.095),row.y-.025,z,.14,.050,.045);
      // Two closed loops support the cloth sleeve on a rigid top rod.
      for(const dx of [-.23,.23])bar([center+dx,row.y,z],[center+dx,top,z],.006);
      bar([center-.34,top,z],[center+.34,top,z],.011);
      // A separate correctly-oriented back face gives readable TC print from
      // either travel direction; its vertices follow the same physical cloth.
      const geometry=bannerGeometry(width,height),positions=geometry.attributes.position,rest=new Float32Array(positions.array);
      const material=bannerMaterials[rowIndex];
      const mesh=new THREE.Mesh(geometry,material);mesh.position.set(center,top,z);mesh.castShadow=false;mesh.receiveShadow=true;mesh.name=`Original ${BANNER_TEXT} cloth banner ${row.id} ${side<0?'west':'east'}`;group.add(mesh);
      const hemGeometry=new THREE.CylinderGeometry(.009,.009,width+.015,8);hemGeometry.rotateZ(Math.PI/2);
      const hem=new THREE.Mesh(hemGeometry,iron);hem.position.set(center,top-height,z);hem.castShadow=false;hem.name=`Weighted lower banner hem ${row.id} ${side}`;group.add(hem);
      banners.push({mesh,hem,positions,geometry,rest,width,height,phase:rowIndex*1.11+side*.73,top,bottom:top-height,center,z,
        label:BANNER_TEXT,detail:BANNER_DETAIL,contact:{wall_surface_x:side*surface,bracket_tip_x:inner,top_rod_y:top}});
    }
  });

  for(const {geometry,material,matrices} of staticBatches.values()){
    const mesh=new THREE.InstancedMesh(geometry,material,matrices.length);
    matrices.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();
    mesh.name='Rain festival / wall plates, rods and closed fittings';mesh.castShadow=false;mesh.receiveShadow=true;group.add(mesh);
  }
  for(const batch of animatedBatches.values()){
    const mesh=new THREE.InstancedMesh(batch.geometry,batch.material,batch.items.length);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.name='Rain festival / connected suspended lantern parts';
    mesh.castShadow=false;mesh.receiveShadow=true;mesh.frustumCulled=false;group.add(mesh);batch.mesh=mesh;
  }

  let elapsed=0,sinceUpdate=0;
  function update(dt,breeze){
    if(!Number.isFinite(dt)||dt<0)return;
    elapsed+=Math.min(dt,.25);sinceUpdate+=Math.min(dt,.25);
    if(sinceUpdate<1/24&&dt!==0)return;
    sinceUpdate=0;
    const time=Number.isFinite(breeze?.time)?breeze.time:elapsed;
    const gain=THREE.MathUtils.clamp(breeze?.speed??.78,.2,1.2);
    for(const batch of animatedBatches.values()){
      batch.items.forEach((item,i)=>{
        pose.position.set(...item.anchor);pose.rotation.set(.013*gain*Math.sin(time*.95+item.phase),item.yaw,.019*gain*Math.sin(time*1.09+item.phase));
        pose.scale.setScalar(item.scale);pose.updateMatrix();batch.mesh.setMatrixAt(i,pose.matrix);
      });batch.mesh.instanceMatrix.needsUpdate=true;
    }
    for(const flag of banners){
      const {positions,rest,width,height,phase}=flag;
      const bottom=.014*gain*Math.sin(time*1.05+phase);
      for(let i=0;i<positions.count;i++){
        const x=rest[i*3],y=rest[i*3+1],t=THREE.MathUtils.clamp(-y/height,0,1);
        // The top edge stays on its sleeve; the bottom moves as one weighted
        // line and therefore remains joined to the rigid lower rod.
        const billow=.034*gain*Math.sin(Math.PI*t)*Math.sin(time*1.20+phase+x/width*2.2+t*3.0)+bottom*t;
        positions.setXYZ(i,x,y,billow);
      }
      positions.needsUpdate=true;flag.geometry.computeVertexNormals();flag.hem.position.z=flag.z+bottom;
    }
  }
  function setTime(mode){for(const material of paperMaterials)material.emissiveIntensity=mode==='evening'?.34:.025;}
  update(0);setTime('day');
  const diagnostics={
    originalArtwork:true,paidAssets:false,people:0,newGroundColliders:0,
    rows:cables,lanterns:lanterns.map(item=>({row:item.row,anchor:item.anchor,scale:item.scale,lowest_tassel_y:item.anchor[1]-.985*item.scale})),
    banners:banners.map(b=>({label:b.label,detail:b.detail,center:[b.center,(b.top+b.bottom)/2,b.z],width:b.width,height:b.height,bottom_y:b.bottom,motion_z_bound:.055,contact:b.contact})),
    mounts,drawCalls:staticBatches.size+animatedBatches.size+cables.length+banners.length*2,
    minimumOverheadClearance:Math.min(...lanterns.map(item=>item.anchor[1]-.985*item.scale),...banners.map(b=>b.bottom)),
    limits:['World-space anchors follow existing known storey bands and the drugstore repaired-plaster gap; exact hardware contact and signage occlusion require final image review.','Original painted cloth/paper artwork, not a scan of the supplied photo.','Decoration is overhead with no new walking surfaces or route colliders.','Six banners and fourteen lanterns remain a bounded addition; no NPC or resident behaviour.'],
  };
  group.userData.rainFestival=diagnostics;
  return {group,update,setTime,diagnostics};
}
