import * as THREE from 'three';

// Original, deterministic surface studies. One world unit equals one metre.
// Packed RGB stores diffuse value / roughness variation / height; A distinguishes
// clay or glaze from a mortar joint. These are numeric data, never image opacity.
// World projection keeps texel density consistent on nonuniformly scaled instances.
const definitions = {
  // Bump values are physical relief in metres, not a screen-space multiplier.
  asphalt: {seed:731, metres:.85, roughness:.96, metalness:0, bump:.0032},
  plaster: {seed:187, metres:1.35, roughness:.91, metalness:0, bump:.0008},
  tile: {seed:293, metres:1.6, roughness:.37, metalness:0, bump:.005, roughnessVariation:.9},
  concrete: {seed:541, metres:1.0, roughness:.90, metalness:0, bump:.0015},
  metal: {seed:907, metres:.48, roughness:.39, metalness:.88, bump:.00012},
  wood: {seed:421, metres:.72, roughness:.68, metalness:0, bump:.0008},
  brick: {seed:151, metres:.48, roughness:.95, metalness:0, bump:.0018},
  brickwork: {seed:151, metres:1.2, roughness:.94, metalness:0, bump:.006},
  paint: {seed:643, metres:.50, roughness:.48, metalness:0, bump:.00014},
  canvas: {seed:813, metres:.16, roughness:.94, metalness:0, bump:.0003},
  rubber: {seed:379, metres:.28, roughness:.84, metalness:0, bump:.0003},
  plastic: {seed:647, metres:.40, roughness:.42, metalness:0, bump:.0001},
};
const textures = new Map();
const materials = new Map();
// Shared weather state changes numeric shader inputs, never the authored dry
// textures. Only ground-level road surfaces enter the wet footprint below.
const surfaceRainAmount={value:0};
const rainyAsphaltMaterials=new Set();
let surfaceRainEnvironment=null;
export function setSurfaceRainAmount(amount){
  const next=Number.isFinite(amount)?Math.max(0,Math.min(1,amount)):0;
  surfaceRainAmount.value=next;
  for(const material of rainyAsphaltMaterials){
    const original=material.userData.rainDryEnvironment;
    const map=next>.001&&surfaceRainEnvironment?surfaceRainEnvironment:original.map;
    if(material.envMap!==map){material.envMap=map;material.needsUpdate=true;}
    material.envMapIntensity=original.intensity;
    if(next>.001&&surfaceRainEnvironment)material.envMapIntensity=.24;
  }
}
export function setSurfaceRainEnvironment(texture){
  surfaceRainEnvironment=texture??null;setSurfaceRainAmount(surfaceRainAmount.value);
}
export function getSurfaceRainSnapshot(){
  return {amount:surfaceRainAmount.value,asphaltMaterialCount:rainyAsphaltMaterials.size,roadReflectionReady:!!surfaceRainEnvironment,footprint:'Ground-level asphalt/paint in the main road and two connected crossroads; arcade remains dry.'};
}
// One shared 1K PBR set for every asphalt material, loaded lazily.  A world
// can start before these optional files finish loading: its original packed
// procedural asphalt remains visible until all three images are available.
const asphaltPhoto = {
  status: 'not_started', loaded: 0, failed: [], maps: null,
  ready: {value: 0},
};
const asphaltPhotoFiles = {
  color: '/assets/textures/asphalt_03/asphalt_03_diff_1k.jpg',
  normal: '/assets/textures/asphalt_03/asphalt_03_nor_gl_1k.jpg',
  roughness: '/assets/textures/asphalt_03/asphalt_03_rough_1k.jpg',
};

