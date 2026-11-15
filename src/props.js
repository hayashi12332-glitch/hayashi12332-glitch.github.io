import * as THREE from 'three';

// Refinement of the existing GLBs. All procedural surface studies and the
// small serving ladle are original CC0 work, shared by cloned prototypes.
// Coordinates stay in the authored model, so moving a prop never moves its wear.
const textureCache=new Map();
const kindCode={postboxRed:1,postboxGreen:1,stall:2,shelf:3,checkout:4,teaEgg:5};
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const smooth=x=>x*x*(3-2*x);

// The authored shelf groups all stock into one mesh per material.  Adjust
// each existing item around its own centre while retaining the shelf, aisle,
// labels and caps.  A few shallow tapered tops suggest soft packets.  Every
// new width/height is smaller than its original bounding box.
function reshapeShelfStock(node){
  const name=node.material?.name;
  if(!['TW_Green','TW_Red','TW_Canopy','TW_Blue','TW_Cream','TW_Labels'].includes(name))return;
  const geom=node.geometry,pos=geom?.getAttribute('position');if(!pos)return;
  const boxRows=[{lo:.149,hi:.401,base:.15,height:.25},
    {lo:.869,hi:1.121,base:.87,height:.25},
    {lo:1.224,hi:1.456,base:1.225,height:.23}];
  const bottle={lo:.509,hi:.781,base:.51,height:.22};
  const rows=[boxRows[0],bottle,boxRows[1],boxRows[2]];
  const widths=[
    [.90,.97,.82,.94,.88,1], [.94,.92,1,.85,.96,.90],
    [.95,.83,.97,.88,1,.90], [.87,.98,.89,1,.84,.94],
  ];
  const heights=[
    [.88,1,.84,.95,.91,.97], [.86,.95,.89,1,.92,.83],
    [.94,.83,1,.90,.86,.97], [.90,.80,.95,.86,1,.82],
  ];
  // Small stagger and lean, still within the authored shelf and clear of the
  // next stock item; labels and caps receive the same transform.
  const depthOffsets=[-.010,.008,-.006,.011,-.012,.006];
  const leanOffsets=[.006,-.008,.009,-.005,.008,-.007];
  const stockColour=['TW_Green','TW_Red','TW_Canopy','TW_Blue'].includes(name);
  const colours=stockColour?new Float32Array(pos.count*3).fill(1):null;
  const tints=[[1,.96,.91],[.91,.97,1],[.96,.91,.84],[1,.97,.98],[.93,1,.94],[1,.91,.89]];
  let changed=0;
  for(let i=0;i<pos.count;i++){
    const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);
    // No authored stock extends beyond these depth limits; shelf lips do.
    if(z<-.051||z>.191)continue;
    let row=-1;
    if(name==='TW_Labels'){
      if(z<.124||z>.190)continue;
      if(y>.245&&y<.322)row=0;
      else if(y>.595&&y<.655)row=1;
      else if(y>.965&&y<1.043)row=2;
      else if(y>1.31&&y<1.39)row=3;
    }else if(name==='TW_Cream'){
      // Cream bottle caps: stay registered to their corresponding bottles.
      if(y>.725&&y<.781&&z>.035&&z<.105)row=1;
    }else{
      if(y>=boxRows[0].lo&&y<=boxRows[0].hi)row=0;
      else if(y>=bottle.lo&&y<=.731)row=1;
      else if(y>=boxRows[1].lo&&y<=boxRows[1].hi)row=2;
      else if(y>=boxRows[2].lo&&y<=boxRows[2].hi)row=3;
      if(name==='TW_Blue'&&row!==1)row=-1;
    }
    if(row<0)continue;
    const column=Math.round((x+.49)/.197),centre=-.49+column*.197;
    if(column<0||column>5||Math.abs(x-centre)>.091)continue;
    const item=rows[row],v=clamp((y-item.base)/item.height);
    // Only top-row packets have a narrowed top; labels follow that shape.
    const packet=row===3&&(column===0||column===2||column===5);
    const taper=packet?1-.26*v:1;
    pos.setXYZ(i,centre+(x-centre)*widths[row][column]*taper+leanOffsets[column]*v,
      item.base+(y-item.base)*heights[row][column],z+depthOffsets[column]);
    if(colours)colours.set(tints[(column+row*2)%tints.length],i*3);
    changed++;
  }
  if(changed){
    if(colours)geom.setAttribute('color',new THREE.BufferAttribute(colours,3));
    pos.needsUpdate=true;geom.computeVertexNormals();geom.computeBoundingBox();geom.computeBoundingSphere();
  }
}
function random(seed){let n=seed>>>0;return()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};}
function noise(seed,size,sizeY=size){
  const rng=random(seed),a=Array.from({length:size*sizeY},rng);
  return(u,v)=>{
    const x=u*size,y=v*sizeY,ix=Math.floor(x),iy=Math.floor(y),fx=smooth(x-ix),fy=smooth(y-iy);
    const at=(x,y)=>a[((y%sizeY+sizeY)%sizeY)*size+(x%size+size)%size];
    return (at(ix,iy)*(1-fx)+at(ix+1,iy)*fx)*(1-fy)+(at(ix,iy+1)*(1-fx)+at(ix+1,iy+1)*fx)*fy;
  };
}

