import * as THREE from 'three';

// Observation round 1, R1-1: the cross street (z=-16.5) ran east into bare
// ground and sky — the corner building at (35.8,-31.5) only closes the main
// street's north-south sightlines, not the cross street's eastward one.
// This row closes it the way the z=-86 row closes the main axis: plain
// facades across the road end, fronts at x=36.2, flush with where the
// carriageway stops. It is built standalone (not via contextBuilding)
// because the shared building-weathering atlas is full — registering more
// context buildings throws and the world never becomes ready.
export function addCrossStreetEast(root, { solid } = {}) {
  const mat = (color, rough = .92) => new THREE.MeshStandardMaterial({ color, roughness: rough });
  const M = {
    frame: mat('#4c4a44', .8),
    glass: mat('#3d4a4e', .35),
    lit: new THREE.MeshStandardMaterial({ color: '#8a7a52', roughness: .6, emissive: '#ffb45e', emissiveIntensity: .12 }),
    shutter: mat('#7a7e78', .85),
    dark: mat('#3a3a36', .95),
    tank: mat('#9aa0a2', .7),
  };
  const geo = new THREE.BoxGeometry(1, 1, 1);
  function add(material, x, y, z, w, h, d) {
    const m = new THREE.Mesh(geo, material);
    m.position.set(x, y, z); m.scale.set(w, h, d);
    m.castShadow = true; m.receiveShadow = true;
    root.add(m); return m;
  }

  // One block of the row: mass centred (40, cz), west front at x=36.2.
  function block(cz, width, height, wallColor, seed) {
    const wall = mat(wallColor);
    add(wall, 40, height / 2, cz, 7.6, height, width);
    solid?.(40, height / 2, cz, 7.6, height, width, 0);
    add(M.dark, 40, height + .09, cz, 7.9, .18, width + .3);            // parapet cap
    add(wall, 40, .55, cz, 7.7, 1.1, width + .06);                     // ground-floor band
    // Window grid on the west face: 2-3 bays, three floors where height allows.
    const bays = width > 9 ? [-3.2, 0, 3.2] : [-1.9, 1.9];
    const floors = height > 10 ? [3.6, 6.3, 9.0] : [3.6, 6.3];
    floors.forEach((y, fi) => bays.forEach((dz, bi) => {
      const lit = ((seed + fi * 3 + bi * 7) % 5 === 0);
      add(M.frame, 36.14, y, cz + dz, .1, 1.5, 1.15);
      add(lit ? M.lit : M.glass, 36.08, y, cz + dz, .06, 1.32, .95);
      add(M.frame, 36.12, y - .82, cz + dz, .14, .08, 1.35);           // sill
      if ((seed + fi + bi) % 3 === 0) add(M.tank, 36.02, y - 1.18, cz + dz, .34, .55, .85); // outdoor AC unit under the window
    }));
    // Rooftop water tank on two of the blocks.
    if (seed % 2 === 0) {
      add(M.tank, 41.5, height + .75, cz + width / 4, 1.1, 1.3, 1.1);
      add(M.dark, 41.5, height + 1.44, cz + width / 4, 1.2, .08, 1.2);
    }
  }

  block(-24.6, 6.4, 9.0, '#b5b2a6', 1);
  block(-16.5, 9.6, 11.0, '#adb3ab', 2);
  block(-6.2, 8.6, 10.0, '#c1b39c', 3);

  // The centre block's ground floor: two shuttered shopfronts and a doorway,
  // so the street ends on a lived-in face rather than a blank wall.
  for (const dz of [-2.6, .9]) {
    add(M.dark, 36.16, 1.45, -16.5 + dz, .12, 2.9, 2.6);
    add(M.shutter, 36.10, 1.38, -16.5 + dz, .07, 2.55, 2.3);
    for (let i = 0; i < 4; i++) add(M.dark, 36.06, .45 + i * .62, -16.5 + dz, .03, .05, 2.3);
  }
  add(M.dark, 36.16, 1.5, -13.3, .12, 3.0, 1.1);
  add(mat('#5d4a38', .85), 36.10, 1.45, -13.3, .07, 2.8, .92);

  return { setTime() {} };
}
