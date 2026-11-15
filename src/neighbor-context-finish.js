// The two existing anonymous shop alcoves retain their purpose and envelope.
// Fittings replace the old floating coloured blocks; no fictional business,
// entrance, address, collider or service is introduced here. Units are metres.
export function addNeighborContextShop(kind,{width,front,b,round,face,mat,merchandiseLabel,palette}){
  const {wood,cream,dark,metal,paper}=palette;
  const pale=mat('neighbor alcove maintained plaster','#c6c5b4',{roughness:.89});
  const grain=mat('neighbor alcove old wood','#85715a',{roughness:.8});
  const drawer=mat('neighbor alcove drawer wood','#75634e',{roughness:.84});
  const seam=mat('neighbor alcove cabinet recess','#414840',{roughness:.95});
  const tin=mat('neighbor alcove tin metal','#8b9c90',{metalness:.55,roughness:.49});
  const bag=mat('neighbor alcove kraft packaging','#c4af86',{roughness:.94});
  b(grain,0,1.40,front-1.78,width-.28,2.70,.04);
  b(pale,0,2.48,front-1.746,width-.31,.51,.027);
  // Restrained board joints are aligned with the backing, not room-wide dirt.
  for(let x=-width/2+.40;x<width/2-.3;x+=.48)
    b(drawer,x,1.40,front-1.756,.008,2.64,.012);
  const units=kind==='north-residential'?[-2.55,2.55]:[.36];
  for(const [unit,x] of units.entries()){
    const w=Math.min(2.62,width-1.65),z=front-1.16;
    // Plinth bottom meets the unchanged ground at y=0. No decorative floor
    // is put over the old collider and no false gap remains below the unit.
    b(seam,x,.055,z,w-.10,.11,.51);
    b(grain,x,.535,z,w,.96,.57);
    b(dark,x,1.045,z,w+.06,.06,.64);
    for(const dx of [-w*.25,w*.25]){
      b(drawer,x+dx,.56,z+.294,w*.5-.045,.83,.028);
      b(metal,x+dx,.86,z+.322,.17,.018,.024);
      for(const offset of [-.065,.065])b(metal,x+dx+offset,.86,z+.310,.018,.026,.032);
    }
    // A supported back shelf gives the same stock a second depth layer.
    b(wood,x,1.70,front-1.52,w-.12,.045,.37);
    for(const dx of [-w*.35,w*.35]){
      b(metal,x+dx,1.58,front-1.72,.025,.24,.033);
      b(metal,x+dx,1.668,front-1.57,.025,.024,.31);
    }
    for(let i=0;i<5;i++){
      const sx=x+(i-2)*.41,back=front-1.55;
      // Folded bags have a base, gusset, folded top and a separate print face.
      const h=.22+(i%2)*.035,bottom=1.076;
      b(bag,sx,bottom+h/2,z,.18,h,.11);
      b(paper,sx,bottom+h-.008,z,.186,.022,.12);
      b(grain,sx+.080,bottom+h*.48,z+.057,.009,h-.035,.006);
      face('plane',merchandiseLabel(i%2?'日用品':'雜貨'),sx,bottom+h*.53,z+.059,.12,.065);
      const base=1.7225,r=.065,th=.18+(i%2)*.025;
      round(tin,sx,base+th/2,back,r,th);
      round(metal,sx,base+th+.007,back,r+.004,.014);
      round(metal,sx,base+.006,back,r+.002,.012);
    }
    // A small reused paper stack sits on the counter rather than in mid-air.
    b(cream,x-w*.40,1.087,z+.07,.20,.022,.17);
  }
  return {kind,features:['supported cabinet plinth','drawer pulls','back shelf brackets','folded bags and rolled-rim tins']};
}
