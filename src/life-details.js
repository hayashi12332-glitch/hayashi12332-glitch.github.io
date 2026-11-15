// Small utility details belong to the existing occupied buildings. Dimensions
// are metres; all parts use the world's shared instanced primitive batches.
// These boxes are mounted on the existing columns, not in pedestrian space.
export function addLifeDetails({box,mat}){
  const metal=mat('galvanized metal','#a6aba8',{metalness:.82,roughness:.47});
  const dark=mat('dark painted steel','#3c5350');
  const ivory=mat('ivory','#f4ecda');
  const black=mat('rubber','#303d3c');
  const paper=mat('kraft paper bags','#c7a577',{roughness:.98});
  const wood=mat('shop wood','#957550',{roughness:.8});
  const toWorld=(cx,cz,lx,lz,angle)=>[
    cx+Math.cos(angle)*lx+Math.sin(angle)*lz,
    cz-Math.sin(angle)*lx+Math.cos(angle)*lz
  ];
  // Each set is flush to a column's street face. The public address is on
  // the other column, and the dimensions never intrude into the clear aisle.
  function meter(cx,cz,width,front,angle,conduit=true){
    const lx=width/2-.18;
    const b=(m,x,y,z,w,h,d)=>{const [px,pz]=toWorld(cx,cz,x,z,angle);box(m,px,y,pz,w,h,d,angle);};
    const face=front+.025;
    // Metal wall box with a recessed, lightly framed reading window.
    b(metal,lx,1.63,face,.28,.41,.08);
    b(dark,lx,1.66,face+.044,.20,.21,.012);
    b(ivory,lx,1.67,face+.052,.165,.165,.008);
    b(black,lx,1.68,face+.057,.105,.025,.004);
    for(let i=-1;i<=1;i++)b(dark,lx+i*.035,1.61,face+.058,.014,.025,.004);
    for(const side of [-1,1])b(dark,lx+side*.105,1.48,face+.045,.016,.016,.008);
    if(conduit){
      // A continuous capped conduit connects the meter to the overhead beam.
      // It shares the same narrow column face and leaves the sign board clear.
      b(metal,lx,2.36,face-.015,.025,1.08,.026);
      b(dark,lx,2.02,face+.001,.055,.025,.029);
      b(dark,lx,2.72,face+.001,.055,.025,.029);
      b(metal,lx,1.32,face-.015,.025,.23,.026);
    }
  }
  // Five meters on main-street columns: all are on the far column from the
  // number plate. The old-street arcade centreline x=-5.4 stays unobstructed.
  meter(-8.15,-8.4,5.4,4.75,Math.PI/2);
  meter(-8.15,-2.65,5.6,4.75,Math.PI/2);
  meter(-8.15,3.15,5.4,4.75,Math.PI/2);
  meter(-8.15,11.6,5.8,4.75,Math.PI/2);
  meter(7.7,-8.2,5.6,4.55,-Math.PI/2);
  // Three occupied cross-street frontages use the same hardware. Heights stay
  // below business fascia, sign plates and the traffic lights at the corner.
  meter(-25,-25,6.2,4,0);
  meter(-18.1,-25,7.1,4,0);
  meter(18.6,-25,6.7,4,0);

  // Rear-wall utility boxes serve the same buildings from the service lane.
  // The wall is z=-29. Every surface remains within .13m of it; the lane
  // centre z=-31.25 and the escape-stair and duct footprints remain clear.
  // The selected x positions also avoid the rear windows and air conditioners.
  for(const [x,variation] of [[-27.0,0],[-13.85,1],[4.75,2],[10.0,3]]){
    const wall=-29,y=1.64,w=variation%2?.30:.35,h=variation%2?.40:.46;
    box(metal,x,y,wall-.055,w,h,.11);
    // A low-contrast inset and fasteners read as a service enclosure without
    // inventing a company logo or a fictional piece of public information.
    box(dark,x,y+.02,wall-.115,w-.065,h-.095,.01);
    box(ivory,x,y+.035,wall-.122,w-.105,.15,.006);
    for(const side of [-1,1])box(dark,x+side*(w/2-.035),y-h/2+.035,wall-.116,.016,.016,.008);
    // Both conduit runs touch the housing; the upper one terminates in a
    // small wall junction, while the lower run stops above ground splash.
    const cableX=x+(variation%2?.07:-.07),top=y+h/2;
    box(metal,cableX,(top+3.35)/2,wall-.025,.026,3.35-top,.05);
    box(dark,cableX,3.37,wall-.04,.10,.11,.08);
    box(metal,cableX,(y-h/2+.35)/2,wall-.025,.026,y-h/2-.35,.05);
    for(const clampY of [1.02,2.48,3.02])box(dark,cableX,clampY,wall-.052,.055,.025,.035);
  }

  // Bands on the existing two stacked stock cartons beside the convenience
  // store's wall. The cartons already exist; no item is placed in an entrance.
  box(paper,10.02,1.025,1.12,.055,.008,.49);
  box(wood,10.02,.87,1.374,.055,.28,.008);
  box(paper,9.86,1.025,1.12,.17,.008,.095);
}
