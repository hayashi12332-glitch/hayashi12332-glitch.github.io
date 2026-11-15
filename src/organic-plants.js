// Small, original low-poly planting for the existing street. Window boxes are
// anchored to the OUTSIDE face of an actual window, not to the wall volume.
// `face` is the window surface (x,z); `y` is the top of its existing sill.
// Yaw transforms local +Z to the outward normal and local X along the ledge.
// The exported specs also let offline QA inspect every installation.
export const WINDOW_BOX_SPECS = Object.freeze([
  {id:'tea-lower',face:[-3.22,-9.669],y:4.11,yaw:Math.PI/2,seed:1},
  // The lower window's deep balcony hides a planter when seen from below;
  // the upper window has a clear sill and a readable, naturally supported box.
  {id:'dry-upper',face:[-3.22,-1.334],y:6.69,yaw:Math.PI/2,seed:2},
  {id:'food-upper',face:[-3.22,1.881],y:6.69,yaw:Math.PI/2,seed:3},
  {id:'herbs-west-lower',face:[-3.22,10.237],y:4.11,yaw:Math.PI/2,seed:4},
  // A fabric sign moves beside the other lower window; place the lower box
  // on the opposite window and keep its upper counterpart above the sign.
  {id:'herbs-east-lower',face:[2.97,-6.884],y:4.11,yaw:-Math.PI/2,seed:5},
  {id:'herbs-east-upper',face:[2.97,-9.516],y:6.69,yaw:-Math.PI/2,seed:6},
  {id:'breakfast-lower',face:[4.37,10.5075],y:4.11,yaw:-Math.PI/2,seed:7},
  {id:'breakfast-upper',face:[4.37,13.0925],y:6.69,yaw:-Math.PI/2,seed:8},
  {id:'laundry-lower',face:[-25,-20.91],y:3.84,yaw:0,seed:9},
  {id:'bank-upper',face:[-18.1,-20.91],y:6.54,yaw:0,seed:10},
  {id:'phone-lower',face:[-10.442,-20.91],y:3.84,yaw:0,seed:11},
  {id:'drinks-upper',face:[-6.6,-20.91],y:6.54,yaw:0,seed:12},
  {id:'estate-lower',face:[6.6,-20.91],y:3.84,yaw:0,seed:13},
  {id:'barber-lower',face:[10.634,-20.91],y:3.84,yaw:0,seed:14},
  {id:'rechao-lower',face:[20.409,-20.91],y:3.84,yaw:0,seed:15},
  {id:'bakery-lower',face:[25.2,-20.91],y:3.84,yaw:0,seed:16},
]);

// Centimetre-scale separation accounts for animated leaf movement as well as
// its static extent. The small exterior shelf overlaps the sill on purpose.
export const WINDOW_BOX_PLACEMENT = Object.freeze({
  centreOffset:.31, shelfCentreOffset:.22, shelfDepth:.46,
  supportRails:Object.freeze([.22,.40]), boxDepth:.23, supportDrop:.14,
  maxLeafScale:.54, maxWindDisplacement:.032,
});

