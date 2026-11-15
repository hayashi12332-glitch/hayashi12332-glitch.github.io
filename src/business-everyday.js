// Original procedural shop fittings. All positions are local metres; floor is y=.14.
// The common left entrance remains clear along its full approach to the back wall.
export function furnishEveryday(type,api){
  if(type!=='laundry'&&type!=='barber')return {features:[]};
  const {width,front,back,entryX,b,c,s,label,hit,m}=api;
  const steel=m('business steel','#a0a8a8',{metalness:.7,roughness:.35});
  const ivory=m('business ivory','#e1dccf');
  const charcoal=m('business charcoal','#323d40');
  const wood=m('business wood','#9c7654');
  const red=m('business red','#a94938');
  const teal=m('business teal','#367c7a');
  const left=-width/2+.25,right=width/2-.25;
  const aisleRight=entryX+.65;

  if(type==='laundry'){
    const drum=m('business drum glass','#425d60',{metalness:.20,roughness:.20});
    const enamel=m('business laundry enamel','#d4d8d2',{metalness:.18,roughness:.42});
    const machineWidth=.86,machineDepth=.78;
    // Front-loading doors use a raised steel ring around a recessed dark drum.
    const machine=(x,z,y,dryer=false,number=1)=>{
      const height=1.14,face=z+machineDepth/2;
      b(enamel,x,y,z,machineWidth,height,machineDepth);
      b(charcoal,x,y-height/2+.055,face+.006,machineWidth-.04,.065,.018);
      b(steel,x,y+.41,face+.016,machineWidth-.055,.20,.035);
      b(charcoal,x-.16,y+.41,face+.039,.20,.075,.014);
      b(teal,x-.16,y+.41,face+.049,.13,.025,.006);
      c(charcoal,x+.18,y+.41,face+.047,.055,.025,Math.PI/2);
      b(steel,x+.18,y+.43,face+.063,.012,.035,.009);
      c(steel,x,y-.035,face+.03,.302,.065,Math.PI/2);
      c(charcoal,x,y-.035,face+.069,.260,.023,Math.PI/2);
      c(drum,x,y-.035,face+.085,.232,.022,Math.PI/2);
      // Stainless drum perforations and curved-window highlights are kept
      // within the round opening. The horizontal grip is separate from the
      // rim, as on commercial self-service machines.
      for(const [px,py] of [[-.09,-.10],[0,-.12],[.09,-.10],[-.14,-.035],[.14,-.035],[-.10,.06],[0,.085],[.10,.06]])
        c(charcoal,x+px,y-.035+py,face+.099,.009,.006,Math.PI/2);
      s(ivory,x-.09,y+.075,face+.099,.055,.010,.004);
      b(charcoal,x,y-.04,face+.107,.40,.038,.022);
      b(steel,x+.18,y-.04,face+.121,.058,.029,.012);
      for(const px of [-.30,.30])for(const py of [-.41,.25])
        c(charcoal,x+px,y+py,face+.024,.012,.007,Math.PI/2);
      label({text:`${dryer?'烘衣':'洗衣'} ${String(number).padStart(2,'0')}`,x,y:y+.27,z:face+.043,width:.30,height:.10,bg:'#e1dccf',fg:'#323d40',kind:'service'});
      hit(x,y,z,machineWidth,height,machineDepth+.11);
    };
    const rearZ=back+.15+machineDepth/2;
    const firstX=Math.max(aisleRight+.52,-.25);
    for(let i=0;i<3;i++)machine(firstX+i*.99,rearZ,.14+1.14/2,false,i+1);
    const dryerX=right-machineWidth/2-.02,dryerZ=front-1.28;
    machine(dryerX,dryerZ,.14+1.14/2,true,4);
    machine(dryerX,dryerZ,.14+1.14*1.5+.035,true,5);
    b(steel,dryerX,1.297,dryerZ,machineWidth+.015,.035,machineDepth+.015);
    // The narrow folding station fits on the opposite side of the entrance aisle.
    const foldX=left+.29,foldZ=front-1.20;
    b(wood,foldX,.96,foldZ,.58,.07,1.58);
    for(const dx of [-.235,.235])for(const dz of [-.70,.70])b(steel,foldX+dx,.54,foldZ+dz,.045,.80,.045);
    hit(foldX,.57,foldZ,.58,.86,1.58);
    for(let i=0;i<3;i++)b(i===1?teal:ivory,foldX,.999+i*.035,foldZ-.42,.39,.03,.31);
    // Open slatted laundry basket under the folding top, not a solid mystery cube.
    b(teal,foldX,.285,foldZ+.25,.48,.035,.54);
    for(const side of [-1,1]){
      b(teal,foldX+side*.24,.57,foldZ+.25,.025,.035,.56);
      b(teal,foldX,.57,foldZ+.25+side*.27,.50,.035,.025);
      for(let i=0;i<4;i++){
        b(teal,foldX+side*.24,.43,foldZ+.04+i*.14,.020,.28,.025);
        b(teal,foldX-.18+i*.12,.43,foldZ+.25+side*.27,.025,.28,.020);
      }
    }
    label({text:'摺衣區',x:foldX,y:.82,z:foldZ+.802,width:.48,height:.17,bg:'#e1dccf',fg:'#323d40',kind:'service'});
    label({text:'洗衣 $60 起',detail:'請先清空口袋・勿超過容量',x:firstX+.99,y:1.64,z:back+.18,width:1.58,height:.43,bg:'#367c7a',fg:'#fff8e8',kind:'service'});
    label({text:'洗脫烘',detail:'請勿洗烘寵物用品、地墊及鞋類',x:firstX+.99,y:2.27,z:back+.18,width:2.04,height:.42,bg:'#e1dccf',fg:'#323d40',kind:'service'});
    return {features:['前開式洗衣機','雙層烘衣機','摺衣檯與洗衣籃','洗衣價目及使用須知']};
  }

  const mirror=m('business mirror','#b5c7c6',{metalness:.78,roughness:.16});
  const barberBlue=m('business barber blue','#41648a');
  const stationXs=[Math.max(aisleRight+.58,-.10),1.22];
  for(const x of stationXs){
    const mirrorZ=back+.20,chairZ=1.18;
    b(wood,x,1.77,mirrorZ,.99,1.18,.08);
    b(steel,x,1.77,mirrorZ+.045,.91,1.10,.025);
    b(mirror,x,1.77,mirrorZ+.065,.84,1.03,.018);
    b(ivory,x-.34,1.77,mirrorZ+.078,.018,.96,.008);
    b(wood,x,.98,back+.46,1.02,.095,.56);
    b(wood,x+.33,.76,back+.43,.30,.36,.46);
    b(steel,x+.33,.81,back+.667,.14,.018,.018);
    hit(x,.69,back+.46,1.02,1.10,.56);
    // Products and combs stay on the station surface.
    for(let i=0;i<2;i++){
      c(i?teal:ivory,x+.20+i*.16,1.105,back+.45,.044,.15);
      c(charcoal,x+.20+i*.16,1.195,back+.45,.028,.035);
    }
    b(charcoal,x-.25,1.041,back+.48,.17,.018,.042);
    // Hydraulic barber chair faces the mirror; the backrest faces the shopfront.
    c(steel,x,.19,chairZ,.28,.075);
    c(steel,x,.43,chairZ,.074,.44);
    b(charcoal,x,.73,chairZ,.58,.16,.55);
    b(teal,x,.82,chairZ,.55,.065,.53);
    // Rounded side rolls preserve the padded-chair silhouette from behind.
    b(charcoal,x,1.08,chairZ+.25,.47,.54,.12);
    for(const side of [-1,1])c(charcoal,x+side*.235,1.08,chairZ+.25,.06,.54);
    b(teal,x,1.08,chairZ+.173,.51,.46,.035);
    for(const y of [.97,1.19])b(charcoal,x,y,chairZ+.315,.37,.012,.009);
    b(steel,x,1.40,chairZ+.25,.035,.16,.035);
    b(charcoal,x,1.49,chairZ+.25,.29,.14,.13);
    for(const side of [-1,1]){
      b(steel,x+side*.32,.87,chairZ,.035,.30,.035);
      b(charcoal,x+side*.32,1.02,chairZ,.09,.075,.51);
      b(steel,x+side*.18,.43,chairZ-.39,.025,.29,.025);
    }
    b(steel,x,.31,chairZ-.47,.48,.035,.27);
    for(let i=0;i<4;i++)b(charcoal,x-.15+i*.10,.332,chairZ-.47,.012,.008,.22);
    hit(x,.85,chairZ+.04,.76,1.42,.66);
    hit(x,.31,chairZ-.47,.50,.08,.28);
  }
  const basinX=right-.43,basinZ=back+.77;
  b(ivory,basinX,.62,basinZ,.62,.96,.58);
  s(ivory,basinX,1.105,basinZ,.41,.13,.34);
  s(charcoal,basinX,1.20,basinZ+.015,.31,.031,.245);
  c(steel,basinX+.25,1.31,basinZ-.20,.023,.25);
  b(steel,basinX+.25,1.435,basinZ-.12,.045,.035,.19);
  c(steel,basinX+.25,1.405,basinZ-.025,.025,.05);
  hit(basinX,.69,basinZ,.82,1.10,.68);
  label({text:'理髮 $250',detail:'剪髮・洗髮・修容',x:.58,y:2.60,z:back+.18,width:1.72,height:.38,bg:'#e1dccf',fg:'#323d40',kind:'service'});
  // An original three-colour pole sits inside this storefront's own footprint.
  const poleX=left+.25,poleZ=front-.38;
  c(steel,poleX,.19,poleZ,.14,.08);
  c(steel,poleX,.82,poleZ,.034,1.22);
  c(steel,poleX,1.45,poleZ,.13,.08);
  for(let i=0;i<12;i++)c([red,ivory,barberBlue,ivory][i%4],poleX,1.52+i*.06,poleZ,.101,.061);
  c(steel,poleX,2.22,poleZ,.13,.08);
  s(ivory,poleX,2.29,poleZ,.095,.07,.095);
  hit(poleX,1.22,poleZ,.28,2.16,.28);
  return {features:['雙座理髮椅與鏡臺','洗髮臺','三色理髮燈柱','剪髮價目表']};
}
