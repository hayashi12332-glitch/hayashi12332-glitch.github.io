import * as THREE from 'three';

// A public market (公有市場) closing the south end of the extended
// street (POLICY_MUSE_JA.md section 8, 2026-11-15). Modelled on the
// Tainan West Market pattern from the research notes: a two-storey
// central block with a mansard roof, dormer windows and a round gable
// over the entrance, flanked by single-storey wings with high
// clerestory windows and a qilou-style eave. Markets were built at the
// edge of town and pulled the town toward them — the right kind of
// building to terminate a street. Facade only: the doorway shows dim
// stall silhouettes, and a stall counter closes it, so there is no
// unbuilt interior to walk into. The market faces -z, back toward town.

export function addPublicMarket(root, { solid, addSign } = {}) {
  const group = new THREE.Group();
  // The facade faces north (-z), the town's shadow side, so the
  // palette runs light and the interiors warm-dark rather than black.
  const wall = new THREE.MeshStandardMaterial({ color: '#e6dfcd', roughness: .9 });
  const wallWing = new THREE.MeshStandardMaterial({ color: '#ddd3ba', roughness: .92 });
  const trim = new THREE.MeshStandardMaterial({ color: '#a8543f', roughness: .84 });
  const roofMat = new THREE.MeshStandardMaterial({ color: '#5f6e6a', roughness: .88 });
  const darkGlass = new THREE.MeshStandardMaterial({ color: '#5d6d70', roughness: .3, metalness: .2 });
  const dark = new THREE.MeshStandardMaterial({ color: '#57493a', roughness: .95 });
  const counterMat = new THREE.MeshStandardMaterial({ color: '#6f5a41', roughness: .92 });
  const glow = new THREE.MeshStandardMaterial({ color: '#6b4a26', emissive: '#ff9c46', emissiveIntensity: .3, roughness: .8 });
  const produce1 = new THREE.MeshStandardMaterial({ color: '#5d7d3a', roughness: .9 });
  const produce2 = new THREE.MeshStandardMaterial({ color: '#c96a2e', roughness: .9 });
  const produce3 = new THREE.MeshStandardMaterial({ color: '#b3392e', roughness: .9 });

  const cube = new THREE.BoxGeometry(1, 1, 1);
  const add = (mat, x, y, z, w, h, d, rx = 0, rz = 0) => {
    const mesh = new THREE.Mesh(cube, mat);
    mesh.position.set(x, y, z); mesh.scale.set(w, h, d);
    mesh.rotation.x = rx; mesh.rotation.z = rz;
    mesh.castShadow = true; mesh.receiveShadow = true;
    group.add(mesh); return mesh;
  };
  const solidBox = (mat, x, y, z, w, h, d) => {
    add(mat, x, y, z, w, h, d);
    if (solid) solid(x, y, z, w, h, d);
  };

  const FZ = 39.2; // front face plane; the building extends to z ~45.2

  // Plinth apron in front of the facade (visual only, 4 cm lip).
  add(wallWing, 0, .02, FZ - .8, 23.5, .04, 1.7);

  // --- Central block: two storeys, 9 wide, 6 deep, walls to 7.2.
  // Built as segments around a real entrance opening (a single solid
  // box would bury the doorway inside itself).
  solidBox(wall, -3.1, 3.6, FZ + 3, 2.8, 7.2, 6);
  solidBox(wall, 3.1, 3.6, FZ + 3, 2.8, 7.2, 6);
  solidBox(wall, 0, 5.3, FZ + 3, 3.4, 3.8, 6);
  // Trim band between floors and a cornice line.
  add(trim, 0, 3.62, FZ - .04, 9.2, .22, .1);
  add(trim, 0, 7.05, FZ - .04, 9.3, .3, .12);
  // Upper windows: five tall windows with trim frames.
  for (const wx of [-3.4, -1.7, 0, 1.7, 3.4]) {
    add(darkGlass, wx, 5.5, FZ - .03, 1.05, 1.7, .06);
    add(trim, wx, 6.42, FZ - .045, 1.2, .1, .07);
  }
  // Entrance recess: a 1.6 m deep pocket — back panel with the warm
  // glow, stall counters silhouetted in front of it.
  add(dark, 0, 1.7, FZ + 1.6, 3.4, 3.4, .08);
  add(wall, -1.65, 1.7, FZ + .8, .1, 3.4, 1.6);
  add(wall, 1.65, 1.7, FZ + .8, .1, 3.4, 1.6);
  add(glow, 0, 2.5, FZ + 1.52, 2.4, 1.0, .06);
  for (const [sx, prod] of [[-0.85, produce1], [0.85, produce2]]) {
    add(counterMat, sx, .55, FZ + 1.05, 1.5, 1.1, .6);
    for (let i = 0; i < 4; i++) {
      const mound = new THREE.Mesh(new THREE.SphereGeometry(.16, 8, 6), prod);
      mound.position.set(sx - .45 + i * .3, 1.18, FZ + 1.05);
      mound.scale.y = .62; group.add(mound);
    }
  }
  // A stall counter across the doorway keeps walkers out of the
  // unbuilt interior while reading as market furniture.
  solidBox(counterMat, 0, .5, FZ + .42, 3.0, 1.0, .3);
  add(produce3, -.6, 1.1, FZ + .42, .5, .18, .24);
  add(produce1, .55, 1.1, FZ + .42, .5, .18, .24);

  // Mansard roof: four sloped planes and a flat cap.
  add(roofMat, 0, 8.02, FZ + .95, 10.0, .12, 3.1, -.5);          // front slope
  add(roofMat, 0, 8.02, FZ + 5.05, 10.0, .12, 3.1, .5);          // back slope
  add(roofMat, -4.05, 8.02, FZ + 3, 3.1, .12, 6.9, 0, .5);      // left slope
  add(roofMat, 4.05, 8.02, FZ + 3, 3.1, .12, 6.9, 0, -.5);      // right slope
  add(roofMat, 0, 8.78, FZ + 3, 6.4, .22, 3.9);                 // cap
  add(trim, 0, 8.95, FZ + 3, .5, .35, .5);                      // finial base
  // Dormer windows on the front slope (the centre one would collide
  // with the round gable, so only the flanking pair).
  for (const dx of [-2.6, 2.6]) {
    add(wall, dx, 7.95, FZ + .78, .78, .95, .5);
    add(darkGlass, dx, 7.98, FZ + .5, .55, .62, .06);
    add(roofMat, dx, 8.52, FZ + .8, .95, .08, .62, -.5);
  }
  // Round gable over the entrance.
  const gable = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, .16, 24), trim);
  gable.rotation.x = Math.PI / 2;
  gable.position.set(0, 7.62, FZ - .1);
  group.add(gable);
  const gableCore = new THREE.Mesh(new THREE.CylinderGeometry(.8, .8, .18, 24), wall);
  gableCore.rotation.x = Math.PI / 2;
  gableCore.position.set(0, 7.62, FZ - .1);
  group.add(gableCore);

  // --- Wings: single storey, clerestory band, qilou-style eave.
  // Open stall bays: a set-back mass, front posts and beam, side
  // walls — never a solid box with the bay buried inside it.
  for (const s of [-1, 1]) {
    const cx = s * 7.85;
    solidBox(wallWing, cx, 2.1, FZ + 3.05, 6.7, 4.2, 4.9);
    add(wallWing, cx - 3.28, 2.1, FZ + 1.5, .14, 4.2, 3.2);
    add(wallWing, cx + 3.28, 2.1, FZ + 1.5, .14, 4.2, 3.2);
    for (const px of [-3.2, 0, 3.2]) solidBox(wallWing, cx + px, 2.1, FZ + .22, .45, 4.2, .45);
    add(wallWing, cx, 3.25, FZ + .18, 6.7, 1.9, .36);
    add(roofMat, cx, 4.42, FZ + 2.75, 7.1, .14, 6.1, 0, s * .1);
    // Clerestory windows just under the eave.
    for (let i = 0; i < 4; i++) {
      add(darkGlass, cx - 2.4 + i * 1.6, 3.45, FZ - .03, 1.05, .62, .06);
    }
    // Warm-dark bay backdrop with a lit strip, a counter and
    // produce mounds in the opening.
    add(dark, cx, 1.15, FZ + .56, 5.6, 2.3, .08);
    add(glow, cx, 1.95, FZ + .52, 5.2, .5, .05);
    solidBox(counterMat, cx, .45, FZ + .35, 5.6, .9, .35);
    for (let i = 0; i < 5; i++) {
      const prod = [produce1, produce2, produce3][i % 3];
      const mound = new THREE.Mesh(new THREE.SphereGeometry(.17, 8, 6), prod);
      mound.position.set(cx - 2.2 + i * 1.1, .98, FZ + .35);
      mound.scale.y = .62; group.add(mound);
    }
    // Eave awning on thin posts along the front.
    add(roofMat, cx, 2.62, FZ - .55, 6.9, .06, 1.3, -.22);
    for (const px of [-3.2, 0, 3.2]) {
      add(trim, cx + px, 1.28, FZ - 1.05, .09, 2.56, .09);
    }
  }

  if (addSign) {
    addSign({ text: '榕安市場', detail: '公有市場・生鮮・青果', x: 0, y: 6.35, z: FZ - .12, yaw: Math.PI, width: 2.6, height: .62, bg: '#a8543f', fg: '#f7ecd2' });
    addSign({ text: '生鮮蔬果', detail: '每日進貨', x: -7.85, y: 2.95, z: FZ - .12, yaw: Math.PI, width: 1.5, height: .4, bg: '#507e5c', fg: '#f2f7ee' });
    addSign({ text: '鮮魚・肉類', detail: '現宰・新鮮', x: 7.85, y: 2.95, z: FZ - .12, yaw: Math.PI, width: 1.5, height: .4, bg: '#2e5f8a', fg: '#f4f7fa' });
  }

  root.add(group);
  return {
    setTime(mode) {
      glow.emissiveIntensity = mode === 'evening' ? 1.1 : .3;
    },
  };
}