// Positions are deterministic; shop doors and crossings stay unobstructed.
// The caller batches primitives with the rest of the world.
export function addOrganicPlants({box,cyl,primitive,mat,solid}){
  const foliage=mat('leaf surface','#45684b',{roughness:.52});
  const young=mat('new leaf surface','#738748',{roughness:.57});
  const darkLeaf=mat('organic deep leaf','#315b45',{roughness:.62});
  const paleLeaf=mat('organic sunlit leaf','#8b9b56',{roughness:.6});
  const clay=mat('terracotta','#b57754',{roughness:.88});
  const stone=mat('cement plant pot','#aaa79a',{roughness:.9});
  const soil=mat('pot soil','#514c3b',{roughness:.98});
  const rim=mat('organic planter rim','#76664e',{roughness:.84});

  // Narrow leaves are shared seven-sided geometry, not a set of billboards.
  // Golden-angle spacing and per-plant phase prevent a repeated radial pattern.
  function leafy(x,y,z,scale,seed,count=11){
    for(let i=0;i<count;i++){
      const a=i*2.399963+seed*1.41;
      const reach=scale*(.11+.045*(i%3)+.018*Math.sin(seed+i));
      const height=scale*(.20+.065*(i%4)+.025*Math.sin(seed*2+i));
      const lx=x+Math.cos(a)*reach,lz=z+Math.sin(a)*reach;
      const ly=y+height;
      cyl(darkLeaf,(x+lx)/2,y+height*.48,(z+lz)/2,.007*scale,height*.93);
      primitive('leaf',i%5===0?paleLeaf:i%3===0?young:i%4===0?darkLeaf:foliage,
        [lx,ly,lz],[scale*(.070+.012*(i%2)),scale*.014,scale*(.15+.018*(i%3))],
        [-.32-(i%4)*.09,a,.10*Math.sin(a)]);
    }
  }

  function windowBox({face:[faceX,faceZ],y,yaw:angle,seed}){
    const normalX=Math.sin(angle),normalZ=Math.cos(angle);
    const tangentX=Math.cos(angle),tangentZ=-Math.sin(angle);
    const x=faceX+normalX*WINDOW_BOX_PLACEMENT.centreOffset;
    const z=faceZ+normalZ*WINDOW_BOX_PLACEMENT.centreOffset;
    const baseY=y-WINDOW_BOX_PLACEMENT.supportDrop;
    const m=seed%3===0?stone:clay;
    // The original sill is too shallow. Two slender rails support the base;
    // a pair of small brackets attach the rails back to the window sill.
    // A solid deep slab here looks like an unrelated box from the pavement.
    for(const offset of WINDOW_BOX_PLACEMENT.supportRails){
      box(rim,faceX+normalX*offset,baseY-.0125,faceZ+normalZ*offset,
        .64,.025,.035,angle);
    }
    for(const side of [-1,1]){
      const tx=tangentX*side*.24,tz=tangentZ*side*.24;
      box(rim,faceX+tx+normalX*.22,baseY-.0375,faceZ+tz+normalZ*.22,.025,.025,.46,angle);
      // A compact clip joins each horizontal bracket directly to the sill.
      box(rim,faceX+tx+normalX*.04,baseY-.019,faceZ+tz+normalZ*.04,.035,.058,.035,angle);
    }
    box(m,x,baseY+.085,z,.56,.17,.23,angle);
    box(rim,x,baseY+.175,z,.58,.025,.25,angle);
    box(soil,x,baseY+.189,z,.51,.009,.18,angle);
    for(let i=0;i<3;i++){
      const along=(i-1)*.16,px=x+Math.cos(angle)*along,pz=z-Math.sin(angle)*along;
      // Keep leaves above the rim. Former downward-hanging leaves passed
      // through the planter wall and appeared as green slits on its face.
      leafy(px,baseY+.19,pz,.42+((seed+i)%3)*.06,seed+i,7);
    }
  }
  WINDOW_BOX_SPECS.forEach(windowBox);

  function floorPot(x,z,seed){
    const scale=.72+(seed%3)*.08,pot=seed%2?stone:clay;
    cyl(pot,x,.14+.16*scale,z,.17*scale,.32*scale);
    cyl(rim,x,.14+.326*scale,z,.18*scale,.026*scale);
    cyl(soil,x,.14+.345*scale,z,.155*scale,.012*scale);
    leafy(x,.14+.35*scale,z,scale,seed,9);
    // Small footprint is against an existing column, away from clear paths.
    solid(x,.14+.16*scale,z,.34*scale,.32*scale,.34*scale);
  }
  // Each pot is by a frontage column, well clear of the left-hand entrance.
  [[-27.67,-21.16],[-14.95,-21.16],[-14.20,-21.16],[-4.40,-21.16],
   [8.80,-21.16],[14.70,-21.16],[21.55,-21.16],[22.85,-21.16]]
    .forEach(([x,z],i)=>floorPot(x,z,i+21));

  // A few tiny shoots grow next to the sheltered side walls, not across the
  // path. Their shadows and slight height break up the perfectly clean edge.
  for(const [x,z,seed] of [[-3.96,-26.8,1],[-3.96,-31.8,2],[3.96,-28.1,3],[3.96,-34,4]]){
    for(let i=0;i<4;i++){
      const a=seed+i*2.4;
      primitive('leaf',i%2?foliage:young,[x+Math.cos(a)*.035,.18+i*.012,z+Math.sin(a)*.04],
        [.022,.008,.095],[-1.05,a,.04]);
    }
  }
  return {windowBoxes:WINDOW_BOX_SPECS.length,floorPots:8,wallTufts:4};
}
