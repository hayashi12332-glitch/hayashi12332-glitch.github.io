import * as THREE from 'three';

// Original maintenance marks, not photographs or outdoor dirt. Shared assets
// stay bounded; adding stock reuses one small contact-shadow texture/batch.
let shared;
const floorMaterials=new Map();
function canvasTexture(canvas,name,color=true){
  const texture=new THREE.CanvasTexture(canvas);texture.name=name;
  texture.colorSpace=color?THREE.SRGBColorSpace:THREE.NoColorSpace;
  texture.anisotropy=4;return texture;
}
function assets(){
  if(shared)return shared;
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
  const q=canvas.getContext('2d'),g=q.createRadialGradient(64,64,4,64,64,61);
  g.addColorStop(0,'rgba(35,31,24,.26)');g.addColorStop(.48,'rgba(35,31,24,.20)');
  g.addColorStop(.80,'rgba(35,31,24,.065)');g.addColorStop(1,'rgba(35,31,24,0)');
  q.fillStyle=g;q.fillRect(0,0,128,128);
  const contact=new THREE.MeshBasicMaterial({map:canvasTexture(canvas,'Retail grounded contact falloff'),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
  contact.name='Retail small contact shadow';
  const wearCanvas=document.createElement('canvas');wearCanvas.width=256;wearCanvas.height=32;
  const w=wearCanvas.getContext('2d');
  for(let i=0;i<29;i++){
    const x=(i*73+19)%256,y=8+(i*7)%17;
    w.fillStyle=i%3?'rgba(113,118,108,.18)':'rgba(217,216,200,.24)';
    w.fillRect(x,y,3+(i*11)%26,i%4?1:2);
  }
  const edge=new THREE.MeshStandardMaterial({map:canvasTexture(wearCanvas,'Retail shelf lip contact scuffs'),transparent:true,depthWrite:false,roughness:.86,metalness:.12,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
  edge.name='Retail used shelf lip';
  const metalCanvas=document.createElement('canvas');metalCanvas.width=32;metalCanvas.height=128;
  const m=metalCanvas.getContext('2d'),fade=m.createLinearGradient(0,0,0,128);
  fade.addColorStop(0,'rgba(196,204,198,0)');fade.addColorStop(.2,'rgba(196,204,198,.28)');
  fade.addColorStop(.8,'rgba(196,204,198,.28)');fade.addColorStop(1,'rgba(196,204,198,0)');
  m.fillStyle=fade;m.fillRect(3,0,26,128);
  for(let i=0;i<14;i++){m.fillStyle='rgba(231,234,225,.15)';m.fillRect(5+(i*7)%20,18+(i*19)%91,1,7+(i%4)*3);}
  const metal=new THREE.MeshStandardMaterial({map:canvasTexture(metalCanvas,'Retail handle hand-polished centre'),transparent:true,depthWrite:false,roughness:.20,metalness:.72,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
  metal.name='Retail handle contact polish';
  shared={plane:new THREE.PlaneGeometry(1,1),contact,edge,metal};return shared;
}
function floorMaterial(width,depth,entryX,type){
  const key=[width,depth,entryX,type].join(':');if(floorMaterials.has(key))return floorMaterials.get(key);
  const color=document.createElement('canvas'),rough=document.createElement('canvas');
  color.width=rough.width=512;color.height=rough.height=256;
  const q=color.getContext('2d'),r=rough.getContext('2d');
  const pixels=q.createImageData(512,256),roughPixels=r.createImageData(512,256);
  for(let py=0;py<256;py++)for(let px=0;px<512;px++){
    const x=(px/511-.5)*(width-.32),z=py/255*depth;
    // Tile boundaries agree with the existing 65 cm physical grout strips.
    const tx=Math.floor((x+width/2-.25)/.65),tz=Math.floor((z-.3)/.65);
    const h=Math.sin(tx*127.1+tz*311.7+type.length*7.3)*43758.5453;
    const tile=(h-Math.floor(h)-.5)*.045;
    const traffic=Math.exp(-(((x-entryX)/.58)**2))*(.80+.20*Math.sin(z*2.1+.7));
    const edgeDust=Math.exp(-z/.075)*.035;
    const noise=(Math.sin(px*17.7+py*31.3)*.5)*.004;
    const value=1+tile+traffic*.018-edgeDust+noise,i=(py*512+px)*4;
    pixels.data[i]=Math.round(220*value);pixels.data[i+1]=Math.round(215*value);pixels.data[i+2]=Math.round(203*value);pixels.data[i+3]=255;
    const roughness=Math.round(205-traffic*57+(tile*200));
    roughPixels.data[i]=roughPixels.data[i+1]=roughPixels.data[i+2]=roughness;roughPixels.data[i+3]=255;
  }
  q.putImageData(pixels,0,0);r.putImageData(roughPixels,0,0);
  // A few short sole/cart scuffs near the real doorway; the rest stays clean.
  // Their width is about a centimetre, not a room-wide generic dirt overlay.
  q.strokeStyle='rgba(87,81,69,.13)';q.lineWidth=.65;q.lineCap='round';
  for(let i=0;i<6;i++){
    const x=entryX+Math.sin(i*2.17)*.33,z=depth-.18-(i%4)*.32;
    const u=(x/(width-.32)+.5)*512,v=z/depth*256;
    q.beginPath();q.moveTo(u-1.8,v+1);q.quadraticCurveTo(u,v-1.5,u+2.3,v-.4);q.stroke();
  }
  const material=new THREE.MeshStandardMaterial({map:canvasTexture(color,'Retail maintained tile tone '+type),roughnessMap:canvasTexture(rough,'Retail aisle polish '+type,false),roughness:1,metalness:0});
  material.name='Retail maintained floor '+type;floorMaterials.set(key,material);return material;
}

export function createRetailSurfaceFinish(type,{mesh,width,front,back,entryX}){
  const a=assets();
  function horizontal(material,x,y,z,w,d){mesh(a.plane,material,x,y,z,[-Math.PI/2,0,0],[w,d,1]);}
  // Top .1572m is above the existing .156m tile and below .1595m grout.
  horizontal(floorMaterial(width,front-back,entryX,type),0,.1572,(front+back)/2,width-.32,front-back);
  return {
    contact(x,floor,z,w,d,padding=.016){horizontal(a.contact,x,floor+.0006,z,w+padding,d+padding);},
    fitting(x,z,w,d){horizontal(a.contact,x,.1578,z,w+.09,d+.09);},
    shelf(x,y,z,w){mesh(a.plane,a.edge,x,y,z,[0,0,0],[w,.025,1]);},
    handle(x,y,z){mesh(a.plane,a.metal,x,y,z,[0,0,0],[.023,.27,1]);},
  };
}
