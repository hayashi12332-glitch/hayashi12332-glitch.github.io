// A lightweight, static approximation of sky visibility under the shophouses.
// Only indirect light is reduced: sunlight, shop lamps and emissive signs remain.
// This avoids a full-screen ambient-occlusion pass on mobile devices.
const fragment=/* glsl */`
varying vec3 vShelterWorld;
float shelterBox(vec3 p, vec3 low, vec3 high) {
  vec3 enter=smoothstep(low-vec3(.08),low+vec3(.08),p);
  vec3 leave=1.0-smoothstep(high-vec3(.08),high+vec3(.08),p);
  return enter.x*enter.y*enter.z*leave.x*leave.y*leave.z;
}
float skyVisibility(vec3 p, vec3 worldNormal) {
  float west=shelterBox(p,vec3(-8.1,-.1,-11.15),vec3(-3.38,3.31,14.52));
  float westDepth=1.0-smoothstep(-7.7,-3.38,p.x);
  float pharmacy=shelterBox(p,vec3(3.14,-.1,-11.02),vec3(7.85,3.31,-5.38));
  float pharmacyDepth=smoothstep(3.14,7.6,p.x);
  float breakfast=shelterBox(p,vec3(4.54,-.1,9.03),vec3(9.5,3.31,14.57));
  float breakfastDepth=smoothstep(4.54,9.25,p.x);
  float store=shelterBox(p,vec3(3.12,-.1,-3.81),vec3(10.62,3.28,6.20));
  float storeDepth=min(smoothstep(3.12,7.8,p.x),1.0-smoothstep(1.5,6.2,p.z));
  // The occupied shops across 長和路 share a recessed, covered frontage.
  // Two bands leave the continuation of 榕安街 fully open to the sky.
  float northWest=shelterBox(p,vec3(-28.1,-.1,-25.61),vec3(-4.0,3.26,-20.99));
  float northEast=shelterBox(p,vec3(4.0,-.1,-25.61),vec3(27.95,3.26,-20.99));
  float north=max(northWest,northEast);
  float northDepth=1.0-smoothstep(-25.4,-21.0,p.z);
  float covered=max(max(west,pharmacy),max(breakfast,store));
  covered=max(covered,north);
  float visibility=1.0;
  visibility=min(visibility,1.0-west*mix(.26,.75,westDepth));
  visibility=min(visibility,1.0-pharmacy*mix(.26,.75,pharmacyDepth));
  visibility=min(visibility,1.0-breakfast*mix(.26,.75,breakfastDepth));
  visibility=min(visibility,1.0-store*mix(.23,.66,storeDepth));
  visibility=min(visibility,1.0-north*mix(.25,.70,northDepth));
  // The roof sees much less of the sky than the floor facing the open street.
  // Downward-facing undersides retain bounce light; they are never painted black.
  float underside=smoothstep(.25,.85,-worldNormal.y);
  float vertical=1.0-abs(worldNormal.y);
  float floorJunction=(1.0-smoothstep(.14,.43,p.y))*vertical;
  float ceilingJunction=smoothstep(2.84,3.13,p.y)*vertical;
  float contact=1.0-covered*(.22*floorJunction+.12*ceilingJunction);
  visibility*=mix(1.0,.60,covered*underside)*contact;
  return max(.12,visibility);
}
`;

export function applyShelterOcclusion(scene){
  const seen=new Set();
  scene.traverse(object=>{
    if(!object.isMesh)return;
    for(const material of Array.isArray(object.material)?object.material:[object.material]){
      if(!material?.isMeshStandardMaterial||seen.has(material)||material.userData.shelterOcclusion)continue;
      seen.add(material);material.userData.shelterOcclusion=true;
      const previousCompile=material.onBeforeCompile;
      const previousKey=material.customProgramCacheKey();
      material.onBeforeCompile=function(shader,renderer){
        previousCompile.call(this,shader,renderer);
        shader.vertexShader='varying vec3 vShelterWorld;\n'+shader.vertexShader;
        shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',/* glsl */`
          #include <project_vertex>
          vec4 shelterPosition=vec4(transformed,1.0);
          #ifdef USE_BATCHING
            shelterPosition=batchingMatrix*shelterPosition;
          #endif
          #ifdef USE_INSTANCING
            shelterPosition=instanceMatrix*shelterPosition;
          #endif
          vShelterWorld=(modelMatrix*shelterPosition).xyz;
        `);
        shader.fragmentShader=fragment+shader.fragmentShader;
        shader.fragmentShader=shader.fragmentShader.replace('#include <aomap_fragment>',/* glsl */`
          #include <aomap_fragment>
          vec3 shelterNormal=inverseTransformDirection(normal,viewMatrix);
          float shelterVisibility=skyVisibility(vShelterWorld,shelterNormal);
          reflectedLight.indirectDiffuse*=shelterVisibility;
          reflectedLight.indirectSpecular*=mix(.60,1.0,shelterVisibility);
        `);
      };
      material.customProgramCacheKey=()=>previousKey+'|taiwan-shelter-v5';
      material.needsUpdate=true;
    }
  });
}