// R: broad surface variation, G: fine roughness, B: material-specific structure.
function surfaceTexture(style){
  if(textureCache.has(style))return textureCache.get(style);
  const size=256,canvas=document.createElement('canvas');canvas.width=canvas.height=size;
  const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(size,size);
  const rng=random(1291+style*271),broad=noise(613+style*173,8),fine=noise(957+style*31,32);
  const woodFibre=noise(1781,64,3),woodDrift=noise(1963,8,2),woodFine=noise(2137,96,5);
  const sites=Array.from({length:24},()=>[rng(),rng()]);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const u=x/size,v=y/size,n=broad(u,v),f=fine(u,v),grain=rng();
    let r=n,g=grain,b=f;
    if(style===2){
      // Long, uneven fibres with small changes in width and continuity.
      // Regular sine stripes read as corrugation at the shopfront distance.
      const drift=(woodDrift(u,v)-.5)*.012;
      const latewood=Math.pow(clamp((woodFibre(u+drift,v)-.38)*1.9),2);
      const detail=woodFine(u+drift,v)-.5;
      r=clamp(.66-latewood*.30+detail*.045+(n-.5)*.07);
      b=clamp(.58-latewood*.18+detail*.025);g=.52+latewood*.10+(grain-.5)*.06;
    }else if(style===3){
      const brush=Math.sin(v*Math.PI*2*117)*.22+Math.sin(v*Math.PI*2*73)*.12;
      r=.52+(n-.5)*.16;g=clamp(.5+brush+(grain-.5)*.12);b=f;
    }else if(style===4){
      let nearest=10,second=10;
      // Wrapped Voronoi edges make irregular tea-coloured cracks, not a grid.
      for(const s of sites){let dx=Math.abs(u-s[0]),dy=Math.abs(v-s[1]);dx=Math.min(dx,1-dx);dy=Math.min(dy,1-dy);const d=dx*dx+dy*dy;if(d<nearest){second=nearest;nearest=d;}else if(d<second)second=d;}
      const edge=Math.sqrt(second)-Math.sqrt(nearest);
      b=1-smooth(clamp(edge/.0055));r=.44+n*.32;g=.45+(grain-.5)*.08;
    }else if(style===5){
      // The canopy already has stripes; only its fabric weave is supplied here.
      const weave=(x%4<2?1:-1)*(y%4<2?1:-1);
      r=.45+n*.12+weave*.035;g=.6+weave*.15+(grain-.5)*.10;b=f;
    }
    const i=(y*size+x)*4;pixels.data[i]=Math.round(clamp(r)*255);pixels.data[i+1]=Math.round(clamp(g)*255);pixels.data[i+2]=Math.round(clamp(b)*255);pixels.data[i+3]=255;
  }
  ctx.putImageData(pixels,0,0);
  const texture=new THREE.CanvasTexture(canvas);texture.name='Original prop surface '+style;
  texture.colorSpace=THREE.NoColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  texture.minFilter=THREE.LinearMipmapLinearFilter;texture.anisotropy=4;
  textureCache.set(style,texture);return texture;
}

