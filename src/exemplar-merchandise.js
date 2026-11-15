import * as THREE from 'three';
import {SIGN_FONT} from './typography.js';
import {createRetailSurfaceFinish} from './retail-surface-finish.js';

// Scenery specifications, not measurements or current commercial listings.
// A single record binds each printed quantity to its intended container size.
export const RETAIL_LABEL_SPECS=Object.freeze({
  lotion:{title:'潤膚乳',subtitle:'MOISTURIZING LOTION',quantity:'容量 500 mL',quantityType:'volume',unit:'mL',storage:'ambient',container:'bottle',bodyHeight:.25,radius:.035},
  shampoo:{title:'洗髮精',subtitle:'GENTLE SHAMPOO',quantity:'容量 700 mL',quantityType:'volume',unit:'mL',storage:'ambient',container:'bottle',bodyHeight:.27,radius:.040},
  sunscreen:{title:'防曬乳',subtitle:'SPF 50+・PA++++',quantity:'容量 50 mL',quantityType:'volume',unit:'mL',storage:'ambient',container:'tube',bodyHeight:.120,radiusX:.0275,radiusZ:.0125,capHeight:.020},
  vitamins:{title:'維他命',subtitle:'DAILY NUTRITION',quantity:'內容量 180 粒',quantityType:'count',unit:'粒',storage:'ambient',container:'jar',bodyHeight:.15,radius:.038},
  mask:{title:'面膜',subtitle:'HYDRATING MASK',quantity:'內容量 5 片',quantityType:'count',unit:'片',storage:'ambient',container:'pouch',width:.13,height:.18,depth:.018},
  cotton:{title:'棉花棒',subtitle:'COTTON SWABS',quantity:'內容量 200 支',quantityType:'count',unit:'支',storage:'ambient',container:'box',width:.095,height:.13,depth:.070},
  milk:{title:'鮮乳',subtitle:'冷藏 4°C以下',quantity:'容量 936 mL',quantityType:'volume',unit:'mL',storage:'chilled',container:'carton',width:.080,height:.250,depth:.075},
  soy:{title:'豆漿',subtitle:'無加糖・冷藏',quantity:'容量 1000 mL',quantityType:'volume',unit:'mL',storage:'chilled',container:'carton',width:.080,height:.250,depth:.075},
  yogurt:{title:'優酪乳',subtitle:'原味・冷藏',quantity:'容量 900 mL',quantityType:'volume',unit:'mL',storage:'chilled',container:'bottle',bodyHeight:.25,radius:.040},
  water:{title:'礦泉水',subtitle:'NATURAL MINERAL WATER',quantity:'容量 600 mL',quantityType:'volume',unit:'mL',storage:'chilled',container:'bottle',bodyHeight:.25,radius:.032},
  tea:{title:'烏龍茶',subtitle:'無糖・冷藏',quantity:'容量 600 mL',quantityType:'volume',unit:'mL',storage:'chilled',container:'bottle',bodyHeight:.25,radius:.032},
  cereal:{title:'燕麥片',subtitle:'常溫保存・早餐食品',quantity:'淨重 400 g',quantityType:'mass',unit:'g',storage:'ambient',container:'box',width:.15,height:.24,depth:.065},
  noodles:{title:'關廟麵',subtitle:'常溫保存・乾麵',quantity:'淨重 600 g',quantityType:'mass',unit:'g',storage:'ambient',container:'box',width:.15,height:.24,depth:.065},
});
// Alias deliberately shares the same records: print and geometry cannot drift
// into separate independently edited quantities or product classifications.
export const RETAIL_PRODUCT_SPECS=RETAIL_LABEL_SPECS;
export const PRODUCE_SPECS=Object.freeze({
  apple:{title:'蘋果',radiusMin:.040,radiusMax:.047},
  orange:{title:'柳橙',radiusMin:.035,radiusMax:.043},
  bokChoy:{title:'青江菜',leafLength:.27,leafWidth:.11},
});
// A sealed tube gets wider but thinner towards its crimp, unlike a rotational
// bottle profile. Entries are radius-x, normalised height, radius-z.
const TUBE_PROFILE=[[.54,0,.54],[.72,.05,.72],[.74,.12,.74],[1,.74,1],[.94,.94,.24],[.95,1,.12]];
const TUBE_LABEL_FROM=.16,TUBE_LABEL_TO=.83;

