import * as THREE from 'three';

// Shared, deterministic crust texture: small toasted flecks and broken,
// irregular cracks, rather than identical straight stripes on every bun.
// This is generated locally and remains a single instanced material.
let breadCrustMap, breadCrumbMap;
function getBreadCrustMap(){
  if(breadCrustMap)return breadCrustMap;
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
  const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(256,256);
  let state=1937;
  const rand=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
  for(let y=0;y<256;y++)for(let x=0;x<256;x++){
    const broad=Math.sin(x*.061+y*.032)*Math.cos(y*.049-x*.021);
    const fine=(rand()-.5)*15;
    const v=Math.max(0,Math.min(255,236+broad*8+fine));
    const i=(y*256+x)*4;
    pixels.data[i]=v;pixels.data[i+1]=v;pixels.data[i+2]=v;pixels.data[i+3]=255;
  }
  ctx.putImageData(pixels,0,0);
  ctx.strokeStyle='rgba(104,75,48,.32)';ctx.lineWidth=1.7;
  for(let i=0;i<65;i++){
    const x=rand()*256,y=rand()*256,dx=4+rand()*12,dy=(rand()-.5)*12;
    ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+dx*.45,y+dy*.25);ctx.lineTo(x+dx,y+dy);ctx.stroke();
  }
  breadCrustMap=new THREE.CanvasTexture(canvas);breadCrustMap.colorSpace=THREE.SRGBColorSpace;
  breadCrustMap.anisotropy=4;breadCrustMap.name='Original baked crust flecks';
  return breadCrustMap;
}
function getBreadCrumbMap(){
  if(breadCrumbMap)return breadCrumbMap;
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
  const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(128,128);
  let state=6119;
  for(let y=0;y<128;y++)for(let x=0;x<128;x++){
    state=(Math.imul(state,1664525)+1013904223)>>>0;
    const r=state/4294967296,v=239+(r-.5)*12-(r<.018?18:0);
    const i=(y*128+x)*4;pixels.data[i]=v;pixels.data[i+1]=v;pixels.data[i+2]=v;pixels.data[i+3]=255;
  }
  ctx.putImageData(pixels,0,0);breadCrumbMap=new THREE.CanvasTexture(canvas);
  breadCrumbMap.colorSpace=THREE.SRGBColorSpace;breadCrumbMap.anisotropy=4;
  breadCrumbMap.name='Original pale bread crumb';return breadCrumbMap;
}

