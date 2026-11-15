import * as THREE from 'three';

// Refine the existing opaque upper-storey panes; no extra panes or rooms.
export function refineWindowSurface(material){
  material.userData.architecturalGlass='upper';
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
  const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(256,256);
  for(let y=0;y<256;y++)for(let x=0;x<256;x++){
    const u=x/255,v=y/255,edge=Math.min(u,1-u,v,1-v);
    const frame=.83+.17*Math.min(1,edge/.035);
    const topShadow=1-.12*Math.exp(-v*20);
    // A restrained blue-grey gradient reads as a dark interior through glass;
    // the actual sky reflections come from the scene environment, not a
    // painted-on building or a fixed white diagonal stripe.
    const reflectedSky=.75+.16*(1-v)+.015*Math.sin(u*5.4+v*.9);
    const grime=(Math.sin(x*.17+y*.041)*Math.sin(y*.063+x*.027))*.012;
    const value=frame*topShadow*(reflectedSky+grime);
    const i=(y*256+x)*4;
    pixels.data[i]=Math.round(194*value);pixels.data[i+1]=Math.round(211*value);pixels.data[i+2]=Math.round(211*value);pixels.data[i+3]=255;
  }
  ctx.putImageData(pixels,0,0);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
  texture.name='Existing panes — frame shade and subdued sky tint';
  material.map=texture;material.color.set('#c2cfcb');material.metalness=0;material.roughness=.16;material.envMapIntensity=2.2;
  material.onBeforeCompile=shader=>{
    shader.vertexShader='varying float vPaneVariation;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`
      #include <project_vertex>
      vec4 paneOrigin=vec4(0.0,0.0,0.0,1.0);
      #ifdef USE_INSTANCING
        paneOrigin=instanceMatrix*paneOrigin;
      #endif
      paneOrigin=modelMatrix*paneOrigin;
      vPaneVariation=fract(sin(dot(paneOrigin.xyz,vec3(12.17,37.03,8.93)))*43758.54);
    `);
    shader.fragmentShader='varying float vPaneVariation;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','\n#include <map_fragment>\ndiffuseColor.rgb*=mix(.82,1.08,vPaneVariation);');
  };
  material.customProgramCacheKey=()=> 'existing-window-depth-v2';
  return material;
}

// Diffused light behind a fabric curtain, not an opaque uniformly yellow
// rectangle. Low contrast keeps details legible without inventing a room.
export function refineLitWindowSurface(material){
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;
  const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(128,128);
  for(let y=0;y<128;y++)for(let x=0;x<128;x++){
    const u=x/127,v=y/127;
    // A few soft folds with uneven spacing and width avoid the repeated,
    // uniformly spaced bands that made the previous curtain look synthetic.
    const fold=(centre,width)=>Math.exp(-(((u-centre)/width)**2));
    const folds=-.026*fold(.18,.075)+.012*fold(.34,.13)-.018*fold(.61,.055)+.009*fold(.86,.15);
    const edge=Math.min(u,1-u,v,1-v);
    const shade=.91+.07*Math.min(1,edge/.045)-.05*v+folds;
    const i=(y*128+x)*4;
    pixels.data[i]=Math.round(238*shade);pixels.data[i+1]=Math.round(231*shade);pixels.data[i+2]=Math.round(214*shade);pixels.data[i+3]=255;
  }
  ctx.putImageData(pixels,0,0);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
  texture.name='Soft curtain behind illuminated window';
  // The curtain modulates emitted light too, so evening does not turn the
  // whole opening back into a uniform glowing rectangle.
  material.map=texture;material.emissiveMap=texture;material.roughness=.42;material.metalness=0;
  return material;
}