// Preserve the mesh and its silhouette. Only normals are welded over smooth
// angles; flat sheet faces and the right-angle corners remain distinct.
function refineNormals(geometry){
  const position=geometry.getAttribute('position'),normal=geometry.getAttribute('normal');
  if(!position||!normal)return;
  const count=position.count,weights=new Float32Array(count),index=geometry.index;
  const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),cross=new THREE.Vector3();
  for(let i=0;i<(index?.count??count);i+=3){
    const ia=index?index.getX(i):i,ib=index?index.getX(i+1):i+1,ic=index?index.getX(i+2):i+2;
    a.fromBufferAttribute(position,ia);b.fromBufferAttribute(position,ib);c.fromBufferAttribute(position,ic);
    cross.crossVectors(b.sub(a),c.sub(a));const area=cross.length();
    weights[ia]+=area;weights[ib]+=area;weights[ic]+=area;
  }
  const groups=new Map();
  for(let i=0;i<count;i++){
    const key=Math.round(position.getX(i)*100000)+':'+Math.round(position.getY(i)*100000)+':'+Math.round(position.getZ(i)*100000);
    if(!groups.has(key))groups.set(key,[]);groups.get(key).push(i);
  }
  const output=new Float32Array(count*3);
  for(const group of groups.values())for(const i of group){
    const nx=normal.getX(i),ny=normal.getY(i),nz=normal.getZ(i);let x=0,y=0,z=0;
    for(const j of group){const jx=normal.getX(j),jy=normal.getY(j),jz=normal.getZ(j);if(nx*jx+ny*jy+nz*jz<.58)continue;const w=Math.max(weights[j],1e-8);x+=jx*w;y+=jy*w;z+=jz*w;}
    const length=Math.hypot(x,y,z)||1;output[i*3]=x/length;output[i*3+1]=y/length;output[i*3+2]=z/length;
  }
  geometry.setAttribute('normal',new THREE.BufferAttribute(output,3));
}

const declarations=/* glsl */`
varying vec3 vPropPosition;
varying vec3 vPropNormal;
uniform sampler2D propSurface;
uniform float propKind;
uniform float propStyle;
uniform float propPaint;
uniform float propLabels;
vec2 propUV(vec3 p,vec3 n) {
  vec3 a=abs(n);
  if(a.y>a.x&&a.y>a.z)return vec2(p.x,-p.z);
  if(a.x>a.z)return vec2(p.z,p.y);
  return p.xy;
}
`;

