import * as THREE from 'three';
import {SIGN_FONT} from './typography.js';

// A converted corner house, with its old window centres and sill hosts intact.
// b is the existing upperBox callback: every part follows the ceiling group.
export function addNeighborSevenUpper({b,mat,palette}){
  const {cream,white,window,metal,dark}=palette;
  const frame=mat('neighbor7 window brushed aluminium','#a4afa8',{metalness:.66,roughness:.40});
  const reveal=mat('neighbor7 window reveal concrete','#7e8b80',{roughness:.92});
  const coat=mat('neighbor7 maintained plaster','#c4c9b9',{roughness:.88});
  const patch=mat('neighbor7 repaired plaster','#d2d4c3',{roughness:.91});
  // Thin render coats and the original slab heights explain the broad wall.
  b(coat,3.103,3.84,1.08,.026,.54,9.98);
  b(coat,6.90,3.84,6.122,7.48,.54,.026);
  b(patch,3.095,6.52,1.08,.030,.43,9.98);
  b(patch,6.90,6.52,6.124,7.48,.43,.030);
  function windowBay(axis,u){
    const side=axis==='side';
    // Local u runs horizontally along either facade; n is outward distance.
    const at=(m,du,y,n,w,h,d)=>side
      ?b(m,3.11-n,y,u+du,d,h,w)
      :b(m,u+du,y,6.11+n,w,h,d);
    at(white,0,5.15,.025,1.66,1.92,.075);
    at(reveal,0,5.15,.071,1.48,1.76,.055);
    at(window,0,5.15,.102,1.38,1.62,.022);
    // Separate jambs, two leaves, bottom rail and sliding-track shadow.
    for(const dx of [-.704,.704])at(frame,dx,5.15,.145,.045,1.74,.066);
    for(const y of [4.31,5.99])at(frame,0,y,.145,1.45,.045,.066);
    at(frame,0,5.15,.157,.037,1.64,.057);
    at(frame,0,5.43,.157,1.39,.034,.057);
    at(dark,0,4.347,.151,1.34,.012,.025);
    at(frame,0,4.365,.176,1.40,.016,.026);
    at(dark,.065,5.03,.190,.018,.16,.022);
    // Sill footprint/height match the former primitive exactly.
    if(side)b(cream,3.00,4.17,u,.22,.13,1.80);
    else b(cream,u,4.17,6.24,1.80,.13,.22);
    // A folded metal drip edge caps the opening and has short return brackets.
    at(metal,0,6.14,.175,1.80,.027,.34);
    at(metal,0,6.105,.337,1.80,.064,.022);
    for(const dx of [-.59,.59])at(dark,dx,6.045,.113,.025,.16,.10);
    // Narrow sill dirt stays on the lower masonry, never across the glazing.
    const dirt=mat('neighbor7 sill runoff plaster','#adb7a6',{roughness:.96});
    for(const [dx,w,h] of [[-.58,.031,.20],[.52,.026,.14]])
      at(dirt,dx,4.085-h/2,.021,w,h,.008);
  }
  for(const z of [-2.1,.95,3.95])windowBay('side',z);
  for(const x of [4.5,7.1,9.6])windowBay('front',x);
  // Roof-edge flashing on these same two elevations, with a finished corner.
  b(metal,3.064,7.55,1.08,.09,.028,10.20);
  b(metal,6.90,7.55,6.193,7.76,.028,.09);
  return {windows:6,sillHostsUnchanged:true};
}

export const NEIGHBOR_SEVEN_SKUS=Object.freeze({
  greenTea:{title:'無糖綠茶',quantity:'容量 600 mL',price:30,color:'#6e8b52',radius:.032,height:.25},
  oolong:{title:'烏龍茶',quantity:'容量 600 mL',price:30,color:'#9b7950',radius:.032,height:.25},
  water:{title:'礦泉水',quantity:'容量 600 mL',price:25,color:'#9bb7bb',radius:.032,height:.25},
  milk:{title:'鮮乳',quantity:'容量 936 mL',price:95,color:'#e8e9df',width:.070,height:.230,depth:.075},
  blackCoffee:{title:'黑蔘美式咖啡',quantity:'容量 350 mL',price:35,color:'#3a2a20',radius:.030,height:.21},
});
let goods;
function stockAssets(){
  if(goods)return goods;
  const profile=[[.82,0],[.96,.025],[1,.07],[1,.69],[.95,.78],[.66,.86],[.43,.90],[.43,1]];
  const bottle=new THREE.LatheGeometry(profile.map(([r,y])=>new THREE.Vector2(r,y)),16);
  const sleeve=new THREE.CylinderGeometry(1,1,1,16,1,true,-Math.PI/2,Math.PI);
  const plane=new THREE.PlaneGeometry(1,1);
  const shape=new THREE.Shape();shape.moveTo(-.5,0);shape.lineTo(.5,0);shape.lineTo(.5,.84);shape.lineTo(0,1);shape.lineTo(-.5,.84);shape.closePath();
  const carton=new THREE.ExtrudeGeometry(shape,{depth:1,bevelEnabled:false,curveSegments:1});carton.translate(0,0,-.5);
  const prints={};
  for(const [key,sku] of Object.entries(NEIGHBOR_SEVEN_SKUS)){
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
    const q=canvas.getContext('2d');q.fillStyle='#f1efdf';q.fillRect(0,0,256,256);
    q.fillStyle=sku.color;q.fillRect(0,0,256,36);q.fillRect(0,216,256,40);
    q.fillStyle='#334b43';q.textAlign='center';q.textBaseline='middle';
    q.font=`700 16px ${SIGN_FONT}`;q.fillText('北巷日常',128,18,230);
    q.font=`700 37px ${SIGN_FONT}`;q.fillText(sku.title,128,83,236);
    q.font=`500 20px ${SIGN_FONT}`;q.fillText(key==='milk'?'冷藏保存 0–7°C':'冷藏飲品',128,128,236);
    q.font=`700 23px ${SIGN_FONT}`;q.fillText(sku.quantity,128,177,238);
    q.fillStyle='#243e36';q.font=`500 15px ${SIGN_FONT}`;q.fillText('DAILY SERIES',128,237,230);
    const texture=new THREE.CanvasTexture(canvas);texture.name=`Neighbor7 print ${key}`;texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
    const material=new THREE.MeshStandardMaterial({map:texture,roughness:key==='milk'?.69:.48});material.name=`Neighbor7 packaging ${key}`;prints[key]=material;
  }
  const canvas=document.createElement('canvas');canvas.width=canvas.height=64;
  const q=canvas.getContext('2d'),g=q.createRadialGradient(32,32,2,32,32,30);g.addColorStop(0,'rgba(33,38,31,.20)');g.addColorStop(.6,'rgba(33,38,31,.12)');g.addColorStop(1,'rgba(33,38,31,0)');q.fillStyle=g;q.fillRect(0,0,64,64);
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
  const contact=new THREE.MeshBasicMaterial({map,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});contact.name='Neighbor7 shelf support falloff';
  goods={bottle,sleeve,plane,carton,prints,contact};return goods;
}

