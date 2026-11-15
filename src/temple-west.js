import * as THREE from 'three';

// Observation round 1, R1-2: west of the Rong'an temple the ground runs
// bare to the slab edge, and the street arch's haze facades (x=-44,
// z=-11..-22) read as floating cards from the temple corner. This adds
// the missing layer behind the temple: a low precinct wall along
// x=-35.6 and a row of low houses at x=-44 (backs to the temple, roofs
// and upper walls visible over the wall), so the precinct reads as a
// place inside a town instead of the town's edge.
export function addTempleWest(root, { solid } = {}) {
  const mat = (color, rough = .92) => new THREE.MeshStandardMaterial({ color, roughness: rough });
  const M = {
    frame: mat('#4c4a44', .8),
    glass: mat('#3d4a4e', .35),
    lit: new THREE.MeshStandardMaterial({ color: '#8a7a52', roughness: .6, emissive: '#ffb45e', emissiveIntensity: .12 }),
    tileDark: mat('#46504e', .9),
    tileRed: mat('#8a4a3c', .9),
    plaster: mat('#cbbba2', .95),
    trunk: mat('#6a5138', .95),
    leaf: mat('#5d7d4a', .95),
    tank: mat('#9aa0a2', .7),
  };
  const geo = new THREE.BoxGeometry(1, 1, 1);
  function add(material, x, y, z, w, h, d, rx = 0, rz = 0) {
    const m = new THREE.Mesh(geo, material);
    m.position.set(x, y, z); m.scale.set(w, h, d);
    m.rotation.x = rx; m.rotation.z = rz;
    m.castShadow = true; m.receiveShadow = true;
    root.add(m); return m;
  }

  // Precinct wall: plaster with a dark tile cap, z 14.5..33 at x=-35.6.
  add(M.plaster, -35.6, .85, 23.75, .25, 1.7, 18.5);
  add(M.tileDark, -35.6, 1.78, 23.75, .4, .14, 18.7);
  solid?.(-35.6, .85, 23.75, .25, 1.7, 18.5, 0);

  // Low houses at x=-44 (centres), east faces at x=-41.
  function house(cz, width, height, wallColor, roofMat, seed) {
    const wall = mat(wallColor);
    add(wall, -44, height / 2, cz, 6, height, width);
    // Gable roof across x: two slopes meeting at a ridge along z.
    const slopeLen = Math.hypot(3.4, 1.2);
    add(roofMat, -45.55, height + .55, cz, slopeLen, .1, width + .5, 0, .34);
    add(roofMat, -42.45, height + .55, cz, slopeLen, .1, width + .5, 0, -.34);
    add(roofMat, -44, height + 1.18, cz, .5, .12, width + .5);
    // Windows on the east face.
    for (const [dy, dz] of [[height * .55, -width / 4], [height * .55, width / 4], [height * .22, 0]]) {
      const lit = ((seed + (dz > 0 ? 1 : 0) + (dy < height * .4 ? 2 : 0)) % 4 === 0);
      add(M.frame, -40.95, dy, cz + dz, .1, 1.25, .95);
      add(lit ? M.lit : M.glass, -40.9, dy, cz + dz, .06, 1.08, .78);
    }
    // A front door with a step, and an AC unit: the east face is the front
    // (it faces the side street), not a back.
    add(mat('#5d4a38', .85), -40.93, 1.05, cz - width / 5, .08, 2.1, .95);
    add(M.frame, -40.9, 2.2, cz - width / 5, .1, .18, 1.15);
    add(mat('#c9c9c2', .95), -40.72, .09, cz - width / 5, .5, .18, 1.25);
    add(mat('#c9cdc9', .55), -40.82, height * .22 + .95, cz + width / 4, .34, .52, .82);
    if (seed % 2 === 1) add(M.tank, -45.2, height + .6, cz - width / 4, 1.0, 1.1, 1.0);
  }
  house(15.5, 7, 5.6, '#c0b6a4', M.tileDark, 1);
  house(23.8, 7.6, 6.4, '#bdb5a8', M.tileRed, 2);
  house(32, 6.6, 5.8, '#c2b096', M.tileDark, 3);
  // The same row continued north, so the view north-west from the temple
  // corner (and west from the cross street) also lands on houses, with a
  // side street in front of them to ground the row.
  house(2.0, 7.4, 6.1, '#bcb09c', M.tileRed, 4);
  house(10.3, 6.8, 5.5, '#c2b8a6', M.tileDark, 5);
  add(mat('#83837e', .97), -39.5, .02, 6, 5.2, .04, 26);              // side street asphalt
  add(mat('#c9c9c2', .97), -36.6, .035, 6, .9, .07, 26);              // its east sidewalk

  // Broad trees between the wall and the houses. The canopy is layered
  // flat-shaded icosahedron blobs in three greens (close-round 2): the
  // earlier four smooth spheres read as green balls from the lane.
  const leafMats = ['#4c6a3e', '#5d7d4a', '#6d8c56'].map(col =>
    new THREE.MeshStandardMaterial({ color: col, roughness: .95, flatShading: true }));
  const blobGeo = new THREE.IcosahedronGeometry(1, 0);
  for (const z of [19.2, 28.6, 6.0]) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.14, .2, 2.4, 7), M.trunk);
    trunk.position.set(-38.6, 1.2, z); trunk.castShadow = true; root.add(trunk);
    const blobs = [
      // dx, dy, dz, sx, sy, sz, matIdx, rotY
      [0, 3.15, 0, 2.0, 1.05, 1.8, 1, .4],
      [-1.05, 2.8, .45, 1.45, .8, 1.3, 0, 1.7],
      [1.0, 2.9, -.4, 1.5, .85, 1.35, 1, 2.6],
      [.25, 2.5, .95, 1.2, .7, 1.1, 0, .9],
      [-.5, 3.45, -.7, 1.25, .7, 1.15, 2, 2.1],
      [.65, 3.5, .55, 1.1, .62, 1.0, 2, 1.2],
      [-.15, 2.35, -.95, 1.05, .6, .95, 0, 3.0],
    ];
    for (const [dx, dy, dz, sx, sy, sz, mi, ry] of blobs) {
      const c = new THREE.Mesh(blobGeo, leafMats[mi]);
      c.position.set(-38.6 + dx, dy, z + dz);
      c.scale.set(sx, sy, sz); c.rotation.y = ry;
      c.castShadow = true; root.add(c);
    }
  }

  return { setTime() {} };
}
