import * as THREE from 'three';
import {SIGN_FONT} from './typography.js';

// Legible, original sign faces. Pack labels into shared atlases; all triangles
// on a page share one draw call. Raster and physical aspect ratios agree.
export function createStreetSignage(parent){
  const SIZE=2048,pages=[],records=[];
  function page(){
    const canvas=document.createElement('canvas');canvas.width=canvas.height=SIZE;
    const result={canvas,ctx:canvas.getContext('2d'),x:2,y:2,row:0,positions:[],uvs:[],indices:[]};
    pages.push(result);return result;
  }
  function place(w,h){
    let p=pages.at(-1)??page();
    if(p.x+w+2>SIZE){p.x=2;p.y+=p.row+4;p.row=0;}
    if(p.y+h+2>SIZE)p=page();
    const result={p,x:p.x,y:p.y};p.x+=w+4;p.row=Math.max(p.row,h);return result;
  }
  function fit(ctx,text,size,maxWidth){
    ctx.font=`700 ${size}px ${SIGN_FONT}`;
    const width=ctx.measureText(text).width;
    if(width>maxWidth)ctx.font=`700 ${size*maxWidth/width}px ${SIGN_FONT}`;
  }
  function add({text,detail='',note='',x,y,z,width,height,yaw=0,bg='#1f6049',fg='#fff9e7',kind='notice',back=false}){
    const scale=Math.min(640/width,400/height,500);
    const w=Math.max(64,Math.round(width*scale)),h=Math.max(48,Math.round(height*scale));
    const slot=place(w,h),{p}=slot,ctx=p.ctx;
    ctx.save();ctx.translate(slot.x,slot.y);ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
    ctx.strokeStyle=fg;ctx.lineWidth=Math.max(1.2,h*.012);ctx.globalAlpha=.72;
    const inset=Math.max(3,h*.045);ctx.strokeRect(inset,inset,w-inset*2,h-inset*2);ctx.globalAlpha=1;
    ctx.fillStyle=fg;ctx.textAlign='center';ctx.textBaseline='middle';
    const lines=kind==='address'?[[text,.23,.23],[detail,.48,.64]]:
      note?[[text,.28,.24],[detail,.24,.54],[note,.19,.80]]:
      detail?[[text,.44,.36],[detail,.22,.77]]:[[text,.49,.51]];
    for(const [line,size,top] of lines){fit(ctx,line,h*size,w-inset*3);ctx.fillText(line,w/2,h*top);}
    ctx.restore();
    const u0=(slot.x+.5)/SIZE,u1=(slot.x+w-.5)/SIZE,v0=1-(slot.y+h-.5)/SIZE,v1=1-(slot.y+.5)/SIZE;
    const face=angle=>{
      const c=Math.cos(angle),s=Math.sin(angle),start=p.positions.length/3;
      for(const [px,py] of [[-width/2,-height/2],[width/2,-height/2],[width/2,height/2],[-width/2,height/2]])
        p.positions.push(x+c*px+s*.006,y+py,z-s*px+c*.006);
      p.uvs.push(u0,v0,u1,v0,u1,v1,u0,v1);
      p.indices.push(start,start+1,start+2,start,start+2,start+3);
    };
    face(yaw);if(back)face(yaw+Math.PI);
    records.push({text,detail,note,kind,position:[x,y,z],size:[width,height],yaw,back});
  }
  function finalize(){
    for(const [i,p] of pages.entries()){
      const texture=new THREE.CanvasTexture(p.canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
      texture.name='Original Taiwanese daily signs '+i;
      const geometry=new THREE.BufferGeometry();
      geometry.setAttribute('position',new THREE.Float32BufferAttribute(p.positions,3));
      geometry.setAttribute('uv',new THREE.Float32BufferAttribute(p.uvs,2));geometry.setIndex(p.indices);geometry.computeVertexNormals();
      const material=new THREE.MeshStandardMaterial({map:texture,roughness:.72,emissive:'#ffffff',emissiveIntensity:.045});
      const mesh=new THREE.Mesh(geometry,material);mesh.name='Everyday signs / atlas '+i;mesh.receiveShadow=true;parent.add(mesh);
    }
    return{count:records.length,pages:pages.length,records};
  }
  return{add,finalize};
}
