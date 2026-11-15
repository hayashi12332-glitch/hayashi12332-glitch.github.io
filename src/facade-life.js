import * as THREE from 'three';

// Taiwan streetscape clutter (POLICY_MUSE_JA.md section 7, 2026-11-14):
// the lived-in layer on the walls — laundry poles with washing hung out
// over the lanes, extra outdoor AC units with drain pipes on the rear
// walls, and plain rain pipes. Procedural, merged per material. Hung
// only where the wall plane is known exactly (rear wall z=-29, the
// north-lane chain walls, one main-street facade), at heights that
// clear signs, windows and the walking space.
export function addFacadeLife(root) {
  const acMat = new THREE.MeshStandardMaterial({ color: '#c9cdc9', roughness: .55, metalness: .3 });
  const darkMat = new THREE.MeshStandardMaterial({ color: '#4a4f4d', roughness: .7, metalness: .2 });
  const pipeMat = new THREE.MeshStandardMaterial({ color: '#b9bcb4', roughness: .6, metalness: .35 });
  const poleMat = new THREE.MeshStandardMaterial({ color: '#8a8d88', roughness: .5, metalness: .6 });
  const clothMats = ['#e8e4da', '#a8c4d4', '#e3b7b0', '#d9cf9f', '#b9c9a8'].map(c =>
    new THREE.MeshStandardMaterial({ color: c, roughness: .95, side: THREE.DoubleSide }));
  const parts = { ac: [], dark: [], pipe: [], pole: [], cloth: clothMats.map(() => []) };

  const place = (list, geo, x, y, z, ry = 0, rz = 0) => {
    if (rz) geo.rotateZ(rz);
    if (ry) geo.rotateY(ry);
    geo.translate(x, y, z);
    list.push(geo);
  };
  const box = (list, w, h, d, x, y, z, ry = 0, rz = 0) => place(list, new THREE.BoxGeometry(w, h, d), x, y, z, ry, rz);
  const cylZ = (list, r, len, x, y, z) => { const g = new THREE.CylinderGeometry(r, r, len, 8); g.rotateX(Math.PI / 2); place(list, g, x, y, z); };
  const cylX = (list, r, len, x, y, z) => { const g = new THREE.CylinderGeometry(r, r, len, 8); g.rotateZ(Math.PI / 2); place(list, g, x, y, z); };
  const cylY = (list, r, len, x, y, z) => place(list, new THREE.CylinderGeometry(r, r, len, 8), x, y, z);

  // --- Laundry: a pole jutting from the wall, cloths hanging off it ---
  // axis 'z': pole runs along z from wallZ, cloth width lies along z.
  // axis 'x': pole runs along x from wallX, cloth width lies along x.
  let clothSeed = 0;
  function laundry({ axis, wall, fixed, y, reach }) {
    const dir = Math.sign(reach), len = Math.abs(reach);
    const mid = wall + dir * len / 2;
    if (axis === 'z') cylZ(parts.pole, .021, len, fixed, y, mid);
    else cylX(parts.pole, .021, len, mid, y, fixed);
    const spots = [.22, .52, .82];
    spots.forEach((t, i) => {
      if (clothSeed % 4 === 3 && i === 1) { clothSeed++; return; } // a gap in the row
      const at = wall + dir * len * t;
      const w = .48 + ((clothSeed * 37) % 10) / 40;      // .48-.70
      const h = .62 + ((clothSeed * 53) % 10) / 30;      // .62-.92
      const tilt = (((clothSeed * 29) % 7) - 3) * .02;
      const list = parts.cloth[clothSeed % clothMats.length];
      // Hanger style: each cloth's plane is perpendicular to the pole,
      // so the row reads from along the street, not just face-on.
      if (axis === 'z') box(list, w, h, .03, fixed, y - h / 2 - .02, at, 0, tilt);
      else box(list, .03, h, w, at, y - h / 2 - .02, fixed, 0, tilt);
      clothSeed++;
    });
  }
  // Back lane, off the rear wall (z = -29), poles reaching into the lane.
  laundry({ axis: 'z', wall: -29.1, fixed: -24, y: 6.1, reach: -1.25 });
  laundry({ axis: 'z', wall: -29.1, fixed: -6, y: 5.6, reach: -1.15 });
  laundry({ axis: 'z', wall: -29.1, fixed: 8, y: 6.4, reach: -1.3 });
  laundry({ axis: 'z', wall: -29.1, fixed: 21, y: 5.8, reach: -1.1 });
  // North lane, off the chain-store walls (their faces are at |x| = 3.8:
  // centre 7.2 with 6.8 of depth across the lane, per world.js).
  laundry({ axis: 'x', wall: -3.85, fixed: -58, y: 6.2, reach: 1.25 });
  laundry({ axis: 'x', wall: 3.85, fixed: -69, y: 5.9, reach: -1.25 });
  // Main street, east upper facade at z = 2. Its visible plane is
  // x ≈ 3.0 (probe captures 204/205), not the ground-floor post line.
  laundry({ axis: 'x', wall: 3.02, fixed: 2, y: 6.0, reach: -1.2 });

  // --- Extra outdoor AC units with brackets and drain pipes ---
  // ry rotates the unit to face away from its wall.
  function acUnit(x, y, z, ry, pipeX, pipeZ) {
    box(parts.ac, .88, .62, .27, x, y, z, ry);
    // Fan disc on the front face (front direction = (sin ry, 0, cos ry)).
    const fx = Math.sin(ry), fz = Math.cos(ry);
    const g = new THREE.CylinderGeometry(.21, .21, .03, 14); g.rotateX(Math.PI / 2);
    place(parts.dark, g, x + fx * .145, y, z + fz * .145, ry);
    box(parts.dark, .7, .05, .05, x, y - .38, z, ry);
    // Drain pipe from below the unit down to the lane.
    cylY(parts.pipe, .032, y - .35, pipeX, (y - .35) / 2 + .05, pipeZ);
  }
  // Rear wall (face z=-29, units face -z: ry = PI; drains hug the wall).
  acUnit(-26, 4.6, -29.32, Math.PI, -25.67, -29.13);
  acUnit(-12, 3.4, -29.32, Math.PI, -11.67, -29.13);
  acUnit(0, 5.2, -29.32, Math.PI, .33, -29.13);
  acUnit(12, 4.2, -29.32, Math.PI, 12.33, -29.13);
  acUnit(24, 3.6, -29.32, Math.PI, 24.33, -29.13);
  // North-lane west wall (face x=-3.8, units face +x: ry = PI/2).
  acUnit(-3.64, 4.8, -52, Math.PI / 2, -3.72, -51.6);
  acUnit(-3.64, 5.4, -70, Math.PI / 2, -3.72, -69.6);

  // --- Standalone rain pipes on the rear wall ---
  for (const x of [-16, 19]) cylY(parts.pipe, .04, 8.6, x, 4.3, -29.3);

  const merge = (geos) => {
    const nonIndexed = geos.map(g => g.index ? g.toNonIndexed() : g);
    const count = nonIndexed.reduce((n, g) => n + g.attributes.position.count, 0);
    const positions = new Float32Array(count * 3), normals = new Float32Array(count * 3), uvs = new Float32Array(count * 2);
    let offset = 0;
    for (const g of nonIndexed) {
      positions.set(g.attributes.position.array, offset * 3);
      normals.set(g.attributes.normal.array, offset * 3);
      if (g.attributes.uv) uvs.set(g.attributes.uv.array, offset * 2);
      offset += g.attributes.position.count;
    }
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    out.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    out.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    for (const g of new Set([...geos, ...nonIndexed])) g.dispose();
    return out;
  };
  const add = (geos, material, shadow = false) => {
    if (!geos.length) return;
    const mesh = new THREE.Mesh(merge(geos), material);
    mesh.castShadow = shadow; mesh.receiveShadow = true;
    root.add(mesh);
  };
  add(parts.ac, acMat, true);
  add(parts.dark, darkMat);
  add(parts.pipe, pipeMat);
  add(parts.pole, poleMat);
  parts.cloth.forEach((geos, i) => add(geos, clothMats[i]));
}