// Original, reusable retail fittings. A shared geometry/material is instanced
// by the world's mesh adapter; stocking a shelf does not add a draw per item.
// All dimensions are metres. Labels are original generic packaging, not
// reproductions of a pharmaceutical or food manufacturer's trade dress.
export function furnishExemplarRetail(type, api) {
  const {width, front, back, entryX, b, c, s, hit, label, m, mesh} = api;
  if (typeof mesh !== 'function') throw new Error('Exemplar retail requires the instanced mesh adapter');
  const M={
    white:m('retail satin white','#f0eee7',{roughness:.43}),
    ivory:m('retail ivory enamel','#dedfd7',{roughness:.43,metalness:.12}),
    charcoal:m('retail graphite enamel','#303936',{roughness:.53,metalness:.15}),
    rubber:m('retail black gasket rubber','#202724',{roughness:.9}),
    steel:m('retail brushed steel','#b4bdb7',{roughness:.32,metalness:.72}),
    paper:m('retail offwhite paper','#eee8d9',{roughness:.91}),
    blue:m('retail deep blue plastic','#305c72',{roughness:.29}),
    green:m('retail herb green plastic','#457263',{roughness:.37}),
    red:m('retail muted red plastic','#b44643',{roughness:.38}),
    pink:m('retail blush plastic','#d2a7a4',{roughness:.44}),
    amber:m('retail amber plastic','#896030',{roughness:.32}),
    wood:m('retail pale wood','#a88760',{roughness:.76}),
    led:m('retail cabinet LED','#eaf3eb',{emissive:'#dcebdd',emissiveIntensity:.65,roughness:.38}),
    display:m('retail POS screen','#3c6964',{emissive:'#224a43',emissiveIntensity:.22,roughness:.28}),
    glass:m('retail refrigerator glass','#e5eeea',{transparent:true,opacity:.055,roughness:.08,metalness:.02,depthWrite:false}),
    leaf:m('retail produce leaf','#466f37',{roughness:.76,side:THREE.DoubleSide}),
    leafLight:m('retail produce new leaf','#789850',{roughness:.8,side:THREE.DoubleSide}),
    stalk:m('retail vegetable stalk','#d5ddb1',{roughness:.75}),
    stem:m('retail fruit stem','#69503b',{roughness:.85}),
  };
  const geometry={
    plane:new THREE.PlaneGeometry(1,1),
    round:roundedCube(),
    bottle:lathe([[.72,0],[.94,.018],[1,.06],[1,.68],[.96,.75],[.76,.84],[.39,.89],[.39,1]]),
    jar:lathe([[.91,0],[1,.035],[1,.79],[.97,.85],[.88,.91],[.88,1]]),
    tube:sealedTubeGeometry(TUBE_PROFILE),
    bottleLabel:curvedLabelGeometry([[1,0],[1,1]],0,1),
    tubeLabel:curvedLabelGeometry(TUBE_PROFILE,TUBE_LABEL_FROM,TUBE_LABEL_TO),
    carton:milkCarton(),
    apple:appleGeometry(),
    orange:new THREE.SphereGeometry(1,18,12),
    leaf:leafGeometry(),
  };
  const materials=new Map();
  const rightStart=entryX+.88, rightEnd=width/2-.30;
  const aisleLeft=entryX-.65,aisleRight=entryX+.65;
  const leftCenter=(-width/2+.22+aisleLeft-.22)/2;
  const leftSpan=aisleLeft-(-width/2+.22)-.44;
  const draw=(geo,mat,x,y,z,sx=1,sy=1,sz=1,rotation=[0,0,0])=>mesh(geo,mat,x,y,z,rotation,[sx,sy,sz]);
  const finish=createRetailSurfaceFinish(type,api);
  const rounded=(mat,x,y,z,w,h,d)=>draw(geometry.round,mat,x,y,z,w,h,d);
  function fixed(mat,x,y,z,w,h,d,bevel=false){
    if(bevel)rounded(mat,x,y,z,w,h,d);else b(mat,x,y,z,w,h,d);
    hit(x,y,z,w,h,d);
  }
  function sign(text,x,y,z,w,h,bg='#f0eee6',fg='#3b4b42',detail=''){
    label({text,detail,x,y,z,width:w,height:h,bg,fg,kind:'service'});
  }
  function printMaterial(key,color,format='bottle',series=0){
    const {title,subtitle,quantity}=RETAIL_LABEL_SPECS[key];
    const cacheKey=key+(series?'--alternate':'');
    if(materials.has(cacheKey))return materials.get(cacheKey);
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=384;
    const q=canvas.getContext('2d');
    q.fillStyle=series?'#edf0e8':'#f2eedf';q.fillRect(0,0,256,384);
    q.fillStyle=color;q.fillRect(0,0,256,49);q.fillRect(0,301,256,19);
    if(series){q.fillRect(0,49,13,251);q.fillRect(13,180,230,82);}
    q.fillStyle='#fffdf2';q.textAlign='center';q.textBaseline='middle';q.font=`700 24px ${SIGN_FONT}`;q.fillText(series?'BASIC LINE':'DAILY SELECT',128,27,232);
    q.fillStyle='#33483e';q.font=`700 ${title.length>3?39:48}px ${SIGN_FONT}`;q.fillText(title,128,95,232);
    q.font=`700 18px ${SIGN_FONT}`;q.fillText(subtitle,128,141,230);
    q.strokeStyle=series?'#f4f2e7':color;q.lineWidth=3;
    if(['milk','yogurt','water'].includes(key)){
      q.beginPath();q.moveTo(128,177);q.bezierCurveTo(116,199,90,222,98,241);q.bezierCurveTo(110,270,158,267,161,239);q.bezierCurveTo(163,219,139,196,128,177);q.stroke();
    }else if(key==='soy'){
      q.beginPath();q.ellipse(128,223,52,27,-.40,0,Math.PI*2);q.stroke();
      for(let i=0;i<3;i++){q.beginPath();q.ellipse(100+i*27,234-i*11,9,12,.4,0,Math.PI*2);q.stroke();}
    }else if(key==='cereal'){
      q.beginPath();q.moveTo(128,265);q.lineTo(128,180);q.stroke();
      for(let i=0;i<4;i++)for(const side of [-1,1]){q.beginPath();q.ellipse(128+side*14,198+i*15,8,13,side*.65,0,Math.PI*2);q.stroke();}
    }else if(key==='noodles'){
      q.beginPath();q.moveTo(80,225);q.quadraticCurveTo(128,282,176,225);q.lineTo(80,225);q.stroke();
      for(let i=0;i<3;i++){q.beginPath();q.moveTo(108+i*21,222);q.bezierCurveTo(91+i*21,200,124+i*21,202,108+i*21,184);q.stroke();}
    }else if(key==='tea'){
      q.beginPath();q.moveTo(89,249);q.quadraticCurveTo(100,186,172,183);q.quadraticCurveTo(162,249,89,249);q.lineTo(158,195);q.stroke();
    }else{
      q.beginPath();q.ellipse(128,220,53,47,0,0,Math.PI*2);q.stroke();
      q.beginPath();q.moveTo(102,243);q.quadraticCurveTo(125,186,159,196);q.quadraticCurveTo(164,233,102,243);q.stroke();
      q.beginPath();q.moveTo(106,240);q.lineTo(149,204);q.stroke();
    }
    q.fillStyle='#5e6c5c';q.font=`700 17px ${SIGN_FONT}`;q.fillText('日常生活・安心選物',128,282,232);
    q.textAlign='left';q.fillStyle='#485148';q.font=`700 18px ${SIGN_FONT}`;
    q.fillText(quantity,16,342,232);
    for(let i=0;i<50;i++){q.fillRect(15+i*3.2,355,1+(i%3===0?1:0),17-(i%5===0?4:0));}
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
    texture.name='Original generic retail label '+cacheKey;
    const mat=m('retail printed label '+cacheKey,'#ffffff',{map:texture,roughness:.78,metalness:0});
    materials.set(cacheKey,mat);return mat;
  }
  const pack={
    lotion:printMaterial('lotion','#758c78'),
    shampoo:printMaterial('shampoo','#415d73'),
    sunscreen:printMaterial('sunscreen','#c6954a'),
    vitamins:printMaterial('vitamins','#9c6b40'),
    mask:printMaterial('mask','#aa7380'),
    cotton:printMaterial('cotton','#5b8e9e'),
    milk:printMaterial('milk','#547ca2','food'),
    soy:printMaterial('soy','#7d9155','food'),
    yogurt:printMaterial('yogurt','#a46975','food'),
    water:printMaterial('water','#548e9d','food'),
    tea:printMaterial('tea','#6f8b4f','food'),
    cereal:printMaterial('cereal','#82935c','food'),
    noodles:printMaterial('noodles','#a78959','food'),
  };
  const alternateColors={lotion:'#607f91',shampoo:'#72846a',sunscreen:'#977d54',vitamins:'#617d68',mask:'#82728d',cotton:'#648678',
    milk:'#a16c53',soy:'#6c7d99',yogurt:'#6e8e82',water:'#778aa0',tea:'#9a7950',cereal:'#9c7752',noodles:'#788e68'};
  const retailPrices={lotion:[129,159],shampoo:[199,229],sunscreen:[199,249],vitamins:[289,349],mask:[89,109],cotton:[59,69],
    milk:[95,99],soy:[49,55],yogurt:[89,95],water:[25,29],tea:[30,35],cereal:[119,139],noodles:[89,99]};
  const labelFor=(kind,series=0)=>series?printMaterial(kind,alternateColors[kind],['milk','soy','yogurt','water','tea','cereal','noodles'].includes(kind)?'food':'bottle',1):pack[kind];
  const stocking={front:0,back:0,depleted:0,rows:0};
  const stockNoise=(seed,index)=>{
    let value=(Math.imul(seed+1,2654435761)^Math.imul(index+17,1597334677))>>>0;
    value=Math.imul(value^(value>>>16),2246822507)>>>0;
    return (value^(value>>>13))>>>0;
  };
  function printed(mat,x,y,z,w,h){draw(geometry.plane,mat,x,y,z,w,h,1);}
  function facings(center,usableSpan,productWidth,gap=.018){
    const pitch=productWidth+gap,count=Math.max(1,Math.floor((usableSpan+gap)/pitch));
    return Array.from({length:count},(_,i)=>center+(i-(count-1)/2)*pitch);
  }
  // Coherent brand blocks, a small sold/recessed pocket, and stock behind
  // selected facings. Jitter stays below 3 mm; body dimensions never vary.
  function stockRow(center,span,productWidth,frontZ,rearZ,seed,place){
    const positions=facings(center,span,productWidth,.022),count=positions.length;
    const pocket=Math.min(count-2,Math.max(1,Math.floor(count*(.36+(seed%5)*.08))));
    const block=Math.max(1,Math.ceil(count/2));stocking.rows++;
    for(const [col,x] of positions.entries()){
      const bits=stockNoise(seed,col),series=Math.floor(col/block)%2;
      const px=x+((bits%101)/100-.5)*.005;
      if((bits>>>8)%5!==0){
        place(px,rearZ+((bits>>>12)%7-3)*.001,col,series,true);stocking.back++;
      }
      if(count>5&&seed%3!==1&&col===pocket){stocking.depleted++;continue;}
      const recess=seed%2&&col===pocket-1?.035:0;
      place(px,frontZ-recess+((bits>>>18)%7-3)*.001,col,series,false);stocking.front++;
    }
  }
  function boxProduct(x,floor,z,kind='mask',color=M.paper,w=.15,h=.23,d=.065,series=0,resting=true){
    if(resting)finish.contact(x,floor,z,w*.92,d*.92);
    rounded(color,x,floor+h/2,z,w,h,d);
    printed(labelFor(kind,series),x,floor+h/2,z+d/2+.0015,w*.91,h*.94);
    b(M.white,x,floor+h-.006,z,w*.93,.006,d*.92);
  }
  function bottleProduct(x,floor,z,kind='lotion',color=M.white,pump=false,variant=null,series=0){
    const {bodyHeight:h,radius:r}=variant??RETAIL_PRODUCT_SPECS[kind];
    finish.contact(x,floor,z,r*1.80,r*1.80);
    draw(kind==='vitamins'?geometry.jar:geometry.bottle,color,x,floor,z,r,h,r);
    c(kind==='vitamins'?M.ivory:M.charcoal,x,floor+h+.010,z,r*(kind==='vitamins'?.91:.46),.022);
    // The label follows the cylindrical body instead of sitting inside its
    // front surface. The 1.2 mm offset represents a thin printed sleeve.
    draw(geometry.bottleLabel,labelFor(kind,series),x,floor+h*.43,z,r+.0012,h*.49,r+.0012);
    if(pump){
      c(M.white,x,floor+h+.025,z,.009,.026);
      rounded(M.white,x+.015,floor+h+.043,z,.058,.014,.023);
      b(M.white,x+.038,floor+h+.036,z,.012,.020,.019);
    }
  }
  function tubeProduct(x,floor,z,color=M.white,series=0){
    const {bodyHeight:h,radiusX:rx,radiusZ:rz,capHeight}=RETAIL_PRODUCT_SPECS.sunscreen;
    finish.contact(x,floor,z,.030,.018,.012);
    rounded(M.ivory,x,floor+capHeight/2,z,.032,capHeight,.019);
    draw(geometry.tube,color,x,floor+capHeight,z,rx,h,rz);
    b(M.white,x,floor+capHeight+h+.002,z,rx*1.94,.006,.004);
    draw(geometry.tubeLabel,labelFor('sunscreen',series),x,floor+capHeight+h*(TUBE_LABEL_FROM+TUBE_LABEL_TO)/2,z,
      rx+.0005,h*(TUBE_LABEL_TO-TUBE_LABEL_FROM),rz+.0005);
  }
  function milkProduct(x,floor,z,kind='milk',series=0){
    const {width:w,height:h,depth:d}=RETAIL_PRODUCT_SPECS[kind];
    finish.contact(x,floor,z,w*.96,d*.96);
    draw(geometry.carton,M.white,x,floor,z,w,h,d);
    printed(labelFor(kind,series),x,floor+h*.43,z+d/2+.0008,w*.90,h*.75);
    b(series?M.charcoal:kind==='soy'?M.green:M.blue,x,floor+h,z,w*.94,.006,.009);
  }
  function price(text,x,y,z,w=.30){
    b(M.paper,x,y,z,w,.075,.018);
    sign(text,x,y,z+.012,w-.012,.068,'#eee9d8','#3a4339');
  }
  function pos(x,z,w=1.12){
    finish.fitting(x,z,w,.72);
    fixed(M.ivory,x,.62,z,w,.96,.72,true);
    rounded(M.charcoal,x,1.12,z,w+.06,.085,.78);
    finish.shelf(x,1.125,z+.3905,w*.73);
    for(const y of [.39,.76])b(M.steel,x,y,z+.365,w-.10,.014,.018);
    b(M.charcoal,x+.08,1.23,z-.08,.055,.18,.045);
    rounded(M.charcoal,x+.08,1.43,z-.08,.39,.27,.065);
    printed(M.display,x+.08,1.43,z-.044,.33,.20);
    b(M.led,x+.08,1.47,z-.038,.22,.012,.003);
    b(M.paper,x+.08,1.40,z-.038,.16,.009,.003);
    rounded(M.charcoal,x+.32,1.19,z+.18,.18,.045,.12);
    b(M.display,x+.32,1.216,z+.18,.13,.006,.08);
    rounded(M.ivory,x-.29,1.235,z+.09,.20,.16,.21);
    b(M.rubber,x-.29,1.285,z+.197,.12,.018,.008);
    b(M.paper,x-.29,1.293,z+.207,.083,.008,.11);
    b(M.steel,x-.08,1.175,z+.21,.16,.025,.13);
    sign('結帳',x,.85,z+.375,.52,.15,type==='drugstore'?'#a73f44':'#365f7a','#fff5df');
  }
  function baseShelf(x,z,w,depth=.50,height=2.30){
    finish.fitting(x,z+depth/2,w,depth);
    fixed(M.ivory,x,.14+height/2,z,w,height,.07);
    for(const edge of [-1,1])b(M.ivory,x+edge*(w/2-.025),.14+height/2,z+depth/2,.035,height,depth);
    b(M.charcoal,x,.205,z+depth/2,w,.13,depth);
    b(M.white,x,2.43,z+depth/2,w,.055,depth);
    for(let row=0;row<4;row++){
      const y=.35+row*.46;
      b(M.ivory,x,y,z+depth/2,w-.06,.035,depth);
      b(M.steel,x,y-.005,z+depth+.006,w-.04,.065,.024);
      finish.shelf(x,y-.004,z+depth+.0185,w-.13);
    }
    hit(x,1.25,z+depth/2,w,2.22,depth);
  }

  if(type==='drugstore'){
    const red='#a83f46';
    // Three coherent departments replace random colour alternation. A low
    // foreground island and the back wall create separate depth layers.
    const start=rightStart+.08,end=rightEnd-.06,span=end-start;
    const bayW=(span-.10)/3;
    for(let bay=0;bay<3;bay++){
      const x=start+bayW/2+bay*(bayW+.05);
      baseShelf(x,back+.105,bayW,.47);
      const title=['保養・清潔','美妝・防曬','保健用品'][bay];
      sign(title,x,2.60,back+.59,bayW-.08,.20,red,'#fff7e8');
      b(M.led,x,2.35,back+.43,bayW-.12,.018,.045);
      for(let row=0;row<4;row++){
        const floor=.3675+row*.46;
        const sku=bay===0?(row%2?'shampoo':'lotion'):bay===1?(row%2?'mask':'sunscreen'):row<2?'vitamins':'cotton';
        const spec=RETAIL_PRODUCT_SPECS[sku],productWidth=spec.width??(spec.radius??spec.radiusX)*2;
        stockRow(x,bayW-.22,productWidth,back+.43,back+.23,bay*19+row+3,(px,pz,col,series)=>{
          if(bay===0)bottleProduct(px,floor,pz,sku,row%2?(series?M.green:M.blue):(series?M.ivory:M.white),row===2,null,series);
          else if(bay===1){
            if(row%2===0)tubeProduct(px,floor,pz,series?M.ivory:M.white,series);
            else boxProduct(px,floor,pz,sku,series?M.ivory:M.pink,spec.width,spec.height,spec.depth,series);
          }else if(row<2)bottleProduct(px,floor,pz,sku,M.amber,false,null,series);
          else boxProduct(px,floor,pz,sku,series?M.ivory:M.white,spec.width,spec.height,spec.depth,series);
        });
        price('NT$ '+retailPrices[sku][0],x-bayW*.23,.315+row*.46,back+.59,.38);
        price('NT$ '+retailPrices[sku][1],x+bayW*.23,.315+row*.46,back+.59,.38);
      }
    }
    // Left of the full-depth entrance aisle: a real pegboard display, with
    // visible hooks and thin sealed packets rather than another high counter.
    const pegX=leftCenter,pegZ=back+.24;
    fixed(M.ivory,pegX,1.36,pegZ,leftSpan,2.42,.10);
    for(let row=0;row<6;row++)for(let col=0;col<9;col++)
      b(M.charcoal,pegX-leftSpan*.42+col*leftSpan*.105,.47+row*.31,pegZ+.056,.009,.009,.004);
    sign('旅行・衛生用品',pegX,2.72,pegZ+.08,leftSpan-.10,.19,red,'#fff7e8');
    for(let row=0;row<3;row++)for(let col=0;col<5;col++){
      const px=pegX-leftSpan*.36+col*leftSpan*.18,py=.80+row*.55;
      const sku=row===1?'cotton':'mask',spec=RETAIL_PRODUCT_SPECS[sku],top=py-.08+spec.height;
      b(M.steel,px,top+.015,pegZ+.13,.018,.018,.21);
      // One depleted hook remains visible among otherwise grouped packets.
      if(row===2&&col===3)continue;
      boxProduct(px,py-.08,pegZ+.20,sku,row===1?M.white:col<2?M.pink:M.ivory,spec.width,spec.height,spec.depth,col<2?0:1,false);
      b(M.ivory,px,top+.008,pegZ+.20,spec.width*.66,.022,.012);
    }
    const islandX=.72,islandZ=front-1.13;
    fixed(M.ivory,islandX,.52,islandZ,2.05,.76,.68,true);
    rounded(M.white,islandX,.93,islandZ,2.12,.065,.74);
    b(M.red,islandX,.75,islandZ+.35,1.98,.13,.012);
    // Three compact, faced recommendation groups replace the former carpet
    // of identical pump bottles. Rear stock is still on the same supported top.
    for(const [group,sku] of ['lotion','sunscreen','mask'].entries()){
      const center=islandX-.68+group*.68,spec=RETAIL_PRODUCT_SPECS[sku];
      if(sku==='mask'){
        // Thin sealed packets sit in a supported countertop display.
        b(M.ivory,center,1.006,islandZ-.151,.59,.087,.012);
        b(M.ivory,center,.973,islandZ+.191,.59,.021,.012);
      }
      const productWidth=spec.width??(spec.radius??spec.radiusX)*2;
      stockRow(center,.55,productWidth,islandZ+.16,islandZ-.13,91+group,(px,pz,col,series)=>{
        if(sku==='lotion')bottleProduct(px,.9625,pz,sku,series?M.ivory:M.white,true,null,series);
        else if(sku==='sunscreen')tubeProduct(px,.9625,pz,M.white,series);
        else boxProduct(px,.9625,pz,sku,series?M.ivory:M.pink,spec.width,spec.height,spec.depth,series);
      });
      price('NT$ '+retailPrices[sku][0]+' 起',center,.88,islandZ+.382,.46);
    }
    sign('本週推薦',islandX,.74,islandZ+.365,.95,.15,red,'#fff8e9');
    const checkoutX=rightEnd-.76,checkoutZ=front-.69;
    pos(checkoutX,checkoutZ,1.19);
    // A shallow drawer/service wall behind the cashier keeps the work area
    // visible while the centre of the shop remains an actual aisle.
    sign('會員服務',checkoutX,2.80,back+.12,1.12,.16,'#f0eee6','#6d4c50');
    return {features:['分區藥妝壁架','潤膚乳與洗髮精','防曬乳與面膜','掛架旅行衛生用品','低檯推薦商品','結帳與會員服務'],stocking:{...stocking}};
  }

  // Food shop: two large, deep refrigerated cabinets read as appliances, with
  // a service plinth, door seals, handles, shelves and their own lit interior.
  const fridgeStart=rightStart+.12,fridgeEnd=rightEnd-.08;
  const cabinetW=(fridgeEnd-fridgeStart-.12)/2;
  for(let bay=0;bay<2;bay++){
    const x=fridgeStart+cabinetW/2+bay*(cabinetW+.12),caseZ=back+.51;
    finish.fitting(x,back+.55,cabinetW,.90);
    fixed(M.charcoal,x,1.35,back+.13,cabinetW,2.42,.17,true);
    for(const dx of [-1,1])b(M.charcoal,x+dx*(cabinetW/2-.035),1.35,caseZ,.07,2.42,.80);
    b(M.charcoal,x,2.54,caseZ,cabinetW,.14,.80);
    b(M.ivory,x,.30,caseZ,cabinetW,.30,.82);
    b(M.charcoal,x,.20,caseZ+.426,cabinetW-.13,.11,.018);
    for(let i=0;i<Math.floor(cabinetW/.075);i++)b(M.steel,x-cabinetW/2+.07+i*.075,.205,caseZ+.44,.008,.070,.012);
    b(M.white,x,1.35,back+.235,cabinetW-.15,2.07,.025);
    for(let row=0;row<4;row++){
      const floor=.48+row*.43;
      b(M.ivory,x,floor-.019,back+.55,cabinetW-.15,.038,.58);
      b(M.white,x,floor-.028,back+.85,cabinetW-.16,.065,.035);
      finish.shelf(x,floor-.028,back+.868,cabinetW-.20);
      const sku=bay===0?(row===0?'milk':row===1?'soy':'yogurt'):row<2?'water':'tea';
      const spec=RETAIL_PRODUCT_SPECS[sku],productWidth=spec.width??spec.radius*2;
      stockRow(x,cabinetW-.36,productWidth,back+.70,back+.39,131+bay*13+row,(px,pz,col,series)=>{
        if(bay===0){
          if(row<2)milkProduct(px,floor,pz,sku,series);
          else bottleProduct(px,floor,pz,sku,series?M.ivory:M.white,false,null,series);
        }else bottleProduct(px,floor,pz,sku,row<2?(series?M.white:M.ivory):M.green,false,null,series);
      });
      price('NT$ '+retailPrices[sku][0],x-cabinetW*.23,floor-.04,back+.882,.40);
      price('NT$ '+retailPrices[sku][1],x+cabinetW*.23,floor-.04,back+.882,.40);
    }
    const doors=3,doorW=(cabinetW-.15)/doors,doorZ=back+.965;
    for(let d=0;d<doors;d++){
      const dx=x-(cabinetW-.15)/2+doorW/2+d*doorW;
      b(M.glass,dx,1.37,doorZ,doorW-.055,1.87,.014);
      for(const side of [-1,1]){
        b(M.rubber,dx+side*(doorW/2-.017),1.37,doorZ,.033,1.96,.028);
        b(M.steel,dx+side*(doorW/2-.004),1.37,doorZ+.017,.016,1.98,.037);
      }
      for(const y of [.39,2.35])b(M.steel,dx,y,doorZ+.017,doorW,.026,.037);
      b(M.led,dx-doorW/2+.04,1.37,doorZ-.052,.014,1.82,.02);
      b(M.steel,dx+doorW/2-.12,1.43,doorZ+.085,.025,.47,.028);
      finish.handle(dx+doorW/2-.12,1.43,doorZ+.0995);
      for(const y of [1.21,1.65])b(M.steel,dx+doorW/2-.12,y,doorZ+.05,.025,.025,.08);
    }
    sign(bay===0?'鮮乳・豆漿・優酪乳':'冷藏飲品',x,2.57,doorZ+.03,cabinetW-.12,.16,'#344841','#f1f4e9');
    sign('4°C',x+cabinetW/2-.31,2.40,doorZ+.035,.40,.10,'#273731','#a9c4b6');
    hit(x,1.30,back+.56,cabinetW,2.32,.96);
  }
  // Grocery left bay has baskets and dry goods; it no longer duplicates the
  // pharmacy's completely empty left wall and wall-wide cartons.
  baseShelf(leftCenter,back+.13,leftSpan,.48,2.30);
  sign('日常食品',leftCenter,2.62,back+.65,leftSpan-.05,.19,'#cb633e','#fff4df');
  for(let row=0;row<4;row++){
    const kind=row%2?'noodles':'cereal',spec=RETAIL_PRODUCT_SPECS[kind];
    stockRow(leftCenter,leftSpan-.20,spec.width,back+.43,back+.25,171+row,(px,pz,col,series)=>{
      boxProduct(px,.3675+row*.46,pz,kind,series?M.paper:row%2?M.ivory:M.green,spec.width,spec.height,spec.depth,series);
    });
    for(const series of [0,1])price('NT$ '+retailPrices[kind][series],leftCenter+(series?1:-1)*leftSpan*.23,.315+row*.46,back+.65,.40);
  }
  // Slatted low produce tables: individual fruit is fully above the liner,
  // each crate has a bottom, side walls, corner pieces and supported stock.
  const produceX=.47,produceZ=front-1.06;
  fixed(M.charcoal,produceX,.48,produceZ,2.56,.66,.83,true);
  for(let i=0;i<12;i++)b(M.wood,produceX-1.20+i*.219,.53,produceZ+.428,.18,.60,.035);
  b(M.wood,produceX,.855,produceZ,2.65,.09,.91);
  for(let tray=0;tray<3;tray++){
    const x=produceX-.88+tray*.88;
    crate(x,.94,produceZ,.80,.73);
    if(tray===0){
      const spec=PRODUCE_SPECS.apple;let i=0;
      for(const [row,pz0] of facings(produceZ,.61,spec.radiusMax*2,.009).entries())for(const [col,px0] of facings(x,.68,spec.radiusMax*2,.009).entries()){
        const slot=i++;
        if(row<2&&col<2)continue; // A picked corner, not a checkerboard of holes.
        const bits=stockNoise(201,slot),px=px0+((bits%7)-3)*.001,pz=pz0+(((bits>>>8)%7)-3)*.001;
        const radius=spec.radiusMin+(slot%3)*(spec.radiusMax-spec.radiusMin)/2;
        finish.contact(px,.99,pz,radius*1.5,radius*1.5,.012);
        draw(geometry.apple,fruitMaterial('apple'),px,.99+radius*.955,pz,radius,radius,radius,[0,slot*.63,0]);
        const stemHeight=radius*.30,stemBottom=.99+radius*1.705-stemHeight*.12,leafY=radius*.35;
        c(M.stem,px,stemBottom+stemHeight/2,pz,radius*.045,stemHeight);
        draw(geometry.leaf,M.leaf,px,stemBottom+stemHeight*.90-leafY*.12,pz,radius*.62,leafY,radius*1.10,[0,.55,-.20]);
      }
      price('蘋果  NT$ 39',x,.972,produceZ+.384,.68);
    }else if(tray===1){
      const spec=PRODUCE_SPECS.orange;let i=0;
      for(const [row,pz0] of facings(produceZ,.61,spec.radiusMax*2,.008).entries())for(const [col,px0] of facings(x,.68,spec.radiusMax*2,.008).entries()){
        const slot=i++;
        if(row>3&&col>3)continue;
        const bits=stockNoise(217,slot),px=px0+((bits%7)-3)*.001,pz=pz0+(((bits>>>8)%7)-3)*.001;
        const radius=spec.radiusMin+(slot%3)*(spec.radiusMax-spec.radiusMin)/2;
        finish.contact(px,.99,pz,radius*1.4,radius*1.4,.012);
        draw(geometry.orange,fruitMaterial('orange'),px,.99+radius*.94,pz,radius,radius*.94,radius,[0,slot*.65,0]);
        c(M.leaf,px,.99+radius*1.88,pz,radius*.10,.003);
      }
      price('柳橙  NT$ 25',x,.972,produceZ+.384,.68);
    }else{
      for(let i=0;i<5;i++){
        const px=x-.20+(i%2)*.35,pz=produceZ-.19+Math.floor(i/2)*.20;
        for(let leaf=0;leaf<5;leaf++){
          const angle=leaf*1.25+i*.31;
          c(M.stalk,px,1.045,pz,.028,.11,.18*Math.cos(angle),.18*Math.sin(angle));
          draw(geometry.leaf,leaf%2?M.leaf:M.leafLight,px,1.09,pz,.10,.13,.27,[.35,angle,0]);
        }
      }
      price('青江菜  NT$ 29',x,.972,produceZ+.384,.68);
    }
  }
  const checkoutX=rightEnd-.78,checkoutZ=front-.64;
  pos(checkoutX,checkoutZ,1.26);
  // A weighing platform and bags belong to produce sales, not cosmetics.
  rounded(M.ivory,checkoutX-.30,1.23,checkoutZ-.11,.26,.13,.24);
  b(M.steel,checkoutX-.30,1.307,checkoutZ-.11,.27,.018,.25);
  b(M.display,checkoutX-.30,1.23,checkoutZ+.019,.15,.035,.008);
  const basketsX=leftCenter,basketsZ=front-.65;
  for(let i=0;i<4;i++){
    const lift=i*.083;
    b(M.charcoal,basketsX,.17+lift,basketsZ,.64,.055,.43);
    for(const side of [-1,1]){
      // Open ribs and a continuous top rim read as nesting shopping baskets,
      // rather than a stack of solid storage boxes.
      b(M.green,basketsX+side*.34,.32+lift,basketsZ,.028,.030,.49);
      b(M.green,basketsX,.32+lift,basketsZ+side*.23,.69,.030,.026);
      for(let rib=0;rib<10;rib++)b(M.green,basketsX-.30+rib*.0667,.25+lift,basketsZ+side*.23,.014,.13,.018);
      for(let rib=0;rib<6;rib++)b(M.green,basketsX+side*.34,.25+lift,basketsZ-.20+rib*.08,.018,.13,.014);
    }
  }
  for(const side of [-1,1]){
    for(const end of [-1,1])c(M.charcoal,basketsX+end*.25,.65,basketsZ+side*.18,.012,.13);
    c(M.charcoal,basketsX,.715,basketsZ+side*.18,.012,.50,0,Math.PI/2);
  }
  hit(basketsX,.48,basketsZ,.75,.68,.54);
  b(M.charcoal,basketsX,.69,basketsZ-.25,.022,.70,.025);
  sign('購物籃',basketsX,1.04,basketsZ-.25,.65,.14,'#f0eee6','#3b4b42');
  return {features:['玻璃門冷藏櫃','鮮乳豆漿與飲品','蘋果柳橙與青江菜','分格木箱蔬果檯','日常食品壁架','購物籃與秤重結帳'],stocking:{...stocking}};

  function crate(x,y,z,w,d){
    b(M.charcoal,x,y,z,w,.08,d);
    b(M.paper,x,y+.045,z,w-.065,.01,d-.065);
    for(const side of [-1,1]){
      b(M.wood,x+side*(w/2-.025),y+.095,z,.05,.13,d);
      b(M.wood,x,y+.095,z+side*(d/2-.022),w,.13,.045);
    }
    for(const dx of [-1,1])for(const dz of [-1,1])b(M.wood,x+dx*(w/2-.04),y+.11,z+dz*(d/2-.04),.06,.16,.06);
  }
  function fruitMaterial(kind){
    const key='fruit '+kind;
    if(materials.has(key))return materials.get(key);
    const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
    const q=canvas.getContext('2d');q.fillStyle=kind==='apple'?'#aa4734':'#d99b38';q.fillRect(0,0,128,128);
    let seed=8147;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
    for(let i=0;i<1800;i++){
      q.fillStyle=kind==='apple'?(i%3?'rgba(242,194,115,.13)':'rgba(83,49,28,.13)'):(i%2?'rgba(253,224,143,.19)':'rgba(137,99,38,.12)');
      q.fillRect(random()*128,random()*128,kind==='apple'?.6:1.2,kind==='apple'?2.6:.8);
    }
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const material=m('retail '+key,'#ffffff',{map:texture,roughness:kind==='apple'?.38:.67});
    materials.set(key,material);return material;
  }
}