// Original, compact food-shop fittings. Coordinates are local to the shophouse;
// the left entrance remains a continuous clear aisle through every layout.
export function furnishFood(type, api) {
  const {width, front, back, b, c, s, label, hit, m}=api;
  const steel=m('business steel','#a0a8a8',{metalness:.68,roughness:.4});
  const ivory=m('business ivory','#e1dccf');
  const charcoal=m('business charcoal','#323d40');
  const wood=m('business wood','#9c7654');
  const red=m('business red','#a94938');
  const teal=m('business teal','#367c7a');
  const porcelain=m('glazed tableware','#e9e5d6',{roughness:.23});
  const green=m('business food green','#608044');
  const sauce=m('business food sauce','#8c4b30',{roughness:.58});
  const beans=m('business cooked beans','#91a75a',{roughness:.44});
  const crust=m('business bread crust','#e2a65f',{roughness:.82});
  const crumb=m('business bread crumb','#f0d29b',{roughness:.9});
  if(!crust.map){crust.map=getBreadCrustMap();crust.needsUpdate=true;}
  if(!crumb.map){crumb.map=getBreadCrumbMap();crumb.needsUpdate=true;}
  const glass=m('business display glass','#cce0dc',{transparent:true,opacity:.15,depthWrite:false,roughness:.12});
  const darkGlass=m('business appliance glass','#273c3d',{roughness:.16,metalness:.18});
  const fixed=(material,x,y,z,w,h,d)=>{b(material,x,y,z,w,h,d);hit(x,y,z,w,h,d);};
  const legs=(x,z,w,d,top)=>{
    for(const dx of [-1,1])for(const dz of [-1,1])c(steel,x+dx*(w/2-.10),(.14+top)/2,z+dz*(d/2-.10),.026,top-.14);
  };
  const stool=(x,z)=>{
    c(red,x,.59,z,.175,.065);
    for(const dx of [-1,1])for(const dz of [-1,1])c(steel,x+dx*.105,.36,z+dz*.105,.018,.44);
    hit(x,.37,z,.34,.47,.34);
  };
  const bottle=(x,y,z)=>{
    c(teal,x,y+.11,z,.043,.20);
    s(teal,x,y+.21,z,.043,.045,.043);
    c(teal,x,y+.264,z,.020,.075);c(ivory,x,y+.306,z,.023,.012);
    b(ivory,x,y+.115,z+.044,.056,.078,.006);
  };
  const cup=(x,y,z)=>{
    c(ivory,x,y+.105,z,.058,.20);c(porcelain,x,y+.207,z,.065,.016);
    c(ivory,x,y+.216,z,.048,.004);
    b(teal,x,y+.10,z+.060,.066,.075,.008);
  };
  const hangingBoard=(x,y,z,w,h)=>{
    b(wood,x,y,z-.025,w+.035,h+.035,.045);
    for(const side of [-1,1]){
      const top=y+h/2;
      c(steel,x+side*w*.36,(top+3.03)/2,z-.025,.008,3.03-top);
    }
  };
  if(type==='rechao') {
    // Two shared round tables, each set with small bowls and serving plates.
    for(const x of [.05,2.05]){
      c(wood,x,.92,1.61,.55,.075);c(steel,x,.535,1.61,.075,.70);
      c(charcoal,x,.20,1.61,.31,.07);hit(x,.56,1.61,1.1,.84,1.1);
      for(const [dx,dz] of [[-.72,0],[.72,0],[0,-.72],[0,.72]])stool(x+dx,1.61+dz);
      c(porcelain,x-.12,.969,1.56,.21,.028);
      // A stir-fry of long beans, meat and small pieces of chilli. Pieces
      // lie on the plate and overlap like served food, with orientations and
      // sizes varied instead of five identical coloured balls.
      const dishX=x-.12,dishZ=1.56,mirror=x<1?1:-1;
      for(const [dx,dz,length,turn] of [[-.08,-.04,.14,.5],[-.06,.025,.12,-.8],
        [0,-.055,.13,.9],[.015,.018,.11,-.3],[.067,-.005,.12,.6],
        [.07,.058,.10,-1.0],[-.082,.07,.085,.2],[-.12,-.04,.09,-.5],
        [.12,-.02,.10,.6],[0,.09,.11,-.8],[-.10,-.10,.085,-.3]]){
        c(beans,dishX+dx*mirror,.994,dishZ+dz,.010,length,Math.PI/2,turn*mirror);
      }
      for(const [dx,dz] of [[-.07,-.075],[.02,-.012],[.10,.025],[-.025,.073],[-.095,.045],[.045,.085]])
        s(sauce,dishX+dx*mirror,.997,dishZ+dz,.030,.013,.021);
      for(const [dx,dz,turn] of [[-.105,.015,.2],[.055,-.075,-.4],[.04,.073,.8],[-.04,-.105,-.6]])
        b(red,dishX+dx*mirror,.995,dishZ+dz,.028,.020,.018,turn*mirror);
      c(porcelain,x+.23,.97,1.79,.125,.022);
      for(const [dx,dz] of [[-.24,.31],[.30,-.29]]){
        // Layered foot, body and lip make a ceramic rice bowl readable
        // from the aisle without extra draw calls for individual meshes.
        c(porcelain,x+dx,.967,1.61+dz,.042,.018);
        s(porcelain,x+dx,1.008,1.61+dz,.075,.052,.075);
        c(porcelain,x+dx,1.045,1.61+dz,.075,.012);
        c(ivory,x+dx,1.052,1.61+dz,.060,.004);
        for(const offset of [-.015,.015])b(wood,x+dx+.11,1.003,1.61+dz+offset,.20,.008,.008,-.2);
      }
      b(charcoal,x+.30,1.03,1.37,.12,.15,.09);
    }
    // Cooking line, low tiled splashback and a real projecting extraction hood.
    fixed(steel,.85,.61,back+.53,2.95,.94,.66);
    b(steel,.85,1.10,back+.53,3.04,.045,.72);
    b(ivory,.85,1.52,back+.18,3.04,.77,.045);
    for(let i=0;i<10;i++)b(steel,-.58+i*.31,1.52,back+.208,.009,.77,.006);
    for(const y of [1.32,1.57,1.82])b(steel,.85,y,back+.21,3.04,.009,.006);
    // Low curved wok nested over the burner with a contrasting rim and food.
    // It stays on the existing cooking counter and does not affect collision.
    c(charcoal,.38,1.145,back+.55,.30,.07);
    s(charcoal,.38,1.175,back+.55,.30,.105,.30);
    c(steel,.38,1.228,back+.55,.303,.018);
    c(charcoal,.38,1.238,back+.55,.277,.006);
    for(let i=0;i<8;i++)s(i%3===0?green:i%3===1?crust:sauce,.20+i*.05,1.254,back+.55+(i%2)*.065,.034,.018,.026);
    for(const x of [.15,.60])c(steel,x,1.238,back+.55,.010,.012);
    b(charcoal,.84,1.22,back+.55,.36,.045,.045);
    c(steel,1.63,1.28,back+.53,.20,.32);c(charcoal,1.63,1.445,back+.53,.21,.02);
    b(steel,.85,2.35,back+.63,3.05,.20,.98);
    b(charcoal,.85,2.24,back+.72,2.8,.028,.65);
    b(steel,.85,2.69,back+.40,.52,.52,.40);
    // A narrow bottle fridge sits to the left of the doorway's clear route.
    const fridgeX=-width/2+.59;
    fixed(ivory,fridgeX,1.12,.04,.65,1.96,.65);
    b(charcoal,fridgeX,1.16,.375,.56,1.67,.025);
    for(const y of [.39,.91,1.43]){
      b(steel,fridgeX,y,.44,.54,.035,.12);
      for(let i=0;i<3;i++)bottle(fridgeX-.17+i*.17,y+.025,.43);
    }
    b(glass,fridgeX,1.16,.505,.54,1.67,.012);
    b(steel,fridgeX+.23,1.12,.53,.025,.48,.035);
    label({text:'冷飲',x:fridgeX,y:2.02,z:.38,width:.52,height:.18,bg:'#367c7a'});
    hangingBoard(-.15,2.52,front-.20,1.46,.64);
    hangingBoard(2.06,2.52,front-.20,1.22,.35);
    label({text:'蔥爆牛肉 180',detail:'宮保雞丁 160',note:'炒青菜 100',x:-.15,y:2.52,z:front-.20,width:1.46,height:.64,bg:'#f0e4cc',fg:'#743827'});
    label({text:'內用・外帶',x:2.06,y:2.52,z:front-.20,width:1.22,height:.35,bg:'#9c4536'});
    return {features:['round dining tables','shared dishes','wok and extraction hood','bottle refrigerator']};
  }
  if(type==='drinks') {
    fixed(wood,.78,.63,front-.65,2.52,.98,.66);
    b(steel,.78,1.14,front-.65,2.60,.055,.72);
    b(teal,.78,.76,front-.304,2.48,.55,.025);
    fixed(ivory,.78,.64,back+.50,2.52,1.0,.56);
    b(steel,.78,1.16,back+.50,2.62,.045,.64);
    // Tea urns with lids, handles, taps and short labels.
    for(const [i,x] of [-.12,.55,1.22].entries()){
      c(steel,x,1.47,back+.50,.20,.57);c(charcoal,x,1.765,back+.50,.215,.035);
      c(steel,x,1.185,back+.50,.207,.035);
      c(steel,x,1.785,back+.50,.195,.012);
      c(charcoal,x,1.80,back+.50,.045,.045);
      b(charcoal,x,1.29,back+.738,.045,.06,.10);
      b(steel,x,1.26,back+.78,.03,.095,.035);
      for(const side of [-1,1])b(charcoal,x+side*.23,1.51,back+.50,.07,.08,.045);
      label({text:['紅茶','四季春','奶茶'][i],x,y:1.49,z:back+.704,width:.26,height:.17,bg:'#e1dccf',fg:'#285950'});
    }
    // Cup sealer: U frame, cup carriage and the horizontal sealing-film roll.
    const machineX=1.63,machineZ=front-.65;
    b(teal,machineX,1.22,machineZ,.40,.10,.47);
    for(const side of [-1,1])b(steel,machineX+side*.17,1.47,machineZ-.12,.055,.48,.09);
    b(teal,machineX,1.72,machineZ-.07,.43,.11,.27);
    c(ivory,machineX,1.86,machineZ-.07,.10,.32,0,Math.PI/2);
    b(charcoal,machineX,1.73,machineZ+.072,.22,.047,.012);
    cup(machineX,1.275,machineZ+.07);
    // Lidded cups and cups nested in an upright sleeve beside the service hatch.
    for(const x of [-.20,.04,.28])cup(x,1.18,machineZ+.02);
    for(let i=0;i<6;i++)c(ivory,.73,1.20+i*.038,machineZ,.075,.035);
    b(charcoal,1.08,1.28,machineZ,.15,.26,.15);
    for(let i=0;i<5;i++)c(ivory,1.04+i*.018,1.48,machineZ,.005,.23);
    label({text:'點餐',x:-.10,y:.77,z:front-.283,width:.61,height:.26,bg:'#367c7a'});
    label({text:'取餐',x:1.60,y:.77,z:front-.283,width:.61,height:.26,bg:'#367c7a'});
    label({text:'紅茶 30・四季春 35',detail:'珍珠奶茶 55',x:.75,y:2.34,z:back+.16,width:2.15,height:.52,bg:'#e1dccf',fg:'#285950'});
    hangingBoard(.75,2.30,front-.18,2.18,.50);
    label({text:'甜度',detail:'正常・半糖・微糖・無糖',note:'冰量：正常・少冰・去冰',x:.75,y:2.30,z:front-.18,width:2.18,height:.50,bg:'#285950'});
    return {features:['tea urns with taps','cup sealing machine','takeaway cups','sugar and ice menu']};
  }
  if(type==='bakery') {
    // Low, open shelves keep baked goods visible from the pavement.
    const caseX=.74,caseZ=front-1.03;
    fixed(wood,caseX,.46,caseZ,2.63,.64,1.12);
    for(const y of [.80,1.22]){
      b(steel,caseX,y,caseZ,2.68,.035,1.14);
      for(let tray=0;tray<3;tray++){
        const x=-.10+tray*.83;
        b(charcoal,x,y+.028,caseZ,.70,.028,.83);
        for(let row=0;row<2;row++)for(let item=0;item<2;item++){
          const px=x-.17+item*.34,pz=caseZ-.21+row*.40;
          if(tray===0){
            // A single flattened golden bun avoids a seam that resembles a
            // sandwich; the crust map gives each dome broken baked flecks.
            const radiusX=.132+(item?-.004:.003),radiusZ=.138+(row?.004:-.003);
            const dome=.077+(row?.002:-.002),centerY=y+.042+dome;
            s(crust,px,centerY,pz,radiusX,dome,radiusZ);
            for(const [dx,dz] of [[-.065,-.020],[-.030,.035],[.014,-.048],[.048,.017],[.070,-.025]]){
              const lift=dome*Math.sqrt(Math.max(0,1-(dx/radiusX)**2-(dz/radiusZ)**2));
              s(crumb,px+dx,centerY+.001+lift,pz+dz,.006,.002,.003);
            }
          }else if(tray===1){
            b(crumb,px,y+.15,pz,.235,.20,.25);
            b(crust,px,y+.050,pz,.24,.018,.255);
            s(crust,px,y+.265,pz,.12,.055,.13);
            // Scoring slashes on the toast dome (close-round 2): without
            // them the dome reads as a plain brown blob up close; the
            // crescent tray below already uses this idiom.
            for(const dx of [-.045,0,.045])b(crumb,px+dx,y+.312,pz,.010,.006,.075,.45);
          }else{
            // Three joined lobes and short scoring suggest a crescent roll;
            // the pieces stay on the same tray and share instanced meshes.
            s(crust,px,y+.12,pz,.105,.065,.080);
            for(const side of [-1,1])s(crust,px+side*.105,y+.11,pz+.028,.056,.052,.060);
            for(const dx of [-.045,0,.045])b(crumb,px+dx,y+.177,pz,.010,.006,.075,.45);
          }
        }
      }
    }
    for(const side of [-1,1]){
      b(glass,caseX+side*1.30,1.195,caseZ,.012,.79,1.09);
      for(const end of [-1,1])b(steel,caseX+side*1.30,1.195,caseZ+end*.54,.025,.79,.025);
    }
    b(glass,caseX,1.60,caseZ,2.62,.014,1.10);
    b(glass,caseX,1.195,caseZ+.564,2.60,.79,.012);
    label({text:'菠蘿麵包 35',x:-.10,y:.70,z:caseZ+.58,width:.70,height:.18,bg:'#e1dccf',fg:'#64432c'});
    label({text:'奶油吐司 45',x:.73,y:.70,z:caseZ+.58,width:.70,height:.18,bg:'#e1dccf',fg:'#64432c'});
    label({text:'鹽可頌 40',x:1.56,y:.70,z:caseZ+.58,width:.70,height:.18,bg:'#e1dccf',fg:'#64432c'});
    // Tray/tong station is on the left of the aisle, within reach of the entry.
    const trayX=-width/2+.48;
    fixed(wood,trayX,.63,front-.66,.43,.98,.64);
    for(let i=0;i<4;i++)b(wood,trayX,1.145+i*.022,front-.66,.37,.018,.50);
    for(const side of [-1,1])b(steel,trayX+side*.045,1.245,front-.66,.022,.015,.29,side*.14);
    label({text:'夾子、托盤',detail:'請自取',x:trayX,y:1.60,z:front-.48,width:.46,height:.37,bg:'#e1dccf',fg:'#64432c'});
    // Rear bake oven and an offset checkout do not cut across the entrance.
    fixed(steel,.17,.84,back+.54,1.48,1.40,.72);
    for(const y of [.52,1.08]){
      b(charcoal,.17,y,back+.91,1.24,.40,.025);
      b(darkGlass,.17,y,back+.928,1.06,.28,.012);
      b(steel,.17,y+.18,back+.96,.95,.025,.045);
    }
    b(charcoal,.17,1.49,back+.918,1.24,.09,.015);
    fixed(wood,1.82,.65,back+.66,.74,1.02,.84);
    b(charcoal,1.82,1.21,back+.69,.30,.08,.28);
    b(charcoal,1.82,1.42,back+.59,.31,.29,.045);
    b(teal,1.82,1.44,back+.617,.25,.19,.013);
    label({text:'結帳',x:1.82,y:1.90,z:back+.98,width:.59,height:.25,bg:'#795438'});
    hangingBoard(.74,2.42,front-.20,1.85,.44);
    label({text:'每日現烤',detail:'麵包・吐司',x:.74,y:2.42,z:front-.20,width:1.85,height:.44,bg:'#795438'});
    return {features:['bread and bun display','self-service trays and tongs','baking oven','checkout']};
  }
  return {features:[]};
}
