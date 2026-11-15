import * as THREE from 'three';
import {createSurfaceMaterial} from './surfaces.js';
import {addExemplarFacade} from './exemplar-facades.js';
import {addNeighborFacade} from './neighbor-facades.js';
import {addNeighborShopFinish} from './neighbor-shop-finish.js';
import {addNeighborContextShop} from './neighbor-context-finish.js';
import {addNeighborSevenUpper,addNeighborSevenInterior,addNeighborSevenCoolerStock} from './neighbor-seven-finish.js';
import {createBuildingWeathering} from './weathering.js';
import {refineWindowSurface,refineLitWindowSurface} from './windows.js';
import {createStreetSignage} from './signage.js';
import {SIGN_FONT} from './typography.js';
import {NEIGHBOURHOOD_BUSINESSES,furnishBusiness} from './businesses.js';
import {addPaintoverDetails} from './paintover-details.js';
import {addOrganicPlants} from './organic-plants.js';
import {createRetailLighting} from './shop-lights.js';
import {addLifeDetails} from './life-details.js';
import {addShowcaseWear} from './showcase-details.js';
import {addUtilityWires} from './utility-wires.js';
import {addSignClutter} from './sign-clutter.js';
import {addFacadeLife} from './facade-life.js';
import {addStreetClutter} from './street-clutter.js';
import {addFarBackdrop} from './backdrop-far.js';
import {addTerminusShrine} from './terminus-shrine.js';
import {addRoadWorks} from './road-works.js';
import {addPublicMarket} from './public-market.js';
import {addBackLaneHouses} from './back-lane-houses.js';
import {addCrossStreetEast} from './cross-street-east.js';
import {addParkWallDressing} from './park-wall-dressing.js';
import {addTempleWest} from './temple-west.js';
import {addStreetArches} from './street-arches.js';
import {createPaperLanternParts} from './rain-festival-details.js';
import {PLACEMENT_BOUNDS} from './state.js';

// Original, code-built Taiwanese alley. One world unit is one metre.
// Decorative primitives are instanced by geometry/material to keep draw calls low.
export const spawn = { x: 0, z: 8, yaw: 0 };