// Shared CC0 photographic stucco. Keep the deterministic original plaster
// visible until *all* maps are ready, including if any request fails.
const plasterPhoto = {status:'not_started', loaded:0, failed:[], maps:null, ready:{value:0}};
const plasterPhotoFiles = {
  color:'/assets/textures/white_stucco/white_stucco_diff_1k.jpg',
  normal:'/assets/textures/white_stucco/white_stucco_nor_gl_1k.jpg',
  roughness:'/assets/textures/white_stucco/white_stucco_rough_1k.jpg',
};
export function getPlasterTextureStatus(){
  return {status:plasterPhoto.status,loaded:plasterPhoto.loaded,failed:[...plasterPhoto.failed]};
}
function startPlasterPhoto(){
  if(plasterPhoto.status!=='not_started')return plasterPhoto;
  if(typeof document==='undefined'){plasterPhoto.status='unavailable';return plasterPhoto;}
  plasterPhoto.status='loading';plasterPhoto.maps={};
  const loader=new THREE.TextureLoader();
  for(const [kind,url] of Object.entries(plasterPhotoFiles)){
    const texture=loader.load(url,()=>{
      plasterPhoto.loaded++;
      if(plasterPhoto.loaded===3 && plasterPhoto.failed.length===0){
        plasterPhoto.status='ready';plasterPhoto.ready.value=1;
      }
    },undefined,()=>{plasterPhoto.failed.push(kind);plasterPhoto.status='failed';plasterPhoto.ready.value=0;});
    texture.name=`Poly Haven White Stucco — ${kind}`;
    texture.colorSpace=kind==='color'?THREE.SRGBColorSpace:THREE.NoColorSpace;
    texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
    texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;
    texture.generateMipmaps=true;texture.anisotropy=4;
    plasterPhoto.maps[kind]=texture;
  }
  return plasterPhoto;
}

/** Inspect optional texture readiness without treating a fallback as success. */
export function getAsphaltTextureStatus() {
  return {status: asphaltPhoto.status, loaded: asphaltPhoto.loaded,
    failed: [...asphaltPhoto.failed]};
}

function startAsphaltPhoto() {
  if (asphaltPhoto.status !== 'not_started') return asphaltPhoto;
  // Non-browser callers can still construct the original procedural material.
  if (typeof document === 'undefined') {
    asphaltPhoto.status = 'unavailable';
    return asphaltPhoto;
  }
  asphaltPhoto.status = 'loading';
  asphaltPhoto.maps = {};
  const loader = new THREE.TextureLoader();
  for (const [kind, url] of Object.entries(asphaltPhotoFiles)) {
    const texture = loader.load(url, () => {
      asphaltPhoto.loaded++;
      if (asphaltPhoto.loaded === 3 && asphaltPhoto.failed.length === 0) {
        asphaltPhoto.status = 'ready';
        asphaltPhoto.ready.value = 1;
      }
    }, undefined, () => {
      asphaltPhoto.failed.push(kind);
      asphaltPhoto.status = 'failed';
      asphaltPhoto.ready.value = 0;
    });
    texture.name = `Poly Haven Asphalt 03 — ${kind}`;
    texture.colorSpace = kind === 'color' ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    texture.anisotropy = 4;
    asphaltPhoto.maps[kind] = texture;
  }
  return asphaltPhoto;
}
const clamp = (v,lo=0,hi=1) => Math.max(lo,Math.min(hi,v));
const lerp = (a,b,t) => a+(b-a)*t;
const smooth = t => t*t*(3-2*t);
function random(seed) {
  let state=seed>>>0;
  return ()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return state/4294967296;};
}
function noiseGrid(seed,period,periodY=period) {
  const rng=random(seed),values=Array.from({length:period*periodY},rng);
  return (x,y)=>{
    const ix=Math.floor(x),iy=Math.floor(y),fx=smooth(x-ix),fy=smooth(y-iy);
    const at=(a,b)=>values[((b%periodY+periodY)%periodY)*period+((a%period+period)%period)];
    return lerp(lerp(at(ix,iy),at(ix+1,iy),fx),lerp(at(ix,iy+1),at(ix+1,iy+1),fx),fy);
  };
}

