import * as THREE from 'three';

// A small, original, locally painted texture: pale fog, separate beads and a
// handful of short runoff trails. Transparent centres let shoppers read the
// goods and shelf labels behind the refrigerated doors.
function condensationTexture(){
  const canvas=document.createElement('canvas');
  canvas.width=512;canvas.height=1024;
  const ctx=canvas.getContext('2d');
  let state=77291;
  const rand=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
  const cloud=(x,y,r,opacity)=>{
    const g=ctx.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0,`rgba(222,239,237,${opacity})`);
    g.addColorStop(.48,`rgba(218,236,235,${opacity*.55})`);
    g.addColorStop(1,'rgba(218,236,235,0)');
    ctx.fillStyle=g;ctx.fillRect(x-r,y-r,2*r,2*r);
  };
  cloud(20,910,340,.16);cloud(490,930,340,.15);
  cloud(35,90,235,.09);cloud(490,210,235,.075);
  // More droplets near the cooler frame and lower glass, fewer at eye level.
  for(let i=0;i<1200;i++){
    const x=rand()*512,y=rand()*1024,edge=Math.max(0,1-Math.min(x,512-x)/175);
    const low=Math.max(0,(y-620)/404);
    if(rand()>.14+edge*.62+low*.28)continue;
    const r=.35+Math.pow(rand(),2)*2.2;
    ctx.beginPath();ctx.ellipse(x,y,r*.78,r*1.12,0,0,Math.PI*2);
    ctx.fillStyle=`rgba(157,190,189,${.10+rand()*.12})`;ctx.fill();
    ctx.beginPath();ctx.ellipse(x-r*.18,y-r*.27,Math.max(.25,r*.37),Math.max(.25,r*.32),0,0,Math.PI*2);
    ctx.fillStyle=`rgba(245,255,254,${.18+rand()*.18})`;ctx.fill();
  }
  // A few intermittent trails on the lower half, never a full frosted sheet.
  for(let i=0;i<11;i++){
    const x=i%2?20+rand()*90:410+rand()*85,y=570+rand()*315,len=20+rand()*95;
    ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x+2,y+len*.3,x-3,y+len*.7,x+rand()*5-2,y+len);
    ctx.strokeStyle=`rgba(222,243,240,${.10+rand()*.08})`;ctx.lineWidth=.55+rand()*.75;ctx.stroke();
  }
  const texture=new THREE.CanvasTexture(canvas);
  texture.name='Original fine condensation';texture.colorSpace=THREE.SRGBColorSpace;
  texture.anisotropy=2;
  return texture;
}

// The cold equipment and air-conditioned glazing are fixed building features;
// particles are not physics objects and do not interfere with the doors.
export function addCondensation(scene){
  const root=new THREE.Group();root.name='Condensation on cold glass';
  const texture=condensationTexture(),geometry=new THREE.PlaneGeometry(1,1);
  const material=(opacity)=>new THREE.MeshBasicMaterial({
    map:texture,color:'#e7f2ef',transparent:true,opacity,
    depthWrite:false,depthTest:true,side:THREE.DoubleSide,toneMapped:false
  });
  const fridgeMaterial=material(.82),windowMaterial=material(.45);
  function planes(name,items,mat){
    const mesh=new THREE.InstancedMesh(geometry,mat,items.length),o=new THREE.Object3D();
    mesh.name=name;mesh.renderOrder=4;
    items.forEach((p,i)=>{
      o.position.set(p.x,p.y,p.z);o.rotation.set(0,p.yaw||0,0);o.scale.set(p.w,p.h,1);o.updateMatrix();
      mesh.setMatrixAt(i,o.matrix);
    });
    mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();root.add(mesh);
  }
  // Existing refrigerator glazing: z=-2.965, front towards the store (+Z).
  planes('Refrigerated door beads',Array.from({length:5},(_,i)=>({x:5.2+i*1.13,y:1.35,z:-2.947,w:.90,h:2.10})),fridgeMaterial);
  // Warm, humid air meets the cool convenience store panes. Localised lower
  // corners leave the entrance, notices and the view into the shop clear.
  planes('Light window mist',[
    {x:4.385,y:.67,z:-3.05,w:.52,h:.60,yaw:-Math.PI/2},
    {x:4.385,y:.66,z:-.17,w:.48,h:.58,yaw:-Math.PI/2},
    {x:4.385,y:.67,z:2.42,w:.48,h:.60,yaw:-Math.PI/2},
    {x:4.385,y:.66,z:4.42,w:.48,h:.58,yaw:-Math.PI/2},
    {x:7.22,y:.66,z:4.845,w:.48,h:.58},
    {x:8.45,y:.66,z:4.845,w:.48,h:.58},
    {x:10.18,y:.66,z:4.845,w:.48,h:.58},
  ],windowMaterial);
  scene.add(root);
  return {root,stats:{refrigeratedDoors:5,windowPatches:7,drawCalls:2},dispose(){root.removeFromParent();geometry.dispose();texture.dispose();fridgeMaterial.dispose();windowMaterial.dispose();}};
}
