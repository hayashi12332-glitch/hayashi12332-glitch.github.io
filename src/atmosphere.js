import * as THREE from 'three';

// Original low-cost vapour for the hot tea-egg pot and the stall's covered pot.
// Six reusable emitters cap draw calls even when users place many hot objects.
export function createAtmosphere(scene) {
  const canvas=document.createElement('canvas');canvas.width=64;canvas.height=64;
  const ctx=canvas.getContext('2d');
  const glow=ctx.createRadialGradient(32,32,0,32,32,30);
  glow.addColorStop(0,'rgba(255,255,255,.65)');
  glow.addColorStop(.35,'rgba(255,255,255,.30)');
  glow.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=glow;ctx.fillRect(0,0,64,64);
  const texture=new THREE.CanvasTexture(canvas);
  const sources=new Map();
  const slots=Array.from({length:6},()=>{
    const group=new THREE.Group();group.name='Warm food vapour';group.visible=false;
    for(let i=0;i<7;i++){
      const material=new THREE.SpriteMaterial({map:texture,color:0xf0eee6,transparent:true,opacity:0,depthWrite:false,depthTest:true});
      const puff=new THREE.Sprite(material);puff.userData.phase=i/7;group.add(puff);
    }
    scene.add(group);return {group,id:null};
  });
  let elapsed=0;
  function emitterPosition(record,out){
    // The editable GLBs use local Y-up, with the stall's covered stockpot
    // at local x=-.53,z=0,y=1.37. Rotation is the same Y rotation as its GLB.
    if(record.kind==='stall'){
      const c=Math.cos(record.rotation),s=Math.sin(record.rotation);
      out.set(record.x-.53*c,record.y+1.37,record.z+.53*s);
    }else out.set(record.x,record.y+.35,record.z);
    return out;
  }
  function sync(records){
    const seen=new Set();
    for(const record of records){
      if(record.kind!=='teaEgg'&&record.kind!=='stall')continue;
      seen.add(record.id);
      // Keep the live record reference: edit dragging changes it before persist.
      sources.set(record.id,record);
    }
    for(const id of sources.keys())if(!seen.has(id))sources.delete(id);
    for(const slot of slots)if(slot.id){
      const record=sources.get(slot.id);
      if(!record){slot.id=null;slot.group.visible=false;}
      else emitterPosition(record,slot.group.position);
    }
  }
  const position=new THREE.Vector3();
  function update(dt,camera,flow={x:0,z:0}){
    elapsed+=Math.max(0,Math.min(Number(dt)||0,.25));
    if(!camera?.position)return;
    const candidates=[];
    for(const [id,record] of sources){
      const distance=emitterPosition(record,position).distanceTo(camera.position);
      if(distance<25)candidates.push({id,record,distance});
    }
    candidates.sort((a,b)=>a.distance-b.distance||a.id.localeCompare(b.id));
    candidates.length=Math.min(candidates.length,slots.length);
    const chosen=new Map(candidates.map(c=>[c.id,c]));
    for(const slot of slots)if(slot.id&&!chosen.has(slot.id)){slot.id=null;slot.group.visible=false;}
    for(const candidate of candidates){
      let slot=slots.find(s=>s.id===candidate.id);
      if(!slot){slot=slots.find(s=>s.id===null);if(!slot)continue;slot.id=candidate.id;}
      const {group}=slot,{record,distance}=candidate;
      group.visible=true;emitterPosition(record,group.position);
      const stall=record.kind==='stall',rise=stall?.72:.88,alpha=stall?.24:.30;
      const fade=THREE.MathUtils.clamp((25-distance)/5,0,1);
      const windX=THREE.MathUtils.clamp(Number(flow?.x)||0,-1,1),windZ=THREE.MathUtils.clamp(Number(flow?.z)||0,-1,1);
      for(const puff of group.children){
        const t=(elapsed*(stall?.15:.18)+puff.userData.phase)%1;
        const angle=t*4+puff.userData.phase*6;
        const wander=.025+t*.045,drift=t*t*(stall?1.1:1.5);
        puff.position.set(Math.sin(angle)*wander+windX*drift,t*rise,Math.cos(angle)*wander*.6+windZ*drift);
        const size=(stall?.07:.09)+t*(stall?.18:.25);
        puff.scale.set(size,size,1);
        puff.material.opacity=Math.pow(Math.sin(t*Math.PI),1.2)*alpha*fade;
        puff.material.rotation=t*.65;
      }
    }
  }
  function dispose(){
    for(const {group} of slots){scene.remove(group);group.children.forEach(p=>p.material.dispose());}
    texture.dispose();sources.clear();
  }
  // Read-only diagnostics: bounded to the six active emitters. The original
  // record values are included so an editor test can check live drag/rotation.
  function getSnapshot(){
    const active=[];
    for(const slot of slots){
      if(!slot.id||!slot.group.visible)continue;
      const record=sources.get(slot.id);if(!record)continue;
      const puff=slot.group.children.reduce((best,current)=>
        current.material.opacity>best.material.opacity?current:best);
      const emitter=slot.group.getWorldPosition(new THREE.Vector3());
      const puffWorld=puff.getWorldPosition(new THREE.Vector3());
      active.push({id:slot.id,kind:record.kind,
        recordPosition:[record.x,record.y,record.z],rotation:record.rotation,
        emitterPosition:emitter.toArray(),puffPosition:puffWorld.toArray(),opacity:puff.material.opacity});
    }
    return {sourceCount:sources.size,active};
  }
  return {sync,update,dispose,getSnapshot};
}