// Small irregular mineral inclusions are baked once. Their projected sizes are
// millimetres, unlike the broad random clouds previously used for road grain.
function stampMinerals(data,size,seed,{count,radius,diffuse,relief,roughness}) {
  const rng=random(seed);
  for(let stone=0;stone<count;stone++){
    const cx=rng()*size,cy=rng()*size,rx=radius[0]+rng()*(radius[1]-radius[0]);
    const ry=rx*(.48+rng()*.65),angle=rng()*Math.PI*2,c=Math.cos(angle),s=Math.sin(angle);
    const tone=diffuse[0]+rng()*(diffuse[1]-diffuse[0]);
    const peak=relief[0]+rng()*(relief[1]-relief[0]),phase=rng()*6.28;
    const extent=Math.ceil(Math.max(rx,ry)*1.22);
    for(let yy=Math.floor(cy)-extent;yy<=cy+extent;yy++)for(let xx=Math.floor(cx)-extent;xx<=cx+extent;xx++){
      const dx=xx-cx,dy=yy-cy,lx=(dx*c+dy*s)/rx,ly=(-dx*s+dy*c)/ry;
      const edge=Math.hypot(lx,ly)*(1+.13*Math.sin(Math.atan2(ly,lx)*5+phase));
      if(edge>=1)continue;
      const cover=smooth(clamp((1-edge)/.22));
      const i=(((yy%size+size)%size)*size+(xx%size+size)%size)*4;
      data[i]=Math.round(lerp(data[i],tone*255,cover));
      data[i+1]=Math.round(lerp(data[i+1],roughness*255,cover));
      data[i+2]=Math.round(lerp(data[i+2],peak*255,cover));
    }
  }
}

