import * as THREE from 'three';

// The next occupied lots use the exemplar's construction vocabulary, not its
// elevation copied wholesale. Units are metres and local +Z faces the street.
// This changes surface fittings only: floor/door openings, volume/colliders,
// shared upper glass and every WINDOW_BOX_SPECS anchor remain authoritative.
let runoffMaterial;
function sillRunoff(){
  if(runoffMaterial)return runoffMaterial;
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;
  const ctx=canvas.getContext('2d');
  for(let i=0;i<14;i++){
    const x=7+(i*37)%114,top=2+(i%3)*2,length=42+(i*23)%79;
    const g=ctx.createLinearGradient(0,top,0,top+length);
    g.addColorStop(0,'rgba(64,63,47,.15)');
    g.addColorStop(.35,'rgba(64,63,47,.075)');
    g.addColorStop(1,'rgba(64,63,47,0)');
    ctx.fillStyle=g;ctx.fillRect(x,top,1+(i%3),length);
  }
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
  map.name='Neighbour window-sill runoff — original mask';
  runoffMaterial=new THREE.MeshStandardMaterial({map,transparent:true,depthWrite:false,
    roughness:1,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
  runoffMaterial.name='Neighbour short gravity runoff below actual sills';
  return runoffMaterial;
}

export function addNeighborFacade(kind,api){
  const {width,height,front,b,face,pitched,mat,palette}=api;
  const {cream,white,window,windowLight,metal,dark}=palette;
  const concrete=mat('neighbor repaired concrete','#b8b7a7',{roughness:.9});
  const reveal=mat('neighbor window reveal','#4b5650',{roughness:.92});
  const aluminium=mat('neighbor sliding sash metal','#98a69f',{metalness:.64,roughness:.42});
  const sashDark=mat('neighbor old sash painted metal','#536861',{metalness:.36,roughness:.54});
  const teak=mat('neighbor food interior-facing wood','#735b45',{roughness:.76});
  const seal=mat('neighbor window rubber seals','#35433f',{roughness:.86});
  const joint=mat('neighbor facade tile mortar','#8e978b',{roughness:.96});

  // Depth is expressed by an outer surround, dark jambs, glass, gasket, two
  // overlapping tracks, a latch and the projecting sill. Glass centres and
  // sill tops agree with the old facade so the supported plant boxes stay put.
  function sash(x,y,w,h,{arched=false,wood=false,lit=false,sillHeight=.14,sillOffset=.91}={}){
    const frame=wood?teak:aluminium,shape=arched?'arch':'plane';
    face(shape,concrete,x,y,front+.136,w+.24,h+.25);
    face(shape,reveal,x,y-.006,front+.160,w+.105,h+.08);
    face(shape,lit?windowLight:window,x,y-.015,front+.180,w,h);
    const straight=arched?h*.50:h+.045,sideY=arched?y-h*.25:y-.015;
    for(const side of [-1,1]){
      b(reveal,x+side*(w/2+.044),sideY,front+.169,.085,straight+.08,.145);
      b(seal,x+side*(w/2-.010),sideY,front+.213,.016,straight,.018);
      b(frame,x+side*(w/2-.035),sideY,front+.242,.040,straight+.025,.056);
    }
    b(frame,x,y-.015,front+.247,.046,h-.025,.065);
    b(frame,x,y-h/2,front+.240,w+.045,.056,.065);
    if(!arched)b(frame,x,y+h/2,front+.240,w+.045,.052,.065);
    b(frame,x,y+(arched?.10:.31),front+.247,w,.035,.056);
    if(!wood){
      b(aluminium,x,y-h/2+.045,front+.277,w-.055,.015,.027);
      b(sashDark,x,y-h/2+.071,front+.252,w-.055,.013,.025);
      b(seal,x+.070,y-.15,front+.280,.018,.135,.022);
      b(aluminium,x+.076,y-.15,front+.293,.010,.074,.016);
    }else{
      for(const dx of [-w*.24,w*.24])b(teak,x+dx,y-.19,front+.244,.022,h-.38,.029);
      b(teak,x,y-.30,front+.244,w,.024,.029);
    }
    const sillY=y-sillOffset;
    // The two street lots retain their actual cream planter-host sill, not
    // merely an equal-size replacement. Placement QA identifies that support.
    b(kind==='dry'||kind==='food'?cream:concrete,x,sillY,front+.19,w+.33,sillHeight,.30);
    // A small shadow/drip groove is under, rather than painted across, glass.
    b(reveal,x,sillY-sillHeight/2+.011,front+.305,w+.22,.012,.015);
    face('plane',sillRunoff(),x,sillY-sillHeight/2-.16,front+.063,w+.11,.29);
  }
  function rainhood(x,y,w,depth=.38){
    // Slopes out/down. The hem and wall plate explain its support and drainage.
    pitched(metal,x,y,front+depth*.49,w,.026,depth,.12);
    b(metal,x,y-.049,front+depth-.015,w,.064,.025);
    b(metal,x,y+.018,front+.035,w,.084,.022);
    for(const dx of [-w*.36,w*.36]){
      b(sashDark,x+dx,y-.09,front+.055,.027,.22,.030);
      pitched(sashDark,x+dx,y-.070,front+.16,.025,.024,.25,-.56);
    }
  }
  function band(y,w=width-.16){
    b(concrete,0,y,front+.103,w,.105,.205);
    b(reveal,0,y-.058,front+.173,w-.045,.012,.024);
  }
  function pilaster(x,y,h,w=.23,m=concrete){
    b(m,x,y,front+.099,w,h,.16);
    b(white,x,height-.16,front+.130,w+.075,.11,.21);
  }
  if(kind==='dry'){
    const upper=mat('neighbor dry sun faded plaster','#c4bea5',{roughness:.9});
    const maintained=mat('neighbor dry maintained plaster','#cbc8b2',{roughness:.88});
    b(maintained,0,4.92,front+.026,width-.28,2.18,.045);
    b(upper,0,(6.22+height-.20)/2,front+.026,width-.28,height-.20-6.22,.045);
    for(const x of [-width/2+.14,width/2-.14])pilaster(x,(height+3.8)/2,height-3.7);
    for(let row=0;row<2;row++){
      const y=4.95+row*2.58,w=width*.29;
      for(const side of [-1,1]){
        const x=side*width*.235;
        sash(x,y,w,1.55,{arched:row===1,lit:row===0&&side<0});
        if(row===0){
          // Preserve the pre-existing shallow balcony footprint. Lower rails
          // and posts meet the slab; wall stays connect back to the jambs.
          b(concrete,x,y-.96,front+.37,w+.40,.11,.65);
          b(sashDark,x,y-.54,front+.67,w+.38,.035,.040);
          for(let i=0;i<7;i++)b(sashDark,x-w/2+i*w/6,y-.735,front+.67,.018,.365,.026);
          for(const dx of [-w/2,w/2])b(sashDark,x+dx,y-.54,front+.46,.022,.028,.44);
          for(const dx of [-w*.35,w*.35]){
            b(concrete,x+dx,y-1.10,front+.15,.11,.28,.23);
            pitched(sashDark,x+dx,y-1.09,front+.30,.035,.034,.34,-.48);
          }
        }
      }
      band(y+1.10);
    }
    b(maintained,width*.34,6.18,front+.059,.40,.17,.025);
    return {kind,windowBays:4,retainedWindowAnchors:true};
  }

  if(kind==='food'){
    const plaster=mat('neighbor food faded peach plaster','#c5afa0',{roughness:.88});
    const tile=mat('neighbor food grey green tile','#a7b2a4',{roughness:.38});
    b(plaster,0,(height+3.77)/2,front+.026,width-.25,height-3.77,.045);
    for(const x of [-width/2+.14,0,width/2-.14]){
      pilaster(x,(height+3.8)/2,height-3.7,x===0?.20:.24,tile);
      for(let y=3.9;y<height-.2;y+=.25)b(joint,x,y,front+.184,x===0?.20:.24,.007,.007);
    }
    for(let row=0;row<2;row++){
      const y=4.95+row*2.58,w=width*.29;
      for(const side of [-1,1])sash(side*width*.235,y,w,1.55,{lit:row===0&&side>0});
      band(y+1.10);
      if(row===1)rainhood(0,y+.89,width-.48,.36);
    }
    return {kind,windowBays:4,retainedWindowAnchors:true};
  }

  if(kind==='north-corner'||kind==='north-residential'){
    // This 8.5m corner has room for y4.65/7.35 windows. The old floor-based
    // count left its entire upper storey blank; the return is matched by world.
    const corner=kind==='north-corner',rows=corner?2:Math.floor((height-3.4)/2.7);
    const plaster=mat(corner?'neighbor corner warm plaster':'neighbor residential pale plaster',corner?'#c2bca8':'#b5bbb0',{roughness:.9});
    const lower=mat('neighbor residential tile','#8d9e97',{roughness:.4});
    b(plaster,0,(height+3.32)/2,front+.025,width-.25,height-3.32,.043);
    for(const x of [-width/2+.15,width/2-.15])pilaster(x,(height+3.2)/2,height-3.0,.22,corner?concrete:lower);
    if(!corner)b(lower,0,3.51,front+.066,width-.26,.28,.085);
    for(let row=0;row<rows;row++){
      const y=4.65+row*2.7,w=width*.19;
      for(let bay=0;bay<3;bay++){
        const x=(bay-1)*width*.27;
        // The corner keeps the arched top floor to meet the existing return
        // elevation. The wider residential lot uses replaced flat sashes.
        sash(x,y,w,corner?1.52:1.44,{arched:corner&&row===rows-1,
          lit:!corner&&row===1&&bay===1,sillHeight:.13,sillOffset:.88});
      }
      // Existing corner-return cornices terminate at y5.77 and8.47.
      band(y+1.12,width);
      if(!corner)rainhood(0,y+.89,width-.44,.34);
    }
    // The same three air conditioners are now installed by building-details
    // using the existing CC0 GLB. Do not duplicate cases, rails or pipes here.
    return {kind,windowBays:rows*3,retainedWindowAnchors:true};
  }
  return {kind,windowBays:0};
}
