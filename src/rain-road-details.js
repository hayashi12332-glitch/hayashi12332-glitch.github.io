import * as THREE from 'three';
import {createSurfaceMaterial} from './surfaces.js';

// Original metre-based road paint. The northbound approach has one turning
// choice for each real arm of the existing junction, before its stop line.
export function createRainRoadDetails(scene){
  const group=new THREE.Group();group.name='Rain street road paint';scene.add(group);
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=768;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#d9d5be';
  function polygon(points){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();}
  polygon([[231,726],[281,726],[281,220],[329,220],[256,53],[183,220],[231,220]]);
  ctx.lineWidth=47;ctx.lineCap='butt';ctx.lineJoin='round';
  ctx.beginPath();ctx.moveTo(256,503);ctx.bezierCurveTo(256,403,182,359,105,359);ctx.strokeStyle='#d9d5be';ctx.stroke();
  polygon([[35,359],[136,287],[136,335],[161,335],[161,383],[136,383],[136,431]]);
  ctx.beginPath();ctx.moveTo(256,503);ctx.bezierCurveTo(256,403,330,359,407,359);ctx.stroke();
  polygon([[477,359],[376,287],[376,335],[351,335],[351,383],[376,383],[376,431]]);
  // Loss of paint follows small aggregate chips and sparse fine cracks.
  let seed=73183;const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
  ctx.globalCompositeOperation='destination-out';
  for(let i=0;i<2350;i++){ctx.globalAlpha=.12+random()*.43;const r=.35+random()*1.75;ctx.beginPath();ctx.ellipse(random()*512,random()*768,r,r*(.5+random()),random()*3,0,Math.PI*2);ctx.fill();}
  ctx.globalAlpha=.48;ctx.lineWidth=.65;
  for(let i=0;i<21;i++){const x=random()*512,y=random()*768;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+random()*18-9,y+15+random()*25);ctx.lineTo(x+random()*32-16,y+32+random()*27);ctx.stroke();}
  ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
  const map=new THREE.CanvasTexture(canvas);map.name='Original northbound worn three-way arrow';map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;
  const material=createSurfaceMaterial('paint','#ffffff',{map,transparent:true,alphaTest:.12,roughness:.87,depthWrite:false});
  material.name='Worn northbound approach paint';
  const arrow=new THREE.Mesh(new THREE.PlaneGeometry(1.95,3.45),material);
  arrow.name='Northbound straight left right junction arrow';arrow.rotation.x=-Math.PI/2;arrow.position.set(1.25,.050,-6.6);arrow.receiveShadow=true;group.add(arrow);
  const diagnostics={arrows:1,position:[1.25,.050,-6.6],footprint:{minX:.275,maxX:2.225,minZ:-8.325,maxZ:-4.875},travelDirection:[0,0,-1],junctionCenter:[0,-16.5],stopLineZ:-10.85,groundTop:.045,paintSurface:.050,existingManhole:{centre:[1.3,-9],radius:.27,minimumLongitudinalGap:.405},meaning:'Northbound straight/left/right at existing four-arm intersection; paint is clear of the existing manhole and no arrow is placed under the car.'};
  return {group,getSnapshot:()=>({...diagnostics,footprint:{...diagnostics.footprint}})};
}