function textureFor(style) {
  if(textures.has(style))return textures.get(style);
  const def=definitions[style],size=512;
  const image={data:new Uint8Array(size*size*4)};
  const rng=random(def.seed),broad=noiseGrid(def.seed+1,8),medium=noiseGrid(def.seed+2,32);
  const elongated=noiseGrid(def.seed+3,64,3),woodFine=noiseGrid(def.seed+4,64,5);
  const woodDrift=noiseGrid(def.seed+5,8,2),metalBrush=noiseGrid(def.seed+6,3,64);
  const tiles=Array.from({length:100},rng);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const u=x/size,v=y/size;
    const coarse=broad(u*8,v*8),fine=medium(u*32,v*32),grain=rng()-.5;
    let value=.93,rough=.5,height=.5,jointCoverage=1;
    if(style==='asphalt'){
      // Dark binder, exposed light aggregate and pinholes are separate features.
      // Large road repairs are already geometry; no disconnected cracks here.
      value=.79+(coarse-.5)*.085+(fine-.5)*.055+grain*.065;
      rough=.67+grain*.12;
      height=.38+(fine-.5)*.09+grain*.11;
    }else if(style==='plaster'){
      // Rain streaks belong to architectural anchors in weathering.js. This
      // layer only describes mineral plaster and occasional fine open pores.
      const pore=grain<-.48?-.11:0;
      value=.965+(coarse-.5)*.035+(fine-.5)*.023+grain*.018+pore*.22;
      rough=.61+(coarse-.5)*.09+grain*.08;
      height=.53+(fine-.5)*.11+grain*.14+pore;
    }else if(style==='tile'){
      const gx=u*8,gy=v*8,fx=gx-Math.floor(gx),fy=gy-Math.floor(gy);
      const edge=Math.min(fx,fy,1-fx,1-fy);
      const bevel=smooth(clamp((edge-.007)/.019));
      const t=tiles[Math.floor(gy)*10+Math.floor(gx)];
      value=lerp(.69,.94+t*.05,bevel)+grain*.007;
      // Tile glaze and porous mortar react differently to the same light.
      rough=lerp(1,.39+t*.11,bevel);
      height=lerp(.20,.68,bevel)+(fine-.5)*.015;
      jointCoverage=bevel;
    }else if(style==='concrete'){
      const pore=grain<-.485?-.08:grain*.027;
      value=.93+(coarse-.5)*.05+(fine-.5)*.035+pore;
      rough=.62+(coarse-.5)*.09+grain*.10;
      height=.53+(fine-.5)*.09+pore*1.1;
    }else if(style==='metal'){
      const brush=(metalBrush(u*3,v*64)-.5)*.055;
      value=.985+brush*.16+(coarse-.5)*.012;
      rough=.48+brush*2.2+(coarse-.5)*.06;
      height=.5+brush*.60+grain*.012;
    }else if(style==='wood'){
      // Long fibres vary in width and continuity. Avoid parallel sine stripes
      // that read as corrugated cardboard or a uniformly printed wood sticker.
      const drift=(woodDrift(u*8,v*2)-.5)*.65;
      const fibres=elongated(u*64+drift,v*3);
      const latewood=Math.pow(clamp((fibres-.40)*2.05),2);
      const fineFibre=woodFine(u*128+drift*2,v*5)-.5;
      value=.965-latewood*.16+fineFibre*.025+(coarse-.5)*.035;
      rough=.54+latewood*.13+fineFibre*.035;
      height=.53-latewood*.12+fineFibre*.045;
    }else if(style==='brick'){
      const pore=grain<-.455?-.11:grain*.03;
      value=.93+(coarse-.5)*.10+(fine-.5)*.08+pore;
      rough=.69+grain*.10;
      height=.51+(fine-.5)*.22+pore*1.4;
    }else if(style==='brickwork'){
      // 240 x 75 mm running bond: 230 x 65 mm clay with a 10 mm mortar joint.
      // Five bricks and sixteen rows make both ends of the texture periodic.
      const row=Math.floor(v*16),gx=u*5+(row%2)*.5,gy=v*16;
      const fx=gx-Math.floor(gx),fy=gy-Math.floor(gy);
      const edge=Math.min(Math.min(fx,1-fx)*.24,Math.min(fy,1-fy)*.075)+(fine-.5)*.0012;
      const rim=smooth(clamp((edge-.004)/.003));
      const t=tiles[row*5+(Math.floor(gx)%5)];
      const clay=.90+t*.08+(fine-.5)*.045+grain*.035;
      value=lerp(.91+(fine-.5)*.035,clay,rim);
      rough=lerp(.84,.67+grain*.10,rim);
      height=lerp(.16,.66+(fine-.5)*.13+grain*.06,rim);
      jointCoverage=rim;
    }else if(style==='paint'){
      // A continuous dielectric film; exposure/wear is a separate mask layer.
      value=.989+(coarse-.5)*.008+grain*.006;
      rough=.48+(fine-.5)*.12+grain*.025;
      height=.5+(fine-.5)*.12+grain*.055;
    }else if(style==='canvas'){
      const warp=.5+.5*Math.cos(u*Math.PI*2*112),weft=.5+.5*Math.cos(v*Math.PI*2*104);
      const weave=warp*weft;
      value=.97-(1-weave)*.045+(coarse-.5)*.025;
      rough=.64+weave*.04;
      height=.42+weave*.24+grain*.025;
    }else if(style==='rubber'){
      value=.97+(coarse-.5)*.035+grain*.025;
      rough=.59+(fine-.5)*.15;
      height=.5+(fine-.5)*.16+grain*.1;
    }else if(style==='plastic'){
      value=.992+(coarse-.5)*.007+grain*.006;
      rough=.47+(fine-.5)*.11+grain*.02;
      height=.5+(fine-.5)*.07+grain*.025;
    }
    const i=(y*size+x)*4;
    image.data[i]=Math.round(clamp(value)*255);
    image.data[i+1]=Math.round(clamp(rough)*255);
    image.data[i+2]=Math.round(clamp(height)*255);
    image.data[i+3]=Math.round(jointCoverage*255);
  }
  if(style==='asphalt'){
    stampMinerals(image.data,size,def.seed+13,{count:4700,radius:[1.0,3.2],diffuse:[.82,.995],relief:[.48,.76],roughness:.70});
    stampMinerals(image.data,size,def.seed+19,{count:1400,radius:[.6,1.4],diffuse:[.58,.73],relief:[.18,.31],roughness:.78});
  }else if(style==='concrete'){
    stampMinerals(image.data,size,def.seed+13,{count:1050,radius:[.6,1.9],diffuse:[.76,.89],relief:[.32,.46],roughness:.72});
  }else if(style==='brick'){
    stampMinerals(image.data,size,def.seed+13,{count:1700,radius:[.7,2.7],diffuse:[.72,.88],relief:[.22,.40],roughness:.78});
  }
  // Canvas premultiplies transparent RGB and would erase joint data when A=0.
  // A DataTexture preserves every channel as independent numeric information.
  const texture=new THREE.DataTexture(image.data,size,size,THREE.RGBAFormat,THREE.UnsignedByteType);
  texture.name=`Original ${style} surface — packed linear RGB`;
  texture.colorSpace=THREE.NoColorSpace;
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;
  texture.generateMipmaps=true;texture.needsUpdate=true;
  texture.anisotropy=4;
  textures.set(style,texture);
  return texture;
}

