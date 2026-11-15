import * as THREE from 'three';

/** Shared, bounded-LDR neighbourhood reflection, not a planar mirror.
 * Pooled shop lamps are excluded from a cached probe so its first capture
 * does not depend on which shops the player visited immediately beforehand.
 */
export function createExemplarGlazing(scene,renderer){
  const materials=new Set();
  scene.traverse(object=>{
    if(!object.isMesh)return;
    for(const material of Array.isArray(object.material)?object.material:[object.material]){
      if(material?.userData.architecturalGlass)materials.add(material);
    }
  });
  if(!materials.size||!renderer)return {refresh(){},getSnapshot(){return {materialCount:materials.size,cachedModes:[]};},dispose(){}};

  const target=new THREE.WebGLCubeRenderTarget(128,{
    type:THREE.UnsignedByteType,generateMipmaps:false,
    minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,
  });
  const probe=new THREE.CubeCamera(.25,100,target);
  probe.position.set(0,4.1,-4.0);
  probe.name='Static neighbourhood glass reflection probe';
  const pmrem=new THREE.PMREMGenerator(renderer),reflections=new Map();
  let lastCapture=null;

  for(const material of materials){
    if(material.userData.architecturalGlass!=='storefront')continue;
    const previousCompile=material.onBeforeCompile;
    const previousKey=material.customProgramCacheKey();
    material.onBeforeCompile=function(shader,activeRenderer){
      previousCompile.call(this,shader,activeRenderer);
      shader.fragmentShader=shader.fragmentShader.replace('#include <alphamap_fragment>',/* glsl */`
        #include <alphamap_fragment>
        // A thin neutral film: the centre remains clear, with a restrained
        // street reflection at grazing angles. Upper panes are not retinted.
        float glassFacing=abs(dot(normalize(vNormal),normalize(vViewPosition)));
        float glassFresnel=pow(1.0-clamp(glassFacing,0.0,1.0),4.0);
        diffuseColor.a=mix(.04,.25,glassFresnel);
      `);
    };
    material.customProgramCacheKey=()=>previousKey+'|exemplar-glass-fresnel-v2';
    material.color.set('#eef3f1');
    material.opacity=.04;
    material.roughness=.065;
    material.envMapIntensity=.65;
    material.needsUpdate=true;
  }

  function applyReflection(texture){
    for(const material of materials){
      material.envMap=texture;
      material.envMapIntensity=material.userData.architecturalGlass==='storefront'?.65:.85;
      material.needsUpdate=true;
    }
  }
  function refresh(mode='day'){
    if(reflections.has(mode)){applyReflection(reflections.get(mode).texture);return;}
    const oldTarget=renderer.getRenderTarget(),oldXr=renderer.xr.enabled;
    const oldShadowUpdate=renderer.shadowMap.autoUpdate;
    const hidden=[],previousMaps=new Map(),pooled=[];
    let next=null;
    try{
      for(const material of materials){
        previousMaps.set(material,material.envMap);
        material.envMap=null;
      }
      scene.traverse(object=>{
        if(object.isLight&&object.userData?.retailPooled){
          pooled.push({light:object,intensity:object.intensity});
          object.intensity=0;
        }
        if(!object.isMesh||!object.visible)return;
        const list=Array.isArray(object.material)?object.material:[object.material];
        if(list.some(m=>m?.userData.architecturalGlass==='storefront')){
          hidden.push(object);object.visible=false;
        }
      });
      renderer.xr.enabled=false;
      // Use the current shadow atlas, without six extra shadow renders.
      renderer.shadowMap.autoUpdate=false;
      probe.update(renderer,scene);
      next=pmrem.fromCubemap(target.texture);
      applyReflection(next.texture);
      reflections.set(mode,next);
      lastCapture={mode,pooledLightCount:pooled.length,succeeded:true};
    }catch(error){
      next?.dispose();
      for(const [material,map] of previousMaps){material.envMap=map;material.needsUpdate=true;}
      lastCapture={mode,pooledLightCount:pooled.length,succeeded:false};
      console.warn('Neighbourhood reflection kept the existing sky fallback.',error);
    }finally{
      for(const {light,intensity} of pooled)light.intensity=intensity;
      for(const object of hidden)object.visible=true;
      renderer.xr.enabled=oldXr;
      renderer.shadowMap.autoUpdate=oldShadowUpdate;
      renderer.setRenderTarget(oldTarget);
      renderer.shadowMap.needsUpdate=true;
    }
  }
  function getSnapshot(){
    return {materialCount:materials.size,cachedModes:[...reflections.keys()].sort(),probeResolution:128,probeType:'UnsignedByteType',lastCapture:lastCapture?{...lastCapture}:null};
  }
  refresh();
  return {refresh,getSnapshot,dispose(){for(const map of reflections.values())map.dispose();target.dispose();pmrem.dispose();}};
}
