import * as THREE from 'three';

// Pailou (牌樓) gate arches closing the two east-west roads at their
// west ends (POLICY_MUSE_JA.md section 8, 2026-11-15; research
// candidate 4). The z=17.2 road passes the 榕安宮 temple, so its arch
// is the temple's gate in the temple palette. The z=-16.5 cross
// street gets a plainer stone street arch with two hazy facade
// silhouettes behind it, so the road reads as continuing into a
// further neighbourhood. Four pillars, three openings, two roof
// tiers in the shrine's tiled idiom; the openings stay walkable —
// only the pillars carry colliders.

export function addStreetArches(root, { solid, addSign } = {}) {
  const group = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({ color: '#9a958a', roughness: .95 });
  const stoneDark = new THREE.MeshStandardMaterial({ color: '#7b766b', roughness: .95 });
  const templeRed = new THREE.MeshStandardMaterial({ color: '#923c31', roughness: .85 });
  const woodDark = new THREE.MeshStandardMaterial({ color: '#4c3a28', roughness: .9 });
  const tile = new THREE.MeshStandardMaterial({ color: '#43585a', roughness: .88 });
  const tileStreet = new THREE.MeshStandardMaterial({ color: '#5f6e6a', roughness: .88 });
  const gold = new THREE.MeshStandardMaterial({ color: '#c99635', roughness: .55, metalness: .3 });

  const cube = new THREE.BoxGeometry(1, 1, 1);
  const add = (mat, x, y, z, w, h, d, rz = 0) => {
    const mesh = new THREE.Mesh(cube, mat);
    mesh.position.set(x, y, z); mesh.scale.set(w, h, d);
    mesh.rotation.z = rz;
    mesh.castShadow = true; mesh.receiveShadow = true;
    group.add(mesh); return mesh;
  };

  // One arch centred at (ax, cz), spanning z, road running along x.
  const arch = ({ ax, cz, pillarMat, beamMat, roofMat, signText, signDetail, signBg, signFg }) => {
    for (const pz of [-4.6, -2.0, 2.0, 4.6]) {
      add(pillarMat, ax, 2.7, cz + pz, .5, 5.4, .5);
      add(stoneDark, ax, .25, cz + pz, .78, .5, .78);
      add(pillarMat, ax, 5.5, cz + pz, .62, .22, .62);
      if (solid) solid(ax, 2.7, cz + pz, .55, 5.4, .55);
    }
    // Beams: a top beam across all pillars, a mid beam over the
    // centre opening (4.1 m clearance), short beams over side spans.
    add(beamMat, ax, 5.05, cz, .34, .42, 10.6);
    add(beamMat, ax, 4.35, cz, .3, .34, 4.5);
    add(beamMat, ax, 4.35, cz - 3.3, .3, .34, 2.6);
    add(beamMat, ax, 4.35, cz + 3.3, .3, .34, 2.6);
    // Main roof: two slabs meeting at a ridge along z, gold ridge
    // ornaments at both ends, upturned eave tips.
    add(roofMat, ax - .58, 6.35, cz, 2.7, .11, 7.8, .5);
    add(roofMat, ax + .58, 6.35, cz, 2.7, .11, 7.8, -.5);
    add(beamMat, ax, 7.05, cz, .34, .2, 8.0);
    for (const ez of [-3.95, 3.95]) {
      add(gold, ax, 7.32, cz + ez, .2, .42, .2);
      add(roofMat, ax - 1.32, 5.82, cz + ez, .5, .09, .7, .85);
      add(roofMat, ax + 1.32, 5.82, cz + ez, .5, .09, .7, -.85);
    }
    // Side roofs over the side spans.
    for (const sz of [-3.3, 3.3]) {
      add(roofMat, ax - .45, 5.62, cz + sz, 2.0, .1, 3.1, .5);
      add(roofMat, ax + .45, 5.62, cz + sz, 2.0, .1, 3.1, -.5);
      add(beamMat, ax, 6.12, cz + sz, .26, .16, 3.2);
    }
    add(beamMat, ax, 5.72, cz, .1, .62, 2.05);
    if (addSign) {
      addSign({ text: signText, detail: signDetail, x: ax + .22, y: 5.72, z: cz, yaw: Math.PI / 2, width: 1.9, height: .52, bg: signBg, fg: signFg });
      addSign({ text: signText, detail: signDetail, x: ax - .22, y: 5.72, z: cz, yaw: -Math.PI / 2, width: 1.9, height: .52, bg: signBg, fg: signFg });
    }
  };

  // Temple gate on the z=17.2 road, just west of the 榕安宮 frontage.
  arch({
    ax: -30, cz: 17.2, pillarMat: templeRed, beamMat: woodDark, roofMat: tile,
    signText: '榕安宮', signDetail: '榕安街・廟埕', signBg: '#923c31', signFg: '#f5e7c8',
  });
  // Street arch on the z=-16.5 cross street.
  arch({
    ax: -33, cz: -16.5, pillarMat: stone, beamMat: woodDark, roofMat: tileStreet,
    signText: '榕安街', signDetail: '老街・商圈', signBg: '#2f5d50', signFg: '#f2ecd8',
  });

  // Hazy facade silhouettes behind the street arch.
  const hazeMats = {
    day: new THREE.MeshBasicMaterial({ color: '#c3ced4' }),
    evening: new THREE.MeshBasicMaterial({ color: '#7d8894' }),
    rain: new THREE.MeshBasicMaterial({ color: '#aab8bc' }),
  };
  const hazeMeshes = [];
  for (const [hz, hh, hw] of [[-22.5, 11, 8], [-11, 13, 9], [-16.8, 8.5, 6]]) {
    const mesh = new THREE.Mesh(cube, hazeMats.day);
    mesh.position.set(-44, hh / 2, hz); mesh.scale.set(1, hh, hw);
    group.add(mesh); hazeMeshes.push(mesh);
  }

  root.add(group);
  const state = { time: 'day', weather: 'clear' };
  const applyHaze = () => {
    const mat = state.weather === 'rain' ? hazeMats.rain : state.time === 'evening' ? hazeMats.evening : hazeMats.day;
    for (const mesh of hazeMeshes) mesh.material = mat;
  };
  return {
    setTime(mode) { state.time = mode; applyHaze(); },
    setWeather(mode) { state.weather = mode; applyHaze(); },
  };
}
