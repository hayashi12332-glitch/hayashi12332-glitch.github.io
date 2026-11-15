import * as THREE from 'three';
import {Sky} from 'three/addons/objects/Sky.js';
import {createOrganicClouds} from './organic-clouds.js';

// Sky and PMREM follow the MIT-licensed Three.js r180 Sky example.
// One direction drives the visible sun, reflected sky and directional shadows.
export function createDaylight(scene,renderer,lights){
  const clouds=createOrganicClouds(scene);
  const sky=new Sky();sky.scale.setScalar(10000);sky.name='Outdoor daylight sky';scene.add(sky);
  const reflectionScene=new THREE.Scene();const reflectionSky=new Sky();reflectionSky.scale.setScalar(10000);reflectionScene.add(reflectionSky);
  const pmrem=new THREE.PMREMGenerator(renderer);const environments=new Map();
  let timeOfDay='day',weather='clear';
  const cloudRoot=scene.getObjectByName('Slow high clouds');
  const baseShadowRadius=lights.sun.shadow.radius;
  // A broad, low-contrast cloud deck replaces the sun disc in rain. Its
  // restrained variation is procedural and is also captured by the sky PMREM.
  const rainSkyMaterial=new THREE.ShaderMaterial({
    uniforms:{horizon:{value:new THREE.Color('#bcc7c9')},zenith:{value:new THREE.Color('#85979d')}},
    vertexShader:`varying vec3 vRainSkyDirection; void main(){vRainSkyDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);gl_Position.z=gl_Position.w;}`,
    fragmentShader:`
      uniform vec3 horizon; uniform vec3 zenith; varying vec3 vRainSkyDirection;
      void main(){
        vec3 d=normalize(vRainSkyDirection);
        float veil=sin(d.x*5.2+d.z*2.4)*sin(d.z*4.1-d.y*3.7)+.35*sin(d.x*11.0+d.y*8.2);
        vec3 cloud=mix(horizon,zenith,smoothstep(-.05,.88,d.y));
        gl_FragColor=vec4(cloud*(1.0+veil*.035),1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    side:THREE.BackSide,depthWrite:false,fog:false,
  });
  const rainSkyGeometry=new THREE.SphereGeometry(9900,24,12);
  const rainSky=new THREE.Mesh(rainSkyGeometry,rainSkyMaterial);rainSky.name='Overcast rain cloud deck';rainSky.renderOrder=-1000;rainSky.visible=false;scene.add(rainSky);
  const reflectionRainSky=new THREE.Mesh(rainSkyGeometry,rainSkyMaterial);reflectionRainSky.visible=false;reflectionScene.add(reflectionRainSky);
  const direction=new THREE.Vector3();
  const shadowAnchor=new THREE.Vector3(0,2,-2);
  lights.sun.target.position.set(0,2,-2);scene.add(lights.sun.target);
  Object.assign(lights.sun.shadow.camera,{left:-38,right:38,top:35,bottom:-35,near:.5,far:150});lights.sun.shadow.camera.updateProjectionMatrix();
  // Keep contact shadows close to thin shop hardware; the world is measured in metres.
  lights.sun.shadow.normalBias=.018;lights.sun.shadow.bias=-.000075;
  function setTime(mode){
    timeOfDay=mode==='evening'?'evening':'day';
    mode=timeOfDay;
    clouds.setTime(mode);
    const evening=mode==='evening';
    const raining=weather==='rain';
    sky.visible=reflectionSky.visible=!raining;
    rainSky.visible=reflectionRainSky.visible=raining;
    if(cloudRoot)cloudRoot.visible=!raining;
    rainSkyMaterial.uniforms.horizon.value.set(evening?'#8b9498':'#bcc7c9');
    rainSkyMaterial.uniforms.zenith.value.set(evening?'#55636e':'#85979d');
    // A clear, late-morning / early-afternoon summer light study at Taipei's
    // latitude, not a claim to reproduce the weather or time of a source photo.
    const elevation=evening?10:66,azimuth=evening?-70:-48;
    direction.setFromSphericalCoords(1,THREE.MathUtils.degToRad(90-elevation),THREE.MathUtils.degToRad(azimuth));
    for(const item of [sky,reflectionSky]){
      const uniforms=item.material.uniforms;
      uniforms.turbidity.value=evening?6.0:3.8;
      uniforms.rayleigh.value=evening?2.6:1.8;
      uniforms.mieCoefficient.value=.004;
      uniforms.mieDirectionalG.value=.78;
      uniforms.sunPosition.value.copy(direction);
    }
    scene.background=null;
    // Air perspective belongs in the distance; keep near facades and their
    // actual paint colours readable instead of lifting the whole street to grey.
    scene.fog=new THREE.Fog(evening?0xc3aaa0:0xcfd9dd,58,145);
    lights.sun.position.copy(direction).multiplyScalar(65).add(lights.sun.target.position);
    lights.sun.color.set(evening?0xffc18b:0xfff6eb);lights.sun.intensity=evening?1.65:4.0;
    // A stronger shaft of sun and restrained sky bounce leave the recessed
    // arcades and lanes in deeper shadow without hiding their lit shop signs.
    lights.ambient.color.set(evening?0xc3c7cf:0xd6dddf);
    lights.ambient.groundColor.set(evening?0x90745e:0xb3a08a);
    // An open street still sees a broad sky after direct sunlight has become
    // low. Shelter occlusion separately reduces this term under the arcade;
    // recovering the road's lowest tones does not require raising exposure.
    lights.ambient.intensity=evening?.54:.40;
    // A restrained opposing fill suggests reflected light without removing
    // the contrast under the arcade and deeper shop recesses.
    if(lights.fill){lights.fill.color.set(evening?0xffd0a2:0xf4e0c6);lights.fill.intensity=evening?.055:.06;}
    lights.sun.shadow.radius=baseShadowRadius;
    if(raining){
      // The cloud deck supplies most of the light. Keep a weak directional
      // term for contact shape; the existing arcade occlusion still applies.
      scene.fog=new THREE.Fog(evening?0x7e898e:0xa6b2b6,46,115);
      lights.sun.color.set(evening?0xd5d6cf:0xe0e7e6);
      lights.sun.intensity=evening?.20:.45;
      lights.sun.shadow.radius=3.5;
      lights.ambient.color.set(evening?0xa7b4c2:0xcbd7dc);
      lights.ambient.groundColor.set(evening?0x686a68:0x959a94);
      lights.ambient.intensity=evening?.48:.78;
      if(lights.fill){lights.fill.color.set(evening?0xb9c5cb:0xd1dce0);lights.fill.intensity=evening?.02:.035;}
    }
    const environmentKey=mode+'-'+weather;
    if(!environments.has(environmentKey))environments.set(environmentKey,pmrem.fromScene(reflectionScene,.035));
    scene.environment=environments.get(environmentKey).texture;
    scene.environmentIntensity=evening?.14:.18;
    renderer.toneMappingExposure=evening?.86:.88;
    if(raining){scene.environmentIntensity=evening?.18:.30;renderer.toneMappingExposure=evening?.81:.93;}
    renderer.shadowMap.needsUpdate=true;
  }
  setTime('day');
  function update(dt,camera){
    clouds.update(dt);
    if(!camera)return;
    // Keep the existing shadow resolution over the visited neighbourhood.
    // The northern stores were outside the old origin-centred atlas, allowing
    // direct sun to light their stock through the roof. Snap the anchor in
    // modest steps so a shop retains stable contact shadows while inspected.
    const x=Math.round(camera.position.x/12)*12,z=Math.round(camera.position.z/12)*12;
    if(Math.hypot(x-shadowAnchor.x,z-shadowAnchor.z)<8)return;
    shadowAnchor.set(x,2,z);
    lights.sun.target.position.copy(shadowAnchor);
    lights.sun.position.copy(direction).multiplyScalar(65).add(shadowAnchor);
    renderer.shadowMap.needsUpdate=true;
  }
  function setWeather(mode){const next=mode==='rain'?'rain':'clear';if(next===weather)return;weather=next;setTime(timeOfDay);}
  function getSnapshot(){return {timeOfDay,weather,environmentKey:timeOfDay+'-'+weather,cachedEnvironmentModes:[...environments.keys()].sort(),sunIntensity:lights.sun.intensity,skyIntensity:lights.ambient.intensity,environmentIntensity:scene.environmentIntensity,exposure:renderer.toneMappingExposure};}
  return {setTime,setWeather,update,getSnapshot};
}
