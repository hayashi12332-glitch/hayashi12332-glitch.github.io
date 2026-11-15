import * as THREE from 'three';
import {Reflector} from 'three/addons/objects/Reflector.js';
import {setSurfaceRainAmount,setSurfaceRainEnvironment,getSurfaceRainSnapshot,roadRainShaderChunk} from './surfaces.js';

// Original bounded rain study. The main road receives one cached planar film.
// A subdued static cube remains a fallback outside that plane, not SSR.
// Raindrops are emitted only over the actual exposed road footprint. Existing
// arcade roofs, raised shop floors and doorway colliders remain unchanged.
export function createRainWeather(scene,renderer,{reflectionPosition=[0,.55,-6]}={}){
  const root=new THREE.Group();root.name='Rain over exposed street';root.visible=false;scene.add(root);
  let weather='clear',timeOfDay='day',time=0,reflectionPending=false,lastCapture=null;
  let mainCamera=null,planarDirty=false,planarReady=false,planarCapturing=false;
  let planarCaptureCount=0,planarLastCapture=null,planarLastWallTime=-Infinity;
  const planarPosition=new THREE.Vector3(),planarQuaternion=new THREE.Quaternion();
  const reflections=new Map();
  const rng=(()=>{let n=11012026;return()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};})();
  const inRoad=(x,z)=>
    (Math.abs(x)<2.74&&z>-92.2&&z<37.8)||
    (Math.abs(x)<35.8&&Math.abs(z+16.5)<2.74)||
    (Math.abs(x)<35.8&&Math.abs(z-17.2)<2.74)||
    (Math.abs(x-30.3)<9.8&&Math.abs(z-36.5)<2.24);

  const rainCount=150;
  const rainSeeds=Array.from({length:rainCount},()=>({x:(rng()-.5)*18,z:(rng()-.5)*22,phase:rng(),speed:4.2+rng()*2.0,length:.09+rng()*.09}));
  const rainPositions=new Float32Array(rainCount*6),rainGeometry=new THREE.BufferGeometry();
  rainGeometry.setAttribute('position',new THREE.BufferAttribute(rainPositions,3).setUsage(THREE.DynamicDrawUsage));
  const rainMaterial=new THREE.LineBasicMaterial({color:'#c4d6df',transparent:true,opacity:.24,depthWrite:false,fog:true});
  const drizzle=new THREE.LineSegments(rainGeometry,rainMaterial);drizzle.name='Sparse camera-near rain over road only';drizzle.frustumCulled=false;root.add(drizzle);

  const rippleTime={value:0},rippleGeometry=new THREE.RingGeometry(.91,1,24);
  const rippleMaterial=new THREE.MeshBasicMaterial({color:'#c3d6db',transparent:true,opacity:.16,depthWrite:false,side:THREE.DoubleSide,fog:true});
  const pools=[[-1.8,-5.8],[.9,-8.7],[-1.55,3.9],[1.8,-28.8],[-1.7,-48],[1.6,-64]];
  const rippleCount=pools.length*4,phases=new Float32Array(rippleCount);
  const ripples=new THREE.InstancedMesh(rippleGeometry,rippleMaterial,rippleCount);ripples.name='Small rainfall rings in six road low spots';
  const dummy=new THREE.Object3D();
  pools.forEach(([x,z],poolIndex)=>{
    for(let i=0;i<4;i++){
      const index=poolIndex*4+i;
      phases[index]=rng();dummy.position.set(x+(rng()-.5)*.6,.055,z+(rng()-.5)*1.2);
      dummy.rotation.set(-Math.PI/2,0,rng()*Math.PI);dummy.scale.set(1,.72+rng()*.22,1);dummy.updateMatrix();ripples.setMatrixAt(index,dummy.matrix);
    }
  });
  rippleGeometry.setAttribute('rainRipplePhase',new THREE.InstancedBufferAttribute(phases,1));
  rippleMaterial.onBeforeCompile=shader=>{
    shader.uniforms.rainRippleTime=rippleTime;shader.uniforms.taiwanSurfaceRainAmount={value:1};
    shader.vertexShader='uniform float rainRippleTime; attribute float rainRipplePhase; varying float vRainRippleAge; varying vec3 vRainRippleWorld;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',/* glsl */`
      #include <begin_vertex>
      vRainRippleAge=fract(rainRipplePhase+rainRippleTime*.56);
      transformed.xy*=mix(.018,.19,vRainRippleAge);
    `);
    shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',/* glsl */`
      #include <project_vertex>
      vec4 rainRingWorld=vec4(transformed,1.0);
      #ifdef USE_INSTANCING
        rainRingWorld=instanceMatrix*rainRingWorld;
      #endif
      vRainRippleWorld=(modelMatrix*rainRingWorld).xyz;
    `);
    shader.fragmentShader='varying float vRainRippleAge; varying vec3 vRainRippleWorld;\n'+roadRainShaderChunk+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <alphatest_fragment>',/* glsl */`
      diffuseColor.a*=sin(vRainRippleAge*3.14159265)*pow(1.0-vRainRippleAge,1.4)*twRoadWetness(vRainRippleWorld).y;
      #include <alphatest_fragment>
    `);
  };
  rippleMaterial.customProgramCacheKey=()=> 'taiwan-rain-low-spot-rings-v2-shared-pool-mask';
  ripples.frustumCulled=false;root.add(ripples);

  let dripEmitters=[],drips=null,dripGeometry=null;
  const dripMaterial=new THREE.LineBasicMaterial({color:'#d4e1e4',transparent:true,opacity:.38,depthWrite:false,fog:true});
  function setDripEmitters(specs=[]){
    dripEmitters=specs.filter(s=>[s.x,s.y,s.z,s.groundY??.14].every(Number.isFinite)&&s.y>(s.groundY??.14)+.1)
      .slice(0,24).map(s=>({x:s.x,y:s.y,z:s.z,groundY:s.groundY??.14}));
    if(drips)root.remove(drips);dripGeometry?.dispose();drips=null;dripGeometry=null;
    if(!dripEmitters.length)return;
    dripGeometry=new THREE.BufferGeometry();dripGeometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(dripEmitters.length*3*6),3).setUsage(THREE.DynamicDrawUsage));
    drips=new THREE.LineSegments(dripGeometry,dripMaterial);drips.name='Runoff from recorded physical awning edges';drips.frustumCulled=false;root.add(drips);
  }

  const planarGeometry=new THREE.PlaneGeometry(5.68,111);
  const planarShader={
    name:'Broken rainwater film on main road',
    uniforms:{color:{value:null},tDiffuse:{value:null},textureMatrix:{value:null},
      taiwanSurfaceRainAmount:{value:1},rainPlanarEnabled:{value:0},rainFilmTime:{value:0}},
    vertexShader:/* glsl */`
      uniform mat4 textureMatrix;
      varying vec4 vRainReflectionUV;
      varying vec3 vRainFilmWorld;
      varying vec3 vRainFilmToEye;
      #include <common>
      #include <logdepthbuf_pars_vertex>
      void main(){
        vec4 world=modelMatrix*vec4(position,1.0);
        vRainFilmWorld=world.xyz;
        vRainFilmToEye=cameraPosition-world.xyz;
        vRainReflectionUV=textureMatrix*vec4(position,1.0);
        gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
        #include <logdepthbuf_vertex>
      }`,
    fragmentShader:/* glsl */`
      uniform sampler2D tDiffuse;
      uniform float rainPlanarEnabled;
      uniform float rainFilmTime;
      varying vec4 vRainReflectionUV;
      varying vec3 vRainFilmWorld;
      varying vec3 vRainFilmToEye;
      #include <logdepthbuf_pars_fragment>
      ${roadRainShaderChunk}
      void main(){
        #include <logdepthbuf_fragment>
        if(rainPlanarEnabled<.5)discard;
        vec2 wet=twRoadWetness(vRainFilmWorld);
        float sideEdge=1.0-smoothstep(2.77,2.84,abs(vRainFilmWorld.x));
        float endEdge=1.0-smoothstep(54.6,55.5,abs(vRainFilmWorld.z+32.5));
        float grazing=1.0-clamp(abs(normalize(vRainFilmToEye).y),0.0,1.0);
        float fresnel=.08+.92*pow(grazing,3.2);
        float alpha=(.04*wet.x+.40*wet.y)*fresnel*sideEdge*endEdge;
        if(alpha<.006)discard;
        // Subpixel ripples disturb the real reflected facades. The water has
        // no painted white colour, bloom or luminous ellipse texture.
        vec4 projected=vRainReflectionUV;
        vec2 wave=vec2(sin(vRainFilmWorld.z*18.0+rainFilmTime*2.7),sin(vRainFilmWorld.x*23.0-rainFilmTime*2.0));
        projected.xy+=wave*(.00085+.00075*wet.y)*projected.w;
        vec2 uv=projected.xy/projected.w;
        if(projected.w<=0.0||uv.x<0.0||uv.x>1.0||uv.y<0.0||uv.y>1.0)discard;
        vec3 reflected=texture2DProj(tDiffuse,projected).rgb;
        gl_FragColor=vec4(reflected*vec3(.97,.99,1.0),alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  };
  const planar=new Reflector(planarGeometry,{textureWidth:512,textureHeight:512,clipBias:.0008,multisample:0,shader:planarShader});
  planar.name='Bounded main-road planar rainwater reflection';planar.rotation.x=-Math.PI/2;planar.position.set(0,.0545,-32.5);
  planar.material.transparent=true;planar.material.depthWrite=false;planar.material.depthTest=true;
  planar.renderOrder=2;planar.frustumCulled=false;root.add(planar);ripples.renderOrder=3;
  const filmTime=planar.material.uniforms.rainFilmTime;
  const filmEnabled=planar.material.uniforms.rainPlanarEnabled;
  const nativePlanarRender=planar.onBeforeRender;
  function cameraChanged(camera){
    return !planarLastCapture||camera.position.distanceToSquared(planarPosition)>.000625||
      Math.abs(camera.quaternion.dot(planarQuaternion))<.9999955||camera.fov!==planarLastCapture.fov||camera.aspect!==planarLastCapture.aspect;
  }
  planar.onBeforeRender=function(activeRenderer,activeScene,camera){
    filmEnabled.value=0;
    // Camera identity excludes cube faces, PMREM passes and the reflector's
    // own cloned camera. Merely being a PerspectiveCamera is insufficient.
    if(weather!=='rain'||!renderer||camera!==mainCamera||planarCapturing)return;
    const now=performance.now(),changed=cameraChanged(camera);
    // Signals and gently moving flags also change while the player stands
    // still. A bounded 2Hz refresh prevents their reflections freezing until
    // the next camera movement; walking updates remain capped at 4Hz.
    if(changed||(planarReady&&now-planarLastWallTime>=500))planarDirty=true;
    const majorJump=!planarLastCapture||camera.position.distanceToSquared(planarPosition)>1.0||
      (planarLastCapture&&Math.abs(camera.quaternion.dot(planarQuaternion))<.985);
    const mayCapture=planarDirty&&(!planarReady||majorJump||now-planarLastWallTime>=250);
    if(mayCapture){
      const oldTarget=activeRenderer.getRenderTarget(),oldXr=activeRenderer.xr.enabled;
      const oldShadowAuto=activeRenderer.shadowMap.autoUpdate,oldVisible=root.visible;
      const oldViewport=activeRenderer.getViewport(new THREE.Vector4());
      planarCapturing=true;
      try{
        // Hide droplets/rings as well as this plane in the offscreen pass;
        // a cached photograph of a falling streak would freeze in the water.
        root.visible=false;
        nativePlanarRender.call(planar,activeRenderer,activeScene,camera);
        planarReady=true;planarDirty=false;planarCaptureCount++;planarLastWallTime=performance.now();
        planarPosition.copy(camera.position);planarQuaternion.copy(camera.quaternion);
        planarLastCapture={weather,timeOfDay,captureCount:planarCaptureCount,timestampMs:planarLastWallTime,
          cameraUuid:camera.uuid,cameraType:camera.type,position:camera.position.toArray(),quaternion:camera.quaternion.toArray(),fov:camera.fov,aspect:camera.aspect,succeeded:true};
      }catch(error){
        planarReady=false;planarDirty=true;
        planarLastCapture={weather,timeOfDay,captureCount:planarCaptureCount,timestampMs:performance.now(),succeeded:false};
        console.warn('Planar rainwater reflection kept its subdued environment fallback.',error);
      }finally{
        root.visible=oldVisible;planar.visible=true;activeRenderer.xr.enabled=oldXr;
        activeRenderer.shadowMap.autoUpdate=oldShadowAuto;activeRenderer.setRenderTarget(oldTarget);activeRenderer.setViewport(oldViewport);
        planarCapturing=false;
      }
    }
    filmEnabled.value=planarReady?1:0;
  };

  const target=renderer?new THREE.WebGLCubeRenderTarget(128,{type:THREE.UnsignedByteType,generateMipmaps:false,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter}):null;
  const probe=target?new THREE.CubeCamera(.12,110,target):null;
  if(probe){probe.position.set(...reflectionPosition);probe.name='Cached rainy-road neighbourhood reflection';}
  const pmrem=renderer?new THREE.PMREMGenerator(renderer):null;
  function refreshReflection(){
    if(weather!=='rain'||!renderer||!probe||!pmrem)return;
    const key='rain-'+timeOfDay;
    if(reflections.has(key)){setSurfaceRainEnvironment(reflections.get(key).texture);return;}
    const oldTarget=renderer.getRenderTarget(),oldXr=renderer.xr.enabled,oldShadowAuto=renderer.shadowMap.autoUpdate,wasVisible=root.visible;
    const pooled=[];let next=null;reflectionPending=true;
    try{
      root.visible=false;setSurfaceRainEnvironment(null);
      scene.traverse(object=>{if(object.isLight&&object.userData?.retailPooled){pooled.push({object,intensity:object.intensity});object.intensity=0;}});
      renderer.xr.enabled=false;renderer.shadowMap.autoUpdate=false;
      // Six offscreen faces only when a rainy time is first requested. There
      // is no capture inside update(), and no per-frame render target growth.
      probe.update(renderer,scene);next=pmrem.fromCubemap(target.texture);
      reflections.set(key,next);setSurfaceRainEnvironment(next.texture);
      lastCapture={key,succeeded:true,pooledLightCount:pooled.length};
    }catch(error){
      next?.dispose();setSurfaceRainEnvironment(reflections.get(key)?.texture??null);
      lastCapture={key,succeeded:false,pooledLightCount:pooled.length};
      console.warn('Rainy street kept its overcast environment reflection fallback.',error);
    }finally{
      for(const {object,intensity} of pooled)object.intensity=intensity;
      root.visible=wasVisible;renderer.xr.enabled=oldXr;renderer.shadowMap.autoUpdate=oldShadowAuto;renderer.setRenderTarget(oldTarget);renderer.shadowMap.needsUpdate=true;reflectionPending=false;
    }
  }
  function setWeather(mode){
    const next=mode==='rain'?'rain':'clear';
    if(next!==weather){planarDirty=next==='rain';planarReady=false;}
    weather=next;root.visible=weather==='rain';setSurfaceRainAmount(weather==='rain'?1:0);
    if(weather==='rain')refreshReflection();
  }
  function setTime(mode){const next=mode==='evening'?'evening':'day';if(next!==timeOfDay){planarDirty=weather==='rain';planarReady=false;}timeOfDay=next;rainMaterial.opacity=timeOfDay==='evening'?.18:.24;if(weather==='rain')refreshReflection();}
  function update(dt,camera,breeze={x:.10,z:.035}){
    time+=Math.min(Math.max(Number.isFinite(dt)?dt:0,0),.25);rippleTime.value=time;filmTime.value=time;
    if(camera)mainCamera=camera;
    if(weather!=='rain'||!camera)return;
    const windX=Number.isFinite(breeze?.x)?breeze.x:.10,windZ=Number.isFinite(breeze?.z)?breeze.z:.035;
    rainSeeds.forEach((seed,i)=>{
      const x=camera.position.x+seed.x,z=camera.position.z+seed.z,offset=i*6;
      if(!inRoad(x,z)){rainPositions.fill(0,offset,offset+6);return;}
      const phase=((seed.phase-time*seed.speed/8.2)%1+1)%1,y=.06+phase*8.2;
      rainPositions.set([x,y,z,x-windX*.28,y+seed.length,z-windZ*.28],offset);
    });
    rainGeometry.attributes.position.needsUpdate=true;
    if(dripGeometry){
      const coordinates=dripGeometry.attributes.position.array;
      dripEmitters.forEach((source,i)=>{for(let j=0;j<3;j++){
        const phase=((time*.78+i*.173+j/3)%1+1)%1,height=source.y-source.groundY;
        const y=source.y-height*phase*phase,x=source.x+windX*.08*phase,z=source.z+windZ*.08*phase;
        coordinates.set([x,y,z,x,Math.min(source.y,y+.055),z],(i*3+j)*6);
      }});
      dripGeometry.attributes.position.needsUpdate=true;
    }
  }
  function getSnapshot(){return {weather,timeOfDay,reflectionPending,reflectionReady:weather!=='rain'||reflections.has('rain-'+timeOfDay),cachedModes:[...reflections.keys()].sort(),lastCapture:lastCapture?{...lastCapture}:null,probeResolution:128,probePosition:[...reflectionPosition],surface:getSurfaceRainSnapshot(),planarRequired:weather==='rain',planarReady,planarPending:weather==='rain'&&(planarDirty||planarCapturing),planarCaptureCount,planarLastCapture:planarLastCapture?{...planarLastCapture,position:planarLastCapture.position?[...planarLastCapture.position]:undefined,quaternion:planarLastCapture.quaternion?[...planarLastCapture.quaternion]:undefined}:null,planar:{resolution:[512,512],multisample:0,extent:[5.68,111],position:[0,.0545,-32.5],maxWalkUpdatesHz:4,maxStationaryUpdatesHz:2,cachePolicy:'First valid main render, weather/time change and large viewpoint jumps immediately; walking at most4Hz and stationary animation at most2Hz.',mainCameraUuid:mainCamera?.uuid??null},drizzleSegments:rainCount,rippleInstances:rippleCount,dripEmitters:dripEmitters.map(s=>({...s})),activeDrawCalls:weather==='rain'?(dripEmitters.length?4:3):0,limits:'One bounded cached planar film on the main road, no SSR/fullscreen pass; other roads use subdued static cube fallback. Reflected animation uses a bounded 2Hz stationary /4Hz moving cache, not full hydrology.'};}
  function dispose(){root.removeFromParent();rainGeometry.dispose();rainMaterial.dispose();rippleGeometry.dispose();rippleMaterial.dispose();dripGeometry?.dispose();dripMaterial.dispose();planarGeometry.dispose();planar.dispose();for(const map of reflections.values())map.dispose();target?.dispose();pmrem?.dispose();setSurfaceRainAmount(0);setSurfaceRainEnvironment(null);}
  return {setWeather,setTime,refreshReflection,setDripEmitters,update,getSnapshot,dispose};
}