const fragmentDeclarations = /* glsl */`
  varying vec3 vTaiwanSurfaceWorld;
  uniform sampler2D taiwanSurfaceTexture;
  uniform float taiwanSurfaceMetres;
  uniform float taiwanSurfaceBump;
  uniform float taiwanSurfaceRoughnessVariation;
  uniform vec3 taiwanSurfaceJointColor;
  uniform float taiwanSurfaceFiredClay;

  vec2 taiwanSurfaceUV(vec3 p) {
    // Derivatives yield the actual plane orientation after instance transforms.
    // Dominant-axis projection uses one texture read per channel, not three.
    vec3 n=abs(normalize(cross(dFdx(p),dFdy(p))));
    if(n.y>=n.x && n.y>=n.z)return vec2(p.x,-p.z)/taiwanSurfaceMetres;
    if(n.x>=n.z)return vec2(p.z,p.y)/taiwanSurfaceMetres;
    return p.xy/taiwanSurfaceMetres;
  }

  vec3 taiwanSurfaceNormal(vec3 position,vec3 surfNormal,vec2 grad,float side) {
    // Keep the derivative lengths: they express the real metres-per-pixel.
    // Normalising them makes the apparent relief change when the camera moves.
    vec3 sx=dFdx(position);
    vec3 sy=dFdy(position);
    vec3 r1=cross(sy,surfNormal);
    vec3 r2=cross(surfNormal,sx);
    float determinant=dot(sx,r1)*side;
    vec3 surfaceGradient=sign(determinant)*(grad.x*r1+grad.y*r2);
    return normalize(abs(determinant)*surfNormal-surfaceGradient);
  }
`;

// A road can be damp without becoming one continuous mirror. Deterministic
// low spots break the film into pools while the worn mineral relief remains.
export const roadRainShaderChunk=/* glsl */`
  uniform float taiwanSurfaceRainAmount;
  float twRainHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float twRainNoise(vec2 p){
    vec2 b=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
    return mix(mix(twRainHash(b),twRainHash(b+vec2(1.0,0.0)),f.x),mix(twRainHash(b+vec2(0.0,1.0)),twRainHash(b+vec2(1.0)),f.x),f.y);
  }
  float twRainRect(vec2 p,vec2 centre,vec2 halfSize){
    vec2 edge=abs(p-centre)-halfSize;
    return 1.0-smoothstep(-.14,0.0,max(edge.x,edge.y));
  }
  vec2 twRoadWetness(vec3 p){
    if(taiwanSurfaceRainAmount<.001||p.y<-.02||p.y>.16)return vec2(0.0);
    vec3 n=normalize(cross(dFdx(p),dFdy(p)));
    float ground=smoothstep(.7,.95,abs(n.y));
    float road=max(twRainRect(p.xz,vec2(0.0,-27.2),vec2(2.9,65.2)),
      max(twRainRect(p.xz,vec2(0.0,-16.5),vec2(36.0,2.9)),twRainRect(p.xz,vec2(0.0,17.2),vec2(36.0,2.9))));
    road=max(road,twRainRect(p.xz,vec2(30.3,36.5),vec2(10.0,2.4)));
    float mottling=.64*twRainNoise(p.xz*.52)+.36*twRainNoise(p.xz*1.64+vec2(7.1,9.4));
    // Runoff collects in irregular, lengthwise depressions. Domain warping
    // breaks the borders into connected patches instead of repeated ellipses.
    vec2 warp=vec2(twRainNoise(p.xz*.33+vec2(6.8,1.3)),twRainNoise(p.xz*.29+vec2(2.1,8.7)))-.5;
    vec2 q=p.xz+warp*1.7;
    float lowSpots=.63*twRainNoise(q*vec2(.67,.25))+.25*twRainNoise(q*.97+vec2(4.2,7.8))+.12*twRainNoise(p.xz*3.2);
    float gutter=smoothstep(.75,2.70,abs(p.x))*.075;
    float pools=smoothstep(.50,.72,lowSpots+gutter);
    float wet=taiwanSurfaceRainAmount*road*ground*(.58+.42*smoothstep(.12,.83,mottling));
    // Pool coverage is independent from dampness. Multiplying the two made
    // even a fully covered low spot stay rough after the second roughness mix.
    return vec2(wet,pools*taiwanSurfaceRainAmount*road*ground);
  }
`;