// Replace the old four oversized colour cylinders on one existing shelf.
// Shelf/fascia/glass geometry and all colliders stay in the parent builder.
export function addNeighborSevenCoolerStock({bay,row,x,shelfTop,z=-3.28,b,cyl,mesh,mat}){
  // Bay 2 is the autumn/winter seasonal bay: bottled black-ginseng
  // americano, dark glass against the pale teas around it.
  const a=stockAssets(),key=bay===2?'blackCoffee':bay===4&&row>=2?'milk':['greenTea','oolong','water'][(bay+row)%3];
  const sku=NEIGHBOR_SEVEN_SKUS[key],body=mat(`neighbor7 ${key} packaging`,sku.color,{roughness:key==='milk'?.64:.39});
  const cap=mat('neighbor7 cap painted white','#e5e8dd',{roughness:.42});
  function place(px,pz){
    const milk=key==='milk',w=milk?sku.width:sku.radius*1.8,d=milk?sku.depth:sku.radius*1.8;
    mesh(a.plane,a.contact,px,shelfTop+.0007,pz,[-Math.PI/2,0,0],[w+.012,d+.012,1]);
    if(milk){
      mesh(a.carton,body,px,shelfTop,pz,[0,0,0],[sku.width,sku.height,sku.depth]);
      mesh(a.plane,a.prints[key],px,shelfTop+sku.height*.43,pz+sku.depth/2+.0008,[0,0,0],[sku.width*.92,sku.height*.75,1]);
      b(cap,px,shelfTop+sku.height+.003,pz,.008,.006,sku.depth);
    }else{
      mesh(a.bottle,body,px,shelfTop,pz,[0,0,0],[sku.radius,sku.height,sku.radius]);
      cyl(cap,px,shelfTop+sku.height+.010,pz,.015,.020);
      mesh(a.sleeve,a.prints[key],px,shelfTop+sku.height*.45,pz,[0,0,0],[sku.radius+.0007,.113,sku.radius+.0007]);
    }
  }
  let frontCount=0,rearCount=0;
  for(let i=0;i<6;i++){
    const px=x+(i-2.5)*.116;
    if(i%2===0){place(px,z-.18);rearCount++;}
    if(bay%2===1&&row===2&&i===4)continue;
    place(px,z+((bay+row)%2&&i===1?-.018:0));frontCount++;
  }
  return {sku:key,price:sku.price,frontCount,rearCount};
}

export function addNeighborSevenInterior({b,mat}){
  const gasket=mat('neighbor7 cooler gasket rubber','#2c3c36',{roughness:.85});
  const fitting=mat('neighbor7 cooler satin metal','#aab7b0',{metalness:.72,roughness:.39});
  for(let bay=0;bay<5;bay++){
    const x=5.2+bay*1.13;
    // Seal corners, short hinges and recessed plinth ventilation belong to
    // existing refrigerator frames, not to new boxes across the passage.
    for(const y of [.31,2.39])b(gasket,x,y,-2.982,.86,.014,.014);
    for(const y of [.46,2.22])b(fitting,x+.457,y,-2.932,.044,.076,.023);
    for(let i=0;i<7;i++)b(gasket,x-.32+i*.105,.237,-2.968,.057,.013,.008);
    for(let row=0;row<4;row++){
      const y=.58+row*.48;
      // A raised folded shelf edge has a dark seam and retains the price lip.
      b(fitting,x,y+.015,-3.052,.86,.014,.027);
      b(gasket,x,y-.075,-3.029,.82,.008,.008);
    }
  }
  return {coolers:5,addedColliders:0};
}
