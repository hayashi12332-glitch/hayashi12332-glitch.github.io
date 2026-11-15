import {furnishExemplarRetail} from './exemplar-merchandise.js';

// Compact, static furnishings for three Taiwanese neighbourhood chain stores.
// Coordinates are local metres, with floor y=.14 and the storefront at `front`.
// The 1.30 m entrance centred on entryX is kept clear all the way to the back.
// Signs and product packages are scenery; no financial or medical service runs.
export function furnishChains(type, api) {
  if (!['lottery', 'drugstore', 'supermarket', 'convenience'].includes(type)) return {features: []};
  if (type==='drugstore' || type==='supermarket') return furnishExemplarRetail(type,api);
  const {width, front, back, entryX, b, c, s, hit, label, m} = api;
  const dark=m('chain charcoal','#34413f',{roughness:.77});
  const steel=m('chain brushed steel','#9ca9a5',{metalness:.58,roughness:.42});
  const cream=m('chain shelf ivory','#e4e6dc',{roughness:.8});
  const white=m('chain clean white','#f2f0e8',{roughness:.74});
  const paper=m('chain paper','#eee9d9',{roughness:.95});
  const wood=m('chain light wood','#b29a78',{roughness:.86});
  const green=m('chain herb green','#507e5c',{roughness:.75});
  const yellow=m('chain warm yellow','#e1b544',{roughness:.76});
  const red=m('chain warm red','#bd4c3e',{roughness:.78});
  const blue=m('chain muted blue','#4e7490',{roughness:.76});
  const pink=m('chain soft pink','#d9b0a8',{roughness:.84});
  const glass=m('chain clear case glass','#bcd6d2',{transparent:true,opacity:.17,depthWrite:false,roughness:.18});
  const screen=m('chain screen','#344b52',{roughness:.27});
  const lit=m('chain screen light','#a7c9bd',{emissive:'#4c746b',emissiveIntensity:.12,roughness:.36});
  const rightStart=entryX+.85;
  const rightEnd=width/2-.28;
  const shelfFront=back+.46;
  const colors=[white,green,cream,blue,pink,yellow,white,teal()];
  function teal(){return m('chain muted teal','#6c9b8d',{roughness:.78});}
  function fixed(material,x,y,z,w,h,d){b(material,x,y,z,w,h,d);hit(x,y,z,w,h,d);}
  function faceLabel(text,x,y,z,w,h,bg='#e4e6dc',fg='#34413f',detail='') {
    label({text,detail,x,y,z,width:w,height:h,bg,fg,kind:'service'});
  }
  // A product carton has a top, printed face and small colour band, avoiding
  // both unexplained solid cubes and illegibly detailed invented product text.
  function carton(x,y,z,w,h,d,color,band) {
    b(color,x,y,z,w,h,d);
    b(white,x,y+h*.20,z+d/2+.003,w*.78,h*.14,.006);
    b(band,x,y-h*.15,z+d/2+.007,w*.72,h*.065,.008);
  }
  function bottle(x,y,z,color) {
    c(color,x,y+.11,z,.046,.22);
    c(white,x,y+.225,z,.034,.025);
    b(paper,x,y+.12,z+.047,.065,.10,.007);
  }
  function monitor(x,z,y=1.13) {
    b(dark,x,y+.16,z,.38,.27,.07);
    b(screen,x,y+.16,z+.038,.33,.21,.008);
    b(lit,x-.04,y+.19,z+.045,.19,.014,.006);
    b(lit,x-.06,y+.14,z+.045,.14,.009,.006);
    b(steel,x,y-.005,z,.035,.17,.035);
    b(dark,x,y-.075,z,.22,.025,.14);
  }

  if (type==='lottery') {
    const orange=m('lottery amber','#e4a629',{roughness:.72});
    const counterW=Math.min(3.25,rightEnd-rightStart-.20), counterX=rightStart+.10+counterW/2;
    const counterZ=front-1.00;
    fixed(wood,counterX,.61,counterZ,counterW,.94,.64);
    b(cream,counterX,1.10,counterZ,counterW+.05,.07,.70);
    b(orange,counterX,.73,counterZ+.326,counterW-.10,.24,.02);
    faceLabel('公益彩券',counterX,.74,counterZ+.340,1.30,.18,'#e4a629','#623629');
    // Taiwan Lottery's public age restriction is on a small upright notice at
    // the sales counter, independent of the decorative tickets or any draw.
    const noticeX=counterX-.70,noticeZ=counterZ-.27;
    for(const dx of [-.59,.59])b(steel,noticeX+dx,1.265,noticeZ,.018,.26,.018);
    b(paper,noticeX,1.48,noticeZ,1.54,.22,.028);
    faceLabel('未滿18歲不得購買或兌領彩券',noticeX,1.48,noticeZ+.020,1.48,.18,'#eee9d9','#65392e');
    monitor(counterX+.57,counterZ-.08,1.24);
    // Printer body, a recessed ticket slot, and a short receipt lying on top.
    b(cream,counterX-.25,1.19,counterZ-.06,.34,.18,.26);
    b(dark,counterX-.25,1.245,counterZ+.077,.20,.025,.015);
    b(paper,counterX-.25,1.255,counterZ+.092,.12,.012,.12);
    b(steel,counterX-.60,1.15,counterZ+.08,.36,.08,.22);
    for(let i=0;i<3;i++)b(paper,counterX-.72+i*.12,1.20,counterZ+.09,.095,.015,.14);
    // Rear ticket rack: repeated, individually framed pockets with varied
    // scratch-card colours; it sits above the counter and inside the wall.
    const rackX=Math.min(rightEnd-1.30,Math.max(rightStart+1.40,.42));
    b(wood,rackX,1.67,back+.11,2.55,1.54,.10);
    b(cream,rackX,1.67,back+.17,2.42,1.42,.025);
    for(let row=0;row<3;row++){
      const y=1.21+row*.43;
      b(steel,rackX,y-.175,back+.24,2.31,.032,.13);
      for(let col=0;col<6;col++){
        const x=rackX-1.00+col*.40;
        b([red,yellow,green,blue][(row+col)%4],x,y,back+.24,.31,.32,.035);
        b(paper,x,y+.055,back+.262,.23,.035,.006);
        b(paper,x,y-.04,back+.262,.17,.014,.006);
      }
    }
    faceLabel('刮刮樂',rackX,2.47,back+.23,1.12,.20,'#e4a629','#693c2c');
    // The wide shop's right-hand wall holds another shallow scratch-card rack.
    // Its feet rest on the floor and it sits clear of both the existing rear
    // rack and the entrance aisle; individual cards are supported by ledges.
    const scratchX=Math.min(rightEnd-1.16,3.50),scratchZ=back+.27;
    fixed(cream,scratchX,1.27,scratchZ,2.20,2.26,.34);
    b(wood,scratchX,1.31,back+.46,2.08,2.06,.025);
    for(let row=0;row<4;row++){
      const y=.52+row*.46;
      b(steel,scratchX,y-.175,back+.50,2.00,.035,.18);
      for(let col=0;col<5;col++){
        const x=scratchX-.80+col*.40;
        b([yellow,red,green,blue][(row*2+col)%4],x,y,back+.49,.30,.32,.032);
        b(paper,x,y+.065,back+.51,.23,.035,.006);
        b(paper,x,y-.04,back+.51,.18,.018,.006);
        b(paper,x,y-.09,back+.51,.12,.012,.006);
      }
    }
    faceLabel('即開型彩券',scratchX,2.50,back+.48,1.80,.23,'#e4a629','#623629');
    // A writing surface at the far right gives customers a place to mark a
    // play slip. It does not simulate a purchase or display real draw results.
    const writingX=rightEnd-.47,writingZ=front-.92;
    b(wood,writingX,.93,writingZ,.72,.07,.48);
    for(const dx of [-.27,.27])for(const dz of [-.16,.16])
      b(steel,writingX+dx,.525,writingZ+dz,.035,.77,.035);
    hit(writingX,.57,writingZ,.76,.88,.52);
    for(const dx of [-.17,.17]){
      b(paper,writingX+dx,.970,writingZ,.25,.008,.31);
      for(let line=0;line<4;line++)b(dark,writingX+dx,.976,writingZ-.10+line*.055,.18,.003,.009);
    }
    b(blue,writingX+.22,.986,writingZ+.07,.014,.014,.22);
    b(steel,writingX,1.19,writingZ-.17,.025,.43,.025);
    b(cream,writingX,1.45,writingZ-.17,.68,.19,.035);
    faceLabel('選號填單',writingX,1.45,writingZ-.145,.63,.16,'#eee9d9','#34413f');
    faceLabel('購買須知',scratchX,2.75,back+.15,1.14,.18,'#eee9d9','#34413f');
    // A slim wall display in the left bay is outside the central entrance.
    const wallX=-width/2+1.00;
    b(orange,wallX,1.75,back+.12,1.40,1.32,.05);
    faceLabel('台灣彩券',wallX,2.10,back+.155,1.25,.26,'#e4a629','#b83e34','公益彩券');
    for(let i=0;i<3;i++)b(paper,wallX-.42+i*.42,1.62,back+.16,.32,.43,.025);
    return {features:['公益彩券櫃檯','彩券終端與列印機','刮刮樂陳列架','選號填單桌','台灣彩券服務資訊']};
  }

  if (type==='convenience') {
    // The chains share this layout, but each brand stocks it a little
    // differently: a per-brand seed shifts the product colour sequence,
    // the case's back-row rhythm and the gondola header wording, and the
    // two aisles within a store are stocked differently as well.
    const seed=api.name?.includes('全家')?1:api.name?.includes('萊爾富')?2:api.name?.includes('OK')?3:0;
    const pick=i=>colors[(i+seed*3)%colors.length];
    const gondolaSigns=[['零食・泡麵','飲料・日用品'],['零食・泡麵','飲料・生活用品'],['餅乾・泡麵','冷飲・日用品'],['零食・糖果','飲料・日用品']][seed];
    // Checkout counter on the right of the entrance, two gondola aisles to
    // the left and a refrigerated case along the back wall. The entrance
    // aisle (entryX) stays clear from front to back.
    const counterW=Math.min(2.9,rightEnd-rightStart-.15), counterX=rightStart+.08+counterW/2;
    const counterZ=front-1.02;
    fixed(cream,counterX,.60,counterZ,counterW,.92,.62);
    b(white,counterX,1.085,counterZ,counterW+.05,.06,.68);
    monitor(counterX+.55,counterZ-.06,1.22);
    // Tea-egg pot and a small heated case sit on the counter's front end.
    c(dark,counterX-.95,1.24,counterZ+.10,.16,.16);
    for(let i=0;i<5;i++){const a=i/5*Math.PI*2;b(cream,counterX-.95+Math.cos(a)*.085,1.30,counterZ+.10+Math.sin(a)*.085,.055,.045,.055);}
    faceLabel('茶葉蛋',counterX-.95,1.02,counterZ+.325,.52,.15,'#e4e6dc','#34413f');
    faceLabel('結帳',counterX+.30,1.02,counterZ+.325,.62,.17,'#e4e6dc','#34413f');
    // Gondola aisles: a frame of end panels, a thin centre spine and shelf
    // boards, so products stand ON the boards in the open instead of being
    // buried inside a solid steel block (the previous construction).
    for(const [aisle,aisleX] of [-width/2+1.15,-width/2+2.85].entries()){
      const aisleZ=back+2.05;
      for(const dx of [-1,1])b(steel,aisleX+dx*.43,1.02,aisleZ,.06,1.78,.62);
      b(steel,aisleX,1.02,aisleZ,.90,1.78,.05);
      b(steel,aisleX,1.93,aisleZ,.98,.06,.66);
      b(dark,aisleX,.20,aisleZ,.94,.12,.64);
      hit(aisleX,1.02,aisleZ,.92,1.78,.62);
      for(let level=0;level<3;level++){
        const shelfY=.30+level*.52,top=shelfY+.0175;
        b(cream,aisleX,shelfY,aisleZ,1.02,.035,.72);
        for(let col=0;col<4;col++){
          const x=aisleX-.36+col*.24;
          if((level+col)%3===2)bottle(x,top,aisleZ+.17,pick(level*2+col+aisle));
          else carton(x,top+.095,aisleZ+.17,.20,.19,.24,pick(level+col+aisle*2),pick(level+col+3+aisle*2));
          if((level+col)%3!==2)carton(x,top+.095,aisleZ-.17,.20,.19,.24,pick(level+col+5+aisle),pick(level+col+1+aisle));
          else bottle(x,top,aisleZ-.17,pick(level*3+col+aisle*3));
        }
      }
    }
    faceLabel(gondolaSigns[0],-width/2+1.15,2.02,back+2.42,1.00,.18,'#e4e6dc','#34413f');
    faceLabel(gondolaSigns[1],-width/2+2.85,2.02,back+2.42,1.00,.18,'#e4e6dc','#34413f');
    // Promo carton stack in front of the first gondola, facing the glass
    // (observation round 2, R1-6): from the street the entrance axis read
    // as bare floor. The stack sits left of the entrance aisle, which the
    // layout rule above keeps clear, and gives the storefront a
    // special-offer display like a real chain's door-side promo pile.
    for(const [ci,[px,py]] of [[-.21,.12],[.21,.12],[-.21,.36],[.21,.36]].entries())
      carton(-width/2+1.15+px,py,1.55,.40,.24,.42,pick(ci+seed),pick(ci+seed+2));
    hit(-width/2+1.15,.30,1.55,.84,.60,.44);
    faceLabel('特價',-width/2+1.15,.80,1.78,.80,.22,'#c03a2e','#ffffff','本週特價');
    // Refrigerated case along the back wall, right of the aisles. Like the
    // exemplar cabinets it is a frame — thin back panel, side posts, top
    // beam and plinth — with bottles standing on open shelves behind two
    // framed glass doors, instead of inside a solid white block.
    const caseX=Math.min(rightEnd-1.25,counterX+.35),caseZ=back+.42;
    b(white,caseX,1.06,caseZ-.245,2.30,1.86,.08);
    for(const dx of [-1,1])b(white,caseX+dx*1.10,1.06,caseZ,.10,1.86,.58);
    b(white,caseX,1.93,caseZ,2.30,.12,.58);
    b(white,caseX,.23,caseZ,2.30,.18,.58);
    b(cream,caseX,1.10,caseZ-.19,2.14,1.48,.02);
    b(lit,caseX,1.83,caseZ+.08,2.00,.03,.03);
    hit(caseX,1.06,caseZ,2.30,1.86,.58);
    for(let level=0;level<3;level++){
      const shelfY=.52+level*.46,top=shelfY+.015;
      b(steel,caseX,shelfY,caseZ+.01,2.14,.03,.42);
      for(let col=0;col<8;col++){
        const x=caseX-.91+col*.26;
        // One gap per shelf, at a brand-specific spot, reads as real stocking.
        if((col+level+seed)%8!==6)bottle(x,top,caseZ+.12,pick(level+col));
        const backRow=seed===2?col%3!==1:seed===3?col%2===1:col%2===0;
        if(backRow)bottle(x+.13,top,caseZ-.06,pick(level+col+4));
      }
    }
    for(const dx of [-1,1]){
      const doorX=caseX+dx*.545;
      b(glass,doorX,1.10,caseZ+.295,1.03,1.50,.015);
      b(steel,doorX,1.87,caseZ+.295,1.09,.045,.03);
      b(steel,doorX,.33,caseZ+.295,1.09,.045,.03);
      b(steel,doorX+dx*.52,1.10,caseZ+.295,.045,1.54,.03);
      b(steel,doorX-dx*.30,1.10,caseZ+.325,.03,.62,.025);
    }
    b(steel,caseX,1.10,caseZ+.295,.05,1.54,.03);
    faceLabel('冷藏飲料',caseX,2.12,caseZ+.31,1.15,.19,'#e4e6dc','#34413f');
    // ATM kiosk just inside the left front window.
    const atmX=-width/2+.62,atmZ=front-1.05;
    fixed(dark,atmX,.78,atmZ,.58,1.30,.42);
    b(screen,atmX,1.13,atmZ+.215,.40,.30,.012);
    b(lit,atmX-.05,1.16,atmZ+.222,.22,.016,.006);
    faceLabel('ATM',atmX,.38,atmZ+.215,.40,.16,'#e4e6dc','#34413f');
    // Autumn/winter seasonal stocking (Stage 4): a noodle-cup end-cap at
    // the front of the first aisle, and one signature counter item per
    // chain, so the three stores differ in what they are selling, not
    // only in how the same goods are shuffled.
    const cupRed=m('seasonal noodle red','#c23b2a',{roughness:.6});
    const cupOrange=m('seasonal noodle orange','#d96c2c',{roughness:.6});
    const cupCream=m('seasonal noodle cream','#e8e2cc',{roughness:.6});
    const [cupA,cupB,popText,popBg]=[
      null,
      [cupRed,cupCream,'火之國文龍 拉麵','#c23b2a'],
      [cupOrange,cupRed,'泡麵大賞 熱呼呼','#e60012'],
      [blue,cupCream,'泡麵・熱飲補給','#f15a24'],
    ][seed]||[cupRed,cupCream,'泡麵・熱飲','#34413f'];
    const capX=-width/2+1.15,capZ=back+2.05+.50;
    b(dark,capX,.41,capZ,1.0,.82,.34);
    b(steel,capX,.93,capZ,.80,.22,.30);
    for(let col=0;col<4;col++)c(cupA,capX-.33+col*.22,.865,capZ,.052,.09);
    for(let col=0;col<3;col++)c(cupB,capX-.22+col*.22,1.085,capZ,.052,.09);
    for(const dx of [-1,1])b(steel,capX+dx*.46,1.28,capZ+.15,.03,.92,.03);
    faceLabel(popText,capX,1.80,capZ+.165,1.06,.22,popBg,'#ffffff');
    hit(capX,.45,capZ,1.0,.9,.36);
    // Signature counter item, on the counter top away from the monitor.
    const ix=counterX+1.08;
    if(seed===1){
      // Winter limited hot drinks (2026-11-15): two distinguishable
      // bottles replace the uniform amber stock — dark-amber
      // 桂圓薏仁飲 on the lower shelf, milky 杏仁燕麥飲 above — each
      // with its own cap and label colour, and a 59元 period POP on
      // the cabinet glass. The Let's Tea header stays as it was.
      const longan=m('winter longan drink','#7c4a1e',{roughness:.45});
      const longanCap=m('winter longan cap','#a03a2a',{roughness:.55});
      const longanLabel=m('winter longan label','#ecdfc2',{roughness:.85});
      const almond=m('winter almond drink','#e7dab9',{roughness:.5});
      const almondCap=m('winter almond cap','#c98d4e',{roughness:.55});
      const almondLabel=m('winter almond label','#f6f1e4',{roughness:.85});
      const winterBottle=(x,y,z,body,cap,labelMat)=>{
        c(body,x,y+.11,z,.046,.22);
        c(cap,x,y+.225,z,.034,.025);
        b(labelMat,x,y+.12,z+.047,.065,.10,.007);
      };
      b(dark,ix,1.155,counterZ,.56,.08,.40);
      b(cream,ix,1.44,counterZ-.17,.50,.44,.03);
      b(steel,ix,1.47,counterZ,.50,.02,.34);
      for(let col=0;col<3;col++)winterBottle(ix-.15+col*.15,1.20,counterZ+.02,longan,longanCap,longanLabel);
      for(let col=0;col<3;col++)winterBottle(ix-.15+col*.15,1.49,counterZ+.02,almond,almondCap,almondLabel);
      b(glass,ix,1.44,counterZ+.02,.56,.50,.36);
      // The price POP stands on the counter in front of the monitor,
      // clear of the cabinet, so it never hides the bottles.
      b(dark,ix-.50,1.125,counterZ+.30,.42,.02,.06);
      faceLabel('59元',ix-.50,1.26,counterZ+.30,.44,.24,'#0d7a4a','#ffffff','桂圓薏仁飲・杏仁燕麥飲 11月11日–12月8日');
      faceLabel("Let's Tea 熱飲",ix,1.86,counterZ+.21,.82,.20,'#0d7a4a','#ffffff');
    }else if(seed===2){
      const potato=m('seasonal sweet potato','#c97b2e',{roughness:.8});
      // Open frame, not a solid box: plinth, back, top and side posts,
      // with the potatoes resting on a stone slab where they can be
      // seen through the front glass.
      b(dark,ix,1.15,counterZ,.56,.07,.40);
      b(dark,ix,1.375,counterZ-.185,.56,.45,.03);
      b(dark,ix,1.595,counterZ,.56,.04,.40);
      b(dark,ix-.265,1.375,counterZ,.03,.41,.40);
      b(dark,ix+.265,1.375,counterZ,.03,.41,.40);
      b(steel,ix,1.205,counterZ+.01,.48,.03,.32);
      s(potato,ix-.13,1.26,counterZ-.04,.052,.040,.080);
      s(potato,ix+.10,1.26,counterZ+.05,.048,.038,.074);
      s(potato,ix-.02,1.26,counterZ+.10,.050,.039,.077);
      s(potato,ix+.02,1.345,counterZ-.08,.050,.040,.076);
      s(potato,ix-.14,1.345,counterZ-.02,.046,.036,.070);
      b(glass,ix,1.375,counterZ+.205,.50,.38,.012);
      faceLabel('夯番薯',ix,1.64,counterZ+.21,.60,.20,'#e60012','#ffffff');
    }else if(seed===3){
      b(dark,ix,1.42,counterZ,.50,.54,.38);
      b(screen,ix-.07,1.52,counterZ+.195,.26,.18,.01);
      b(lit,ix-.07,1.40,counterZ+.197,.20,.014,.006);
      c(white,ix+.09,1.16,counterZ+.27,.032,.09);
      c(white,ix+.23,1.16,counterZ+.27,.032,.09);
      faceLabel('OK CAFÉ 現煮咖啡',ix,1.86,counterZ+.21,.88,.20,'#f15a24','#ffffff');
    }
    return {features:['結帳櫃檯','茶葉蛋鍋','商品貨架','冷藏飲料櫃','ATM','秋冬季節商品']};
  }

}
