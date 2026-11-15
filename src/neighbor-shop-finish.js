import * as THREE from 'three';
import {SIGN_FONT} from './typography.js';

// Original fittings for the occupied dry-goods and noodle shops. The caller
// keeps the existing counter, service doorway, trade signs and all colliders.
// Units are metres; the existing counter's top is 1.065m. This replaces the
// old merchandise branch instead of layering over its boxes and stock pots.
let shapes;
const prints=new Map();
function geometry(){
  if(shapes)return shapes;
  shapes={
    ball:new THREE.SphereGeometry(1,12,8),
    cap:new THREE.SphereGeometry(1,20,8,0,Math.PI*2,0,Math.PI/2),
    openPot:new THREE.CylinderGeometry(1,.94,1,28,1,true),
    ring:new THREE.TorusGeometry(1,.035,6,28),
    bowl:new THREE.LatheGeometry([[0,0],[.055,0],[.065,.007],[.076,.02],[.099,.048],[.117,.073],[.119,.080],[.113,.083],[.108,.071],[.091,.050],[.071,.032],[.056,.027],[0,.027]].map(p=>new THREE.Vector2(...p)),24),
    plane:new THREE.PlaneGeometry(1,1),
    bulk:bulkGeometry(),
  };
  return shapes;
}
// Original small-scale bulk relief: lower overlapping contents remain a
// shallow irregular mound rather than a large colour-matched flat board.
function bulkHeight(u,v){return .004+.017*(1-(2*u-1)**2)*(1-(2*v-1)**2)+.002*Math.sin(u*21+v*17);}
function bulkGeometry(){
  const g=new THREE.PlaneGeometry(1,1,16,8);g.rotateX(-Math.PI/2);
  const p=g.attributes.position;
  for(let i=0;i<p.count;i++)p.setY(i,bulkHeight(p.getX(i)+.5,p.getZ(i)+.5));
  g.computeVertexNormals();return g;
}
const bulkMaterials=new Map();
function bulkMaterial(kind){
  if(bulkMaterials.has(kind))return bulkMaterials.get(kind);
  let seed=7919+kind*7919;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const c=document.createElement('canvas'),h=document.createElement('canvas');c.width=h.width=256;c.height=h.height=128;
  const q=c.getContext('2d'),r=h.getContext('2d');
  const palettes=[['#532c25','#753a2c','#8b4837'],['#67513c','#85705a','#a28a6c'],['#765238','#a07850','#b08b5d'],['#81432c','#ab5634','#c06840']];
  q.fillStyle=palettes[kind][0];q.fillRect(0,0,256,128);r.fillStyle='#555';r.fillRect(0,0,256,128);
  for(let i=0;i<(kind===3?710:290);i++){
    const x=rnd()*256,y=rnd()*128,rx=(kind===3?1.3:kind===1?4.8:3.7)*(0.8+rnd()*.4),ry=(kind===3?4.2:kind===0?5.8:3.5)*(0.8+rnd()*.4),a=rnd()*Math.PI;
    q.save();r.save();q.translate(x,y);r.translate(x,y);q.rotate(a);r.rotate(a);
    q.fillStyle=palettes[kind][1+i%2];q.beginPath();q.ellipse(0,0,rx,ry,0,0,Math.PI*2);q.fill();
    q.strokeStyle=palettes[kind][0];q.lineWidth=.7;q.beginPath();q.moveTo(-rx*.2,-ry*.65);q.quadraticCurveTo(rx*.35,0,-rx*.1,ry*.6);q.stroke();
    r.fillStyle='#aaa';r.beginPath();r.ellipse(0,0,rx*.87,ry*.87,0,0,Math.PI*2);r.fill();q.restore();r.restore();
  }
  const map=new THREE.CanvasTexture(c),bumpMap=new THREE.CanvasTexture(h);map.colorSpace=THREE.SRGBColorSpace;map.name='Dry-goods original overlapping bulk '+kind;bumpMap.name='Dry-goods original small relief '+kind;
  const m=new THREE.MeshStandardMaterial({map,bumpMap,bumpScale:.0025,roughness:.88});m.name='Dry-goods original lower bulk '+kind;bulkMaterials.set(kind,m);return m;
}
function print(title,detail=''){
  const key=title+'|'+detail;
  if(prints.has(key))return prints.get(key);
  const canvas=document.createElement('canvas');canvas.width=384;canvas.height=192;
  const q=canvas.getContext('2d');q.fillStyle='#ede3c9';q.fillRect(0,0,384,192);
  q.strokeStyle='#89704c';q.lineWidth=3;q.strokeRect(5,5,374,182);
  q.textAlign='center';q.textBaseline='middle';q.fillStyle='#374a3b';
  q.font=`700 ${detail?60:70}px ${SIGN_FONT}`;q.fillText(title,192,detail?70:96,350);
  if(detail){q.font=`500 31px ${SIGN_FONT}`;q.fillText(detail,192,140,350);}
  const map=new THREE.CanvasTexture(canvas);map.name='Neighbor print '+key;map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;
  const m=new THREE.MeshStandardMaterial({map,roughness:.9});m.name='Neighbor label '+key;
  prints.set(key,m);return m;
}
let contactMaterial;
function contact(){
  if(contactMaterial)return contactMaterial;
  const c=document.createElement('canvas');c.width=c.height=64;const q=c.getContext('2d');
  const g=q.createRadialGradient(32,32,2,32,32,31);
  g.addColorStop(0,'rgba(33,30,22,.20)');g.addColorStop(.62,'rgba(33,30,22,.10)');g.addColorStop(1,'rgba(33,30,22,0)');
  q.fillStyle=g;q.fillRect(0,0,64,64);
  const map=new THREE.CanvasTexture(c);map.name='Neighbor small supported contact';map.colorSpace=THREE.SRGBColorSpace;
  contactMaterial=new THREE.MeshBasicMaterial({map,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
  contactMaterial.name='Neighbor local contact approximation';return contactMaterial;
}

export function addNeighborShopFinish(kind,api){
  if(kind!=='dry'&&kind!=='food')return {kind,features:[]};
  const {width,shopFront,shopBack,displayX,displayWidth,b,round,face,mat,mesh}=api;
  if(typeof mesh!=='function')throw new Error('Neighbor shop finish requires local mesh adapter');
  const g=geometry();
  const draw=(geo,material,x,y,z,sx,sy=sx,sz=sx,rotation=[0,0,0])=>mesh(geo,material,x,y,z,rotation,[sx,sy,sz]);
  const M={
    wood:mat('neighbor dry tray wood','#a68559',{roughness:.78}),
    darkWood:mat('neighbor dry tray inset wood','#6b5238',{roughness:.88}),
    paper:mat('neighbor sealed kraft paper','#b99c70',{roughness:.94}),
    fold:mat('neighbor kraft folded paper','#9c8159',{roughness:.97}),
    jujube:mat('neighbor jujube dried fruit','#6c3329',{roughness:.76}),
    jujubeLight:mat('neighbor jujube side dried fruit','#824337',{roughness:.8}),
    mushroom:mat('neighbor dried mushroom cap','#786048',{roughness:.91}),
    underside:mat('neighbor dried mushroom underside','#bdad87',{roughness:.96}),
    longan:mat('neighbor longan shell','#9b724b',{roughness:.92}),
    goji:mat('neighbor dried goji','#b35b36',{roughness:.84}),
    steel:mat('neighbor food brushed steel','#b6bfb8',{roughness:.34,metalness:.72}),
    steelDull:mat('neighbor food satin steel','#929d96',{roughness:.45,metalness:.68}),
    innerSteel:mat('neighbor food inner steel','#7b867a',{roughness:.4,metalness:.65,side:THREE.BackSide}),
    ladleSteel:mat('neighbor food ladle steel','#aab5ac',{roughness:.38,metalness:.70,side:THREE.DoubleSide}),
    rubber:mat('neighbor food rubber grip','#2f3732',{roughness:.84}),
    ceramic:mat('neighbor glazed ceramic','#e4e7d9',{roughness:.25}),
    bowlBand:mat('neighbor ceramic blue line','#536d75',{roughness:.27}),
    soup:mat('neighbor warm broth','#796a40',{roughness:.30}),
    stock:mat('neighbor dark braising stock','#4a3526',{roughness:.28}),
  };
  const top=1.065,z=shopFront-.40;
  // Recessed plinth closes the existing body's .21m underside to the .14m
  // floor. Its setback preserves the counter silhouette and existing hit.
  b(kind==='dry'?M.darkWood:M.rubber,displayX,.175,z,displayWidth-.10,.07,.50);
  function smallContact(x,y,z,w,d){draw(g.plane,contact(),x,y+.0005,z,w,d,1,[-Math.PI/2,0,0]);}
  function label(title,detail,x,y,z,w=.23,h=.115){face('plane',print(title,detail),x,y,z,w,h);}
  if(kind==='dry'){
    const trayWidth=Math.min(.84,(displayWidth-.23)/4),gap=.07;
    const run=4*trayWidth+3*gap,start=displayX-run/2+trayWidth/2;
    const keys=['紅棗','香菇','桂圓','枸杞'];
    for(let tray=0;tray<4;tray++){
      const x=start+tray*(trayWidth+gap),d=.47,baseY=top+.012,h=.075;
      smallContact(x,top,z,trayWidth+.01,d+.01);
      b(M.darkWood,x,baseY,z,trayWidth,.024,d);
      for(const side of [-1,1]){
        b(M.wood,x+side*(trayWidth/2-.010),top+h/2,z,.020,h,d);
        b(M.wood,x,top+h/2,z+side*(d/2-.010),trayWidth-.024,h,.020);
      }
      // Contents rest just above the tray bottom. Different botanical shapes
      // replace the previous identical pebble layer on four deep cubes.
      const surface=top+.026;
      draw(g.bulk,bulkMaterial(tray),x,surface,z,trayWidth-.072,1,d-.064);
      let seed=4787+tray*787;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
      const count=[62,46,64,76][tray];
      for(let i=0;i<count;i++){
        const u=rnd(),v=rnd();
        // Only the far right corner of the final bin is partly sold through.
        if(tray===3&&u>.78&&v>.70)continue;
        const dx=(u-.5)*(trayWidth-.13),dz=(v-.5)*.34;
        const yy=surface+bulkHeight(u,v),a=rnd()*Math.PI,size=.89+rnd()*.22;
        if(tray===0){
          draw(g.ball,i%4===0?M.jujubeLight:M.jujube,x+dx,yy+.012,z+dz,.016*size,.012*size,.027*size,[0,a,0]);
        }else if(tray===1){
          const radius=.024*size;
          round(M.underside,x+dx,yy+.006,z+dz,.007,.012);
          draw(g.cap,M.mushroom,x+dx,yy+.010,z+dz,radius,.014*size,radius);
          round(M.underside,x+dx,yy+.010,z+dz,radius*.88,.002);
        }else if(tray===2){
          draw(g.ball,M.longan,x+dx,yy+.014,z+dz,.015*size,.014*size,.016*size,[0,a,0]);
        }else{
          draw(g.ball,M.goji,x+dx,yy+.006,z+dz,.0055*size,.004*size,.015*size,[0,a,0]);
        }
      }
      const details=['100元／台斤','乾燥保存','乾燥保存','乾燥保存'];
      label(keys[tray],details[tray],x,top+.066,z+d/2+.002,trayWidth*.62,.108);
    }
    // A short rear stock shelf is entirely to the right of the real service
    // opening, and lower than its operating-hours notice. Three bag groups
    // explain replenishment without carpeting the rear wall with boxes.
    const left=-width/2+1.64,right=width/2-.30,shelfWidth=right-left,cx=(left+right)/2;
    const shelfZ=shopBack+.28,shelfTop=1.62;
    b(M.wood,cx,shelfTop-.022,shelfZ,shelfWidth,.044,.42);
    for(const dx of [-shelfWidth/2+.10,shelfWidth/2-.10]){
      b(M.darkWood,cx+dx,(.14+shelfTop)/2,shelfZ-.10,.045,shelfTop-.14,.045);
      b(M.wood,cx+dx,shelfTop-.10,shelfZ+.04,.045,.20,.35);
    }
    const bagKinds=['香菇','桂圓','枸杞'];
    for(let group=0;group<3;group++)for(let i=0;i<3;i++){
      const x=left+.20+group*(shelfWidth-.4)/3+i*.155,bodyH=.235+(group===0?.025:0);
      const zz=shelfZ+(i===2?-.07:.045);
      b(M.paper,x,shelfTop+bodyH/2,zz,.135,bodyH,.10);
      b(M.fold,x,shelfTop+bodyH+.008,zz,.138,.016,.095);
      b(M.fold,x-.055,shelfTop+.10,zz+.052,.010,.16,.003);
      label(bagKinds[group],'乾燥保存',x,shelfTop+bodyH*.51,zz+.051,.112,.085);
      smallContact(x,shelfTop,zz,.14,.105);
    }
    // Clean upper edge with two narrow handling marks, not general dirt.
    const used=mat('neighbor counter handled wood','#a58b62',{roughness:.65});
    for(const dx of [-.55,.80])b(used,displayX+dx,1.025,shopFront-.067,.28,.008,.006);
    return {kind,features:['four shallow supported dry-goods trays','distinct dried fruit and mushroom silhouettes','three sealed-bag rear stock groups','local counter contact marks'],printedKinds:keys};
  }

  // Three deliberately different stockpots share side/rim/lid geometry. The
  // bottoms meet the existing counter; visible mouths have genuine side
  // walls and a lower contents disc, not an opaque circle over a solid tube.
  for(const [i,x,r,h,covered] of [[0,-.30,.205,.23,true],[1,.48,.185,.20,false],[2,1.20,.165,.265,true]]){
    const y=top+h/2+.012;
    smallContact(x,top,z,r*2+.025,r*2+.025);
    round(M.steelDull,x,top+.006,z,r*.95,.012);
    draw(g.openPot,M.steel,x,y,z,r,h,r);
    // An inner dark wall keeps the open pot readable from above without
    // relying on a double-sided outer wall or a fake black mouth rectangle.
    if(!covered){
      draw(g.openPot,M.innerSteel,x,y,z,r-.004,h,r-.004);
      round(i===1?M.stock:M.soup,x,top+h-.024,z,r-.010,.005);
    }
    draw(g.ring,M.steel,x,top+h+.012,z,r,r,r,[Math.PI/2,0,0]);
    for(const side of [-1,1]){
      // The two-piece handles attach directly at the sides of the pot.
      const hx=x+side*(r+.041);
      b(M.steel,hx,top+h*.65,z-.045,.085,.020,.017);
      b(M.steel,hx,top+h*.65,z+.045,.085,.020,.017);
      b(M.rubber,x+side*(r+.079),top+h*.65,z,.027,.037,.12);
    }
    if(covered){
      draw(g.cap,M.steelDull,x,top+h+.015,z,r-.006,.032,r-.006);
      draw(g.ring,M.steel,x,top+h+.017,z,r-.008,r-.008,r-.008,[Math.PI/2,0,0]);
      for(const side of [-1,1])b(M.steel,x+side*.027,top+h+.059,z,.015,.025,.018);
      b(M.rubber,x,top+h+.074,z,.085,.025,.033);
    }
  }
  // A small rear prep surface replaces floating bowls and the previous plain
  // grey appliance. Its top supports tableware; three front seams and a pull
  // distinguish a maintained cabinet from a single flat mysterious box.
  const px=width*.31,pz=shopBack+.38;
  b(M.steelDull,px,1.57,pz,.80,.65,.46);
  b(M.rubber,px,1.57,pz+.236,.64,.46,.018);
  b(M.steel,px,1.57,pz+.248,.57,.39,.016);
  b(M.rubber,px,1.80,pz+.265,.24,.025,.028);
  for(const x of [px-.29,px+.29])for(const y of [1.33,1.81])b(M.steelDull,x,y,pz+.260,.025,.025,.012);
  // Four tubular feet carry the existing rear appliance enclosure to floor.
  for(const dx of [-.32,.32])for(const dz of [-.17,.17]){
    b(M.steelDull,px+dx,(.14+1.245)/2,pz+dz,.035,1.245-.14,.035);
    b(M.rubber,px+dx,.150,pz+dz,.045,.020,.045);
  }
  b(M.steel,px,1.918,pz,.86,.046,.51);
  for(const dx of [-.31,.31])b(M.steelDull,px+dx,1.985,pz-.20,.022,.10,.022);
  b(M.steelDull,px,2.035,pz-.20,.64,.025,.025);
  // Lower open shelf supports nested ceramic bowls behind the sales counter.
  const bx=.36,bz=shopBack+.40,by=1.155;
  b(M.steelDull,bx,by-.024,bz,1.22,.048,.48);
  for(const x of [bx-.53,bx+.53])b(M.steelDull,x,(.14+by)/2,bz-.15,.035,by-.14,.035);
  for(const dx of [-.35,0,.35]){
    for(let i=0;i<3;i++){
      const y=by+i*.033;
      draw(g.bowl,M.ceramic,bx+dx,y,bz,1,1,1);
      draw(g.ring,M.bowlBand,bx+dx,y+.080,bz,.117,.117,.117,[Math.PI/2,0,0]);
    }
    smallContact(bx+dx,by,bz,.16,.16);
  }
  // Rail fixed to the existing backing, retaining both the closed passage
  // door and all operating-hours/arcade signs above it.
  b(M.steel,-.55,2.13,shopBack+.11,1.20,.028,.040);
  for(const [i,lx] of [-.98,-.65,-.32].entries()){
    b(M.rubber,lx,2.10,shopBack+.135,.042,.042,.035);
    b(M.steel,lx,1.96,shopBack+.14,.018,.30,.018);
    if(i===1){
      // Rounded ladle bowl with a shallow dark well.
      draw(g.cap,M.ladleSteel,lx,1.79,shopBack+.155,.048,.025,.048,[-Math.PI/2,0,0]);
      draw(g.ring,M.steel,lx,1.79,shopBack+.155,.048,.048,.048);
    }else{
      b(M.steel,lx,1.785,shopBack+.14,.075,.065,.018);
      if(i===0)for(const dx of [-.020,0,.020])b(M.rubber,lx+dx,1.785,shopBack+.151,.006,.035,.003);
    }
  }
  return {kind,features:['supported stockpots with real sidewalls and rims','two fitted lids and one open stock pot','nested ceramic tableware on a supported shelf','small rear stainless cabinet and attached utensils']};
}
