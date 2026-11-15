// A few low-profile details inspired by the paintover. All measures are metres.
// The existing paving and traffic remain the actual walking/road surfaces.
export function addPaintoverDetails({box,mat}){
  const grout=mat('grout','#aaa79a');
  // The arcade has its own raised floor over the older sidewalk markings.
  // Put fine joints just above that finish, aligned with its existing grid.
  for(const x of [-5.51,-4.79,-4.07]){
    box(grout,x,.146,1.65,.009,.002,25.7);
  }
  for(let row=0;row<36;row++){
    const z=-11.0+row*.72;
    if(z>14.5)break;
    box(grout,-4.78,.146,z,2.80,.002,.009);
  }

  // Small resurfacing fragments sit just above the road. Uneven edge bands
  // soften the formerly perfectly rectangular silhouettes while preserving
  // the original repair locations and keeping the traffic markings above them.
  // Each band is disjoint, so coplanar faces do not fight in the depth buffer.
  const asphalt=mat('repaired asphalt','#4b5353');
  const bands=[[-.04,.76],[.025,.92],[-.035,.98],[.015,.96],[-.025,.98],[.035,.88],[-.02,.73]];
  for(const [x,z,w,d,angle] of [
    [-.35,3.25,.48,.65,.02],[.78,-5.1,.56,.78,-.03],
    [-1.15,7.1,.30,.42,.04],[1.65,5.4,.30,.49,-.02],
  ]){
    const dz=d/bands.length,c=Math.cos(angle),s=Math.sin(angle);
    bands.forEach(([offset,width],i)=>{
      const lx=offset*w,lz=(i+.5)*dz-d/2;
      box(asphalt,x+c*lx+s*lz,.048,z-s*lx+c*lz,w*width,.002,dz,angle);
    });
  }
  // Fine, connected repaired seams taper at their ends, with no raised physical
  // collision. The repeated short segments follow subtle changes in direction.
  const seams=mat('asphalt seam','#394242');
  for(const points of [
    [[-.48,4.04],[-.42,4.29],[-.49,4.52],[-.64,4.72],[-.76,4.88]],
    [[1.65,-4.24],[1.71,-4.03],[1.66,-3.82],[1.76,-3.62]],
    [[-1.08,-9.42],[-1.05,-9.20],[-1.01,-8.95]],
    [[.40,8.25],[.45,8.47],[.42,8.72],[.49,8.84]],
  ]){
    for(let i=1;i<points.length;i++){
      const [x0,z0]=points[i-1],[x1,z1]=points[i];
      const dx=x1-x0,dz=z1-z0,length=Math.hypot(dx,dz);
      // Keep adjoining segments a hair apart to avoid overlapping top faces.
      if(length>.004)box(seams,(x0+x1)/2,.048,(z0+z1)/2,.006,.002,length-.002,Math.atan2(dx,dz));
    }
  }
}
