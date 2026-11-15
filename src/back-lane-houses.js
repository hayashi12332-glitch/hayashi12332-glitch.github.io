import * as THREE from 'three';

// Low older houses closing the back lane's west end and layering the
// park's east side (POLICY_MUSE_JA.md section 8, 2026-11-15; research
// candidate 5). Two contrasting Taiwanese low-house types:
// - a Japanese-era wooden dormitory house: black-tile hip roof,
//   horizontal rain-board siding, small porch;
// - a military-village (眷村) house: red brick, green door, tiled
//   gable roof and a bamboo fence.
// They terminate the lane as a lived-in back neighbourhood rather
// than scenery flats: full small masses with colliders, at the lane's
// own low scale. A plainer pair repeats east of the park as a depth
// layer. Procedural throughout.

export function addBackLaneHouses(root, { solid } = {}) {
  const group = new THREE.Group();
  const siding = new THREE.MeshStandardMaterial({ color: '#8a7358', roughness: .9 });
  const sidingDark = new THREE.MeshStandardMaterial({ color: '#6e5942', roughness: .92 });
  const brick = new THREE.MeshStandardMaterial({ color: '#9a5a48', roughness: .94 });
  const brickDark = new THREE.MeshStandardMaterial({ color: '#7e4636', roughness: .94 });
  const tileBlack = new THREE.MeshStandardMaterial({ color: '#3f4443', roughness: .9 });
  const tileRed = new THREE.MeshStandardMaterial({ color: '#8a4a3a', roughness: .9 });
  const wood = new THREE.MeshStandardMaterial({ color: '#74563a', roughness: .88 });
  const green = new THREE.MeshStandardMaterial({ color: '#4a6e52', roughness: .8 });
  const glass = new THREE.MeshStandardMaterial({ color: '#46545a', roughness: .3, metalness: .15 });
  const bamboo = new THREE.MeshStandardMaterial({ color: '#a08b58', roughness: .95 });
  const concrete = new THREE.MeshStandardMaterial({ color: '#a9a294', roughness: .97 });

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
  // Triangular gable infill for a roof whose ridge runs along x:
  // without it the sloped planes float above the end walls with a
  // see-through gap (found in the first back-lane capture).
  const gablePlate = (mat, cx, cy, cz, halfW, height) => {
    const shape = new THREE.Shape();
    shape.moveTo(-halfW, 0); shape.lineTo(halfW, 0); shape.lineTo(0, height); shape.closePath();
    const mesh = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: .08, bevelEnabled: false }), mat);
    mesh.rotation.y = Math.PI / 2;
    mesh.position.set(cx, cy, cz);
    mesh.castShadow = true; mesh.receiveShadow = true;
    group.add(mesh);
  };
  // A hip roof from four sloped planes and a cap, ridge along z.
  const hipRoof = (mat, cx, cz, w, d, yBase, rise) => {
    const s = rise / Math.hypot(w / 2, rise);
    const slopeLen = Math.hypot(w / 2, rise) + .3;
    add(mat, cx - w / 4 - .05, yBase + rise / 2, cz, slopeLen, .09, d + .5, 0, Math.atan2(rise, w / 2));
    add(mat, cx + w / 4 + .05, yBase + rise / 2, cz, slopeLen, .09, d + .5, 0, -Math.atan2(rise, w / 2));
    const slopeLenZ = Math.hypot(d / 2, rise) + .3;
    add(mat, cx, yBase + rise / 2, cz - d / 4 - .05, w * .62, .09, slopeLenZ, -Math.atan2(rise, d / 2), 0);
    add(mat, cx, yBase + rise / 2, cz + d / 4 + .05, w * .62, .09, slopeLenZ, Math.atan2(rise, d / 2), 0);
    add(mat, cx, yBase + rise + .04, cz, .5, .12, d * .45);
    // Ridge roll and eave fascia (close-round 2): the plain cap and
    // paper-thin slope edges read as a flat lid from above; a rounded
    // ridge line and a visible eave edge give the roof its thickness.
    const ridge = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, d * .45, 8), mat);
    ridge.position.set(cx, yBase + rise + .13, cz); ridge.rotation.x = Math.PI / 2;
    ridge.castShadow = true; group.add(ridge);
    for (const sd of [-1, 1]) add(mat, cx + sd * (w / 2 + .16), yBase + .03, cz, .07, .15, d + .55);
    void s;
  };

  // --- Back lane west end. Fronts face +x (east, back down the lane).
  // House A: Japanese dormitory, centre z=-28.6, front x=-32.
  {
    const cz = -28.6, fx = -32;
    solidBox(siding, fx - 2.5, 1.6, cz, 5, 3.2, 5.4);
    for (let i = 0; i < 4; i++) add(sidingDark, fx + .02, .5 + i * .75, cz, .03, .05, 5.4);
    hipRoof(tileBlack, fx - 2.5, cz, 5.6, 6.0, 3.2, 1.1);
    // Porch: small slab on two posts, wooden door and a window.
    add(concrete, fx + .55, .07, cz, 1.1, .14, 2.2);
    add(wood, fx + .35, 1.05, cz - .5, .08, 2.1, .85);
    add(glass, fx + .03, 1.85, cz + 1.55, .05, .95, 1.3);
    add(wood, fx + .05, 1.85, cz + 1.55, .04, 1.05, .12);
    add(tileBlack, fx + .55, 2.32, cz, 1.3, .07, 2.4, 0, -.18);
    for (const pz of [-1.0, 1.0]) add(wood, fx + 1.02, 1.12, cz + pz, .09, 2.24, .09);
  }
  // House B: 眷村 brick house, centre z=-34.6, front x=-32.
  {
    const cz = -34.6, fx = -32;
    solidBox(brick, fx - 2.5, 1.55, cz, 5, 3.1, 5.4);
    add(brickDark, fx + .02, 2.55, cz, .03, .18, 5.4);
    // Gable roof along x: two slopes meeting at a ridge across z centre.
    add(tileRed, fx - 2.5, 3.85, cz - 1.42, 5.9, .09, 3.3, -.42);
    add(tileRed, fx - 2.5, 3.85, cz + 1.42, 5.9, .09, 3.3, .42);
    add(brickDark, fx - 2.5, 4.52, cz, 5.9, .14, .3);
    gablePlate(brick, fx - .04, 3.05, cz, 2.7, 1.47);
    gablePlate(brick, fx - 5.04, 3.05, cz, 2.7, 1.47);
    // Green door, a window with bars, and a bamboo fence in front.
    add(green, fx + .03, 1.0, cz - 1.2, .05, 2.0, .92);
    add(glass, fx + .03, 1.8, cz + 1.4, .05, .9, 1.2);
    for (let i = 0; i < 4; i++) add(wood, fx + .05, 1.8, cz + .95 + i * .3, .03, .95, .04);
    for (let i = 0; i < 9; i++) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(.028, .028, 1.05, 6), bamboo);
      post.position.set(fx + 1.15, .52, cz - 2.2 + i * .55);
      group.add(post);
    }
    add(bamboo, fx + 1.15, .82, cz, .04, .05, 4.6);
    add(bamboo, fx + 1.15, .34, cz, .04, .05, 4.6);
    if (solid) solid(fx + 1.15, .5, cz, .08, 1.0, 4.6);
  }

  // --- East of the park: a plainer pair as a depth layer, fronts -x.
  const parkPair = [
    { cz: 24.5, mat: brick, roof: tileRed },
    { cz: 31.5, mat: siding, roof: tileBlack },
  ];
  for (const { cz, mat, roof } of parkPair) {
    const cx = 43.5;
    solidBox(mat, cx, 1.7, cz, 5, 3.4, 6);
    add(roof, cx, 3.95, cz - 1.55, 5.9, .09, 3.4, -.4);
    add(roof, cx, 3.95, cz + 1.55, 5.9, .09, 3.4, .4);
    add(mat, cx, 4.6, cz, 5.9, .13, .3);
    gablePlate(mat, cx - 2.54, 3.3, cz, 3.0, 1.3);
    gablePlate(mat, cx + 2.46, 3.3, cz, 3.0, 1.3);
    add(glass, cx - 2.53, 1.9, cz - 1.2, .05, 1.0, 1.1);
    add(wood, cx - 2.53, 1.05, cz + 1.3, .05, 2.1, .9);
  }

  root.add(group);
  return { setTime() {} };
}
