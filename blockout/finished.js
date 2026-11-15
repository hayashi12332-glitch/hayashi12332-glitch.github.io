import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {ASSETS} from '../src/state.js';
import {buildWorld} from '../src/world.js';
import {loadSignFont} from '../src/typography.js';
import {refinePropPrototype} from '../src/props.js';
import {attachCuttingBoard} from '../src/cutting-board.js';
import {WOODEN_CUTTING_BOARD_URL} from '../src/optional-assets.js';
import {loadBuildingDetails} from '../src/building-details.js';
import {buildTraffic} from '../src/traffic.js';
import {createDaylight} from '../src/daylight.js';
import {createWind} from '../src/wind.js';
import {createAtmosphere} from '../src/atmosphere.js';
import {addCondensation} from '../src/condensation.js';
import {applyShelterOcclusion} from '../src/shelter.js';
import {createStreetSignage} from '../src/signage.js';
import {addCivicFacilities} from './civic-facilities.js';
import {addNeighborhoodPark} from './neighborhood-park.js';
import {addTransportServices} from './transport-services.js';
import {addSouthernBackdrop} from './southern-backdrop.js';
import {addFrontageLife} from './frontage-life.js';
import {addResidentHome} from './resident-home.js';
import {addBreakfastLife} from './breakfast-life.js';
import {addResidentRoutes} from './resident-routes.js';
import {addGirlHome} from './girl-home.js';
import {addResidentSchool} from './resident-school.js';
import {createScooterFactory} from './scooter-model.js';
import {createExemplarGlazing} from '../src/exemplar-glazing.js';
import {createRainWeather} from '../src/rain-weather.js';
import {createRainStreetDetails} from '../src/rain-street-details.js';
import {createRainFestivalDetails} from '../src/rain-festival-details.js';
import {createRainRoadDetails} from '../src/rain-road-details.js';
import {loadRainVehicle} from '../src/rain-vehicle.js';

/** Build the existing finished street in its own scene.
 *
 * It shares the original metre-based coordinates and asset files, but it never
 * reads or writes the editor's saved layout. The existing street's placements
 * are a fixed example; a failed optional asset leaves the other parts usable.
 * `ready` resolves when the colliders and models have finished loading.
 */
