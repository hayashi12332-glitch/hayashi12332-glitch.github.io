import * as THREE from 'three';

// Observation round 1, R1-3: from inside the park, the westward view is
// filled by the east side of the house at (12.8, 27.2) (girl-home.js) —
// a completely blank wall: ground floor x=16.17 (z 24.25..30.19) and a
// solid upper mass whose east face is x=16.25, y 3.31..7.19. A real side
// wall facing a park would have windows, an AC unit and a rain pipe.
// This module dresses that exact face; nothing else is touched.
export function addParkWallDressing(root) {
  const mat = (color, rough = .9) => new THREE.MeshStandardMaterial({ color, roughness: rough });
  const M = {
    frame: mat('#4c4a44', .8),
    glass: mat('#3d4a4e', .35),
    ac: mat('#c9cdc9', .55),
    pipe: mat('#b9bcb4', .6),
    skirt: mat('#6a6a62', .95),
  };
  const geo = new THREE.BoxGeometry(1, 1, 1);
  function add(material, x, y, z, w, h, d) {
    const m = new THREE.Mesh(geo, material);
    m.position.set(x, y, z); m.scale.set(w, h, d);
    m.castShadow = true; m.receiveShadow = true;
    root.add(m); return m;
  }
  const FACE = 16.25;

  // Upper-floor windows (on the solid mass, face x=16.25).
  for (const z of [25.5, 27.2, 28.9]) {
    add(M.frame, FACE + .03, 5.3, z, .1, 1.5, 1.1);
    add(M.glass, FACE + .06, 5.3, z, .05, 1.32, .92);
    add(M.frame, FACE + .07, 4.5, z, .16, .07, 1.3);
  }
  // AC unit under the middle upper window, with a drain pipe to the ground.
  add(M.ac, FACE + .19, 4.32, 27.2, .36, .52, .82);
  add(M.pipe, FACE + .3, 2.2, 27.62, .05, 3.7, .05);

  // Ground-floor windows with security bars.
  for (const z of [25.7, 28.7]) {
    add(M.frame, FACE + .02, 1.95, z, .09, 1.3, 1.0);
    add(M.glass, FACE + .05, 1.95, z, .05, 1.14, .84);
    for (const dz of [-.28, 0, .28]) add(M.frame, FACE + .1, 1.95, z + dz, .04, 1.24, .045);
  }
  // Rain pipe at the north corner, full height.
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, 7.0, 8), M.pipe);
  pipe.position.set(FACE + .12, 3.6, 30.02); pipe.castShadow = true;
  root.add(pipe);
  // Skirting / grime band along the base of both floors' face line.
  add(M.skirt, FACE + .01, .28, 27.22, .05, .56, 5.9);

  // The same house's WEST face (x=9.35, R1-4): equally blank, and it is
  // the wall the main street's south end looks at. Same treatment,
  // mirrored; rain pipe at the south corner this time.
  const W = 9.35;
  for (const z of [25.5, 27.2, 28.9]) {
    add(M.frame, W - .03, 5.3, z, .1, 1.5, 1.1);
    add(M.glass, W - .06, 5.3, z, .05, 1.32, .92);
    add(M.frame, W - .07, 4.5, z, .16, .07, 1.3);
  }
  add(M.ac, W - .19, 4.32, 27.2, .36, .52, .82);
  for (const z of [25.7, 28.7]) {
    add(M.frame, W - .02, 1.95, z, .09, 1.3, 1.0);
    add(M.glass, W - .05, 1.95, z, .05, 1.14, .84);
    for (const dz of [-.28, 0, .28]) add(M.frame, W - .1, 1.95, z + dz, .04, 1.24, .045);
  }
  const pipeW = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, 7.0, 8), M.pipe);
  pipeW.position.set(W - .12, 3.6, 24.45); pipeW.castShadow = true;
  root.add(pipeW);
  add(M.skirt, W - .01, .28, 27.22, .05, .56, 5.9);

  return { setTime() {} };
}