function surfaceShader(material,kind,{style=1,paint=false,labels=false}={}){
  const previousCompile=material.onBeforeCompile,previousKey=material.customProgramCacheKey();
  material.onBeforeCompile=function(shader,renderer){
    previousCompile.call(this,shader,renderer);
    Object.assign(shader.uniforms,{propSurface:{value:surfaceTexture(style)},propKind:{value:kindCode[kind]},propStyle:{value:style},propPaint:{value:paint?1:0},propLabels:{value:labels?1:0}});
    shader.vertexShader='varying vec3 vPropPosition;\nvarying vec3 vPropNormal;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',/* glsl */`
      #include <begin_vertex>
      vPropPosition=position;
      vPropNormal=normal;
    `);
    shader.fragmentShader=declarations+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',/* glsl */`
      #include <map_fragment>
      vec3 pp=vPropPosition,pn=normalize(vPropNormal);
      vec2 puv=propUV(pp,pn);
      float pScale=propStyle==4.0?8.0:propStyle==5.0?3.0:propStyle==3.0?1.4:1.0;
      vec3 pSample=texture2D(propSurface,puv*pScale).rgb;
      float pWear=0.0;
      if(propLabels<.5){
        diffuseColor.rgb*=.96+.08*pSample.r;
        if(propStyle==2.0){
          diffuseColor.rgb*=.76+.34*pSample.r;
          float foot=1.0-smoothstep(.12,.34,pp.y);
          diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*.75+vec3(.035,.038,.030),foot*.30);
        }else if(propStyle==4.0){
          // Tea stain follows the shell. The tiny darker veins stay on each egg.
          diffuseColor.rgb*=.93+.12*pSample.r;
          diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.72,.62,.50),pSample.b*.38);
        }
        if(propKind==1.0&&propPaint>.5){
          float exposure=smoothstep(.78,1.40,pp.y)*(.28+.42*max(pn.y,0.0));
          float front=smoothstep(.145,.17,pp.z);
          float runoff=(1.0-smoothstep(.007,.020,abs(abs(pp.x)-.151)))*smoothstep(.93,1.12,pp.y)*(1.0-smoothstep(1.18,1.26,pp.y))*front;
          pWear=exposure*(.45+.50*pSample.r);
          diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*.65+vec3(.18,.16,.13),pWear);
          diffuseColor.rgb*=1.0-runoff*(.10+.16*pSample.b);
          diffuseColor.rgb*=.83+.17*smoothstep(.08,.27,pp.y);
        }
        if(propKind==2.0&&pp.y>1.98){
          float exposure=.10+.38*max(pn.y,0.0);
          pWear=exposure*(.55+.45*pSample.r);
          diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*.58+vec3(.22,.19,.15),pWear);
          float edge=pow(clamp(abs(pp.z)/.68,0.0,1.0),10.0);
          diffuseColor.rgb*=1.0-edge*(.035+.055*pSample.b);
        }
        // Recessed horizontal ventilation slots on the rear of the checkout
        // display. Constrain them to the back of that one existing screen;
        // counter and drawer materials remain untouched.
        if(propKind==4.0 && pn.z<-.8 && pp.x>.13 && pp.x<.37 && pp.y>1.32 && pp.y<1.43){
          float slot=1.0-smoothstep(.0012,.0024,abs(mod(pp.y-1.32,.013)-.0065));
          diffuseColor.rgb*=1.0-slot*.28;
        }
      }
    `);
    shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',/* glsl */`
      #include <roughnessmap_fragment>
      roughnessFactor=clamp(roughnessFactor+(pSample.g-.5)*(propStyle==3.0?.17:.08)+pWear*.16,.07,.98);
      if(propKind==2.0&&pp.y>1.98)roughnessFactor=max(roughnessFactor,.79);
      if(propLabels>.5&&propKind==4.0&&pp.y>1.2)roughnessFactor=.24;
    `);
  };
  material.customProgramCacheKey=()=>previousKey+'|existing-prop-surfaces-v2';
}

// A stainless serving ladle rests on the edge of the tea-egg pot. Keep the
// whole assembly within the source model's bounding box, so saved positions,
// collision proxies, and the steam emitter all keep their existing anchors.
let teaLadleAssets;

// The source pot had seven 11 cm angular shells. Reuse its existing two egg
// meshes/materials with twelve smooth, 6–7 cm egg-shaped shells, arranged
// inside the existing 45 cm pot. The tea surface is at local y=.330 m.
// All shells stay within the pot and intersect that surface intentionally.
function teaEggGeometry(name){
  const layouts={
    // x, z, length, radius, tilt, direction, height offset, all in metres.
    TW_Egg:[[-.115,.070,.064,.023,.25,.2,-.002],[.100,.080,.065,.024,.65,1.4,.001],
      [.014,-.014,.062,.022,.85,2.2,-.003],[.015,-.120,.066,.024,.43,-.6,.001],
      [-.100,-.140,.062,.023,.78,1.0,-.001],[.085,.015,.065,.023,.48,-1.2,.003]],
    TW_EggLight:[[-.018,.110,.064,.024,.69,-.8,.002],[-.100,-.065,.066,.023,.35,1.8,-.003],
      [.115,-.055,.063,.023,.83,.6,.000],[.090,-.140,.064,.023,.57,2.6,-.002],
      [-.160,.000,.065,.023,.74,-2.0,.002],[.040,.140,.062,.022,.31,-.1,-.001]],
  };
  const template=new THREE.SphereGeometry(1,24,16),point=template.getAttribute('position'),uv=template.getAttribute('uv');
  const vertices=[],uvs=[],indices=[];
  for(const [cx,cz,height,radius,tilt,direction,dy] of layouts[name]){
    const offset=vertices.length/3;
    for(let i=0;i<point.count;i++){
      const x=point.getX(i),y=point.getY(i),z=point.getZ(i),taper=1-.10*y;
      const ax=x*radius*taper,ay=y*height*.5,az=z*radius*taper;
      const tiltedY=ay*Math.cos(tilt)-az*Math.sin(tilt),tiltedZ=ay*Math.sin(tilt)+az*Math.cos(tilt);
      vertices.push(cx+ax*Math.cos(direction)+tiltedZ*Math.sin(direction),
        .340+dy+tiltedY,cz-ax*Math.sin(direction)+tiltedZ*Math.cos(direction));
      uvs.push(uv.getX(i),uv.getY(i));
    }
    for(let i=0;i<template.index.count;i++)indices.push(offset+template.index.getX(i));
  }
  template.dispose();
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  geometry.setIndex(indices);geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();
  return geometry;
}

function addTeaLadle(scene){
  if(!teaLadleAssets){
    const material=new THREE.MeshStandardMaterial({color:'#9da4a0',metalness:.8,roughness:.3,side:THREE.DoubleSide});
    const bowl=new THREE.SphereGeometry(1,16,8,0,Math.PI*2,Math.PI/2,Math.PI/2);
    const handle=new THREE.CylinderGeometry(.004,.004,1,10);
    teaLadleAssets={material,bowl,handle};
  }
  const {material,bowl,handle}=teaLadleAssets;
  const a=new THREE.Vector3(.169,.342,.047),b=new THREE.Vector3(.251,.381,.150);
  const cup=new THREE.Mesh(bowl,material);cup.name='Tea pot ladle bowl';
  cup.position.set(.16,.340,.035);cup.scale.set(.027,.010,.027);cup.castShadow=true;
  const shaft=new THREE.Mesh(handle,material);shaft.name='Tea pot ladle handle';
  const direction=b.clone().sub(a);shaft.position.copy(a).add(b).multiplyScalar(.5);
  shaft.scale.y=direction.length();shaft.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());shaft.castShadow=true;
  scene.add(cup,shaft);
  return {meshes:2,triangles:(bowl.index.count+handle.index.count)/3};
}

/** Improve the existing prop prototype without replacing its source GLB. */
export function refinePropPrototype(scene,kind){
  const materialCache=new Map();let meshes=0,triangles=0;
  scene.traverse(node=>{
    if(!node.isMesh)return;
    if(kind==='teaEgg'&&['TW_Egg','TW_EggLight'].includes(node.material?.name))node.geometry=teaEggGeometry(node.material.name);
    if(kind==='teaEgg'&&node.material?.name==='TW_Tea'){
      // A filled pot exposes the liquid just below the existing rolled rim.
      const position=node.geometry.getAttribute('position');
      for(let i=0;i<position.count;i++)position.setY(i,position.getY(i)+.028);
      position.needsUpdate=true;node.geometry.computeBoundingBox();node.geometry.computeBoundingSphere();
    }
    meshes++;triangles+=(node.geometry.index?.count??node.geometry.getAttribute('position').count)/3;
    if(kind==='shelf')reshapeShelfStock(node);
    refineNormals(node.geometry);
    const replace=source=>{
      if(materialCache.has(source))return materialCache.get(source);
      const material=source.clone(),name=source.name;
      if(kind==='shelf'&&node.geometry.hasAttribute('color'))material.vertexColors=true;
      material.userData.originalPropMaterial=name;material.userData.realismKind=kind;
      let style=1,paint=false,labels=name==='TW_Labels';
      material.metalness=0;
      if(name==='TW_Metal'){
        material.color.set(kind==='shelf'?'#a8aaa6':kind==='teaEgg'?'#c7cbc8':'#c1c3bf');material.metalness=kind==='shelf'?.78:.92;material.roughness=kind==='shelf'?.42:kind==='teaEgg'?.22:.27;style=3;
        if(kind==='teaEgg')material.envMapIntensity=2.2;
      }else if(name==='TW_Wood'){
        material.color.set('#8d6946');material.roughness=.79;style=2;
      }else if(name==='TW_Concrete'){
        material.color.set('#9f9d91');material.roughness=.96;
      }else if(name==='TW_Tea'){
        material.color.set('#49301d');material.roughness=.12;style=3;
      }else if(name==='TW_Egg'||name==='TW_EggLight'){
        material.color.set(name==='TW_Egg'?'#aa7f51':'#c29a6c');material.roughness=.47;style=4;
      }else if(name==='TW_Black'||name==='TW_Dark'){
        material.color.set(name==='TW_Black'?'#202724':'#303c37');material.roughness=kind==='checkout'?.41:kind==='teaEgg'?.51:.61;
      }else if(labels){
        material.roughness=.68;material.metalness=0;
        if(material.map)material.map.anisotropy=4;
      }else if(kind==='stall'&&(name==='TW_Red'||name==='TW_Cream')){
        material.roughness=.79;style=5;
      }else if(kind.startsWith('postbox')){
        paint=true;material.roughness=.43;
      }else if(kind==='shelf'){
        if(name==='TW_Cream')material.color.set('#d8d7cc');
        material.roughness=name==='TW_Blue'?.28:name==='TW_Canopy'?.47:.38;
      }else if(kind==='checkout'){
        if(name==='TW_Cream')material.color.set('#d8d6ca');
        material.roughness=.46;
      }else material.roughness=Math.min(material.roughness,.65);
      surfaceShader(material,kind,{style,paint,labels});
      materialCache.set(source,material);return material;
    };
    node.material=Array.isArray(node.material)?node.material.map(replace):replace(node.material);
  });
  const detail=kind==='teaEgg'?addTeaLadle(scene):{meshes:0,triangles:0};
  scene.userData.refinement={meshes:meshes+detail.meshes,triangles:triangles+detail.triangles,addedMeshes:detail.meshes,addedTriangles:detail.triangles,kind};
  return scene;
}
