import * as THREE from 'three';

// Three authored elevations within the existing street envelope. Shared PBR
// brickwork/stucco and installed roof/AC assets are retained. Measurements are
// local metres; +Z is out toward the street. Window-box anchors are unchanged.
export function addExemplarFacade(kind, api) {
  const {width,height,front,rear,shopFront,b,face,sideFace,pitched,mat,palette} = api;
  const {cream,white,window,windowLight,metal,dark,brickwork} = palette;
  const aluminium=mat('exemplar sash aluminium','#9da69f',{metalness:.66,roughness:.4});
  const teak=mat('exemplar aged teak wood','#68513d',{roughness:.72});
  const shadow=mat('exemplar reveal shadow','#34403c',{roughness:.9});
  const stone=mat('exemplar weathered stone concrete','#b7b5a4',{roughness:.89});
  const tile=mat('exemplar breakfast ceramic tile','#a7b7a6',{roughness:.34});
  const tileJoint=mat('exemplar tile mortar','#7b8980',{roughness:.97});
  const patched=mat('exemplar repaired lime plaster','#d2cbb6',{roughness:.92});
  const faded=mat('exemplar breakfast faded plaster','#b0b8a7',{roughness:.85});
  const stains=new Map();
  function runoff(seed) {
    if(stains.has(seed))return stains.get(seed);
    const canvas=document.createElement('canvas');canvas.width=128;canvas.height=256;
    const ctx=canvas.getContext('2d');
    for(let i=0;i<18;i++){
      const x=(Math.sin(seed*3.17+i*7.31)*.5+.5)*128;
      const y=2+(i%5)*3,run=35+((i*47+seed*23)%180),w=1+(i%4)*1.2;
      const gradient=ctx.createLinearGradient(0,y,0,y+run);
      gradient.addColorStop(0,`rgba(61,60,43,${.12+(i%3)*.025})`);
      gradient.addColorStop(.3,'rgba(65,66,48,.07)');gradient.addColorStop(1,'rgba(65,66,48,0)');
      ctx.fillStyle=gradient;ctx.fillRect(x,y,w,run);
    }
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const m=new THREE.MeshStandardMaterial({map:texture,transparent:true,depthWrite:false,roughness:1,
      polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
    m.name=`Localized gravity runoff ${seed}`;stains.set(seed,m);return m;
  }
  function streak(x,top,z,w,h,seed){face('plane',runoff(seed),x,top-h/2,z,w,h);}
  function sash(x,y,w,h,{wood=false,arched=false,lit=false,grille=false,transom=true,sill=true}={}){
    const frame=wood?teak:aluminium;
    face(arched?'arch':'plane',cream,x,y,front+.16,w+.24,h+.28);
    face(arched?'arch':'plane',lit?windowLight:window,x,y-.015,front+.18,w,h);
    // Real jambs project ahead of the pane; the glass is not merely a colour
    // rectangle on the wall. The lower sill remains the original planter host.
    for(const side of [-1,1]){
      b(shadow,x+side*(w/2+.045),y-(arched?.32:0),front+.17,.10,arched?h*.60:h+.10,.18);
      b(frame,x+side*(w/2-.026),y-(arched?.32:0),front+.238,.052,arched?h*.60:h+.05,.065);
    }
    b(frame,x,y-.015,front+.238,.048,h-.035,.065);
    b(frame,x,y-h/2,front+.238,w,.055,.065);
    if(!arched)b(frame,x,y+h/2,front+.238,w+.06,.055,.065);
    if(transom)b(frame,x,y+(wood?.32:.37),front+.24,w,.045,.065);
    // Separate sliding tracks and the handle belong to one sash leaf.
    if(!wood){
      b(aluminium,x,y-h/2+.065,front+.275,w,.018,.035);
      b(dark,x+.065,y-.13,front+.279,.018,.15,.022);
    }else{
      for(const dx of [-w*.25,w*.25])b(teak,x+dx,y-.14,front+.238,.022,h-.23,.033);
      b(teak,x,y-.27,front+.24,w,.028,.035);
    }
    if(grille){
      b(dark,x,y+.10,front+.30,w+.14,.026,.035);
      for(let i=0;i<7;i++)b(dark,x-w*.46+i*w*.153,y+.08,front+.30,.014,h*.78,.025);
    }
    if(sill)b(cream,x,y-.91,front+.19,w+.33,.14,.30);
  }
  function rainhood(x,y,w,depth=.46){
    pitched(metal,x,y,front+depth*.47,w,.027,depth,.13);
    b(metal,x,y-.075,front+depth-.04,w,.085,.026);
    for(const dx of [-w*.37,w*.37]){
      b(dark,x+dx,y-.16,front+.18,.025,.27,.025);
      pitched(dark,x+dx,y-.13,front+.29,.025,.025,.26,-.60);
    }
  }

  if(kind==='breakfast'){
    // A maintained postwar tiled house: flat sashes, restrained horizontal
    // service bands and a shallow metal rainhood, rather than historic arches.
    b(faded,0,(height+3.73)/2,front+.027,width-.24,height-3.73,.055);
    for(const x of [-width/2+.14,0,width/2-.14]){
      const w=x===0?.30:.25;
      b(tile,x,(height+3.72)/2,front+.11,w,height-3.72,.13);
      for(let y=3.84;y<height-.1;y+=.22)b(tileJoint,x,y,front+.179,w,.008,.006);
      b(white,x,height-.19,front+.14,w+.055,.10,.17);
    }
    for(let floor=0;floor<2;floor++){
      const y=4.95+floor*2.58;
      for(const side of [-1,1]){
        const x=side*width*.235,w=width*.29;
        sash(x,y,w,1.55,{lit:floor===0&&side<0});
        // Runoff begins immediately below an actual sill, not across glass.
        streak(x,y-1.0,front+.060,w+.12,floor?.38:.23,11+floor+(side>0?2:0));
      }
      b(stone,0,y+1.08,front+.095,width-.22,.10,.19);
      if(floor===1)rainhood(0,y+.95,width-.44,.45);
    }
    b(patched,-width*.34,3.83,front+.070,.48,.16,.025);
    b(aluminium,0,height+.48,front-.08,width-.18,.055,.35);
    // The corner exposes a blind south wall. Keep it blind: its floor joint,
    // later render coats, roof flashing and roof-drain connection explain the
    // large surface without inventing windows or unrelated decorative props.
    const side=-1,sideX=side*(width/2+.014),run=front-rear,zmid=(front+rear)/2;
    const upperCoat=mat('exemplar side sun faded plaster','#b0b7a7',{roughness:.87});
    const lowerCoat=mat('exemplar side maintained plaster','#a1ad9e',{roughness:.89});
    const slabRender=mat('exemplar side slab plaster','#b7bdac',{roughness:.9});
    const joint=mat('exemplar render joint','#718077',{roughness:.96});
    b(lowerCoat,sideX,(3.47+5.98)/2,zmid,.025,5.98-3.47,run-.06);
    b(upperCoat,sideX,(6.12+height-.10)/2,zmid,.025,height-.10-6.12,run-.06);
    // A narrow proud slab edge meets the existing first-floor front cornice.
    b(slabRender,side*(width/2+.028),6.045,zmid,.055,.13,run+.03);
    b(joint,side*(width/2+.058),5.982,zmid,.006,.012,run-.03);
    b(slabRender,side*(width/2+.022),3.425,zmid,.045,.14,run-.03);
    // The front's tiled corner return has a finished edge on this same wall.
    b(tile,side*(width/2+.027),(height+3.72)/2,front-.13,.050,height-3.72,.28);
    for(let y=3.84;y<height-.1;y+=.22)
      b(tileJoint,side*(width/2+.054),y,front-.13,.007,.008,.28);
    // Flashing caps the actual roof slab; a modest gutter collects its edge
    // and drains against the existing ground-floor side wall, down to grade.
    const pipeZ=shopFront-.30,pipeX=side*(width/2+.075),pipeTop=height+.16;
    b(metal,side*(width/2+.035),height+.165,zmid,.13,.035,run+.08);
    b(aluminium,side*(width/2+.072),height+.115,zmid,.075,.075,run-.06);
    b(aluminium,pipeX,(pipeTop+.055)/2,pipeZ,.070,pipeTop-.055,.070);
    for(const y of [.45,2.45,4.45,6.45,8.20])if(y<height)
      b(dark,side*(width/2+.046),y,pipeZ,.075,.035,.105);
    b(metal,pipeX,.025,pipeZ,.13,.05,.15);
    for(const z of [pipeZ-.04,pipeZ,pipeZ+.04])b(dark,pipeX,.053,z,.080,.006,.014);
    // Concentrate runoff at the gutter outlet and along the service pipe;
    // their gravity direction is independent of the wall's world orientation.
    sideFace(side,runoff(51),pipeZ,height-1.69,.49,3.55,.030);
    sideFace(side,runoff(57),pipeZ,2.50,.35,4.65,.030);
    sideFace(side,runoff(61),front-.58,height-.69,.66,1.15,.030);
    return {kind,windowBays:4};
  }

  if(kind==='tea'){
    // A brick shop house with timber joinery. Recessed panels and modest
    // masonry corbels refer to the construction in the Dihua photographs;
    // elaborate relief sculptures are not simulated with arbitrary blobs.
    b(brickwork,0,(height+3.80)/2,front+.025,width-.28,height-3.80,.045);
    for(const x of [-width/2+.14,width/2-.14]){
      b(stone,x,(height+3.8)/2,front+.13,.25,height-3.7,.20);
      for(let y=3.95;y<height-.3;y+=.48)b(cream,x,y,front+.25,.28,.13,.035);
    }
    for(let floor=0;floor<2;floor++){
      const y=4.95+floor*2.58;
      for(const side of [-1,1]){
        const x=side*width*.235,w=width*.29;
        sash(x,y,w,1.55,{wood:true,arched:floor===1,lit:floor===0&&side<0,grille:floor===0&&side<0});
        // Shallow masonry heads and stone keystones give each opening weight.
        if(floor===0){
          b(stone,x,y+.91,front+.18,w+.38,.16,.28);
          for(const dx of [-w*.42,w*.42])b(cream,x+dx,y+.77,front+.20,.13,.18,.24);
        }else b(stone,x,y+.82,front+.19,.14,.21,.21);
        streak(x,y-.99,front+.053,w+.2,.43,22+floor+(side>0?2:0));
      }
      b(stone,0,y+1.10,front+.12,width,.13,.24);
      for(const x of [-width*.33,0,width*.33])b(cream,x,y+1.22,front+.145,.13,.14,.27);
    }
    b(stone,0,3.81,front+.12,width-.20,.12,.23);
    // The gable stays within its original height and supports the same roof.
    for(let i=0;i<9;i++)b(stone,-width*.42+i*width*.105,height-.21,front+.18,.10,.17,.25);
    b(patched,width*.37,6.13,front+.056,.30,.37,.025);
    return {kind,windowBays:4};
  }

  if(kind==='drugstore'){
    // Two occupied upper storeys with four regular rectangular bays. The broad
    // concrete frame differs decisively from the old-street arch template.
    b(patched,0,(height+3.32)/2,front+.031,width-.24,height-3.32,.055);
    for(const x of [-width/2+.14,-width*.25,0,width*.25,width/2-.14])
      b(stone,x,(height+3.28)/2,front+.12,.18,height-3.28,.22);
    for(let row=0;row<2;row++){
      const y=4.47+row*2.18,w=width*.175;
      for(let bay=0;bay<4;bay++){
        const x=(bay-1.5)*width*.245;
        sash(x,y,w,1.39,{lit:row===1&&bay===2,transom:true,sill:false});
        b(stone,x,y-.82,front+.14,w+.20,.12,.28);
        streak(x,y-.90,front+.066,w+.10,.27,36+row*4+bay);
      }
      b(stone,0,y+1.01,front+.12,width-.16,.12,.25);
      rainhood(0,y+.84,width-.28,.42);
    }
    // A repaired section, a continuous drip edge, and narrow pipe clips convey
    // maintenance rather than uniform all-over noise.
    b(stone,0,3.34,front+.14,width-.14,.12,.28);
    b(metal,width/2-.39,(height+3.5)/2,front+.30,.048,height-3.5,.048);
    for(const y of [3.7,5.6,7.5])b(dark,width/2-.39,y,front+.295,.10,.035,.085);
    return {kind,windowBays:8};
  }
  return {kind,windowBays:0};
}