export function buildWorld(scene, {southCurbGaps = [], openNorthExit = false, scooterFactory = null, rainStreetFinish = false} = {}) {
  const root = new THREE.Group();
  root.name = 'Taiwan neighbourhood — original procedural scenery';
  scene.add(root);
  const retailLighting=createRetailLighting(root);
  const dailySigns=createStreetSignage(root);
  const shopAddresses=[];
  const businesses=[];
  const colliders = [];
  const placements = [];
  const bounds=PLACEMENT_BOUNDS;
  const groundColliders=[{position:[0,-.15,0],size:[80,.3,90]}];
  const shopFloorZones=[];
  const batches = new Map();
  const weather=createBuildingWeathering(),buildingFronts=[];
  let activeBuildingId=-1;
  const materials = {};
  const mat = (name, color, extra = {}) => {
    if (materials[name]) return materials[name];
    const style=/brickwork/.test(name)?'brickwork':/brick/.test(name)?'brick':/painted|oxide red|ivory|road markings|scooter-/.test(name)?'paint':/plaster/.test(name)?'plaster':/tile/.test(name)?'tile':/road$|asphalt/.test(name)?'asphalt':/pavement|foundation|concrete|mortar|cement/.test(name)?'concrete':/wood/.test(name)?'wood':/rubber/.test(name)?'rubber':/linen|lanterns/.test(name)?'canvas':/crate|packaging/.test(name)?'plastic':/metal|steel/.test(name)?'metal':null;
    const material=style?createSurfaceMaterial(style,color,extra):new THREE.MeshStandardMaterial({color,roughness:.78,...extra});
    material.userData.weatherRole=style==='plaster'?'plaster':style==='brick'||style==='brickwork'||style==='concrete'?'masonry':['tile','wood','metal','paint'].includes(style)?style:null;
    return materials[name]=material;
  };
  const cream = mat('plaster', '#d9d1b8');
  const mint = mat('mint plaster', '#a1aaa0');
  const yellow = mat('warm plaster', '#c9b68b');
  const peach = mat('peach plaster', '#c6aaa0');
  const dark = mat('dark painted steel', '#3c5350');
  const red = mat('oxide red', '#ad493c');
  const paleRed = mat('roof tile', '#b56850');
  const metal = mat('galvanized metal', '#a6aba8', { metalness: .82, roughness: .47 });
  const window = refineWindowSurface(mat('blue green glass', '#405557', { metalness: 0, roughness: .17 }));
  const clearGlass=new THREE.MeshStandardMaterial({color:'#d9eeee',metalness:0,roughness:.1,envMapIntensity:2.2,transparent:true,opacity:.13,depthWrite:false,side:THREE.DoubleSide});
  clearGlass.userData.architecturalGlass='storefront';
  // Closed thin boxes expose an outward face from either side of the door.
  // Culling the hidden far face avoids applying the pane's tint twice.
  // Single planes still need the original double-sided material.
  const boxedClearGlass=clearGlass.clone();boxedClearGlass.side=THREE.FrontSide;
  boxedClearGlass.name='Storefront thin box outer glass';
  const windowLight = refineLitWindowSurface(mat('lit windows', '#e8c78c', { emissive: '#f5bc6a', emissiveIntensity: .12 }));
  const white = mat('ivory', '#f4ecda');
  const pavement = mat('pavement', '#c2bda8');
  const road = mat('road', '#595e60');
  const line = mat('road markings', '#ebe2c9');
  const green = mat('green packaging', '#557760',{roughness:.42});
  const leafGreen = mat('leaf surface', '#45684b',{roughness:.52});
  const lightGreen = mat('new leaf surface', '#738748',{roughness:.57});
  const terracotta = mat('terracotta', '#b57754');
  const black = mat('rubber', '#303d3c');
  const lanternMat = mat('lanterns', '#cd523e', { emissive: '#b84021', emissiveIntensity: .08 });
  const lanternRib = mat('lantern rib bamboo', '#8a4438', { roughness: .92 });
  const lanternCap = mat('lantern cap metal', '#a18b59', { metalness: .35, roughness: .62 });
  const lampMat = mat('lamp bulbs', '#fff1cb', { emissive: '#ffd89a', emissiveIntensity: .22 });
  const ceramicTile = mat('wall tile', '#a6b7a6', {roughness:.38});
  const frameGrey = mat('window frame grey metal', '#8f979b', {metalness:.5, roughness:.5});
  const frameBronze = mat('window frame bronze metal', '#6b5f4c', {metalness:.5, roughness:.55});
  const tinWall = mat('rooftop tin wall metal', '#7e8a8c', {metalness:.5, roughness:.6});
  const tinRoof = mat('rooftop tin roof metal', '#98a0a2', {metalness:.6, roughness:.52});
  const wood = mat('shop wood', '#957550', {roughness:.8});
  const curtain = mat('linen', '#c9bd9c');
  const shutter = mat('shutter metal', '#8c9490', {metalness:.3,roughness:.72});
  const interiorDark = mat('recess shadow', '#263d3d');
  const bluePlastic = mat('crate blue', '#4f6f76');
  const milkGlass = mat('frosted glass', '#b4c1b3',{roughness:.36,metalness:0});
  const fluorescent = mat('fluorescent', '#e8f4ea',{emissive:'#e0f4ff',emissiveIntensity:1.3});
  const brick = mat('old red brick', '#985f4c', {roughness:.94});
  const brickLight = mat('sun faded brick', '#ad7761', {roughness:.94});
  const mortar = mat('lime mortar', '#bdad95', {roughness:.96});
  const brickwork = mat('historic brickwork', '#945c46', {roughness:.91});
  // Tiny shared labels are deliberately reused across shelves. This keeps
  // the merchandise legible up close without a separate draw call per tin.
  const merchandiseLabels=new Map();
  function merchandiseLabel(text){
    if(merchandiseLabels.has(text))return merchandiseLabels.get(text);
    const canvas=document.createElement('canvas');canvas.width=160;canvas.height=96;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#e8dfc8';ctx.fillRect(0,0,160,96);
    ctx.strokeStyle='#77664a';ctx.lineWidth=3;ctx.strokeRect(3,3,154,90);
    ctx.fillStyle='#314b3e';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.font=`700 43px ${SIGN_FONT}`;ctx.fillText(text,80,48,142);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    texture.name=`World merchandise print ${text}`;
    const material=new THREE.MeshStandardMaterial({map:texture,roughness:.9});
    merchandiseLabels.set(text,material);return material;
  }
  const teaTinColors=[mat('tea tin forest','#455e4d',{roughness:.48}),mat('tea tin red','#8a4035',{roughness:.48}),mat('tea tin indigo','#4d6067',{roughness:.48}),mat('tea tin olive','#6d7351',{roughness:.48})];
  const teaLid=mat('tea tin lid metal','#9b987c',{metalness:.45,roughness:.38});
  const dryTones=[mat('dried jujube','#733e32'),mat('dried mushrooms','#6b5744'),mat('dried longan','#96754e'),mat('dried grains','#bbaa7c')];
  const herbJarGlass=mat('herbal display glass','#c9d8cd',{transparent:true,opacity:.32,depthWrite:false,roughness:.22});
  const tableware = mat('glazed tableware', '#e9e5d6', {roughness:.23});
  const paper = mat('kraft paper bags', '#c7a577', {roughness:.98});
  const driedGoods = mat('dried goods', '#81603b', {roughness:.97});
  const archShape=new THREE.Shape();
  archShape.moveTo(-.5,-.5);archShape.lineTo(.5,-.5);archShape.lineTo(.5,0);
  archShape.absarc(0,0,.5,0,Math.PI,false);archShape.lineTo(-.5,-.5);
  const rampGeometry=new THREE.BufferGeometry();
  rampGeometry.setAttribute('position',new THREE.Float32BufferAttribute([
    -.5,0,-.5, .5,0,-.5, .5,1,-.5, -.5,0,.5, .5,0,.5, .5,1,.5
  ],3));
  rampGeometry.setIndex([0,5,2,0,3,5,0,2,1,3,4,5,1,2,5,1,5,4,0,1,4,0,4,3]);
  const rampSurface=rampGeometry.toNonIndexed();rampSurface.computeVertexNormals();
  const geometries = {
    box: new THREE.BoxGeometry(1, 1, 1),
    cylinder: new THREE.CylinderGeometry(1, 1, 1, 16),
    cone: new THREE.ConeGeometry(1, 1, 8),
    sphere: new THREE.SphereGeometry(1, 16, 10),
    leaf: new THREE.SphereGeometry(1, 7, 4),
    plane: new THREE.PlaneGeometry(1,1),
    arch: new THREE.ShapeGeometry(archShape,12),
    ramp: rampSurface,
  };
  // Paper lanterns share one part definition with the rain-festival rows:
  // lathed body, bamboo ribs, metal caps and tassel strands, anchored at the
  // hanging point (see createPaperLanternParts).
  const lanternParts=createPaperLanternParts();
  geometries.lanternBody=lanternParts.body;
  geometries.lanternRibs=lanternParts.ribs;
  geometries.lanternCaps=lanternParts.caps;
  geometries.lanternTassel=lanternParts.tassel;
  const archUV=geometries.arch.attributes.uv;
  for(let i=0;i<archUV.count;i++)archUV.setXY(i,archUV.getX(i)+.5,archUV.getY(i)+.5);
  const leafPositions=geometries.leaf.attributes.position;
  for(let i=0;i<leafPositions.count;i++){
    const x=leafPositions.getX(i),y=leafPositions.getY(i),z=leafPositions.getZ(i);
    leafPositions.setXYZ(i,x*(.84-.18*z),y+.22*z*z,z);
  }
  geometries.leaf.computeVertexNormals();
  const dummy = new THREE.Object3D();
  function primitive(type, material, position, scale, rotation = [0, 0, 0], group=root) {
    if(type==='box'&&material===clearGlass)material=boxedClearGlass;
    const key = type + ':' + material.uuid + ':' + group.uuid;
    if (!batches.has(key)) batches.set(key, { geometry: geometries[type], material, matrices: [], buildingIds:[],group });
    dummy.position.set(...position); dummy.scale.set(...scale); dummy.rotation.set(...rotation); dummy.updateMatrix();
    batches.get(key).matrices.push(dummy.matrix.clone());
    batches.get(key).buildingIds.push(activeBuildingId);
  }
  const box = (m, x, y, z, w, h, d, ry = 0) => primitive('box', m, [x, y, z], [w, h, d], [0, ry, 0]);
  const cyl = (m, x, y, z, r, h, rotation = [0, 0, 0]) => primitive('cylinder', m, [x, y, z], [r, h, r], rotation);
  const sphere = (m, x, y, z, rx, ry = rx, rz = rx) => primitive('sphere', m, [x, y, z], [rx, ry, rz]);
  const solid = (x, y, z, w, h, d) => colliders.push({ position: [x, y, z], size: [w, h, d] });
  const toWorld = (cx, cz, x, z, angle) => [cx + Math.cos(angle) * x + Math.sin(angle) * z, cz - Math.sin(angle) * x + Math.cos(angle) * z];
  // Compose local geometry rotations in the same existing instance batches.
  const localMesh=(cx,cz,angle,group=root)=>(geometry,material,lx,y,lz,rotation=[0,0,0],scale=[1,1,1])=>{
    const type=`shared-${geometry.uuid}`;
    if(!geometries[type])geometries[type]=geometry;
    const [x,z]=toWorld(cx,cz,lx,lz,angle);
    const quaternion=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),angle)
      .multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)));
    const euler=new THREE.Euler().setFromQuaternion(quaternion);
    primitive(type,material,[x,y,z],scale,[euler.x,euler.y,euler.z],group);
  };

  function sign(text, subtitle, x, y, z, w, h, bg = '#264f47', fg = '#f7edce', ry = 0) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.min(2048,Math.max(256,Math.round(w/h*256)));
    canvas.height = Math.round(canvas.width*h/w);
    const cw=canvas.width,ch=canvas.height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = fg; ctx.globalAlpha=.6; ctx.lineWidth = ch*.012; ctx.strokeRect(ch*.05, ch*.05, cw-ch*.1, ch*.9); ctx.globalAlpha=1;
    for(let i=0;i<42;i++){ctx.fillStyle=i%2?'#fff':'#1c2826';ctx.globalAlpha=.025;ctx.fillRect((i*177)%1024,(i*43)%256,11+(i%8)*9,1+(i%4));}ctx.globalAlpha=1;
    ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const draw=(line,size,y)=>{ctx.font=`700 ${size}px ${SIGN_FONT}`;const measured=ctx.measureText(line).width;if(measured>cw-ch*.22)ctx.font=`700 ${size*(cw-ch*.22)/measured}px ${SIGN_FONT}`;ctx.fillText(line,cw/2,y);};
    draw(text,ch*(subtitle?.47:.62),ch*(subtitle?.36:.51));
    if (subtitle) draw(subtitle,ch*.21,ch*.78);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy=4;
    const material = new THREE.MeshStandardMaterial({ map: texture, roughness: .85, emissive: '#ffffff', emissiveIntensity: .035 });
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
    panel.position.set(x, y, z); panel.rotation.y = ry; root.add(panel);
    weather.attachMesh(panel,activeBuildingId,'sign');
    return panel.material;
  }
  function verticalSign(text, x,y,z, color,angle=0) {
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=1024;
    const ctx=canvas.getContext('2d');ctx.fillStyle=color;ctx.fillRect(0,0,256,1024);
    ctx.strokeStyle='#e7ddbb';ctx.lineWidth=5;ctx.strokeRect(12,12,232,1000);
    ctx.font=`700 163px ${SIGN_FONT}`;ctx.fillStyle='#fff1d2';ctx.textAlign='center';ctx.textBaseline='middle';
    [...text].forEach((c,i)=>ctx.fillText(c,128,110+i*(800/Math.max(text.length-1,1)),210));
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const m=new THREE.MeshStandardMaterial({map:texture,roughness:.63,emissive:'#ffffff',emissiveIntensity:.09});
    const panel=new THREE.Mesh(new THREE.PlaneGeometry(.60,2.35),m);panel.position.set(x,y,z);panel.rotation.y=angle;root.add(panel);
    const nearest=buildingFronts.filter(b=>Math.sign(b.x)===Math.sign(x)).sort((a,b)=>Math.abs(a.z-z)-Math.abs(b.z-z))[0];
    if(nearest)weather.attachMesh(panel,nearest.id,'sign');
    const reverse=new THREE.Mesh(panel.geometry.clone(),m);
    reverse.position.set(x-Math.sin(angle)*.11,y,z-Math.cos(angle)*.11);reverse.rotation.y=angle+Math.PI;root.add(reverse);
    if(nearest)weather.attachMesh(reverse,nearest.id,'sign');
    box(dark,x-Math.sin(angle)*.055,y,z-Math.cos(angle)*.055,.67,2.42,.09,angle);
    const wallX=x<0?-3.40:3.15;
    for(const yy of [y-.93,y+.93]){box(metal,(wallX+x)/2,yy,z-.04,Math.abs(wallX-x)+.08,.045,.055);box(dark,wallX,yy,z-.04,.055,.24,.18);}
  }
  function plant(x, z, scale = 1, y = .12) {
    // Thin, angled leaves and uneven branching replace identical cactus-like blobs.
    const phase=Math.abs(Math.sin(x*12.53+z*4.17));
    const pot=phase>.62?mat('cement plant pot','#aaa79a'):terracotta;
    cyl(pot,x,y+.18*scale,z,.19*scale,.36*scale);
    cyl(dark,x,y+.365*scale,z,.194*scale,.026*scale);
    cyl(mat('pot soil','#514c3b'),x,y+.376*scale,z,.17*scale,.012*scale);
    if(y<.3)solid(x,y+.18*scale,z,.38*scale,.36*scale,.38*scale);
    const count=phase>.4?12:9;
    for(let i=0;i<count;i++){
      const a=i*2.39996+phase*5.2;
      const reach=(.16+(i%4)*.033)*scale;
      const level=(.48+(i%5)*.105)*scale;
      const lx=x+Math.cos(a)*reach,lz=z+Math.sin(a)*reach;
      const stalkMid=new THREE.Vector3((x+lx)/2,y+level/2+.19*scale,(z+lz)/2);
      const stalkEnd=new THREE.Vector3(lx,y+level,lz);
      const stemLength=stalkEnd.distanceTo(new THREE.Vector3(x,y+.38*scale,z));
      dummy.position.copy(stalkMid);dummy.scale.set(.009*scale,stemLength,.009*scale);
      dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),stalkEnd.clone().sub(new THREE.Vector3(x,y+.38*scale,z)).normalize());dummy.updateMatrix();
      const key='cylinder:'+leafGreen.uuid;if(!batches.has(key))batches.set(key,{geometry:geometries.cylinder,material:leafGreen,matrices:[]});batches.get(key).matrices.push(dummy.matrix.clone());
      primitive('leaf',i%4===0?lightGreen:leafGreen,[lx,y+level,lz],[.075*scale,.018*scale,(.19+(i%3)*.025)*scale],[-.25-(i%3)*.13,a,.12*Math.sin(a)]);
    }
  }
  function stool(x, z) {
    const floor=x>4.4&&x<10.6&&z>-3.8&&z<4.8?.20:.14;
    cyl(red, x, floor+.4425, z, .27, .035);
    for (const dx of [-.18, .18]) for (const dz of [-.18, .18]) cyl(red, x + dx, floor+.2125, z + dz, .022, .425);
  }
  function scooter(x, z, color, angle = 0, floor = .14) {
    // Only the r187 scene supplies this factory. The original world and the
    // missing-asset fallback retain their existing procedural scooters.
    if (scooterFactory) {
      const replacement = scooterFactory(x, z, angle, floor, color);
      root.add(replacement.object);
      colliders.push(replacement.collider);
      return;
    }
    const body = mat('scooter-' + color, color, {roughness:.32,metalness:0});
    const b=(m,lx,y,lz,w,h,d)=>{const [px,pz]=toWorld(x,z,lx,lz,angle);box(m,px,y,pz,w,h,d,angle);};
    const rounded=(m,lx,y,lz,w,h,d)=>{const [px,pz]=toWorld(x,z,lx,lz,angle);primitive('sphere',m,[px,y,pz],[w,h,d],[0,angle,0]);};
    const c=(m,lx,y,lz,r,h,rotation)=>{const [px,pz]=toWorld(x,z,lx,lz,angle);cyl(m,px,y,pz,r,h,[rotation[0],angle+rotation[1],rotation[2]]);};
    for(const lz of [-.56,.55]){c(black,0,.37,lz,.25,.15,[0,0,Math.PI/2]);c(metal,.085,.37,lz,.13,.165,[0,0,Math.PI/2]);c(dark,.095,.37,lz,.055,.18,[0,0,Math.PI/2]);}
    rounded(body,0,.68,-.34,.27,.30,.44);
    rounded(black,0,.96,-.23,.24,.065,.43);
    b(body,0,.43,.16,.44,.10,.68);
    rounded(body,0,.82,.53,.27,.42,.13);
    rounded(body,0,.52,.60,.23,.11,.32);
    b(metal,0,1.18,.56,.045,.37,.045);
    rounded(body,0,1.31,.56,.33,.12,.14);
    b(dark,0,1.32,.56,.72,.05,.065);
    b(milkGlass,0,1.32,.70,.28,.14,.026);
    b(red,0,.69,-.75,.28,.10,.03);
    b(white,0,.52,-.78,.20,.13,.02);
    for(const side of [-1,1]){b(metal,side*.27,1.47,.56,.018,.27,.018);rounded(window,side*.31,1.60,.56,.10,.06,.035);}
    b(metal,-.29,.36,-.43,.10,.10,.51);
    // Parked rider's helmet and the side stand give the machine a human use.
    rounded(black,.015,1.09,-.47,.19,.18,.19);rounded(milkGlass,.015,1.08,-.32,.14,.07,.035);
    solid(x,.7,z,.85,1.4,1.65);
  }
  function awning(cx, z, width, depth, angle, color) {
    const stripes = Math.ceil(width / .33);
    for (let i = 0; i < stripes; i++) {
      const [px, pz] = toWorld(cx, z, -width / 2 + width / stripes * (i + .5), depth / 2, angle);
      box(i % 2 ? white : color, px, 2.65, pz, width / stripes, .075, depth, angle);
      const [fx, fz] = toWorld(cx, z, -width / 2 + width / stripes * (i + .5), depth - .02, angle);
      box(i % 2 ? white : color, fx, 2.52, fz, width / stripes, .25, .06, angle);
    }
  }
  // Reuse the street's existing metal geometry for Taiwanese rooftop hardware.
  // The tank's legs and rolled seams make the previously plain cylinder read
  // as a supported stainless water tank, not a loose drum on the roof.
  function roofTank(x,z,height,r=.48,tankHeight=1.15){
    const rim=mat('tank seam galvanized metal','#919b98',{metalness:.8,roughness:.48});
    const center=height+.79;
    for(const dx of [-1,1])for(const dz of [-1,1])
      box(metal,x+dx*r*.61,height+.13,z+dz*r*.61,.06,.26,.06);
    box(metal,x,height+.23,z,r*1.60,.055,r*1.60);
    cyl(metal,x,center,z,r,tankHeight);
    for(const offset of [-.39,0,.39])cyl(rim,x,center+offset,z,r+.012,.035);
    cyl(rim,x,center+tankHeight/2+.025,z,r+.025,.05);
    cyl(dark,x,center+tankHeight/2+.065,z,r*.18,.045);
    cyl(metal,x+r*.67,height+.25,z,.035,.5);
  }
  function frontBuilding(cx, cz, width, depth, height, bodyMat, title, caption, ry = Math.PI / 2, trade='tea',doorNumber=2) {
    const previousBuildingId=activeBuildingId;
    const exemplar=trade==='breakfast'?'breakfast':title==='春日茶行'?'tea':null;
    const neighbor=title==='永和商店'?'dry':title==='巷口食堂'?'food':null;
    activeBuildingId=weather.registerBuilding({x:cx,z:cz,angle:ry,width,depth,height,front:depth/2+1.45,kind:'front'});
    buildingFronts.push({x:cx,z:cz,id:activeBuildingId});
    // A shophouse is three separate volumes: deep shop, open arcade, upper home.
    // The ground-floor front is 2.55 m behind the upper facade, not a solid box
    // hidden behind ornamental columns. Local +Z points toward the street.
    const front=depth/2+1.45, shopFront=depth/2-1.30, rear=-depth/2;
    const b=(m,lx,y,lz,w,h,d)=>{const [x,z]=toWorld(cx,cz,lx,lz,ry);box(m,x,y,z,w,h,d,ry);};
    const hit=(lx,y,lz,w,h,d)=>{
      const [x,z]=toWorld(cx,cz,lx,lz,ry),c=Math.abs(Math.cos(ry)),q=Math.abs(Math.sin(ry));
      solid(x,y,z,c*w+q*d,h,q*w+c*d);
    };
    const round=(m,lx,y,lz,r,h)=>{const [x,z]=toWorld(cx,cz,lx,lz,ry);cyl(m,x,y,z,r,h);};
    const face=(type,m,lx,y,lz,w,h)=>{const [x,z]=toWorld(cx,cz,lx,lz,ry);primitive(type,m,[x,y,z],[w,h,1],[0,ry,0]);};
    const pitched=(m,lx,y,lz,w,h,d,pitch=0)=>{
      const [x,z]=toWorld(cx,cz,lx,lz,ry);
      const q=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),ry)
        .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),pitch));
      const rotation=new THREE.Euler().setFromQuaternion(q);
      primitive('box',m,[x,y,z],[w,h,d],[rotation.x,rotation.y,rotation.z]);
    };
    const sideFace=(side,m,lz,y,w,h,outset=.035)=>{
      const [x,z]=toWorld(cx,cz,side*(width/2+outset),lz,ry);
      primitive('plane',m,[x,y,z],[w,h,1],[0,ry+side*Math.PI/2,0]);
    };
    const shopBack=shopFront-1.8, upperDepth=front-rear;
    const mesh=localMesh(cx,cz,ry);
    // Two actual rear service openings: the solid rear volume and the
    // interior wall panels are split around the opening. The door leaf is
    // fixed closed and has its own collider; it is not an interactive door.
    const serviceDoor=trade==='dry'||trade==='food';
    const serviceDoorX=-width/2+.72,serviceGap=1.05,serviceDoorTop=2.29;
    b(bodyMat,0,(height+3.35)/2,(front+rear)/2,width,height-3.35,upperDepth);
    hit(0,(height+3.35)/2,(front+rear)/2,width,height-3.35,upperDepth);
    if(serviceDoor){
      const left=-width/2,right=width/2,openingLeft=serviceDoorX-serviceGap/2,openingRight=serviceDoorX+serviceGap/2;
      const depth=shopBack-rear,z=(rear+shopBack)/2;
      for(const [a,c] of [[left,openingLeft],[openingRight,right]]){
        b(bodyMat,(a+c)/2,1.73,z,c-a,3.18,depth);hit((a+c)/2,1.73,z,c-a,3.18,depth);
      }
      const lintelHeight=3.32-serviceDoorTop;
      b(bodyMat,serviceDoorX,serviceDoorTop+lintelHeight/2,z,serviceGap,lintelHeight,depth);
      hit(serviceDoorX,serviceDoorTop+lintelHeight/2,z,serviceGap,lintelHeight,depth);
      const leaf=trade==='dry'?mat('rear door dark wood','#765b47',{roughness:.84}):mat('rear door steel','#667571',{metalness:.38,roughness:.57});
      const inset=trade==='dry'?mat('rear door inset wood','#674d3d',{roughness:.88}):mat('rear door inset metal','#52615e',{metalness:.34,roughness:.64});
      const leafZ=rear+.15,leafWidth=serviceGap-.12;
      b(leaf,serviceDoorX,1.215,leafZ,leafWidth,2.15,.06);
      hit(serviceDoorX,1.215,leafZ,leafWidth,2.15,.065);
      // Frames attach to the real cut edges, 15 cm in front of the closed leaf.
      for(const side of [-1,1]){
        b(cream,serviceDoorX+side*(serviceGap/2-.035),1.22,rear+.015,.07,2.16,.09);
        b(cream,serviceDoorX+side*(serviceGap/2-.035),1.22,shopBack+.08,.07,2.16,.09);
      }
      b(cream,serviceDoorX,2.28,rear+.015,serviceGap,.075,.09);
      b(cream,serviceDoorX,2.28,shopBack+.08,serviceGap,.075,.09);
      // Subtle inset panels and a separate pull handle face the alley.
      for(const y of [.65,1.52])b(inset,serviceDoorX,y,leafZ-.034,leafWidth-.20,.68,.012);
      const handleX=serviceDoorX+leafWidth*.31;
      b(metal,handleX,1.16,leafZ-.085,.025,.28,.025);
      for(const y of [1.035,1.285])b(metal,handleX,y,leafZ-.060,.025,.025,.055);
      if(trade==='food'){
        // Narrow louvres on a metal kitchen service door; no opening extends
        // into the alley and no separate fake recess sits on a solid wall.
        for(let i=0;i<4;i++)b(metal,serviceDoorX,.56+i*.075,leafZ-.045,leafWidth-.26,.018,.018);
      }else{
        for(const x of [serviceDoorX-.22,serviceDoorX+.22])b(leaf,x,1.20,leafZ-.046,.025,1.84,.016);
      }
      // The deep service passage has a second, independently closed door at
      // the shop end. Its outward face sits recessed in the interior jamb;
      // this conceals the service passage from the shop without filling the
      // structural opening with solid wall or removing either door collider.
      const insideZ=shopBack-.10;
      b(leaf,serviceDoorX,1.215,insideZ,leafWidth,2.15,.06);
      hit(serviceDoorX,1.215,insideZ,leafWidth,2.15,.065);
      for(const y of [.65,1.52])b(inset,serviceDoorX,y,insideZ+.034,leafWidth-.20,.68,.012);
      b(metal,handleX,1.16,insideZ+.085,.025,.28,.025);
      for(const y of [1.035,1.285])b(metal,handleX,y,insideZ+.060,.025,.025,.055);
      for(const y of [.39,1.27,2.19])b(metal,serviceDoorX-leafWidth/2+.035,y,insideZ+.04,.045,.10,.025);
    }else{
      b(bodyMat,0,1.73,(rear+shopBack)/2,width,3.18,shopBack-rear);
      hit(0,1.73,(rear+shopBack)/2,width,3.18,shopBack-rear);
    }
    // Side walls stop at the shop threshold; the arcade stays open between lots.
    for(const side of [-1,1]){
      b(bodyMat,side*(width/2-.08),1.73,(shopFront+shopBack)/2,.16,3.18,shopFront-shopBack);
      hit(side*(width/2-.08),1.73,(shopFront+shopBack)/2,.16,3.18,shopFront-shopBack);
      b(ceramicTile,side*(width/2-.08),.69,shopFront+.015,.18,1.10,.045);
      const col=side*(width/2-.18),colFront=front-.22;
      b(cream,col,1.73,colFront,.34,3.18,.40);hit(col,1.73,colFront,.34,3.18,.40);
      b(ceramicTile,col,.60,colFront,.37,.94,.43);
      b(white,col,3.13,colFront,.48,.20,.52);
      b(cream,col,3.08,(shopFront+front)/2,.22,.34,front-shopFront);
    }
    b(cream,0,3.26,(shopFront+front)/2,width,.24,front-shopFront);
    b(white,0,3.37,front-.02,width+.10,.20,.26);
    // Street columns carry the continuous beam and the rooms above.
    b(cream,0,3.08,front-.20,width,.34,.42);
    b(pavement,0,.135,(shopBack+front)/2,width,.01,front-shopBack);
    const [floorX,floorZ]=toWorld(cx,cz,0,(shopBack+front)/2,ry);
    const floorWidth=Math.abs(Math.cos(ry))*width+Math.abs(Math.sin(ry))*(front-shopBack);
    const floorDepth=Math.abs(Math.sin(ry))*width+Math.abs(Math.cos(ry))*(front-shopBack);
    groundColliders.push({position:[floorX,.07,floorZ],size:[floorWidth,.14,floorDepth]});
    shopFloorZones.push({x:floorX,z:floorZ,width:floorWidth,depth:floorDepth});
    function backingPanel(material,y,z,panelWidth,panelHeight,thickness){
      if(!serviceDoor){b(material,0,y,z,panelWidth,panelHeight,thickness);return;}
      const left=-panelWidth/2,right=panelWidth/2,openingLeft=serviceDoorX-serviceGap/2,openingRight=serviceDoorX+serviceGap/2;
      for(const [a,c] of [[left,openingLeft],[openingRight,right]])if(c>a)b(material,(a+c)/2,y,z,c-a,panelHeight,thickness);
      const bottom=Math.max(y-panelHeight/2,serviceDoorTop),top=y+panelHeight/2;
      if(top>bottom)b(material,serviceDoorX,(bottom+top)/2,z,serviceGap,top-bottom,thickness);
    }
    backingPanel(wood,1.63,shopBack+.035,width-.20,2.90,.05);
    backingPanel(cream,2.45,shopBack+.075,width-.28,1.08,.035);
    // A rolled-up shutter is a small header. The occupied shop below is open.
    b(shutter,0,2.87,shopFront+.02,width-.25,.24,.22);
    for(let y=2.79;y<2.99;y+=.06)b(metal,0,y,shopFront+.14,width-.30,.012,.018);
    for(const lx of [-width/2+.11,width/2-.11])b(metal,lx,1.48,shopFront+.04,.06,2.48,.09);
    b(fluorescent,0,2.96,shopFront+.72,Math.min(width-1,2.8),.045,.10);
    b(metal,0,3.005,shopFront+.72,Math.min(width-.9,2.9),.045,.15);
    // The sign is fixed to the arcade beam, above a normal person's clearance.
    const [sx,sz]=toWorld(cx,cz,0,front+.13,ry);
    sign(title,caption,sx,3.44,sz,width-.32,.53,trade==='herbs'?'#6b4636':'#e7d7b3',trade==='herbs'?'#f1dfb4':'#405b4c',ry);
    // Retractable fabric shades below the beam: their outer edge stays behind
    // the street columns, leaving both the road and the arcade clear. The
    // fascia and address plates sit above and beside the canvas respectively.
    if(((trade==='food'||trade==='dry')&&!(neighbor&&rainStreetFinish))||(trade==='herbs'&&cx>0)){
      const fabric=trade==='dry'?mat('awning linen faded red','#a75d50'):mat('awning linen muted green','#587b69');
      const paleFabric=mat('awning linen warm stripe','#e3d5b9');
      const span=width-.72,segments=Math.max(2,Math.round(span/.40)),run=.88,tilt=.21;
      const rotation=new THREE.Euler().setFromQuaternion(
        new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),ry)
          .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),tilt))
      );
      const stripDepth=run/Math.cos(tilt),outer=front-.06;
      for(let i=0;i<segments;i++){
        const lx=-span/2+span*(i+.5)/segments,cloth=i%2?paleFabric:fabric;
        const [wx,wz]=toWorld(cx,cz,lx,outer-run/2,ry);
        primitive('box',cloth,[wx,2.885,wz],[span/segments+.004,.018,stripDepth],[rotation.x,rotation.y,rotation.z]);
        b(cloth,lx,2.70,outer,span/segments+.003,.16,.025);
      }
      b(metal,0,2.99,outer-run,span,.035,.045);
      b(metal,0,2.78,outer-.025,span,.035,.045);
      for(const lx of [-span*.43,span*.43]){
        b(metal,lx,2.95,outer-run+.04,.035,.12,.035);
        b(metal,lx,2.81,outer-.06,.035,.12,.035);
      }
    }
    // Fictional local addresses: east odd, west even, increasing northwards.
    const [ax,az]=toWorld(cx,cz,-width/2+.18,front+.015,ry);
    dailySigns.add({text:'榕安街',detail:`${doorNumber}號`,x:ax,y:2.31,z:az,width:.30,height:.39,yaw:ry,kind:'address',bg:'#235b49'});
    const hours={tea:['09:00–19:00','每週一公休'],dry:['08:30–18:30','每週日公休'],cloth:['10:00–18:00','每週一公休'],herbs:['09:00–19:00','每週日公休'],food:['11:00–20:00','每週二公休'],breakfast:['06:00–13:00','每日營業']};
    // Keep the food-shop hours clear of the utensil rail and passage notice.
    const hoursX=trade==='food'?width/2-.65:serviceDoor?serviceDoorX+1.18:-width/2+.55;
    const [hx,hz]=toWorld(cx,cz,hoursX,shopBack+.115,ry),schedule=hours[trade];
    dailySigns.add({text:'營業時間',detail:schedule[0],note:schedule[1],x:hx,y:2.40,z:hz,width:.74,height:.53,yaw:ry,bg:'#eee8d6',fg:'#354d42',kind:'hours'});
    if(trade==='tea'||trade==='food'){
      const [tx,tz]=toWorld(cx,cz,0,shopBack+.12,ry);
      dailySigns.add({text:'騎樓通道',detail:'請保持暢通',x:tx,y:2.67,z:tz,width:1.10,height:.25,yaw:ry,bg:'#eee8d6',fg:'#465d50'});
    }
    shopAddresses.push({name:title,street:'榕安街',number:doorNumber,position:[cx,cz],hours:schedule});
    // Merchandise lives inside the threshold; a clear entrance is left at one end.
    const displayWidth=Math.max(1.10,width-1.55),displayX=.48;
    b(wood,displayX,.61,shopFront-.40,displayWidth,.80,.60);
    b(dark,displayX,1.035,shopFront-.40,displayWidth+.06,.06,.66);
    hit(displayX,.62,shopFront-.40,displayWidth,.92,.62);
    if(neighbor){
      addNeighborShopFinish(neighbor,{width,shopFront,shopBack,displayX,displayWidth,b,round,face,mesh,mat,merchandiseLabel,
        palette:{cream,white,dark,wood,metal,paper,tableware,dryTones}});
    }else if(trade==='dry'){
      for(let i=0;i<Math.floor(displayWidth/.48);i++){
        const x=displayX-displayWidth/2+.27+i*.48;
        b(paper,x,1.22,shopFront-.34,.35,.32,.39);
        b(dryTones[i%4],x,1.395,shopFront-.34,.29,.045,.31);
        // Distinct shapes and muted tones suggest a mixed dry-goods display.
        for(let j=0;j<9;j++){
          const lx=x-.095+(j%3)*.092,lz=shopFront-.43+Math.floor(j/3)*.095;
          const [px,pz]=toWorld(cx,cz,lx,lz,ry);
          const size=.022+(j%3)*.005;
          sphere(dryTones[(i+(j%4===0?1:0))%4],px,1.43+(j%2)*.008,pz,size*1.12,size*.65,size);
        }
        face('plane',merchandiseLabel(['紅棗','香菇','桂圓','五穀'][i%4]),x,1.22,shopFront-.137,.16,.11);
      }
    }else if(trade==='cloth'){
      // The rolls sit across the counter, separated from one another; their
      // axis follows the shop's local depth even on the rotated west facade.
      const count=Math.min(7,Math.floor((displayWidth-.20)/.25)+1);
      for(let i=0;i<count;i++){
        const x=displayX-(count-1)*.125+i*.25;
        const [px,pz]=toWorld(cx,cz,x,shopFront-.32,ry);
        primitive('cylinder',[curtain,bluePlastic,red,cream,green][i%5],[px,1.17,pz],[.105,.37,.105],[Math.PI/2,0,-ry]);
      }
      for(let i=0;i<5;i++){
        const x=-.38+i*.29;
        b([cream,bluePlastic,curtain,red,green][i],x,1.72,shopBack+.32,.24,1.15,.24);
        b(paper,x,1.30,shopBack+.444,.235,.055,.008);
        face('plane',merchandiseLabel(['棉布','花布','帆布','格紋','棉布'][i]),x,1.66,shopBack+.446,.14,.09);
      }
    }else if(trade==='herbs'){
      for(let row=0;row<5;row++)for(let col=0;col<Math.floor((width-.6)/.38);col++){
        const x=-width/2+.42+col*.38,y=.52+row*.34;
        b(col%3?wood:paper,x,y,shopBack+.12,.35,.31,.12);
        b(black,x,y-.015,shopBack+.19,.08,.025,.025);
        face('plane',merchandiseLabel(['甘草','當歸','陳皮','枸杞','黃耆','川芎'][(row*3+col)%6]),x,y+.075,shopBack+.187,.14,.065);
      }
      for(let i=0;i<4;i++){
        const x=-.36+i*.60;
        round(dryTones[(i+1)%4],x,1.235,shopFront-.38,.13,.30);
        round(herbJarGlass,x,1.29,shopFront-.38,.16,.44);
        round(dark,x,1.52,shopFront-.38,.17,.035);
        face('plane',merchandiseLabel(['枸杞','陳皮','紅棗','花茶'][i]),x,1.30,shopFront-.215,.17,.105);
      }
    }else if(trade==='food'||trade==='breakfast'){
      for(let i=0;i<3;i++){
        const x=-.25+i*.7;
        round(metal,x,1.15,shopFront-.40,.20,.20);
        round(metal,x,1.255,shopFront-.40,.212,.018);
        round(dark,x,1.267,shopFront-.40,.18,.010);
        round(metal,x,1.279,shopFront-.40,.045,.025);
        for(const side of [-1,1])b(dark,x+side*.23,1.19,shopFront-.40,.08,.045,.07);
      }
      for(let i=0;i<6;i++){
        const x=.2+i*.15;
        round(white,x,1.10,shopBack+.45,.065,.08);
        round(white,x,1.145,shopBack+.45,.070,.012);
      }
      b(metal,width*.31,1.57,shopBack+.38,.8,.65,.46);
      b(dark,width*.31,1.57,shopBack+.62,.62,.45,.025);
      if(trade==='food'){
        // A small utensil rail is fixed to the shop's own back wall, rather
        // than to the movable cart. Nothing projects into the arcade.
        b(metal,-.55,2.13,shopBack+.11,1.20,.028,.040);
        for(const lx of [-.98,-.65,-.32]){
          b(metal,lx,1.96,shopBack+.14,.018,.30,.018);
          b(metal,lx,1.785,shopBack+.14,.075,.065,.025);
          b(dark,lx,2.10,shopBack+.135,.042,.042,.035);
        }
      }
    }else{
      for(let shelf=0;shelf<3;shelf++){
        const y=.72+shelf*.48;
        b(wood,0,y,shopBack+.30,width-.6,.055,.48);
        for(let i=0;i<Math.floor((width-.7)/.40);i++){
          const x=-width/2+.53+i*.40,variant=(shelf*3+i)%4,r=.105+(variant%2)*.012,h=.27+(variant%3)*.025;
          round(teaTinColors[variant],x,y+.03+h/2,shopBack+.34,r,h);
          round(teaLid,x,y+.03+h+.012,shopBack+.34,r+.008,.024);
          round(teaLid,x,y+.035,shopBack+.34,r+.003,.012);
          face('plane',merchandiseLabel(['烏龍','高山','紅茶','包種'][variant]),x,y+.03+h*.52,shopBack+.34+r+.003,.14,.10);
        }
      }
      for(let i=0;i<4;i++){
        const x=-.45+i*.62,r=.14+(i%2)*.01;
        round(teaTinColors[i],x,1.215,shopFront-.40,r,.30);
        round(teaLid,x,1.375,shopFront-.40,r+.01,.025);
        face('plane',merchandiseLabel(['烏龍','高山','紅茶','包種'][i]),x,1.22,shopFront-.40+r+.004,.16,.105);
      }
    }
    const [priceX,priceZ]=toWorld(cx,cz,displayX,shopFront-.075,ry);
    const sales={dry:['香菇　紅棗　桂圓','紅棗 100元／台斤'],cloth:['棉布　花布　布料','歡迎選購'],herbs:['中藥　養生茶','品項請洽櫃檯'],food:['內用・外帶','陽春麵 40元'],breakfast:['蛋餅 35元　豆漿 20元','內用・外帶'],tea:['烏龍茶　高山茶','茶葉請洽店員']};
    sign(...sales[trade],priceX,.82,priceZ,Math.min(displayWidth-.2,2.6),.23,'#e9dbb6','#6b4936',ry);
    // Narrow historic facades: alternating brick and lime plaster, tall arched
    // openings, pilasters and cornices. No identical high-rise balcony stacks.
    if(exemplar){
      addExemplarFacade(exemplar,{width,height,front,rear,shopFront,b,face,sideFace,pitched,mat,
        palette:{cream,white,window,windowLight,metal,dark,brickwork}});
    }else if(neighbor){
      addNeighborFacade(neighbor,{width,height,front,rear,shopFront,b,face,sideFace,pitched,mat,
        palette:{cream,white,window,windowLight,metal,dark,brickwork}});
    }else{
      const brickFacade=trade==='tea'||trade==='cloth'||trade==='herbs';
      if(brickFacade){
        // The existing backing face now carries life-size brickwork; oversized
        // individual blocks are replaced, with no additional wall or geometry.
        b(brickwork,0,(height+3.80)/2,front+.025,width-.28,height-3.80,.045);
      }
      for(const x of [-width/2+.12,width/2-.12]){
        b(cream,x,(height+3.8)/2,front+.13,.22,height-3.7,.18);
        b(white,x,height-.15,front+.17,.38,.20,.24);
      }
      const floors=height>8.2?2:1;
      for(let floor=0;floor<floors;floor++){
        const y=4.95+floor*2.58;
        for(const side of [-1,1]){
          const x=side*width*.235,w=width*.29;
          const openingShape=floor===floors-1&&trade==='cloth'?'arch':'plane';
          face(openingShape,cream,x,y,front+.16,w+.24,1.83);
          face(openingShape,(floor+(side>0?1:0))%3===0?windowLight:window,x,y-.015,front+.18,w,1.55);
          b(dark,x,y-.015,front+.205,.035,1.50,.025);
          b(dark,x,y-.10,front+.205,w,.045,.035);
          // Slim aluminium sash edges sit just within the visible opening.
          // Arch windows stop the side stiles at the spring of the arch.
          for(const edge of [-1,1])b(dark,x+edge*(w/2-.018),y+(openingShape==='arch'?-.40:-.015),front+.205,.025,openingShape==='arch'?.74:1.50,.025);
          b(dark,x,y-.76,front+.205,w,.025,.025);
          if(openingShape==='plane')b(dark,x,y+.73,front+.205,w,.025,.025);
          b(cream,x,y-.91,front+.19,w+.33,.14,.30);
          if(trade==='herbs'&&cx<0){
            // Iron window grilles on the older pharmacy's upper windows.
            for(let bx=-w/2+.10;bx<=w/2-.08;bx+=.18)b(dark,x+bx,y-.015,front+.235,.016,1.46,.018);
            for(const by of [-.38,.38])b(dark,x,y+by-.015,front+.235,w-.06,.016,.018);
          }
          if(floor===0&&trade==='dry'){
            b(cream,x,y-.96,front+.37,w+.40,.11,.65);
            b(dark,x,y-.54,front+.67,w+.38,.035,.04);
            for(let i=0;i<7;i++)b(dark,x-w/2+i*w/6,y-.72,front+.67,.018,.36,.026);
          }
        }
        b(cream,0,y+1.10,front+.12,width,.13,.17);
      }
    }
    b(cream,0,height+.06,(front+rear)/2,width+.16,.18,upperDepth+.16);
    b(white,0,height-.14,front+.16,width+.24,.15,.32);
    b(cream,0,height+.35,front-.10,width,.52,.25);
    b(white,0,height+.63,front-.10,width+.15,.12,.38);
    // The modest stepped central pediment is a solid part of the party wall.
    if(trade==='tea'||trade==='cloth'){
      b(cream,0,height+.71,front-.10,width*.42,.30,.25);
      b(white,0,height+.91,front-.10,width*.46,.10,.32);
      face('arch',bodyMat,0,height+.75,front+.04,.48,.28);
    }else for(const side of [-1,1])b(cream,side*(width/2-.14),height+.64,front-.10,.28,.35,.30);
    // Use and age are placed where they belong: side drain, AC, rooftop tank.
    const drainX=width/2-.31;
    b(metal,drainX,(height+3.6)/2,front+.24,.055,height-3.6,.055);
    // The selected shopfronts use a shared Blender-exported CC0 aircon model.
    // Keep the original compact boxes on the remaining two buildings.
    if(!(['tea','dry','food','breakfast'].includes(trade)||(trade==='herbs'&&cx>0))){
      b(metal,-width*.36,6.15,front+.32,.56,.40,.40);
      for(let i=0;i<5;i++)b(dark,-width*.36,6.04+i*.055,front+.53,.40,.018,.016);
    }
    const [tx,tz]=toWorld(cx,cz,width*.24,rear+1.2,ry);
    roofTank(tx,tz,height);
    activeBuildingId=previousBuildingId;
  }

  // Roads establish connected blocks before lots and buildings (city-tour / city-pcg pattern).
  // Ground continues behind the neighbourhood instead of ending at a display plinth.
  box(mat('ground concrete','#b4b0a1'),0,-.09,-28,100,.18,148);
  box(road,0,.015,-32.5,5.8,.06,111.0);
  box(road,0,.016,-16.5,72,.06,5.8);
  box(road,0,.016,17.2,72,.06,5.8);
  const rampZones=[];
  for(const side of [-1,1]){
    for(const z of [-12.25,-20.75])rampZones.push({x:side*3.35,z,w:.90,d:2,axis:'x',direction:side,angle:side<0?Math.PI:0});
    rampZones.push({x:side*5.7,z:-13.15,w:2,d:.90,axis:'z',direction:1,angle:-Math.PI/2});
    rampZones.push({x:side*5.7,z:-19.85,w:2,d:.90,axis:'z',direction:-1,angle:Math.PI/2});
  }
  // Subtract the landing footprints before building both the visible pavement
  // and its physics. A slope placed over an intact high sidewalk is not a cut.
  const pavingRects=(x,z,w,d)=>{
    let rects=[{x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2}];
    for(const ramp of rampZones){
      const cut={x0:ramp.x-ramp.w/2,x1:ramp.x+ramp.w/2,z0:ramp.z-ramp.d/2,z1:ramp.z+ramp.d/2};
      rects=rects.flatMap(r=>{
        const x0=Math.max(r.x0,cut.x0),x1=Math.min(r.x1,cut.x1),z0=Math.max(r.z0,cut.z0),z1=Math.min(r.z1,cut.z1);
        if(x0>=x1||z0>=z1)return[r];
        return[{x0:r.x0,x1:x0,z0:r.z0,z1:r.z1},{x0:x1,x1:r.x1,z0:r.z0,z1:r.z1},{x0,x1,z0:r.z0,z1:z0},{x0,x1,z0:z1,z1:r.z1}].filter(q=>q.x1-q.x0>.0001&&q.z1-q.z0>.0001);
      });
    }
    return rects;
  };
  const pavingBox=(material,x,y,z,w,h,d)=>{for(const r of pavingRects(x,z,w,d))box(material,(r.x0+r.x1)/2,y,(r.z0+r.z1)/2,r.x1-r.x0,h,r.z1-r.z0);};
  const sidewalk=(x,z,w,d)=>{for(const r of pavingRects(x,z,w,d)){
    const cx=(r.x0+r.x1)/2,cz=(r.z0+r.z1)/2,rw=r.x1-r.x0,rd=r.z1-r.z0;
    box(pavement,cx,.065,cz,rw,.13,rd);groundColliders.push({position:[cx,.07,cz],size:[rw,.14,rd]});
  }};
  for(const side of [-1,1]){
    sidewalk(side*5.05,.15,4.1,26.9);
    pavingBox(cream,side*2.99,.09,.15,.18,.18,26.9);
    for(let z=-13.1;z<13.6;z+=.9)pavingBox(mat('grout','#aaa79a'),side*4.6,.135,z,3.1,.006,.009);
    for(let x=3.35;x<6.8;x+=.72)pavingBox(materials.grout,side*x,.135,.15,.009,.006,26.9);
    box(red,side*2.93,.185,.7,.11,.022,5.8);
  }
  for(const side of [-1,1]){
    sidewalk(side*19.65,-20.25,32.7,1.7);
    sidewalk(side*3.45,-29.6,1.1,17.6);
    pavingBox(cream,side*2.99,.09,-29.6,.18,.18,17.6);
  }
  sidewalk(0,20.85,72,1.5);
  for(const side of [-1,1])pavingBox(cream,side*19.65,.09,-19.49,32.7,.18,.18);
  // Keep the original curb unchanged by default. The independent r187 street
  // can reserve a continuous opening where its pedestrian ramp meets it.
  let curbStart=-36;
  const curbGaps=southCurbGaps.map(({center,width})=>({start:Math.max(-36,center-width/2),end:Math.min(36,center+width/2)}))
    .filter(gap=>Number.isFinite(gap.start)&&Number.isFinite(gap.end)&&gap.start<gap.end)
    .sort((a,b)=>a.start-b.start);
  for(const gap of curbGaps){
    if(gap.start>curbStart)box(cream,(curbStart+gap.start)/2,.09,20.11,gap.start-curbStart,.18,.18);
    curbStart=Math.max(curbStart,gap.end);
  }
  if(curbStart<36)box(cream,(curbStart+36)/2,.09,20.11,36-curbStart,.18,.18);
  for(const ramp of rampZones){
    primitive('ramp',pavement,[ramp.x,.045,ramp.z],[.90,.095,2],[0,ramp.angle,0]);
    for(let step=0;step<4;step++){
      const t=(step+.5)/4,height=.045+.095*t,offset=(t-.5)*.90*ramp.direction;
      const x=ramp.x+(ramp.axis==='x'?offset:0),z=ramp.z+(ramp.axis==='z'?offset:0);
      groundColliders.push({position:[x,height/2,z],size:ramp.axis==='x'?[.225,height,2]:[2,height,.225]});
    }
  }
  // Crosswalks and signals are laid out together by the intersection module.
  for(const z of [-9,10]){cyl(dark,1.3,.052,z,.27,.014);box(metal,1.3,.063,z,.32,.008,.035);}
  // Utility cuts are mostly straight-edged but not perfectly identical
  // rectangles. A few abutting non-overlapping bands give their edges a small
  // irregularity while preserving the existing footprint and surface height.
  // The color stays close to the surrounding asphalt rather than reading as
  // a dark panel pasted onto the street.
  const patch=mat('repaired asphalt','#555a5b');
  function roadRepair(x,z,w,d,angle){
    const bands=[[-.012,.96],[.008,.98],[-.005,.97]];
    const length=d/bands.length,c=Math.cos(angle),s=Math.sin(angle);
    bands.forEach(([offset,width],index)=>{
      const lx=offset*w,lz=(index+.5)*length-d/2;
      box(patch,x+c*lx+s*lz,.049,z-s*lx+c*lz,w*width,.006,length,angle);
    });
  }
  roadRepair(1.05,-1,1.3,2.4,.07);
  roadRepair(-1.7,-7,.65,3.1,-.04);
  for(const side of [-1,1])for(const z of [-9,-3.5,2.8,10.4]){
    box(dark,side*2.73,.056,z,.22,.015,.62);
    for(let i=0;i<7;i++)box(metal,side*2.73,.066,z-.25+i*.078,.21,.012,.018);
  }
  for(const z of [-9,10])for(let i=-2;i<=2;i++)box(black,1.3+i*.075,.072,z,.016,.008,.35-Math.abs(i)*.04);

  frontBuilding(-8.15,-8.4,5.4,6.6,8.9,cream,'春日茶行','烏龍茶・高山茶',Math.PI/2,'tea',10);
  frontBuilding(-8.15,-2.65,5.6,6.6,9.2,cream,'永和商店','南北貨・香菇・紅棗',Math.PI/2,'dry',8);
  frontBuilding(-8.15,3.15,5.4,6.6,8.7,peach,'巷口食堂','陽春麵・滷肉飯',Math.PI/2,'food',6);
  frontBuilding(-8.15,7.275,2.8,6.6,7.2,cream,'永樂布莊','花布・棉布',Math.PI/2,'cloth',4);
  frontBuilding(-8.15,11.6,5.8,6.6,9.1,cream,'乾元蔘藥行','中藥・養生茶',Math.PI/2,'herbs',2);
  frontBuilding(7.7,-8.2,5.6,6.2,8.8,yellow,'日常中藥行','中藥・養生茶',-Math.PI/2,'herbs',9);
  frontBuilding(9.0,11.8,5.5,6,8.6,mint,'美好早餐','豆漿・蛋餅・三明治',-Math.PI/2,'breakfast',1);
  // Party-wall joints carry the arcade beam across the short gaps between lots.
  for(const [z,length] of [[-5.575,.26],[.30,.31],[5.8625,.035],[8.6875,.035]]){
    box(cream,-4.78,3.26,z,2.80,.24,length);
    box(cream,-3.62,3.08,z,.42,.34,length);
  }
  groundColliders.push({position:[-4.76,.07,1.7],size:[2.84,.14,25.8]});

  // Economical distant facades extend the street rhythm without repeating foreground detail.
  // These small vector-drawn lightboxes identify the actual chains without
  // bundling external logo images. Their text remains in the signage records.
  function chainFascia(business,cx,cz,angle,front,width){
    const exemplar=business.type==='drugstore'||business.type==='supermarket';
    const fasciaHeight=exemplar?.70:.49;
    const w=2048,h=Math.max(64,Math.round(w*fasciaHeight/(width-.38)));
    const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
    const c=canvas.getContext('2d'),center=exemplar?w*.34:w/2;
    c.fillStyle=business.color;c.fillRect(0,0,w,h);
    c.textAlign='center';c.textBaseline='middle';
    if(business.type==='lottery'){
      const x=center-h*2.65,y=h*.51,r=h*.36;
      c.fillStyle='#fff7e2';c.fillRect(x-r*1.2,0,r*2.4,h);
      c.fillStyle='#c72e4e';c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();
      c.save();c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.clip();
      c.strokeStyle='#55b9cc';c.lineWidth=r*.55;c.beginPath();c.moveTo(x-r*.65,y+r*.9);c.lineTo(x+r*.65,y-r*.9);c.stroke();c.restore();
    }else if(business.type==='supermarket'){
      const x=exemplar?w*.145:center-h*2.55;c.fillStyle='#fffdf5';c.fillRect(x-h*.40,h*.12,h*.80,h*.76);
      c.fillStyle='#df4339';c.beginPath();c.moveTo(x-h*.34,h*.50);c.lineTo(x-h*.05,h*.20);c.lineTo(x-h*.05,h*.80);c.closePath();c.fill();
      c.fillStyle='#245b8c';c.beginPath();c.moveTo(x+h*.34,h*.50);c.lineTo(x+h*.05,h*.20);c.lineTo(x+h*.05,h*.80);c.closePath();c.fill();
    }else if(business.type==='drugstore'){
      const x=exemplar?w*.145:center-h*2.6;c.strokeStyle='#fffdf3';c.lineWidth=Math.max(1,h*.025);c.strokeRect(x-h*.32,h*.13,h*.64,h*.74);
      c.fillStyle='#fffdf3';c.font=`700 ${Math.round(h*.43)}px ${SIGN_FONT}`;c.fillText('日',x,h*.51);
    }else if(business.type==='convenience'&&business.brand==='familymart'){
      c.fillStyle='#00a650';c.fillRect(0,0,w,h*.20);
      c.fillStyle='#009fe3';c.fillRect(0,h*.20,w,h*.09);
    }else if(business.type==='convenience'&&business.brand==='hilife'){
      c.fillStyle='#ffffff';c.fillRect(0,h*.88,w,h*.12);
      c.fillStyle='#ffc900';c.fillRect(0,h*.845,w,h*.035);
    }else if(business.type==='convenience'&&business.brand==='ok'){
      const x=center-h*2.45,y=h*.51,r=h*.335;
      c.fillStyle='#ffffff';c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();
      c.fillStyle='#f15a24';c.font=`700 ${Math.round(r*1.02)}px ${SIGN_FONT}`;c.fillText('OK',x,y+r*.05);
    }
    c.fillStyle=business.fg??'#fffdf3';
    c.font=`700 ${Math.round(h*(exemplar?.62:.44))}px ${SIGN_FONT}`;
    c.fillText(business.name,center,h*(exemplar?.38:.35),h*(exemplar?7:4.15));
    c.font=`700 ${Math.round(h*.19)}px ${SIGN_FONT}`;
    c.fillText(business.type==='drugstore'?(exemplar?'ニチヤクホンポ':'ニチヤクホンポ・藥妝・日用品'):exemplar?'Carrefour Market':business.caption,center,h*.82,h*(exemplar?6.7:5.2));
    if(exemplar){
      c.font=`700 ${Math.round(h*.31)}px ${SIGN_FONT}`;
      c.fillText(business.type==='drugstore'?business.caption:'生鮮食品・日常用品',w*.765,h*.51,w*.32);
    }
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
    const material=new THREE.MeshStandardMaterial({map:texture,emissive:'#ffffff',emissiveMap:texture,emissiveIntensity:.30,roughness:.72});
    const panel=new THREE.Mesh(new THREE.PlaneGeometry(width-.38,fasciaHeight),material);
    const [x,z]=toWorld(cx,cz,0,front+.105,angle);panel.position.set(x,2.99,z);panel.rotation.y=angle;
    panel.name=`${business.name} storefront lightbox`;root.add(panel);weather.attachMesh(panel,activeBuildingId,'sign');
  }
  function contextBuilding(cx,cz,width,depth,height,color,angle=0,variation=0,business=null){
    // Only the two lots directly beside the northern exemplar shops are lifted.
    const neighborKind=cx===6.5&&cz===-38?'north-corner':cx===7.2&&cz===-72.2?'north-residential':null;
    const previousBuildingId=activeBuildingId;
    activeBuildingId=weather.registerBuilding({x:cx,z:cz,angle,width,depth,height,front:depth/2,kind:'context',variation});
    const body=mat('context plaster '+color,color),front=depth/2,back=-depth/2;
    const local=(m,lx,y,lz,w,h,d)=>{const [x,z]=toWorld(cx,cz,lx,lz,angle);box(m,x,y,z,w,h,d,angle);};
    const hit=(lx,y,lz,w,h,d)=>{const [x,z]=toWorld(cx,cz,lx,lz,angle),c=Math.abs(Math.cos(angle)),q=Math.abs(Math.sin(angle));solid(x,y,z,c*w+q*d,h,q*w+c*d);};
    local(body,0,(height+3.25)/2,0,width,height-3.25,depth);
    hit(0,(height+3.25)/2,0,width,height-3.25,depth);
    if(business){
      const shopFront=front-1.2,shopBack=front-(['drugstore','supermarket'].includes(business.type)?6.0:4.6);
      local(body,0,1.65,(back+shopBack)/2,width,3.3,shopBack-back);
      hit(0,1.65,(back+shopBack)/2,width,3.3,shopBack-back);
      for(const side of [-1,1]){
        local(body,side*(width/2-.08),1.65,(shopFront+shopBack)/2,.16,3.3,shopFront-shopBack);
        hit(side*(width/2-.08),1.65,(shopFront+shopBack)/2,.16,3.3,shopFront-shopBack);
      }
      local(pavement,0,.07,(shopBack+front)/2,width,.14,front-shopBack);
      const [floorX,floorZ]=toWorld(cx,cz,0,(shopBack+front)/2,angle);
      const floorWidth=Math.abs(Math.cos(angle))*width+Math.abs(Math.sin(angle))*(front-shopBack);
      const floorDepth=Math.abs(Math.sin(angle))*width+Math.abs(Math.cos(angle))*(front-shopBack);
      groundColliders.push({position:[floorX,.07,floorZ],size:[floorWidth,.14,floorDepth]});
      shopFloorZones.push({x:floorX,z:floorZ,width:floorWidth,depth:floorDepth});
    }else{
      local(body,0,1.65,-.9,width,3.3,depth-1.8);hit(0,1.65,-.9,width,3.3,depth-1.8);
    }
    local(cream,0,height+.08,0,width+.12,.18,depth+.12);
    local(cream,0,height+.40,front-.12,width,.54,.24);
    local(white,0,height+.71,front-.12,width+.16,.12,.34);
    local(body,0,3.15,front-.80,width,.20,1.6);
    local(cream,0,2.93,front-.12,width,.34,.24);
    for(const side of [-1,1]){
      local(cream,side*(width/2-.14),1.64,front-.16,.28,3.0,.30);
      hit(side*(width/2-.14),1.64,front-.16,.28,3.0,.30);
      local(cream,side*(width/2-.15),(height+3.2)/2,front+.04,.22,height-3.0,.16);
    }
    // Only an occasional shutter is down; other bays reveal counters and stock.
    const closed=!business&&variation===7&&cz>-30;
    if(business){
      const shopFront=front-1.2,shopBack=front-(['drugstore','supermarket'].includes(business.type)?6.0:4.6),entryX=-width*.24;
      const b=(m,lx,y,lz,w,h,d,ry=0,rx=0)=>{const [x,z]=toWorld(cx,cz,lx,lz,angle);primitive('box',m,[x,y,z],[w,h,d],[rx,angle+ry,0]);};
      const c=(m,lx,y,lz,r,h,rx=0,rz=0)=>{const [x,z]=toWorld(cx,cz,lx,lz,angle);cyl(m,x,y,z,r,h,[rx,angle,rz]);};
      const s=(m,lx,y,lz,sx,sy,sz)=>{const [x,z]=toWorld(cx,cz,lx,lz,angle);sphere(m,x,y,z,sx,sy,sz);};
      const label=({x:lx,y,z:lz,yaw=0,...rest})=>{const [x,z]=toWorld(cx,cz,lx,lz,angle);dailySigns.add({...rest,x,y,z,yaw:angle+yaw});};
      const mesh=(geometry,material,lx,y,lz,rotation=[0,0,0],scale=[1,1,1])=>{
        const type=`shared-${geometry.uuid}`;
        if(!geometries[type])geometries[type]=geometry;
        const [x,z]=toWorld(cx,cz,lx,lz,angle);
        const quaternion=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),angle)
          .multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)));
        const euler=new THREE.Euler().setFromQuaternion(quaternion);
        primitive(type,material,[x,y,z],scale,[euler.x,euler.y,euler.z]);
      };

      const buildingId=activeBuildingId;
      // Maintained indoor surfaces do not inherit outdoor runoff and damp masks.
      activeBuildingId=-1;
      const inside=mat('business ivory','#e1dccf'),trim=mat('business charcoal','#323d40');
      local(inside,0,1.66,shopBack+.035,width-.26,2.98,.05);
      local(inside,0,.148,(shopBack+shopFront)/2,width-.32,.016,shopFront-shopBack);
      for(let x=-width/2+.25;x<width/2-.2;x+=.65)local(pavement,x,.158,(shopBack+shopFront)/2,.009,.003,shopFront-shopBack);
      for(let z=shopBack+.3;z<shopFront;z+=.65)local(pavement,0,.158,z,width-.32,.003,.009);
      local(inside,0,3.08,(shopBack+shopFront)/2,width-.30,.10,shopFront-shopBack);
      for(const x of [-width*.20,width*.22]){
        local(metal,x,3.015,.95,.86,.04,.14);
        local(fluorescent,x,2.988,.95,.78,.025,.09);
      }
      // Glazed frontage has a genuinely open, 1.30 m doorway on the left.
      // Food-service counters stay visible through the open shopfront.
      const glazed=!business.open&&business.type!=='drinks';
      const sections=[[-width/2+.14,entryX-.65],[entryX+.65,width/2-.14]];
      for(const [left,right] of sections){
        const w=right-left,x=(left+right)/2;
        if(w<=.05)continue;
        if(glazed){
          local(clearGlass,x,1.48,shopFront,w,2.54,.018);
          hit(x,1.48,shopFront,w,2.54,.025);
          for(const y of [.22,1.02,2.74])local(trim,x,y,shopFront+.02,w,.035,.045);
        }
        for(const xx of [left,right])local(trim,xx,1.48,shopFront,.035,2.56,.055);
      }
      local(trim,0,2.81,shopFront,width-.26,.14,.17);
      if(glazed){
        // A fixed-open sliding leaf rests over the neighbouring fixed pane;
        // the full original 1.30 m opening remains usable. It is scenery,
        // not an automatically opening door.
        const start=entryX+.69,leafWidth=.86,leafX=start+leafWidth/2,leafZ=shopFront+.075;
        const frame=business.type==='bakery'?wood:metal;
        const hardware=mat('sliding door brushed hardware','#c5cfca',{metalness:.65,roughness:.38});
        local(clearGlass,leafX,1.46,leafZ,leafWidth-.08,2.42,.014);
        for(const x of [start,start+leafWidth])local(frame,x,1.46,leafZ,.04,2.50,.05);
        for(const y of [.21,2.71])local(frame,leafX,y,leafZ,leafWidth+.04,.04,.05);
        local(frame,leafX,1.02,leafZ,leafWidth,.025,.045);
        local(hardware,start+.12,1.24,leafZ+.055,.035,.38,.035);
        for(const y of [1.065,1.415])local(hardware,start+.12,y,leafZ+.028,.035,.03,.06);
        const railStart=entryX-.65,railEnd=start+leafWidth+.10;
        local(metal,(railStart+railEnd)/2,2.73,leafZ,railEnd-railStart,.035,.055);
        hit(leafX,1.46,leafZ,leafWidth+.04,2.50,.06);
      }else{
        // Two glazed leaves fold in a shallow zigzag against the right jamb.
        // The counter begins behind the leaves and the left entrance stays
        // completely clear. Each fixed leaf has its own conservative collider.
        const frame=business.type==='drinks'?wood:metal;
        const points=[[width/2-.16,shopFront+.03],[width/2-.49,shopFront-.25],[width/2-.78,shopFront]];
        for(let i=0;i<2;i++){
          const [x1,z1]=points[i],[x2,z2]=points[i+1];
          const dx=x2-x1,dz=z2-z1,length=Math.hypot(dx,dz),yaw=Math.atan2(-dz,dx);
          const x=(x1+x2)/2,z=(z1+z2)/2;
          b(clearGlass,x,1.45,z,length-.055,2.32,.018,yaw);
          for(const y of [.23,1.06,2.67])b(frame,x,y,z,length,.045,.055,yaw);
          local(frame,x1,1.45,z1,.055,2.48,.055);
          if(i===1)local(frame,x2,1.45,z2,.055,2.48,.055);
          hit(x,1.45,z,Math.abs(dx)+.055,2.48,Math.abs(dz)+.055);
        }
        for(const y of [.43,1.29,2.35])local(metal,points[1][0],y,points[1][1],.04,.075,.045);
        for(const y of [.43,1.29,2.35])local(metal,points[0][0],y,points[0][1],.04,.075,.045);
        const [handleX,handleZ]=points[2];
        local(metal,handleX+.04,1.22,handleZ+.035,.025,.26,.025);
        for(const y of [1.105,1.335])local(metal,handleX+.04,y,handleZ+.015,.025,.025,.05);
      }
      // A retracted shutter roll and side guides keep the shop recognisably local.
      local(shutter,0,2.96,shopFront-.06,width-.30,.17,.21);
      const leftWidth=entryX-.65-(-width/2+.14);
      if(!glazed)local(inside,-width/2+.14+leftWidth/2,2.03,shopFront+.035,Math.max(.42,leftWidth-.04),.61,.025);
      const compactHours=business.type==='drugstore'||business.type==='supermarket';
      label({text:'營業時間',detail:business.hours[0],note:business.hours[1],x:-width/2+.14+leftWidth/2,y:compactHours?1.96:2.03,z:shopFront+.055,width:compactHours?.72:Math.max(.42,leftWidth-.04),height:compactHours?.37:.61,bg:'#eee8d6',fg:'#344b45',kind:'hours'});
      const street=business.street??'長和路',number=business.number??1+variation*2;
      label({text:street,detail:`${number}號`,x:-width/2+.14,y:2.32,z:front+.005,width:.26,height:.38,bg:'#235b49',kind:'address'});
      const features=furnishBusiness(business.type,{width,front:shopFront,back:shopBack,entryX,b,c,s,mesh,hit,label,m:mat,name:business.name})?.features??[];
      const [entryWorldX,entryWorldZ]=toWorld(cx,cz,entryX,shopFront,angle);
      businesses.push({type:business.type,name:business.name,street,number,entrance:[entryWorldX,entryWorldZ],interior:toWorld(cx,cz,entryX,shopBack+.9,angle),frontage:toWorld(cx,cz,0,front,angle),features});
      shopAddresses.push({name:business.name,street,number,position:[cx,cz],hours:business.hours});
      activeBuildingId=buildingId;
      local(mat('business fascia '+business.color,business.color),0,2.99,front+.045,width-.28,(business.type==='drugstore'||business.type==='supermarket')?.70:.52,.08);
      label({text:business.name,detail:business.caption,x:0,y:2.99,z:front+.091,width:width-.38,height:.49,bg:business.color,fg:business.fg??'#fff4d9'});
      if(['lottery','drugstore','supermarket','convenience'].includes(business.type))chainFascia(business,cx,cz,angle,front,width);
    }else if(neighborKind){
      const face=(type,m,lx,y,lz,w,h)=>{const [x,z]=toWorld(cx,cz,lx,lz,angle);primitive(type,m,[x,y,z],[w,h,1],[0,angle,0]);};
      const round=(m,lx,y,lz,r,h)=>{const [x,z]=toWorld(cx,cz,lx,lz,angle);cyl(m,x,y,z,r,h);};
      addNeighborContextShop(neighborKind,{width,front,b:local,round,face,mat,merchandiseLabel,
        palette:{wood,cream,dark,metal,paper}});
      local(fluorescent,0,2.88,front-.80,width*.53,.04,.08);
    }else if(closed){
      local(shutter,0,1.43,front-1.25,width-.5,2.55,.06);
      for(let y=.25;y<2.7;y+=.12)local(metal,0,y,front-1.20,width-.55,.012,.018);
    }else{
      local(wood,0,1.45,front-1.78,width-.28,2.75,.04);
      local(cream,0,2.45,front-1.73,width-.3,.80,.035);
      local(wood,.45,.60,front-1.15,width-1.6,.90,.58);
      local(dark,.45,1.07,front-1.15,width-1.5,.06,.64);
      for(let i=0;i<Math.floor((width-1.6)/.42);i++){
        const lx=-width/2+1.45+i*.42;
        local(i%3===0?red:i%3===1?paper:green,lx,1.30,front-1.13,.28,.42,.31);
        local(white,lx,1.30,front-.966,.17,.11,.012);
        local(wood,lx,1.80,front-1.52,.34,.055,.40);
        local(i%2?yellow:cream,lx,1.98,front-1.56,.25,.32,.27);
      }
      local(fluorescent,0,2.88,front-.80,width*.53,.04,.08);
    }
    if(!business)local(variation%2?dark:red,0,2.63,front-.17,width-.26,.28,.035);
    // This 8.5m corner house has room for two upper levels. Match its front
    // and return instead of leaving an unexplained 2.7m blank upper storey.
    const numberOfRows=neighborKind==='north-corner'?2:Math.floor((height-3.4)/2.7);
    if(neighborKind){
      const face=(type,m,lx,y,lz,w,h)=>{const [x,z]=toWorld(cx,cz,lx,lz,angle);primitive(type,m,[x,y,z],[w,h,1],[0,angle,0]);};
      const pitched=(m,lx,y,lz,w,h,d,pitch=0)=>localMesh(cx,cz,angle)(geometries.box,m,lx,y,lz,[pitch,0,0],[w,h,d]);
      addNeighborFacade(neighborKind,{width,height,front,rear:back,shopFront:front-1.2,b:local,face,pitched,mat,variation,
        palette:{cream,white,window,windowLight,metal,dark,brickwork}});
    }else if(business?.type==='drugstore'){
      const b=local;
      const face=(type,m,lx,y,lz,w,h)=>{const [x,z]=toWorld(cx,cz,lx,lz,angle);primitive(type,m,[x,y,z],[w,h,1],[0,angle,0]);};
      const pitched=(m,lx,y,lz,w,h,d,pitch=0)=>{
        const [x,z]=toWorld(cx,cz,lx,lz,angle);
        const q=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),angle)
          .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),pitch));
        const rotation=new THREE.Euler().setFromQuaternion(q);
        primitive('box',m,[x,y,z],[w,h,d],[rotation.x,rotation.y,rotation.z]);
      };
      addExemplarFacade('drugstore',{width,height,front,b,face,pitched,mat,
        palette:{cream,white,window,windowLight,metal,dark,brickwork}});
    }else{
      // Upper windows vary per building so a run of these houses does not
      // read as one cloned block: bay count, frame finish and grille
      // treatment all follow the building's variation seed. weathering.js
      // mirrors this exact layout when anchoring its sill runoff streaks.
      const bays=2+(variation%3),span=width*.78,pitch=span/bays;
      const winW=Math.min(pitch*.58,width*.24);
      const frameMat=[cream,frameGrey,frameBronze][variation%3];
      for(let row=0;row<numberOfRows;row++){
        const y=4.65+row*2.7;
        for(let i=0;i<bays;i++){
          const wx=-span/2+pitch*(i+.5),w=winW;
          const arched=row===numberOfRows-1&&height<11.5;
          const glassMat=(i*2+row+variation)%3?window:milkGlass;
          if(arched){
            const [x,z]=toWorld(cx,cz,wx,front+.05,angle);
            primitive('arch',frameMat,[x,y,z],[w+.18,1.75,1],[0,angle,0]);
            const [gx,gz]=toWorld(cx,cz,wx,front+.075,angle);
            primitive('arch',glassMat,[gx,y-.015,gz],[w,1.52,1],[0,angle,0]);
          }else{
            local(frameMat,wx,y,front+.05,w+.16,1.62,.06);
            local(glassMat,wx,y,front+.09,w,1.44,.035);
          }
          local(dark,wx,y-.015,front+.12,.025,1.42,.025);
          local(dark,wx,y-.15,front+.12,w,.035,.025);
          for(const edge of [-1,1])local(dark,wx+edge*(w/2-.015),y+(arched?-.38:-.015),front+.12,.022,arched?.70:1.42,.022);
          local(dark,wx,y-.72,front+.12,w,.022,.022);
          if(!arched)local(dark,wx,y+.69,front+.12,w,.022,.022);
          local(frameMat,wx,y-.88,front+.12,w+.26,.13,.21);
          // Iron window grilles: flat bars on some bays, and on
          // variation-1 buildings a projecting cage on the lowest upper
          // row's middle bay. Both are everyday Taiwanese fittings.
          const grille=!arched&&(i+row+variation)%4===1;
          const cage=!arched&&variation%3===1&&row===0&&i===Math.floor(bays/2);
          if(cage){
            for(let bx=-w/2+.07;bx<=w/2-.05;bx+=.16)local(dark,wx+bx,y-.015,front+.34,.016,1.42,.016);
            for(const by of [-.48,0,.48])local(dark,wx,y+by-.015,front+.34,w-.06,.016,.016);
            for(const bz of [.16,.25,.34])for(const edge of [-1,1])local(dark,wx+edge*(w/2-.01),y-.015,front+bz,.016,1.42,.016);
            for(let bx=-w/2+.07;bx<=w/2-.05;bx+=.16)local(dark,wx+bx,y-.80,front+.24,.016,.016,.22);
            local(frameMat,wx,y+.80,front+.24,w+.10,.05,.30);
          }else if(grille){
            for(let bx=-w/2+.09;bx<=w/2-.07;bx+=.17)local(dark,wx+bx,y-.015,front+.155,.015,1.40,.015);
            for(const by of [-.36,.36])local(dark,wx,y+by-.015,front+.155,w-.05,.015,.015);
          }
          if((i+variation)%3===0)local(metal,wx+w*.35,y-.70,front+.28,.52,.36,.34);
        }
        local(cream,0,y+1.12,front+.035,width,.09,.10);
      }
    }
    if(variation%2===0){const [x,z]=toWorld(cx,cz,width*.23,-depth*.08,angle);roofTank(x,z,height,.45,1.1);}
    // Some roofs carry a small corrugated-tin addition, the classic
    // Taiwanese rooftop accretion; it breaks the flat parapet skyline.
    if(variation%3===1){
      local(tinWall,-width*.16,height+.52,-depth*.06,width*.34,1.04,depth*.40);
      local(tinRoof,-width*.16,height+1.10,-depth*.06,width*.42,.05,depth*.50);
      local(tinWall,width*.26,height+.34,-depth*.10,width*.16,.68,depth*.26);
      local(tinRoof,width*.26,height+.72,-depth*.10,width*.22,.05,depth*.34);
    }
    // The inside returns of the corner houses are street facades too. Continue
    // their windows and cornices around the corner, and expose shallow glazed
    // retail displays at pavement level instead of a featureless party wall.
    if(angle===0&&Math.abs(cx)<8&&cz<=-25&&cz>=-40){
      const side=cx<0?1:-1,wall=cx+side*width/2,faceAngle=side*Math.PI/2;
      for(const z of [cz-depth*.30,cz,cz+depth*.30]){
        for(let row=0;row<numberOfRows;row++){
          const y=4.65+row*2.7;
          if(row===numberOfRows-1){
            primitive('arch',cream,[wall+side*.045,y,z],[1.46,1.75,1],[0,faceAngle,0]);
            primitive('arch',window,[wall+side*.07,y-.015,z],[1.23,1.52,1],[0,faceAngle,0]);
          }else{
            box(cream,wall+side*.045,y,z,.08,1.64,1.46);
            box(window,wall+side*.095,y,z,.035,1.44,1.23);
          }
          box(dark,wall+side*.12,y-.12,z,.025,1.16,.035);
          box(dark,wall+side*.12,y-.15,z,.025,.035,1.25);
          box(cream,wall+side*.10,y-.88,z,.24,.13,1.62);
        }
      }
      for(const z of [cz-depth/2+.12,cz-.90,cz+depth/2-.12])box(cream,wall+side*.04,(height+3.2)/2,z,.16,height-3.0,.22);
      for(const y of [3.12,5.77,8.47,height+.08])if(y<height+.2)box(cream,wall+side*.055,y,cz,.21,.12,depth+.08);
      box(body,wall-side*.12,height+.40,cz,.24,.54,depth);
      box(white,wall-side*.12,height+.71,cz,.34,.12,depth+.16);
      for(const z of business?[]:[cz-depth*.28,cz+.50]){
        box(wood,wall+side*.03,1.47,z,.035,2.22,1.94);
        box(interiorDark,wall+side*.055,1.52,z,.025,1.88,1.72);
        for(const edge of [-1,1])box(dark,wall+side*.11,1.48,z+edge*.86,.10,2.06,.055);
        for(const y of [.49,1.05,1.62,2.45])box(dark,wall+side*.11,y,z,.11,.045,1.77);
        for(let shelf=0;shelf<2;shelf++)for(let item=0;item<4;item++){
          const yy=1.22+shelf*.57,zz=z-.61+item*.40;
          box(item%3===0?paper:item%3===1?green:red,wall+side*.10,yy,zz,.055,.29,.26);
          box(white,wall+side*.135,yy,zz,.014,.105,.14);
        }
        primitive('plane',clearGlass,[wall+side*.17,1.50,z],[1.70,1.90,1],[0,faceAngle,0]);
        box(variation%2?dark:red,wall+side*.11,2.64,z,.08,.24,2.10);
        box(dark,wall+side*.25,2.86,z,.60,.065,2.20);
      }
      if(business){
        // The corner return names the same shop; it is not a second grocery bay.
        const z=cz+1.0;
        box(dark,wall+side*.08,2.63,z,.08,.42,2.3);
        dailySigns.add({text:business.name,detail:business.caption,x:wall+side*.13,y:2.63,z,width:2.22,height:.38,yaw:faceAngle,bg:business.color,fg:'#fff4d9'});
      }
    }
    activeBuildingId=previousBuildingId;
  }
  // Dihua continues across the junction: two corner rows leave the road open.
  // Muted per-building wall tones for the generic context rows, so a run
  // of houses reads as separate lots instead of one long cloned facade.
  const contextPalette=['#c9cabe','#aeb8ad','#c3b49a','#b3aca0','#bfae9f'];
  const northLots=[[-25,6.2,10.2,'#b5b3a6'],[-18.1,7.1,9.1,'#a5aaa0'],[-11.9,5.4,8.3,'#c7bca7'],[-6.6,5.2,9.8,'#b9b7a5'],[6.6,5.2,9.8,'#b1b4ad'],[12.2,5.8,8.5,'#bea99a'],[18.6,6.7,9.3,'#b9b4a2'],[25.2,5.5,8.1,'#a8b2a8']];
  northLots.forEach(([x,w,h,c],i)=>contextBuilding(x,-25.0,w,8,h,c,0,i,NEIGHBOURHOOD_BUSINESSES[i]));
  for(const [x,z,w,d,h,c,a,v] of [[-18,1,7.2,8,11,'#b5b2a6',Math.PI/2,1],[-18,-8,7.8,8,10,'#adb3ab',Math.PI/2,2],[-18,10,7.5,8,12,'#c1b39c',Math.PI/2,0],[17.1,1.4,7.5,7.7,11,'#b7b3a2',-Math.PI/2,2],[17.1,-7.0,7.7,7.7,12,'#a6ada7',-Math.PI/2,0],[18,10,7.4,7.7,10,'#bdaea2',-Math.PI/2,1]])contextBuilding(x,z,w,d,h,c,a,v);
  // Quieter silhouettes sit behind the old street, never as a wall across it.
  for(const [i,x] of [-28,-20,-12,-6.5,6.5,12,20,28].entries())contextBuilding(x,-38,Math.abs(x)<8?5.0:7.1,9,Math.abs(x)<8?8.5:11+(i%3)*2.0,contextPalette[i%contextPalette.length],0,i);
  // At the eastern end of the rear service lane, an out-of-bounds corner
  // building closes the otherwise bare sky seam. Its nearest face is x=32.1,
  // beyond the walkable boundary (x=28), so it never blocks a public route.
  contextBuilding(35.8,-31.5,8.2,7.4,10.5,'#a5aaa0',-Math.PI/2,2);
  // Visual continuation beyond the walking bounds: the lane recedes between
  // more shopfronts and ends in a distant block, rather than an empty sky seam.
  for(const side of [-1,1]){
    box(pavement,side*3.47,.065,-62.2,1.14,.13,47.6);
    // The visible north sidewalk is walkable, including the short transitions
    // between the street and the entrances of the newly occupied shops.
    groundColliders.push({position:[side*3.47,.065,-62.2],size:[1.14,.13,47.6]});
    box(cream,side*2.99,.09,-62.2,.18,.18,47.6);
    for(const [i,z] of [-48.6,-60.4,-72.2].entries()){
      const cx=side*7.20,angle=side<0?Math.PI/2:-Math.PI/2;
      const business=side<0&&i===0
        ?{type:'lottery',name:'台灣彩券',caption:'公益彩券・刮刮樂',hours:['10:00–21:00','營業時間依門市'],color:'#e4bd32',fg:'#593a25',street:'北巷',number:3}
        :side>0&&i===0
          ?{type:'drugstore',name:'日藥本舖',caption:'藥妝・保健・日用品',hours:['10:00–22:00','營業時間依門市'],color:'#b52c35',street:'北巷',number:2}
          :side>0&&i===1
            ?{type:'supermarket',name:'家樂福超市',caption:'Carrefour Market・生鮮食品',hours:['09:00–22:00','營業時間依門市'],color:'#d9552d',street:'北巷',number:4}
            :side<0&&i===1
              ?{type:'convenience',brand:'hilife',name:'萊爾富',caption:'Hi-Life・便利商店',hours:['24小時營業','全年無休'],color:'#e60012',fg:'#ffffff',street:'北巷',number:5}
              :side<0&&i===2
                ?{type:'convenience',brand:'ok',name:'OK超商',caption:'24小時營業',hours:['24小時營業','全年無休'],color:'#f15a24',fg:'#ffffff',street:'北巷',number:7}
                :side>0&&i===2
                  ?{type:'convenience',brand:'familymart',name:'全家便利商店',caption:'FamilyMart',hours:['24小時營業','全年無休'],color:'#f7f9f5',fg:'#0072bc',street:'北巷',number:6}
                  :null;
      contextBuilding(cx,z,11.6,6.8,8.0+i*.65,contextPalette[(i+(side>0?2:0))%contextPalette.length],angle,i+1,business);
    }
  }
  for(const [i,x] of [-14,-7,0,7,14].entries()){
    if(openNorthExit && x===0)continue;
    contextBuilding(x,-86,6.8,8,9.5+(i%3)*1.4,contextPalette[(i+1)%contextPalette.length],0,i);
  }

  verticalSign('永和商店',-2.35,4.65,-.13,'#3c675d');
  verticalSign('巷口食堂',-2.35,4.56,5.63,'#99574c');
  verticalSign('日常中藥行',2.35,4.55,-5.66,'#626e58');
  // Brackets make projecting signs read as attached, weighted objects.
  // Each projecting board is braced back to its own facade above the pedestrian clearance.

  // Convenience store, with its front and street-facing entrance deliberately open.
  activeBuildingId=weather.registerBuilding({x:7.5,z:.5,angle:0,width:7.58,depth:10.06,height:7.5,front:5.65,kind:'context',seed:'maintained-convenience-store'});
  box(white, 7.5, .095, .5, 6.0, .19, 8.5);
  for (let x = 4.7; x < 10.5; x += .65) box(materials.grout, x, .196, .5, .009, .01, 8.5);
  for (let z = -3.5; z < 4.8; z += .65) box(materials.grout, 7.5, .196, z, 6, .01, .009);
  box(mint, 7.5, 1.7, -3.8, 6.2, 3.2, .18); solid(7.5, 1.7, -3.8, 6.2, 3.2, .18);
  box(cream, 10.6, 1.7, .5, .20, 3.2, 8.8); solid(10.6, 1.7, .5, .20, 3.2, 8.8);
  // Corner posts and fascia only: the large opening is functional for walking.
  for (const [x, z] of [[4.42, -3.8], [4.42, 4.8], [10.6, 4.8]]) {
    box(cream, x, 1.7, z, .2, 3.2, .2); solid(x, 1.7, z, .2, 3.2, .2);
  }
  box(dark, 7.5, 3.12, 4.81, 6.4, .54, .2);
  box(dark, 4.42, 3.12, .5, .2, .54, 8.7);
  // The real Taiwanese 7-ELEVEN storefront is rendered as local vector
  // artwork: orange, green and red bands on white with an inset light sign.
  // The panel sits on the existing fascia; it adds no new collision surface.
  const sevenOrange=mat('7-ELEVEN orange','#f47c26',{roughness:.62});
  const sevenRed=mat('7-ELEVEN red','#df302d',{roughness:.62});
  const sevenGreen=mat('7-ELEVEN green','#008653',{roughness:.62});
  function sevenFascia(x,y,z,width,height,yaw=0){
    const canvas=document.createElement('canvas');
    canvas.width=2048;canvas.height=Math.max(128,Math.round(canvas.width*height/width));
    const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
    c.fillStyle='#fffdf4';c.fillRect(0,0,w,h);
    for(const [color,top,bottom] of [['#f47c26',.08,.29],['#008653',.36,.63],['#df302d',.70,.91]]){
      c.fillStyle=color;c.fillRect(0,Math.round(h*top),w,Math.ceil(h*(bottom-top)));
    }
    const badgeWidth=Math.min(h*1.20,w*.90),bx=(w-badgeWidth)/2;
    c.fillStyle='#fffdf4';c.fillRect(bx,0,badgeWidth,h);
    // A locally drawn stylised numeral and lettering keep the branded sign
    // readable at street distance without an external image dependency.
    c.fillStyle='#ee3330';c.beginPath();
    c.moveTo(bx+badgeWidth*.16,h*.12);c.lineTo(bx+badgeWidth*.88,h*.12);
    c.lineTo(bx+badgeWidth*.88,h*.30);c.lineTo(bx+badgeWidth*.64,h*.60);
    c.lineTo(bx+badgeWidth*.49,h*.94);c.lineTo(bx+badgeWidth*.27,h*.94);
    c.lineTo(bx+badgeWidth*.40,h*.62);c.lineTo(bx+badgeWidth*.67,h*.30);
    c.lineTo(bx+badgeWidth*.16,h*.30);c.closePath();c.fill();
    c.fillStyle='#f47c26';c.fillRect(bx+badgeWidth*.16,h*.12,badgeWidth*.45,h*.17);
    c.fillStyle='#008653';c.textAlign='center';c.textBaseline='middle';
    c.font=`900 ${Math.round(h*.24)}px Arial, sans-serif`;
    c.fillText('ELEVEN',w/2,h*.67,badgeWidth*.94);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
    const panel=new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshStandardMaterial({map:texture,roughness:.68,emissive:'#ffffff',emissiveIntensity:.045}));
    panel.name='7-ELEVEN storefront fascia';panel.position.set(x,y,z);panel.rotation.y=yaw;root.add(panel);
    weather.attachMesh(panel,activeBuildingId,'sign');
  }
  // Attach shallow lightbox backings to the street-facing arcade beams.
  // Their lower edge is at y=2.85 m, above the walking route. Extending the
  // panels around the corner keeps the bands visible in front of the beam
  // and places each logo between columns instead of behind a column.
  box(white,3.065,3.12,1.13,.10,.54,10.14);
  box(white,6.85,3.12,6.145,7.68,.54,.10);
  sevenFascia(3.012,3.12,1.13,10.14,.54,-Math.PI/2);
  sevenFascia(6.85,3.12,6.198,7.68,.54);
  // A double-faced projecting lightbox is mounted above head height on the
  // upper corner wall, with short steel brackets carrying it back to the wall.
  // Both readable faces are separate so that lettering is never mirrored.
  box(sevenGreen,2.70,4.72,4.79,.79,.79,.11);
  for(const y of [4.45,4.99])box(metal,2.97,y,4.79,.40,.035,.045);
  sevenFascia(2.70,4.72,4.855,.69,.69);
  sevenFascia(2.70,4.72,4.725,.69,.69,Math.PI);
  // Glazed storefront with two legible entrances; windows are collision surfaces.
  function frontPane(cx,width){
    primitive('plane',clearGlass,[cx,1.55,4.825],[width,2.42,1]);
    solid(cx,1.50,4.82,width,2.65,.07);
    box(dark,cx,.31,4.82,width,.055,.075);box(dark,cx,2.79,4.82,width,.055,.075);
    for(const edge of [-1,1])box(metal,cx+edge*width/2,1.55,4.82,.045,2.50,.075);
    for(const [material,y] of [[sevenOrange,1.055],[sevenGreen,1.027],[sevenRed,.999]])
      box(material,cx,y,4.84,width,.028,.012);
  }
  frontPane(4.975,.95);frontPane(7.85,1.60);frontPane(9.60,1.70);
  function sidePane(cz,length){
    primitive('plane',clearGlass,[4.405,1.55,cz],[length,2.42,1],[0,-Math.PI/2,0]);
    solid(4.415,1.50,cz,.07,2.65,length);
    box(dark,4.405,.31,cz,.075,.055,length);box(dark,4.405,2.79,cz,.075,.055,length);
    for(const edge of [-1,1])box(metal,4.405,1.55,cz+edge*length/2,.075,2.50,.045);
    for(const [material,y] of [[sevenOrange,1.055],[sevenGreen,1.027],[sevenRed,.999]])
      box(material,4.39,y,cz,.012,.028,length);
  }
  sidePane(-1.67,4.04);sidePane(3.42,2.72);
  for(const x of [5.45,7.05])box(metal,x,1.47,4.82,.065,2.55,.12);
  box(metal,6.25,2.75,4.82,1.66,.16,.15);
  sign('入口','',6.25,2.75,4.908,.48,.12,'#33594b','#f5edd6');
  box(mat('entry rubber mat','#4b5551'),6.25,.207,4.48,1.38,.012,.55);
  for(const z of [.35,2.05])box(metal,4.405,1.47,z,.12,2.55,.065);
  box(metal,4.405,2.75,1.2,.15,.16,1.76);
  sign('入口','',4.315,2.75,1.2,.48,.12,'#33594b','#f5edd6',-Math.PI/2);
  box(materials['entry rubber mat'],4.73,.207,1.2,.55,.012,1.4);
  // Slim ground tracks and sensors suggest retracted automatic glass doors,
  // without placing collision geometry across either open entrance.
  box(metal,6.25,.207,4.81,1.56,.008,.048);
  box(metal,4.405,.207,1.20,.048,.008,1.64);
  box(dark,6.25,2.875,4.902,.28,.07,.052);
  box(dark,4.345,2.875,1.20,.052,.07,.28);
  // Rainwater is collected at the fascia and carried down an existing corner
  // post. The slim pipe is flush with the facade and clear of the arcade.
  box(metal,6.90,3.43,6.20,7.34,.075,.10);
  box(metal,10.53,1.77,6.13,.065,3.32,.065);
  for(const y of [.48,1.45,2.47,3.28])box(dark,10.53,y,6.127,.10,.035,.075);
  box(metal,10.53,.11,6.06,.065,.065,.15);
  const ceiling=new THREE.Group();ceiling.name='Convenience store ceiling — walking mode';
  const ceilingMesh=new THREE.Mesh(new THREE.BoxGeometry(6.35,.16,8.75),white);
  ceilingMesh.position.set(7.5,3.38,.5);ceilingMesh.castShadow=true;ceilingMesh.receiveShadow=true;ceiling.add(ceilingMesh);root.add(ceiling);ceiling.visible=false;
  // The corner convenience shop occupies a converted shophouse. Its upper home
  // projects over both entrances; columns leave a usable covered corner passage.
  const upperBox=(m,x,y,z,w,h,d,ry=0)=>primitive('box',m,[x,y,z],[w,h,d],[0,ry,0],ceiling);
  upperBox(cream,6.90,5.15,1.08,7.58,3.40,10.06);
  upperBox(white,6.90,3.47,1.08,7.72,.16,10.20);
  upperBox(white,6.90,6.91,1.08,7.76,.18,10.22);
  upperBox(mint,6.90,7.21,1.08,7.58,.46,10.06);
  upperBox(cream,6.90,7.49,1.08,7.76,.12,10.22);
  solid(6.90,5.15,1.08,7.58,3.40,10.06);
  addNeighborSevenUpper({b:upperBox,mat,palette:{cream,white,window,metal,dark}});
  for(const [x,z] of [[3.27,-3.75],[3.27,-.20],[3.27,4.70],[3.27,5.94],[8.95,5.94],[10.52,5.94]]){
    box(cream,x,1.75,z,.30,3.22,.32);solid(x,1.75,z,.30,3.22,.32);
    box(ceramicTile,x,.62,z,.32,.96,.34);
    box(white,x,3.22,z,.44,.20,.46);
  }
  // These two posts stand beyond the raised footpath; fill the small gap
  // beneath each existing post so the bases actually meet the lower ground.
  for(const x of [8.95,10.52])box(pavement,x,.07,5.94,.30,.14,.32);
  box(cream,3.27,3.21,1.08,.34,.32,10.06);
  box(cream,6.90,3.21,5.94,7.58,.32,.34);
  const setViewMode=mode=>{ceiling.visible=mode==='walk';};
  activeBuildingId=-1;
  const interiorSign = sign('歡迎光臨', '結帳請至櫃檯', 7.5, 2.79, -3.68, 2.55, .35, '#9baea1', '#334e44');

  // Refrigerated cases have depth: goods behind the glass, not pasted onto its front.
  for(let x=5.2;x<9.9;x+=1.13){
    box(interiorDark,x,1.34,-3.62,1.05,2.25,.055);
    box(dark,x,.24,-3.31,1.05,.12,.67);box(dark,x,2.45,-3.31,1.05,.12,.67);
    for(const side of [-1,1])box(dark,x+side*.495,1.34,-3.31,.06,2.25,.67);
    for(let row=0;row<4;row++){
      const y=.58+row*.48;
      box(white,x,y,-3.31,.91,.035,.53);
      const stock=addNeighborSevenCoolerStock({bay:Math.round((x-5.2)/1.13),row,x,shelfTop:y+.0175,z:-3.28,
        b:box,cyl,mesh:localMesh(0,0,0),mat});
      box(cream,x,y-.045,-3.04,.84,.055,.014);
      // Short price labels sit on the shelf lip, behind the cooler glass.
      // Values are fictional prices for this fictional store.
      const amount=stock.price;
      dailySigns.add({text:`${amount}元`,x,y:y-.045,z:-3.026,width:.17,height:.043,bg:'#f2ebd9',fg:'#45584e'});
    }
    primitive('plane',clearGlass,[x,1.35,-2.965],[.90,2.10,1]);
    for(const side of [-1,1])box(metal,x+side*.457,1.35,-2.955,.038,2.12,.035);
    box(metal,x+.31,1.36,-2.905,.033,.64,.045);
    box(fluorescent,x-.43,1.40,-3.01,.025,1.99,.025);
  }
  addNeighborSevenInterior({b:box,mat});
  solid(7.45,1.3,-3.32,5.5,2.4,.68);
  box(cream, 9.91, .66, 3.10, 1.03, .94, 2.15);
  box(dark, 9.91, 1.15, 3.10, 1.12, .07, 2.26);
  solid(9.91, .68, 3.1, 1.12, 1.12, 2.26);
  box(white, 9.92, 1.46, 3.69, .55, .55, .7);
  box(black, 9.623, 1.46, 3.69, .025, .37, .57);
  box(dark, 9.96, 1.50, 2.47, .52, .7, .45);
  box(black,9.688,1.65,2.47,.025,.20,.30);box(windowLight,9.672,1.65,2.47,.012,.135,.23);
  box(metal,9.64,1.49,2.47,.15,.05,.10);cyl(white,9.62,1.40,2.47,.052,.10);
  box(metal, 9.67, 1.3, 2.47, .19, .08, .27);
  sign('CITY CAFE・微波加熱', '', 10.47, 2.15, 3.0, 2.25, .38, '#eee3c9', '#435f54', -Math.PI / 2);
  box(cream, 9.92, 1.0, -.10, .7, 1.56, .85);
  box(dark, 9.54, 1.42, -.10, .025, .40, .62);
  box(windowLight, 9.52, 1.42, -.10, .008, .29, .49);
  sign('ibon', '列印・繳費', 9.53, 1.88, -.10, .74, .25, '#eeefe9', '#006b48',-Math.PI/2);
  solid(9.92, 1, -.1, .7, 1.8, .85);
  box(yellow, 10.02, .46, 1.12, .65, .52, .55);
  box(cream, 10.02, .87, 1.12, .53, .30, .5);
  box(dark, 5.26, .89, 4.45, 1.4, .09, .42);
  for (const x of [4.75, 5.75]) { cyl(dark, x, .54, 4.45, .035, .65); stool(x, 3.85); }

  // Practical service details: a noticeboard, microwave controls, baskets and a clock.
  sign('冷藏飲品・鮮乳','',7.5,2.52,-3.67,3.7,.20,'#e5e3ca','#516b5e');
  sign('ibon','列印・繳費單',9.53,2.19,-.10,1.1,.34,'#eeefe9','#006b48',-Math.PI/2);
  sign('用餐後請保持整潔','',5.15,2.1,4.71,1.12,.25,'#ede5cf','#586550',Math.PI);
  for(const z of [-1.9,1.5]){box(metal,7.35,3.10,z,3.7,.065,.14);box(fluorescent,7.35,3.055,z,3.52,.035,.11);for(const x of [5.85,8.85])box(metal,x,3.21,z,.016,.16,.016);}
  for(const z of [-1.9,1.5]){const light=new THREE.PointLight('#ecf7f3',19,5.5,2);light.position.set(7.35,3.0,z);root.add(light);}
  for(let i=0;i<3;i++){box(bluePlastic,5.12,.27+i*.14,2.1,.52,.12,.38);for(let j=0;j<4;j++)box(white,4.94+j*.12,.27+i*.14,2.295,.025,.08,.012);}
  for(let i=0;i<4;i++)box(black,9.615,1.48-i*.065,3.97,.02,.027,.035);
  cyl(dark,9.681,1.44,2.61,.035,.025,[0,0,Math.PI/2]);
  // Bowls and condiments belong to the tables and stall, leaving pedestrian space clear.
  for(const x of [-4.40,-4.00]){cyl(tableware,x,.9,6.8,.115,.08);cyl(dark,x,.945,6.8,.09,.007);}
  cyl(red,-4.20,.96,6.62,.045,.23);cyl(dark,-4.20,1.08,6.62,.042,.02);
  for(let i=0;i<2;i++){box(bluePlastic,-6.45,.28+i*.27,2.0,.48,.24,.6);for(let j=0;j<5;j++)box(dark,-6.205,.28+i*.27,1.77+j*.11,.012,.13,.035);}
  const menuCanvas=document.createElement('canvas');menuCanvas.width=512;menuCanvas.height=768;
  const menuContext=menuCanvas.getContext('2d');menuContext.fillStyle='#303b34';menuContext.fillRect(0,0,512,768);
  menuContext.strokeStyle='#d7ccaa';menuContext.lineWidth=4;menuContext.strokeRect(20,20,472,728);
  menuContext.fillStyle='#eee0b8';menuContext.font=`700 70px ${SIGN_FONT}`;menuContext.textAlign='center';menuContext.fillText('菜單',256,130);
  menuContext.font=`700 48px ${SIGN_FONT}`;
  [['陽春麵','40'],['滷肉飯','45'],['燙青菜','35'],['滷味','30']].forEach(([name,price],i)=>{menuContext.textAlign='left';menuContext.fillText(name,52,270+i*100);menuContext.textAlign='right';menuContext.fillText(price,456,270+i*100);});
  menuContext.font=`700 32px ${SIGN_FONT}`;menuContext.textAlign='center';menuContext.fillText('單位：元　內用・外帶',256,692);
  const menuTexture=new THREE.CanvasTexture(menuCanvas);menuTexture.colorSpace=THREE.SRGBColorSpace;menuTexture.anisotropy=4;
  const menuMesh=new THREE.Mesh(new THREE.PlaneGeometry(.70,.94),new THREE.MeshStandardMaterial({map:menuTexture,roughness:.86}));menuMesh.position.set(-3.66,.80,4.58);menuMesh.rotation.y=Math.PI/2;root.add(menuMesh);
  box(wood,-3.69,.80,4.58,.045,1.06,.75);
  for(const z of [4.30,4.86]){box(wood,-3.78,.63,z,.045,1.02,.04);box(wood,-3.57,.63,z,.045,1.02,.04);}
  const stallLight=new THREE.PointLight('#ffc88c',3,4.5,2);stallLight.position.set(-3.9,2.14,3.15);root.add(stallLight);

  // The six existing original models, in the same five requested categories.
  placements.push(
    { id: 'postbox-red-1', kind: 'postboxRed', x: -4.10, y: .14, z: 9.90, rotation: Math.PI / 2 },
    { id: 'postbox-green-1', kind: 'postboxGreen', x: -4.10, y: .14, z: 9.25, rotation: Math.PI / 2 },
    { id: 'noodle-stall-1', kind: 'stall', x: -4.25, y: .14, z: 3.15, rotation: Math.PI / 2 },
    { id: 'shelf-1', kind: 'shelf', x: 6.40, y: .20, z: -.60, rotation: 0 },
    { id: 'shelf-2', kind: 'shelf', x: 8.15, y: .20, z: -.60, rotation: 0 },
    { id: 'checkout-1', kind: 'checkout', x: 7.65, y: .20, z: 3.6, rotation: 0 },
    { id: 'tea-egg-1', kind: 'teaEgg', x: 7.12, y: 1.2, z: 3.48, rotation: 0 }
  );

  // Pavement life: a little outdoor dining, plants and parked scooters.
  cyl(dark, -4.20, .83, 6.8, .52, .04);
  cyl(metal, -4.20, .48, 6.8, .055, .64);
  cyl(metal, -4.20, .17, 6.8, .36, .05);
  stool(-3.75, 6.20); stool(-4.45, 7.45);
  solid(-4.20, .5, 6.8, 1.04, .9, 1.04);
  for (const p of [[-4.35, -11.1, 1.1], [-4.48, -5.9, .8], [-4.38, .15, .8], [-6.45, 8.45, 1.0], [4.9, 6.5, 1], [10.2, 5.4, 1.1], [4.8, -4.4, .9]]) plant(...p);
  if (scooterFactory) {
    // Keep the longer imported vehicles clear of the arcade columns and
    // planters. On the east curb they stand in a row, leaving the arcade open.
    // West shop paving finishes at .14m; the east sidewalk surface is .13m.
    scooter(-4.3, -9.65, '#a2bdb6', -.15, .14);
    scooter(-4.2, -7.55, '#b6a17b', .08, .14);
    scooter(3.65, 8.2, '#d0b173', -.08, .13);
    scooter(3.65, 10.4, '#b45a48', .08, .13);
    // North lane (Stage 4 density): scooters hug the chain-store walls.
    scooter(-3.15, -44.5, '#7d8fa3', 3.1, .13);
    scooter(-3.15, -46.9, '#c2c7ce', .05, .13);
    scooter(3.15, -57.0, '#8a9a7b', -3.05, .13);
    scooter(-3.15, -75.5, '#b45a48', .1, .13);
  } else {
    // Preserve the original-world layout when the asset is unavailable.
    scooter(-4.3, -8.7, '#a2bdb6', -.15);
    scooter(-4.2, -6.8, '#b6a17b', .08);
    scooter(4.2, 8.8, '#d0b173', -.08);
    scooter(5.25, 8.9, '#b45a48', .08);
  }
  // Small curbside rubbish and recycling bins.
  box(dark, -3.65, .58, 10.5, .6, .88, .6); box(mint, -4.35, .58, 10.5, .6, .88, .6);
  box(cream, -3.65, 1.06, 10.5, .68, .1, .68); box(cream, -4.35, 1.06, 10.5, .68, .1, .68);

  // Useful information belongs at the decision point, on actual shop surfaces.
  dailySigns.add({text:'榕安街',detail:'5號',x:4.375,y:2.25,z:.08,width:.30,height:.39,yaw:-Math.PI/2,kind:'address'});
  dailySigns.add({text:'7-ELEVEN',detail:'24小時營業',note:'服務請洽櫃檯',x:4.375,y:1.80,z:-.48,width:.78,height:.50,yaw:-Math.PI/2,kind:'hours',bg:'#eee8d6',fg:'#354d42'});
  shopAddresses.push({name:'7-ELEVEN',street:'榕安街',number:5,position:[7.5,.5],hours:['24小時營業','全年無休']});
  dailySigns.add({text:'出口',x:6.25,y:2.75,z:4.72,width:.48,height:.12,yaw:Math.PI});
  dailySigns.add({text:'出口',x:4.49,y:2.75,z:1.2,width:.48,height:.12,yaw:Math.PI/2});
  dailySigns.add({text:'結帳・取貨',detail:'請依序排隊',x:7.65,y:2.40,z:3.60,width:1.50,height:.40,back:true});
  for(const x of [7.18,8.12])box(metal,x,2.94,3.60,.016,.68,.016);
  dailySigns.add({text:'微波加熱',x:9.632,y:1.69,z:3.69,width:.47,height:.075,yaw:-Math.PI/2,bg:'#eeeadd',fg:'#354d42'});
  dailySigns.add({text:'咖啡',x:9.657,y:1.65,z:2.47,width:.21,height:.09,yaw:-Math.PI/2,bg:'#244b3c'});
  dailySigns.add({text:'繳費單請至櫃檯',x:9.54,y:1.06,z:-.10,width:.64,height:.13,yaw:-Math.PI/2,bg:'#eeeadd',fg:'#354d42'});
  dailySigns.add({text:'購物籃',x:4.845,y:.39,z:2.10,width:.27,height:.09,yaw:-Math.PI/2,bg:'#e8e4d5',fg:'#354d42'});
  dailySigns.add({text:'一般垃圾',x:-3.65,y:.66,z:10.812,width:.48,height:.23,bg:'#e8e4d5',fg:'#354d42'});
  dailySigns.add({text:'資源回收',detail:'寶特瓶・鐵鋁罐',x:-4.35,y:.66,z:10.812,width:.48,height:.23,bg:'#2e6654'});
  // These roads and addresses are world settings, not real Dihua addresses.
  // Opposite readable faces share an atlas; no mirrored DoubleSide lettering.
  for(const [px,pz,direction] of [[-3.4,-11.35,-1],[3.4,-21.65,1]]){
    // The long board faces the sidewalk. The compact cross-street board fits
    // between mast and vehicle head, with its lower edge at 4.5 m.
    const mainX=px-direction*.13;
    dailySigns.add({text:'榕安街',detail:'Rong’an St.',x:mainX,y:4.16,z:pz+direction*.95,width:1.90,height:.47,yaw:Math.PI/2,kind:'street',back:true,bg:'#126649'});
    dailySigns.add({text:'長和路',detail:'Changhe Rd.',x:px-direction*.625,y:4.68,z:pz,width:1.15,height:.36,kind:'street',back:true,bg:'#126649'});
    box(metal,(px+mainX)/2,4.16,pz,.20,.04,.04);
    box(metal,px-direction*.625,4.89,pz,.035,.10,.035);
  }
  for(const z of [-11.35,-21.65])for(const side of [-1,1]){
    const yaw=-side*Math.PI/2,x=side*3.4;
    dailySigns.add({text:'行人專用時相',detail:'請依號誌通行',x:x+Math.sin(yaw)*.13,y:1.94,z,width:.62,height:.28,yaw,bg:'#ece8d8',fg:'#314f45',kind:'pedestrian'});
    box(metal,x+Math.sin(yaw)*.065,1.94,z,.13,.035,.035);
  }

  // The lane opens onto the cross street; its sightline ends on real building facades.
  // A restrained lantern line and overhead cables lend depth without hiding the road.
  const lampLights = [];
  for (const z of [-5.7, 6.0]) {
    for (const x of [-3.85, 3.85]) {
      cyl(dark, x, 2.72, z, .045, 5.2);
      sphere(lampMat, x, 5.36, z, .19, .14, .19);
      const light = new THREE.PointLight('#ffd5a0', 0, 8, 2); light.position.set(x, 4.8, z); root.add(light); lampLights.push(light);
    }
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-3.85, 5.2, z), new THREE.Vector3(0, 4.68, z), new THREE.Vector3(3.85, 5.2, z)]);
    root.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 24, .012, 4, false), dark));
    for (let i = 0; i < 5; i++) {
      const x = -2.9 + i * 1.45; const y = 4.68 + .52 * (x / 3.85) ** 2;
      cyl(dark, x, y - .10, z, .014, .20);
      // Shared paper-lantern parts hang from just under the cable point:
      // lathed paper body with ribs, caps at both ends, tassel strands.
      const anchorY = y - .05;
      primitive('lanternBody', lanternMat, [x, anchorY, z], [1, 1, 1]);
      primitive('lanternRibs', lanternRib, [x, anchorY, z], [1, 1, 1]);
      primitive('lanternCaps', lanternCap, [x, anchorY, z], [1, 1, 1]);
      primitive('lanternTassel', red, [x, anchorY, z], [1, 1, 1]);
    }
  }
  for (const z of [-10.8, -9.9]) {
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-7, 6.1, z), new THREE.Vector3(0, 5.0, z - .15), new THREE.Vector3(7, 6.6, z)]);
    root.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 26, .016, 4, false), dark));
  }

  // Painted road glyph has a transparent surround, not a rectangular sign on the asphalt.
  const markingCanvas=document.createElement('canvas');markingCanvas.width=256;markingCanvas.height=256;
  const markingContext=markingCanvas.getContext('2d');markingContext.font=`700 205px ${SIGN_FONT}`;
  markingContext.textAlign='center';markingContext.textBaseline='middle';markingContext.fillStyle='#d4d0b9';markingContext.fillText('慢',128,140);
  const markingTexture=new THREE.CanvasTexture(markingCanvas);markingTexture.colorSpace=THREE.SRGBColorSpace;
  const markingMaterial=new THREE.MeshStandardMaterial({map:markingTexture,transparent:true,alphaTest:.1,roughness:.95,depthWrite:false});
  const slowMark=new THREE.Mesh(new THREE.PlaneGeometry(.85,1.2),markingMaterial);slowMark.rotation.x=-Math.PI/2;slowMark.position.set(.6,.058,10.8);slowMark.receiveShadow=true;root.add(slowMark);

  addPaintoverDetails({box,mat});
  addOrganicPlants({box,cyl,primitive,mat,solid});
  addLifeDetails({box,mat});
  addSignClutter(dailySigns.add);
  for (const batch of batches.values()) {
    const mesh = new THREE.InstancedMesh(batch.geometry, batch.material, batch.matrices.length);
    batch.matrices.forEach((matrix, index) => mesh.setMatrixAt(index, matrix));
    mesh.instanceMatrix.needsUpdate = true;
    weather.attachBatch(mesh,batch.buildingIds??batch.matrices.map(()=>-1),batch.material.userData.weatherRole??null);
    mesh.castShadow = !batch.material.transparent; mesh.receiveShadow = true;
    mesh.computeBoundingSphere();
    (batch.group||root).add(mesh);
  }
  weather.finalize();
  addShowcaseWear(root);
  addUtilityWires(root,{solid});
  addFacadeLife(root);
  addStreetClutter(root,{solid});
  const farBackdrop=addFarBackdrop(root);
  const terminusShrine=addTerminusShrine(root,{solid,addSign:dailySigns.add});
  const roadWorks=addRoadWorks(root,{solid,addSign:dailySigns.add});
  const publicMarket=addPublicMarket(root,{solid,addSign:dailySigns.add});
  addBackLaneHouses(root,{solid});
  addCrossStreetEast(root,{solid});
  addParkWallDressing(root);
  addTempleWest(root,{solid});
  const streetArches=addStreetArches(root,{solid,addSign:dailySigns.add});
  const sun = new THREE.DirectionalLight('#fff0df', 3.0);
  sun.position.set(-9, 20, 12); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -19, right: 19, top: 20, bottom: -20, near: .5, far: 70 });
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.normalBias = .035; sun.shadow.bias = -.00015;
  scene.add(sun);
  const ambient = new THREE.HemisphereLight('#c5d5df', '#867d69', 1.05); scene.add(ambient);
  const fill = new THREE.DirectionalLight('#c4d4df', .35); fill.position.set(10, 10, -6); scene.add(fill);
  scene.background = new THREE.Color('#dce6df');
  scene.fog = new THREE.Fog('#dce6df', 60, 140);
  function setTime(mode) {
    retailLighting.setTime(mode);
    farBackdrop.setTime(mode);
    terminusShrine.setTime(mode);
    roadWorks.setTime(mode);
    publicMarket.setTime(mode);
    streetArches.setTime(mode);
    const evening = mode === 'evening';
    sun.color.set(evening ? '#ffbe7f' : '#fff0cf');
    sun.intensity = evening ? 1.35 : 3.0;
    sun.position.set(evening ? -18 : -9, evening ? 9 : 20, 12);
    ambient.intensity = evening ? .65 : 1.05;
    ambient.color.set(evening ? '#9aaec5' : '#dbe9e5');
    fill.intensity = evening ? .24 : .35;
    lanternMat.emissiveIntensity = evening ? 1.4 : .08;
    lampMat.emissiveIntensity = evening ? 2.5 : .22;
    windowLight.emissiveIntensity = evening ? .85 : .12;
    interiorSign.emissiveIntensity = evening ? .18 : .035;
    lampLights.forEach(light => light.intensity = evening ? 14 : 0);
    stallLight.intensity=evening?12:3;
  }
  groundColliders.push({position:[7.5,.10,.5],size:[6.2,.2,8.6]});
  const floorHeight=(x,z)=>{
    const ramp=rampZones.find(r=>Math.abs(x-r.x)<=r.w/2&&Math.abs(z-r.z)<=r.d/2);
    if(ramp){const t=.5+((ramp.axis==='x'?x-ramp.x:z-ramp.z)*ramp.direction)/.90;return .045+.095*t;}
    return x>4.4&&x<10.6&&z>-3.8&&z<4.8?.20:
      shopFloorZones.some(f=>Math.abs(x-f.x)<f.width/2&&Math.abs(z-f.z)<f.depth/2)?.14:
      Math.abs(x)>3&&Math.abs(x)<7.1&&z>-13.3&&z<13.6?.14:
      x>-6.18&&x<-3.34&&z>-11.2&&z<14.6?.14:
      Math.abs(x)>2.9&&Math.abs(x)<4&&z<-20.8?.14:
      (Math.abs(x)>3.3&&z>-21.1&&z<-19.4)||(z>20.1&&z<21.6)?.14:.015;
  };
  const arcadeRoutes=[{name:'West continuous qilou',points:[[-5.4,10],[-5.4,-10]],clearWidth:1.05},{name:'Convenience store corner',points:[[3.75,-3.2],[3.75,5.4],[6.25,5.4],[6.25,4.25]],clearWidth:.90}];
  const signage={...dailySigns.finalize(),addresses:shopAddresses,businesses};
  return { colliders, placements, groundColliders, bounds, floorHeight, arcadeRoutes, signage,weathering:weather.getStats(),lights: { sun, ambient, fill }, retailLighting, setTime, setViewMode, setBackdropWeather:(mode)=>{farBackdrop.setWeather(mode);streetArches.setWeather(mode);}, root };
}
