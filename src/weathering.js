import * as THREE from 'three';

// Original, structure-aware surface masks. No meshes, decals or scene objects are
// created here. RGBA stores sun wear, runoff, foot damp and local repairs as data.
const ATLAS_SIZE=1024,GRID=8,CELL=ATLAS_SIZE/GRID;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t);};
function hash(value){let h=2166136261;for(const c of String(value)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function random(seed){let n=seed>>>0;return()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};}
function noiseGrid(rng,size=12){
  const values=Float32Array.from({length:size*size},rng);
  return(x,y)=>{
    const ix=Math.floor(x),iy=Math.floor(y),fx=smooth(0,1,x-ix),fy=smooth(0,1,y-iy);
    const at=(a,b)=>values[((b%size+size)%size)*size+((a%size+size)%size)];
    const a=at(ix,iy)*(1-fx)+at(ix+1,iy)*fx,b=at(ix,iy+1)*(1-fx)+at(ix+1,iy+1)*fx;
    return a*(1-fy)+b*fy;
  };
}

const ROLE_WEIGHTS={
  plaster:[.80,.88,.76,.80],
  masonry:[.24,.80,.62,.24],
  tile:[.14,.42,.54,.18],
  wood:[.28,.25,.24,.10],
  metal:[.17,.28,.18,0],
  paint:[.42,.38,.20,.20],
  sign:[.28,.12,0,0],
};

const vertexDeclarations=/* glsl */`
attribute vec4 buildingWeatherFrame;
attribute vec4 buildingWeatherDomain;
varying vec3 vBuildingLocal;
varying vec4 vBuildingDomain;
`;
const vertexTransform=/* glsl */`
#include <project_vertex>
vec4 buildingPosition=vec4(transformed,1.0);
#ifdef USE_BATCHING
  buildingPosition=batchingMatrix*buildingPosition;
#endif
#ifdef USE_INSTANCING
  buildingPosition=instanceMatrix*buildingPosition;
#endif
buildingPosition=modelMatrix*buildingPosition;
vec2 buildingDelta=buildingPosition.xz-buildingWeatherFrame.xy;
vBuildingLocal=vec3(
  buildingDelta.x*buildingWeatherFrame.z-buildingDelta.y*buildingWeatherFrame.w,
  buildingPosition.y,
  buildingDelta.x*buildingWeatherFrame.w+buildingDelta.y*buildingWeatherFrame.z
);
vBuildingDomain=buildingWeatherDomain;
`;
const fragmentDeclarations=/* glsl */`
uniform sampler2D buildingWeatherAtlas;
uniform vec4 buildingWeatherWeights;
uniform float buildingWeatherSign;
varying vec3 vBuildingLocal;
varying vec4 vBuildingDomain;
`;
const fragmentColor=/* glsl */`
float buildingWearRoughness=0.0;
if(vBuildingDomain.w>=0.0){
  vec3 bn=abs(normalize(cross(dFdx(vBuildingLocal),dFdy(vBuildingLocal))));
  float upper=smoothstep(3.20,3.65,vBuildingLocal.y);
  float street=smoothstep(vBuildingDomain.z-.65,vBuildingDomain.z-.12,vBuildingLocal.z);
  // The older shophouse has 1.45m of arcade in front of its body, whereas
  // context blocks use front=depth/2. This threshold reaches the outside rear
  // faces in either case while ending before the recessed shop back walls.
  // A fractional atlas-slot flag excludes the convenience store: that shop's
  // rear wall is only .18m thick, so its inner and outer faces are too close
  // to distinguish safely with this bounded world-space mask.
  float rearEnabled=1.0-step(.125,fract(vBuildingDomain.w));
  float rear=(1.0-smoothstep(-vBuildingDomain.z+1.57,-vBuildingDomain.z+2.10,vBuildingLocal.z))*rearEnabled*(1.0-buildingWeatherSign);
  float facadeExposure=max(street,rear);
  float frontFacing=smoothstep(.55,.90,bn.z);
  float sideFacing=smoothstep(.55,.90,bn.x);
  float sideEdge=smoothstep(vBuildingDomain.x*.5-.30,vBuildingDomain.x*.5-.04,abs(vBuildingLocal.x));
  float vertical=1.0-smoothstep(.45,.85,bn.y);
  float roof=smoothstep(.65,.9,bn.y)*smoothstep(vBuildingDomain.y-.12,vBuildingDomain.y+.05,vBuildingLocal.y);
  float outside=vertical*max(facadeExposure*frontFacing,sideEdge*sideFacing*upper*.72);
  // Projecting sign faces may be perpendicular to the building's front.
  outside=max(outside,buildingWeatherSign*street*smoothstep(3.0,3.35,vBuildingLocal.y)*vertical*.82);
  float exposure=max(outside,roof*.68);
  if(exposure>.001){
    float tileSize=1.0+step(63.5,vBuildingDomain.w);
    float tileIndex=mod(floor(vBuildingDomain.w),64.0);
    vec2 tileOrigin=vec2(mod(tileIndex,8.0),floor(tileIndex/8.0));
    float facadeU=vBuildingLocal.x/max(vBuildingDomain.x,.1)+.5;
    float sideU=vBuildingLocal.z/max(vBuildingDomain.x,.1)*.65+.5;
    vec2 facadeUv=vec2(mix(facadeU,sideU,sideFacing),vBuildingLocal.y/(vBuildingDomain.y+.8));
    facadeUv=clamp(facadeUv,vec2(.015),vec2(.985));
    vec4 wear=texture2D(buildingWeatherAtlas,(tileOrigin+facadeUv*tileSize)/8.0);
    float repair=wear.a*buildingWeatherWeights.a*outside*upper;
    float faded=wear.r*buildingWeatherWeights.r*exposure*mix(.12,1.0,upper)*(1.0-repair*.86);
    float runoff=wear.g*buildingWeatherWeights.g*outside*facadeExposure*frontFacing*upper*(1.0-repair*.92);
    float damp=wear.b*buildingWeatherWeights.b*outside*facadeExposure*(1.0-repair);
    // Painted surfaces lose chroma and take on a dry, chalked scattering layer.
    // Masonry, metal and sheltered boards get lower weights, not the same filter.
    vec3 fadedPaint=diffuseColor.rgb*.72+vec3(.168,.153,.128);
    diffuseColor.rgb=mix(diffuseColor.rgb,fadedPaint,faded);
    float ageTone=fract(sin((tileIndex+1.0)*78.233)*43758.5453);
    vec3 mineralTone=mix(vec3(.86,.91,.93),vec3(1.015,.965,.89),ageTone);
    diffuseColor.rgb*=mix(vec3(1.0),mineralTone,exposure*buildingWeatherWeights.r*.72*(1.0-repair));
    diffuseColor.rgb*=1.0-runoff*.56-damp*.39;
    diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.86,.91,.84),damp*.48);
    diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*.93+vec3(.055,.050,.039),repair*.65);
    buildingWearRoughness=faded*.10+runoff*.045-damp*.025;
  }
}
`;

/** One atlas shared by all original buildings in a world. */
export function createBuildingWeathering(){
  const bytes=new Uint8Array(ATLAS_SIZE*ATLAS_SIZE*4),occupied=new Uint8Array(GRID*GRID),buildings=[];
  const texture=new THREE.DataTexture(bytes,ATLAS_SIZE,ATLAS_SIZE,THREE.RGBAFormat,THREE.UnsignedByteType);
  texture.name='Original building histories — fade, runoff, damp, repair';
  texture.colorSpace=THREE.NoColorSpace;texture.generateMipmaps=true;
  texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;
  texture.wrapS=texture.wrapT=THREE.ClampToEdgeWrapping;texture.anisotropy=2;
  const prepared=new WeakMap();

  function allocate(size){
    for(let y=0;y<=GRID-size;y++)for(let x=0;x<=GRID-size;x++){
      let free=true;
      for(let j=0;j<size;j++)for(let i=0;i<size;i++)if(occupied[(y+j)*GRID+x+i])free=false;
      if(free){for(let j=0;j<size;j++)for(let i=0;i<size;i++)occupied[(y+j)*GRID+x+i]=1;return{x,y,size};}
    }
    if(size===2)return allocate(1);
    throw new Error('Building weather atlas has no unused cells');
  }

  function registerBuilding(options){
    const b={angle:0,kind:'context',...options};
    // The convenience store's thin back wall has a visible inner face.
    // Mark it before hashing the seed so only its new rear mask is disabled.
    b.excludeRear=b.seed==='maintained-convenience-store';
    b.x=Number(b.x)||0;b.z=Number(b.z)||0;
    b.width=Math.max(.5,Number(b.width)||5);b.height=Math.max(3.5,Number(b.height)||9);
    b.front=Number.isFinite(b.front)?b.front:(Number(b.depth)||6)/2;
    b.seed=hash(b.seed??`${b.x}:${b.z}:${b.angle}:${b.kind}`);
    const rng=random(b.seed),coarse=noiseGrid(rng),medium=noiseGrid(rng),tile=allocate(b.kind==='front'?2:1);
    b.slot=tile.y*GRID+tile.x+(tile.size===2?64:0)+(b.excludeRear?.25:0);
    const resolution=CELL*tile.size,top=b.height+.8;
    const age=b.seed%5===0?.25:.48+rng()*.35;
    const rain=[],patches=[];
    function streak(x,y,length,width,strength){rain.push({x,y,length,width,strength,bend:(rng()-.5)*.055,phase:rng()*10});}
    // Each streak begins at an existing sill edge or the existing roof cornice.
    const rows=b.kind==='front'?(b.height>8.2?2:1):Math.floor((b.height-3.4)/2.7);
    for(let row=0;row<rows;row++){
      const wy=(b.kind==='front'?4.95:4.65)+row*(b.kind==='front'?2.58:2.7);
      // Context buildings mirror the bay layout world.js now generates
      // (2-4 bays from the variation seed) so runoff stays under real sills.
      let centers,windowWidth;
      if(b.kind==='front'){centers=[-b.width*.235,b.width*.235];windowWidth=b.width*.29;}
      else{
        const bays=2+((b.variation??0)%3),span=b.width*.78,pitch=span/bays;
        centers=Array.from({length:bays},(_,i)=>-span/2+pitch*(i+.5));
        windowWidth=Math.min(pitch*.58,b.width*.24);
      }
      for(const wx of centers)for(const side of [-1,1])if(rng()>.30){
        // Slightly wider, tapered sill runoff survives texture mipmapping at
        // a pedestrian viewing distance; it remains tied to actual sills.
        streak(wx+side*(windowWidth/2+.10),wy-(b.kind==='front'?.98:.945),.70+rng()*1.45,.080+rng()*.070,.38+rng()*.48);
      }
    }
    for(const side of [-1,1])streak(side*(b.width/2-.20),b.height+.58,1.4+rng()*2.7,.085+rng()*.085,.42+rng()*.4);
    if(b.seed%3!==1)streak((rng()-.5)*b.width*.65,b.height+.56,1.1+rng()*1.5,.065+rng()*.06,.38+rng()*.3);
    // A minority of fronts show a bounded repair, rather than every wall being patched.
    if(b.seed%3===0)patches.push({x:(rng()-.5)*b.width*.65,y:4.0+rng()*Math.max(.2,b.height-5.2),w:.45+rng()*.90,h:.42+rng()*.70});
    for(let iy=0;iy<resolution;iy++)for(let ix=0;ix<resolution;ix++){
      const u=clamp((ix-2)/(resolution-5)),v=clamp((iy-2)/(resolution-5));
      const x=(u-.5)*b.width,y=v*top;
      const broad=coarse(u*4.7+.21,v*5.2+.37),fine=medium(u*12,v*12);
      let r=age*(.28+.62*broad+.10*fine),g=0,a=0;
      for(const s of rain){
        const down=s.y-y;if(down<0||down>s.length)continue;
        const width=s.width*(1-.48*down/s.length),dx=Math.abs(x-s.x-s.bend*Math.sin(down*3+s.phase));
        if(dx>width*2.5)continue;
        const core=Math.exp(-dx*dx/(width*width));
        const end=1-smooth(s.length*.35,s.length,down);
        const start=smooth(0,.07,down);
        g=Math.max(g,core*end*start*s.strength*(.55+.45*medium(u*12,v*12)));
      }
      const dampHeight=.32+.46*coarse(u*8,1.2);
      const base=(1-smooth(.06,dampHeight,y-.14))*(.2+.8*medium(u*9,.6));
      const damp=clamp(base*(.40+age*.65));
      for(const p of patches){
        const ex=p.w/2-Math.abs(x-p.x),ey=p.h/2-Math.abs(y-p.y);
        a=Math.max(a,smooth(-.03,.025,Math.min(ex,ey)+(fine-.5)*.028)*.82);
      }
      const offset=((tile.y*CELL+iy)*ATLAS_SIZE+tile.x*CELL+ix)*4;
      bytes[offset]=Math.round(clamp(r)*255);bytes[offset+1]=Math.round(clamp(g)*255);
      bytes[offset+2]=Math.round(damp*255);bytes[offset+3]=Math.round(clamp(a)*255);
    }
    buildings.push(b);texture.needsUpdate=true;return buildings.length-1;
  }

  function attributesFor(ids){
    const frames=new Float32Array(ids.length*4),domains=new Float32Array(ids.length*4);
    ids.forEach((id,i)=>{
      const b=buildings[id],n=i*4;
      if(!b){frames.set([0,0,1,0],n);domains.set([1,1,0,-1],n);return;}
      frames.set([b.x,b.z,Math.cos(b.angle),Math.sin(b.angle)],n);
      domains.set([b.width,b.height,b.front,b.slot],n);
    });
    return{frames,domains};
  }

  function materialFor(base,role){
    if(!base?.isMeshStandardMaterial||!ROLE_WEIGHTS[role])return base;
    let roles=prepared.get(base);if(!roles){roles=new Map();prepared.set(base,roles);}
    if(roles.has(role))return roles.get(role);
    // Preserve the earlier surface factory's compile callback and cache key.
    const material=base.clone(),previousCompile=base.onBeforeCompile,previousKey=base.customProgramCacheKey();
    material.userData.buildingWeatherRole=role;
    material.name=(base.name||'Building material')+' / '+role+' history';
    material.onBeforeCompile=function(shader,renderer){
      previousCompile.call(this,shader,renderer);
      shader.uniforms.buildingWeatherAtlas={value:texture};
      shader.uniforms.buildingWeatherWeights={value:new THREE.Vector4(...ROLE_WEIGHTS[role])};
      shader.uniforms.buildingWeatherSign={value:role==='sign'?1:0};
      shader.vertexShader=vertexDeclarations+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',vertexTransform);
      shader.fragmentShader=fragmentDeclarations+shader.fragmentShader;
      // Surface factories may apply mortar or finish layers after map_fragment.
      // Weather the completed colour, so their grout does not erase rain marks.
      shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',fragmentColor+/* glsl */`
        #include <roughnessmap_fragment>
        roughnessFactor=clamp(roughnessFactor+buildingWearRoughness,.065,1.0);
      `);
    };
    material.customProgramCacheKey=()=>previousKey+'|building-histories-v3';
    roles.set(role,material);return material;
  }

  function attachBatch(mesh,ids,role='plaster'){
    if(!ROLE_WEIGHTS[role]||!ids?.some(id=>buildings[id]))return mesh;
    if(ids.length!==mesh.count)throw new Error('Building IDs must match the instance count');
    const {frames,domains}=attributesFor(ids);
    // Geometries in the world are shared between material batches. Never put
    // one batch's per-instance data onto another batch's geometry by accident.
    mesh.geometry=mesh.geometry.clone();
    mesh.geometry.setAttribute('buildingWeatherFrame',new THREE.InstancedBufferAttribute(frames,4));
    mesh.geometry.setAttribute('buildingWeatherDomain',new THREE.InstancedBufferAttribute(domains,4));
    mesh.material=materialFor(mesh.material,role);return mesh;
  }

  function attachMesh(mesh,id,role='sign'){
    if(!buildings[id]||!ROLE_WEIGHTS[role])return mesh;
    const count=mesh.geometry.attributes.position.count,{frames,domains}=attributesFor(Array(count).fill(id));
    mesh.geometry=mesh.geometry.clone();
    mesh.geometry.setAttribute('buildingWeatherFrame',new THREE.BufferAttribute(frames,4));
    mesh.geometry.setAttribute('buildingWeatherDomain',new THREE.BufferAttribute(domains,4));
    mesh.material=materialFor(mesh.material,role);return mesh;
  }

  return{registerBuilding,attachBatch,attachMesh,finalize:()=>{texture.needsUpdate=true;},getStats:()=>({buildings:buildings.length,atlasSize:ATLAS_SIZE,usedCells:occupied.reduce((a,b)=>a+b,0),addedMeshes:0})};
}