function roundedCube(){
  const geo=new THREE.BoxGeometry(1,1,1,4,4,4),pos=geo.attributes.position,inner=.445,r=.055;
  const p=new THREE.Vector3(),core=new THREE.Vector3();
  for(let i=0;i<pos.count;i++){
    p.fromBufferAttribute(pos,i);core.set(Math.max(-inner,Math.min(inner,p.x)),Math.max(-inner,Math.min(inner,p.y)),Math.max(-inner,Math.min(inner,p.z)));
    p.sub(core).normalize().multiplyScalar(r).add(core);pos.setXYZ(i,p.x,p.y,p.z);
  }
  geo.computeVertexNormals();return geo;
}
function lathe(points){return new THREE.LatheGeometry(points.map(([r,y])=>new THREE.Vector2(r,y)),20);}
function profileRadius(profile,y,axis=0){
  const value=p=>axis===2?(p[2]??p[0]):p[0];
  for(let i=1;i<profile.length;i++)if(y<=profile[i][1]){
    const p0=profile[i-1],p1=profile[i];
    return value(p0)+(value(p1)-value(p0))*(y-p0[1])/(p1[1]-p0[1]);
  }
  return value(profile.at(-1));
}
function sealedTubeGeometry(profile){
  const positions=[],uvs=[],indices=[],rows=16,cols=24;
  for(let row=0;row<=rows;row++)for(let col=0;col<=cols;col++){
    const v=row/rows,u=col/cols,angle=u*Math.PI*2;
    positions.push(Math.sin(angle)*profileRadius(profile,v),v,Math.cos(angle)*profileRadius(profile,v,2));uvs.push(u,v);
  }
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
    const i=row*(cols+1)+col;indices.push(i,i+1,i+cols+2,i,i+cols+2,i+cols+1);
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}
function curvedLabelGeometry(profile,from,to){
  const positions=[],uvs=[],indices=[],rows=8,cols=16;
  for(let row=0;row<=rows;row++)for(let col=0;col<=cols;col++){
    const v=row/rows,u=col/cols,angle=(u-.5)*1.96,y=from+(to-from)*v;
    positions.push(Math.sin(angle)*profileRadius(profile,y),v-.5,Math.cos(angle)*profileRadius(profile,y,2));uvs.push(u,v);
  }
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
    const i=row*(cols+1)+col;indices.push(i,i+1,i+cols+2,i,i+cols+2,i+cols+1);
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}
function milkCarton(){
  const geo=new THREE.BufferGeometry();
  const v=[-.5,0,.5,.5,0,.5,.5,.82,.5,-.5,.82,.5,-.5,0,-.5,.5,0,-.5,.5,.82,-.5,-.5,.82,-.5,-.5,1,0,.5,1,0];
  geo.setAttribute('position',new THREE.Float32BufferAttribute(v,3));
  geo.setIndex([0,1,2,0,2,3,5,4,7,5,7,6,4,0,3,4,3,7,1,5,6,1,6,2,4,5,1,4,1,0,3,2,9,3,9,8,6,7,8,6,8,9,7,3,8,2,6,9]);
  geo.computeVertexNormals();return geo;
}
function appleGeometry(){
  const geo=new THREE.SphereGeometry(1,20,14),p=geo.attributes.position;
  for(let i=0;i<p.count;i++){
    let x=p.getX(i),y=p.getY(i),z=p.getZ(i);const angle=Math.atan2(z,x),radius=Math.hypot(x,z);
    const lobe=1+.045*Math.cos(angle*5)*Math.pow(Math.abs(y),2);
    x*=lobe;z*=lobe;y=y*.91-(y>0?.16:.045)*Math.exp(-radius*radius*12);
    p.setXYZ(i,x,y,z);
  }
  geo.computeVertexNormals();return geo;
}
function leafGeometry(){
  const positions=[],uvs=[],indices=[],rows=9,cols=4;
  for(let row=0;row<=rows;row++)for(let col=0;col<=cols;col++){
    const v=row/rows,u=col/cols*2-1,w=Math.pow(Math.sin(Math.PI*v),.75)*.55;
    positions.push(u*w,Math.sin(v*Math.PI)*.30+(1-u*u)*.12+Math.sin(v*18+u*4)*.018,v);
    uvs.push(col/cols,v);
  }
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
    const i=row*(cols+1)+col;indices.push(i,i+1,i+cols+2,i,i+cols+2,i+cols+1);
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geo.setIndex(indices);geo.computeVertexNormals();return geo;
}