/** Return a shared original procedural material, preserving explicit overrides. */
export function createSurfaceMaterial(style,color,extra={}) {
  if(!Object.hasOwn(definitions,style))throw new Error(`Unknown surface style: ${style}`);
  const def=definitions[style];
  const key=style+'|'+String(color)+'|'+JSON.stringify(extra);
  if(materials.has(key))return materials.get(key);
  const material=new THREE.MeshStandardMaterial({color,roughness:def.roughness,metalness:def.metalness,...extra});
  const photo = style === 'asphalt' ? startAsphaltPhoto() : null;
  const wallPhoto = style === 'plaster' ? startPlasterPhoto() : null;
  const rainEligible=style==='asphalt'||style==='paint';
  if(photo){
    material.userData.rainDryEnvironment={map:material.envMap,intensity:material.envMapIntensity};
    rainyAsphaltMaterials.add(material);
    if(surfaceRainAmount.value>.001&&surfaceRainEnvironment){material.envMap=surfaceRainEnvironment;material.envMapIntensity=.24;}
  }
  material.name=`Taiwan ${style} ${String(color)}`;
  material.userData.surfaceStyle=style;
  material.userData.textureMetres=def.metres;
  material.onBeforeCompile=shader=>{
    shader.uniforms.taiwanSurfaceTexture={value:textureFor(style)};
    shader.uniforms.taiwanSurfaceMetres={value:def.metres};
    shader.uniforms.taiwanSurfaceBump={value:def.bump};
    shader.uniforms.taiwanSurfaceRoughnessVariation={value:def.roughnessVariation??.27};
    shader.uniforms.taiwanSurfaceJointColor={value:new THREE.Color(style==='brickwork'?'#aaa08e':'#9c9b8d')};
    shader.uniforms.taiwanSurfaceFiredClay={value:style==='brickwork'?1:0};
    if(rainEligible)shader.uniforms.taiwanSurfaceRainAmount=surfaceRainAmount;
    if (photo) {
      // A packed procedural texture is a safe placeholder if the environment
      // cannot load images. The shared flag changes only after all maps load.
      shader.uniforms.taiwanAsphaltColor={value:photo.maps?.color ?? textureFor(style)};
      shader.uniforms.taiwanAsphaltNormal={value:photo.maps?.normal ?? textureFor(style)};
      shader.uniforms.taiwanAsphaltRoughness={value:photo.maps?.roughness ?? textureFor(style)};
      shader.uniforms.taiwanAsphaltReady=photo.ready;
    }
    if(wallPhoto){
      shader.uniforms.taiwanPlasterColor={value:wallPhoto.maps?.color??textureFor(style)};
      shader.uniforms.taiwanPlasterNormal={value:wallPhoto.maps?.normal??textureFor(style)};
      shader.uniforms.taiwanPlasterRoughness={value:wallPhoto.maps?.roughness??textureFor(style)};
      shader.uniforms.taiwanPlasterReady=wallPhoto.ready;
    }
    shader.vertexShader='varying vec3 vTaiwanSurfaceWorld;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',/* glsl */`
      #include <project_vertex>
      vec4 taiwanWorldPosition=vec4(transformed,1.0);
      #ifdef USE_BATCHING
        taiwanWorldPosition=batchingMatrix*taiwanWorldPosition;
      #endif
      #ifdef USE_INSTANCING
        taiwanWorldPosition=instanceMatrix*taiwanWorldPosition;
      #endif
      vTaiwanSurfaceWorld=(modelMatrix*taiwanWorldPosition).xyz;
    `);
    shader.fragmentShader=fragmentDeclarations+(rainEligible?roadRainShaderChunk:'')+(photo ? /* glsl */`
      uniform sampler2D taiwanAsphaltColor;
      uniform sampler2D taiwanAsphaltNormal;
      uniform sampler2D taiwanAsphaltRoughness;
      uniform float taiwanAsphaltReady;
    ` : '')+(wallPhoto ? /* glsl */`
      uniform sampler2D taiwanPlasterColor;
      uniform sampler2D taiwanPlasterNormal;
      uniform sampler2D taiwanPlasterRoughness;
      uniform float taiwanPlasterReady;
    ` : '')+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',/* glsl */`
      #include <map_fragment>
      vec2 twSurfaceUV=taiwanSurfaceUV(vTaiwanSurfaceWorld);
      vec4 twSurfaceSample=texture2D(taiwanSurfaceTexture,twSurfaceUV);
      ${photo ? /* glsl */`
      // Poly Haven's tile covers two metres. Rescale its sRGB-decoded
      // values as variation around the authored street tint rather than
      // multiplying two dark albedos and turning the road nearly black.
      vec2 twPhotoUV=twSurfaceUV*taiwanSurfaceMetres/2.0;
      vec3 twAsphaltGain=vec3(twSurfaceSample.r);
      if(taiwanAsphaltReady>.5){
        vec3 photoAlbedo=texture2D(taiwanAsphaltColor,twPhotoUV).rgb;
        // Asphalt 03 has a brown source cast. Preserve photographed detail
        // while keeping the authored neutral-grey road colour: retain only a
        // small amount of chroma, rather than baking that cast into the city.
        float photoValue=dot(photoAlbedo,vec3(.2126,.7152,.0722));
        vec3 neutralAlbedo=mix(vec3(photoValue),photoAlbedo,.12);
        twAsphaltGain=mix(twAsphaltGain,clamp(neutralAlbedo*12.0,vec3(.40),vec3(1.30)),.80);
      }
      diffuseColor.rgb*=twAsphaltGain;
      ` : wallPhoto ? /* glsl */`
      // The source is a 2m square; preserve the building's authored paint
      // tint and existing separate weathering, adding photographed variation.
      vec2 twPhotoUV=twSurfaceUV*taiwanSurfaceMetres/2.0;
      float wallGain=twSurfaceSample.r;
      if(taiwanPlasterReady>.5){
        vec3 wallRGB=texture2D(taiwanPlasterColor,twPhotoUV).rgb;
        float wallValue=dot(wallRGB,vec3(.2126,.7152,.0722));
        wallGain=mix(wallGain,clamp((wallValue-.72)*1.35+1.0,.75,1.20),.85);
      }
      diffuseColor.rgb*=wallGain;
      ` : 'diffuseColor.rgb*=twSurfaceSample.r;'}
      if(taiwanSurfaceFiredClay>.5){
        float twKilnTone=smoothstep(.89,.99,twSurfaceSample.r);
        diffuseColor.rgb*=mix(vec3(.97,.99,1.03),vec3(1.03,1.01,.96),twKilnTone);
      }
      // Alpha describes the existing face's exposed clay/glaze, not opacity.
      // Mortar is mineral grey rather than a darker tint of green tile/red clay.
      diffuseColor.rgb=mix(taiwanSurfaceJointColor*twSurfaceSample.r,diffuseColor.rgb,twSurfaceSample.a);
      ${rainEligible?/* glsl */`
      vec2 twRainWet=twRoadWetness(vTaiwanSurfaceWorld);
      if(twRainWet.x>.001)diffuseColor.rgb*=mix(mix(1.0,.80,twRainWet.x),.68,twRainWet.y);
      `:''}
    `);
    shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',/* glsl */`
      #include <roughnessmap_fragment>
      roughnessFactor=clamp(roughnessFactor+(twSurfaceSample.g-.5)*taiwanSurfaceRoughnessVariation,.065,1.0);
      ${photo ? /* glsl */`
      if(taiwanAsphaltReady>.5){
        float photoRough=texture2D(taiwanAsphaltRoughness,twPhotoUV).g;
        roughnessFactor=clamp(mix(roughnessFactor,photoRough,.40),.82,1.0);
      }
      ` : wallPhoto ? /* glsl */`
      if(taiwanPlasterReady>.5){
        float wallRough=texture2D(taiwanPlasterRoughness,twPhotoUV).g;
        roughnessFactor=clamp(mix(roughnessFactor,wallRough,.40),.78,1.0);
      }
      ` : ''}
      ${rainEligible?/* glsl */`
      if(twRainWet.x>.001){
        float twDampRoughness=mix(roughnessFactor,.52,twRainWet.x);
        // The independent planar film supplies the sharp water reflection;
        // the mineral substrate keeps a subdued broad environment response.
        roughnessFactor=mix(twDampRoughness,.45,twRainWet.y);
      }`:''}
    `);
    shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',/* glsl */`
      #include <normal_fragment_maps>
      ${photo ? /* glsl */`if(taiwanAsphaltReady>.5){
        // Tangent frame comes from projected UV and view-space derivatives,
        // so non-uniform InstancedMesh scales preserve correct normal detail.
        vec3 q0=dFdx(-vViewPosition), q1=dFdy(-vViewPosition);
        vec2 st0=dFdx(twPhotoUV), st1=dFdy(twPhotoUV);
        vec3 q1perp=cross(q1,normal), q0perp=cross(normal,q0);
        vec3 T=q1perp*st0.x+q0perp*st1.x;
        vec3 B=q1perp*st0.y+q0perp*st1.y;
        float basisLength=max(dot(T,T),dot(B,B));
        if(basisLength>1e-12){
          float basisScale=inversesqrt(basisLength);
          vec3 mapN=texture2D(taiwanAsphaltNormal,twPhotoUV).xyz*2.0-1.0;
          mapN.xy*=.35;
          normal=normalize(mat3(T*basisScale,B*basisScale,normal)*normalize(mapN));
        }
      } else {` : wallPhoto ? /* glsl */`if(taiwanPlasterReady>.5){
        vec3 q0=dFdx(-vViewPosition),q1=dFdy(-vViewPosition);
        vec2 st0=dFdx(twPhotoUV),st1=dFdy(twPhotoUV);
        vec3 q1perp=cross(q1,normal),q0perp=cross(normal,q0);
        vec3 T=q1perp*st0.x+q0perp*st1.x;
        vec3 B=q1perp*st0.y+q0perp*st1.y;
        float basisLength=max(dot(T,T),dot(B,B));
        if(basisLength>1e-12){
          float basisScale=inversesqrt(basisLength);
          vec3 mapN=texture2D(taiwanPlasterNormal,twPhotoUV).xyz*2.0-1.0;
          mapN.xy*=.70;
          normal=normalize(mat3(T*basisScale,B*basisScale,normal)*normalize(mapN));
        }
      } else {` : ''}
      vec2 twDuvX=dFdx(twSurfaceUV);
      vec2 twDuvY=dFdy(twSurfaceUV);
      float twHeight=twSurfaceSample.b;
      vec2 twGradient=vec2(
        texture2D(taiwanSurfaceTexture,twSurfaceUV+twDuvX).b-twHeight,
        texture2D(taiwanSurfaceTexture,twSurfaceUV+twDuvY).b-twHeight
      )*taiwanSurfaceBump;
      normal=taiwanSurfaceNormal(-vViewPosition,normal,twGradient,faceDirection);
      ${photo || wallPhoto ? '}' : ''}
      ${rainEligible?/* glsl */`if(twRainWet.x>.001)normal=normalize(mix(normal,nonPerturbedNormal,min(.94,.35*twRainWet.x+.60*twRainWet.y)));`:''}
    `);
  };
  // Shader code is identical across styles; maps and physical scale are uniforms.
  material.customProgramCacheKey=()=> (photo ? 'taiwan-asphalt-photo-world-v2' : wallPhoto ? 'taiwan-stucco-photo-world-v1' : 'taiwan-original-world-surfaces-v2')+(rainEligible?'|bounded-rain-v3-planar-film':'');
  materials.set(key,material);
  return material;
}
