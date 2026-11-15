import * as THREE from 'three';

// Two shared slots, each with the existing ceiling lamp and worktop bounce.
// A menu visit is a discontinuous move: resolve its lighting immediately.
// Ordinary walking retains a bounded distance preference and a gentle fade.
const shops=[
  {id:'tea',x:-6.7,z:-8.4,color:'#ffe6c9',power:1.12},
  {id:'dry',x:-6.7,z:-2.65,color:'#ffead5'},
  {id:'food',x:-6.7,z:3.15,color:'#ffdfbe'},
  {id:'cloth',x:-6.7,z:7.275,color:'#ffe8d2'},
  {id:'herbs-west',x:-6.7,z:11.6,color:'#ffe3c6'},
  {id:'herbs-east',x:6.4,z:-8.2,color:'#ffe3c6'},
  {id:'breakfast',x:8.0,z:11.8,color:'#fff0d8',power:1.08},
  {id:'laundry',x:-25+6.2*.22,z:-24.05,color:'#ffefda'},
  {id:'bank',x:-18.1+7.1*.22,z:-24.05,color:'#fff0dc'},
  {id:'phone',x:-11.9+5.4*.22,z:-24.05,color:'#ffefdc'},
  {id:'drinks',x:-6.6+5.2*.22,z:-24.05,color:'#ffddba'},
  {id:'estate',x:6.6+5.2*.22,z:-24.05,color:'#ffe7ca'},
  {id:'barber',x:12.2+5.8*.22,z:-24.05,color:'#ffead0'},
  {id:'rechao',x:18.6+6.7*.22,z:-24.05,color:'#ffd5a6'},
  {id:'bakery',x:25.2+5.5*.22,z:-24.05,color:'#ffd8ae'},
  {id:'lottery',x:-6.7,z:-48.6,color:'#fff0c7'},
  {id:'drugstore',x:6.7,z:-48.6,color:'#f2f7f3',power:1.35},
  {id:'supermarket',x:6.7,z:-60.4,color:'#eef5f0',power:1.35},
  {id:'hilife',x:-6.7,z:-60.4,color:'#fff3e2',power:1.3},
  {id:'ok',x:-6.7,z:-72.2,color:'#ffeee4',power:1.3},
  {id:'familymart',x:6.7,z:-72.2,color:'#eef7f2',power:1.3},
];

const SNAP_DISTANCE=1.25;
const HYSTERESIS_METRES=1;

export function createRetailLighting(root){
  const slots=Array.from({length:2},()=>{
    const light=new THREE.PointLight('#ffead0',0,4.7,2);
    light.name='Shared shop light';light.castShadow=false;
    light.userData.retailPooled=true;root.add(light);
    const bounce=new THREE.PointLight('#ffead0',0,3.3,2);
    bounce.name='Shared shop work-surface bounce';bounce.castShadow=false;
    bounce.userData.retailPooled=true;root.add(bounce);
    return {light,bounce,shop:null,level:0};
  });
  let evening=false,lastPosition=null,lastUpdateKind='uninitialised';

  function place(slot,shop){
    slot.shop=shop;
    if(!shop)return;
    slot.light.position.set(shop.x,2.60,shop.z);
    slot.light.color.set(shop.color);
    slot.bounce.position.set(shop.x,1.15,shop.z);
    slot.bounce.color.set(shop.color);
  }
  function applyPower(){
    for(const slot of slots){
      const power=slot.shop?.power??1;
      slot.light.intensity=slot.level*(evening?7.8:5.2)*power;
      slot.bounce.intensity=slot.level*(evening?1.8:1.0)*power;
    }
  }
  function setTime(mode){
    evening=mode==='evening';
    applyPower();
  }
  function update(camera,dt){
    const p=camera?.position;
    if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.z))return;
    const t=Math.min(Math.max(dt||0,0),.25);
    const distance=s=>Math.hypot(p.x-s.x,p.z-s.z);
    const first=lastPosition===null;
    const jumped=first||Math.hypot(p.x-lastPosition.x,p.z-lastPosition.z)>=SNAP_DISTANCE;
    lastPosition={x:p.x,z:p.z};

    if(jumped){
      // No fade/history survives a discontinuous viewpoint change. Keep the
      // same light budget and powers, including at dt=0 on the first frame.
      const wanted=shops.filter(s=>distance(s)<9).sort((a,b)=>distance(a)-distance(b)).slice(0,2);
      slots.forEach((slot,i)=>{
        place(slot,wanted[i]??null);
        slot.level=slot.shop?1:0;
      });
      lastUpdateKind=first?'initial':'snap';
      applyPower();
      return;
    }

    const assigned=new Set(slots.map(slot=>slot.shop).filter(Boolean));
    const score=s=>distance(s)-(assigned.has(s)?HYSTERESIS_METRES:0);
    // One bounded ranking replaces a loose per-slot retention rule. A nearer
    // incoming shop cannot remain excluded forever by two retained outsiders.
    const wanted=shops
      .filter(s=>distance(s)<(assigned.has(s)?9.5:9))
      .sort((a,b)=>score(a)-score(b))
      .slice(0,2);
    for(const slot of slots){
      const retained=slot.shop&&wanted.includes(slot.shop);
      const target=retained?1:0;
      slot.level+=Math.max(-t*1.8,Math.min(t*1.8,target-slot.level));
      if(!retained&&slot.level<=.001){slot.level=0;slot.shop=null;}
    }
    for(const slot of slots){
      if(slot.shop)continue;
      const next=wanted.find(shop=>!slots.some(other=>other.shop===shop));
      if(next)place(slot,next); // Remains dark at level 0 until the next fade step.
    }
    lastUpdateKind='walk';
    applyPower();
  }
  function getSnapshot(){
    return {
      mode:evening?'evening':'day',lastUpdateKind,
      slots:slots.map(slot=>({
        id:slot.shop?.id??null,level:slot.level,
        position:{x:slot.light.position.x,y:slot.light.position.y,z:slot.light.position.z},
        primaryIntensity:slot.light.intensity,bounceIntensity:slot.bounce.intensity,
      })),
    };
  }
  return {setTime,update,getSnapshot};
}