export function createFinished(scene, renderer) {
  const colliders = [];
  const groundColliders = [];
  const warnings = [];
  const assets = {loaded: [], failed: [], woodenBoard: false, buildingDetails: false, wheelchair: false, scooter: false, rainVehicle:false};
  let world = null, traffic = null, daylight = null, wind = null, steam = null, details = null;
  let civic = null, park = null, transport = null, backdrop = null, communitySigns = null;
  let residentHome = null, girlHome = null, breakfast = null, residentRoutes = null, school = null;
  let glazing = null;
  let rainWeather=null,rainStreet=null,rainFestival=null,rainRoad=null,rainVehicle=null;
  let weatherMode='clear';
  let timeOfDay = 'day', viewMode = 'walk';

  // r187's Sky and PMREM output more radiance than r180's gamma-compressed
  // sky. Retune only this independent scene, preserving sunlight/exposure
  // and the darker arcade instead of washing it out with blue sky bounce.
  function tuneFinishedLighting() {
    if (!daylight || !world) return;
    if(weatherMode==='clear')scene.environmentIntensity = timeOfDay === 'evening' ? .12 : .03;
    // PCFShadowMap in r187 benefits from a small extra receiver offset;
    // this suppresses diagonal self-shadow stripes on thin facade details.
    world.lights.sun.shadow.normalBias = .04;
    if (renderer) renderer.shadowMap.needsUpdate = true;
  }

  const result = {
    scene, colliders, groundColliders, warnings, assets,
    bounds: null,
    floorHeight: (x, z) => world?.floorHeight(x, z) ?? .015,
    setViewMode(mode) { viewMode = mode; world?.setViewMode(mode); },
    setTime(mode) {
      timeOfDay = mode === 'evening' ? 'evening' : 'day';
      world?.setTime(timeOfDay);
      daylight?.setTime(timeOfDay);
      civic?.setTime(timeOfDay);
      park?.setTime(timeOfDay);
      transport?.setTime(timeOfDay);
      backdrop?.setTime?.(timeOfDay);
      residentHome?.setTime?.(timeOfDay);
      girlHome?.setTime?.(timeOfDay);
      breakfast?.setTime?.(timeOfDay);
      school?.setTime?.(timeOfDay);
      rainFestival?.setTime(timeOfDay);
      tuneFinishedLighting();
      rainWeather?.setTime(timeOfDay);
      glazing?.refresh(weatherMode==='clear'?timeOfDay:timeOfDay+'-rain');
    },
    setWeather(mode){
      weatherMode=mode==='rain'?'rain':'clear';
      world?.setTime(timeOfDay);
      daylight?.setWeather(weatherMode);
      // setTime is needed even when a caller repeats the current weather:
      // the world lighting update above must not replace its overcast setup.
      daylight?.setTime(timeOfDay);
      rainStreet?.setWeather(weatherMode);
      tuneFinishedLighting();
      rainWeather?.setWeather(weatherMode);
      world?.setBackdropWeather?.(weatherMode);
      glazing?.refresh(weatherMode==='clear'?timeOfDay:timeOfDay+'-rain');
    },
    getRainStreetSnapshot(){
      return {weather:rainWeather?.getSnapshot()??{weather:weatherMode,reflectionReady:true,reflectionPending:false},daylight:daylight?.getSnapshot()??null,storefront:rainStreet?.getSnapshot()??null,storefrontGeometry:rainStreet?.diagnostics??null,festival:rainFestival?.diagnostics??null,road:rainRoad?.getSnapshot()??null,vehicle:rainVehicle?.getSnapshot()??null,peopleAdded:0};
    },
    update(dt, camera) {
      if (!world) return;
      wind?.update(dt);
      const breeze = wind?.sample();
      rainWeather?.update(dt,camera,breeze);
      rainStreet?.update(dt);
      rainFestival?.update(dt,breeze);
      steam?.update(dt, camera, breeze);
      civic?.update(dt, breeze, camera);
      park?.update(dt, breeze, camera);
      transport?.update?.(dt, breeze, camera);
      backdrop?.update?.(dt, breeze, camera);
      residentHome?.update?.(dt, breeze, camera);
      girlHome?.update?.(dt, breeze, camera);
      breakfast?.update?.(dt, breeze, camera);
      school?.update?.(dt, breeze, camera);
      traffic?.update(dt);
      daylight?.update(dt,camera);
      world.retailLighting.update(camera, dt);
      if (details?.update(camera) && renderer) renderer.shadowMap.needsUpdate = true;
    },
    getCommunitySnapshot() {
      return {places:civic?.places ?? [], park:park?.getSnapshot() ?? null,
        transport:transport?.stats ?? null, backdrop:backdrop?.stats ?? null,
        residentHome:residentHome?.stats ?? null, girlHome:girlHome?.stats ?? null,
        residentRoutes:residentRoutes?.stats ?? null, school:school?.stats ?? null,
        signage:communitySigns};
    },
    ready: null,
  };

  const failure = (name, error) => {
    warnings.push(`${name}: ${error?.message ?? error}`);
    assets.failed.push(name);
    console.warn(`Finished street: ${name} could not be loaded.`, error);
  };

  result.ready = (async () => {
    await loadSignFont();
    const loader = new GLTFLoader();
    let scooterFactory = null;
    try {
      const scooter = await loader.loadAsync('/assets/vendor/urban_motor_scooter_lite/model.glb');
      scooterFactory = createScooterFactory(scooter.scene);
      assets.scooter = true;
    } catch (error) { failure('scooter', error); }
    world = buildWorld(scene,{southCurbGaps:[{center:6.35,width:2.72}],openNorthExit:true,scooterFactory,rainStreetFinish:true});
    rainStreet=createRainStreetDetails(scene);
    rainFestival=createRainFestivalDetails(scene);
    rainRoad=createRainRoadDetails(scene);
    colliders.push(...rainStreet.colliders);
    // The independent street continues south to the homes and north to the
    // school; the r180 world's bounds and backdrop remain unchanged.
    result.bounds = {...world.bounds, minX:-38, maxX:38, minZ:-114, maxZ:33};
    colliders.push(...world.colliders);
    groundColliders.push(...world.groundColliders);
    const sharedSigns=createStreetSignage(scene);
    civic=addCivicFacilities(scene,{signage:sharedSigns});
    park=addNeighborhoodPark(scene,{signage:sharedSigns});
    transport=addTransportServices(scene,{signage:sharedSigns,scooterFactory});
    backdrop=addSouthernBackdrop(scene,{signage:sharedSigns});
    residentHome=addResidentHome(scene);
    girlHome=addGirlHome(scene,{signage:sharedSigns});
    breakfast=addBreakfastLife(scene,{signage:sharedSigns});
    residentRoutes=addResidentRoutes(scene,{signage:sharedSigns});
    school=addResidentSchool(scene,{signage:sharedSigns});
    const frontage=addFrontageLife(scene);
    colliders.push(...frontage.colliders);
    communitySigns=sharedSigns.finalize();
    for(const part of [civic,park,transport,backdrop,residentHome,girlHome,breakfast,residentRoutes,school]){
      colliders.push(...(part.colliders??[]));
      groundColliders.push(...(part.groundColliders??[]));
      part.setTime?.(timeOfDay);
    }
    world.setViewMode(viewMode);
    world.setTime(timeOfDay);
    traffic = buildTraffic(scene, world.floorHeight);
    colliders.push(...traffic.colliders);
    wind = createWind(scene);
    steam = createAtmosphere(scene);
    steam.sync(world.placements);
    addCondensation(scene);
    if (renderer) {
      if (window.innerWidth < 600) world.lights.sun.shadow.mapSize.set(1024, 1024);
      // Preparing the finished scene runs in the background while the white
      // model remains visible. Sky setup changes the shared renderer exposure;
      // restore it here so the draft does not unexpectedly darken while the
      // optional models download. The controller sets it when changing scenes.
      const previousExposure = renderer.toneMappingExposure;
      daylight = createDaylight(scene, renderer, world.lights);
      daylight.setTime(timeOfDay);
      tuneFinishedLighting();
      renderer.toneMappingExposure = previousExposure;
    }

    const prototypes = new Map();
    const jobs = Object.entries(ASSETS).map(async ([kind, asset]) => {
      try {
        const gltf = await loader.loadAsync(`/assets/${asset.file}`);
        refinePropPrototype(gltf.scene, kind);
        gltf.scene.traverse(node => {
          if (node.isMesh) { node.castShadow = true; node.receiveShadow = true; }
        });
        prototypes.set(kind, gltf.scene);
        assets.loaded.push(kind);
      } catch (error) { failure(kind, error); }
    });
    const boardJob = WOODEN_CUTTING_BOARD_URL
      ? loader.loadAsync(WOODEN_CUTTING_BOARD_URL).then(gltf => gltf.scene)
        .catch(error => { failure('woodenBoard', error); return null; })
      : Promise.resolve(null);
    const detailJob = loadBuildingDetails(scene, loader)
      .then(value => { details = value; assets.buildingDetails = true; colliders.push(...value.colliders); })
      .catch(error => failure('buildingDetails', error));
    // The CC0 wheelchair is an optional vendored asset; its absence must not
    // prevent the rest of the street from loading. Keep it in the clinic's
    // right-hand waiting area, clear of the entrance and registration desk.
    const wheelchairJob = loader.loadAsync('/assets/vendor/wheelchair_01_lite/model.glb')
      .then(gltf => gltf.scene)
      .catch(error => { failure('wheelchair', error); return null; });
    const rainVehicleJob=loadRainVehicle(scene,loader).then(value=>{rainVehicle=value;assets.rainVehicle=true;colliders.push(...value.colliders);}).catch(error=>failure('rainVehicle',error));
    const [, board, , wheelchair] = await Promise.all([Promise.all(jobs), boardJob, detailJob, wheelchairJob,rainVehicleJob]);

    if (wheelchair) {
      try {
        wheelchair.name = 'Clinic wheelchair';
        wheelchair.rotation.y = Math.PI;
        wheelchair.updateMatrixWorld(true);
        const bounds = new THREE.Box3().setFromObject(wheelchair);
        if (bounds.isEmpty()) throw new Error('Wheelchair has no visible geometry');
        const center = bounds.getCenter(new THREE.Vector3());
        wheelchair.position.set(-20.1-center.x, .20-bounds.min.y, 25.2-center.z);
        wheelchair.traverse(node => {
          if (node.isMesh) { node.castShadow = true; node.receiveShadow = true; }
        });
        scene.add(wheelchair);
        wheelchair.updateMatrixWorld(true);
        const finalBounds = new THREE.Box3().setFromObject(wheelchair);
        const size = finalBounds.getSize(new THREE.Vector3());
        const finalCenter = finalBounds.getCenter(new THREE.Vector3());
        colliders.push({position:finalCenter.toArray(), size:size.toArray()});
        assets.wheelchair = true;
      } catch (error) { failure('wheelchair', error); }
    }

    if(board){
      try { residentHome.attachBoard(board); }
      catch(error) { failure('residentHomeBoard',error); }
    }
    if (board && prototypes.has('stall')) {
      try { attachCuttingBoard(prototypes.get('stall'), board); assets.woodenBoard = true; }
      catch (error) { failure('woodenBoard', error); }
    }
    for (const placement of world.placements) {
      const prototype = prototypes.get(placement.kind);
      if (!prototype) continue;
      const instance = prototype.clone(true);
      instance.position.set(placement.x, placement.y, placement.z);
      instance.rotation.y = placement.rotation;
      instance.name = `Example prop: ${placement.kind}`;
      scene.add(instance);
      const size = ASSETS[placement.kind].size;
      colliders.push({position:[placement.x, placement.y + size[1] / 2, placement.z], size, rotation:placement.rotation});
    }
    applyShelterOcclusion(scene);
    glazing = createExemplarGlazing(scene, renderer);
    rainWeather=createRainWeather(scene,renderer);
    rainWeather.setTime(timeOfDay);
    rainWeather.setWeather(weatherMode);
    if (renderer) renderer.shadowMap.needsUpdate = true;
    return {warnings: [...warnings], assets: {...assets, loaded:[...assets.loaded], failed:[...assets.failed]}};
  })();

  return result;
}
