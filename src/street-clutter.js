import * as THREE from 'three';

// Taiwan streetscape clutter (POLICY_MUSE_JA.md section 7, 2026-11-14):
// the small movable layer — cardboard stacks, drink crates, plastic
// stools, potted plants and buckets — at arcade edges, shopfront
// corners and along the back lane, where they thicken the street
// without blocking the walking lines. Procedural, merged per material.
export function addStreetClutter(root, { solid } = {}) {
  const mats = {
    card: new THREE.MeshStandardMaterial({ color: '#b99a68', roughness: .92 }),
    cardDark: new THREE.MeshStandardMaterial({ color: '#8f7346', roughness: .92 }),
    red: new THREE.MeshStandardMaterial({ color: '#b03a30', roughness: .6 }),
    blue: new THREE.MeshStandardMaterial({ color: '#2f5f8f', roughness: .6 }),
    crateBlue: new THREE.MeshStandardMaterial({ color: '#31517f', roughness: .7 }),
    crateRed: new THREE.MeshStandardMaterial({ color: '#a33b32', roughness: .7 }),
    terra: new THREE.MeshStandardMaterial({ color: '#a2603f', roughness: .85 }),
    leaf: new THREE.MeshStandardMaterial({ color: '#5d7d43', roughness: .95 }),
    leaf2: new THREE.MeshStandardMaterial({ color: '#6d8a4e', roughness: .95 }),
    bucket: new THREE.MeshStandardMaterial({ color: '#7a8288', roughness: .55, metalness: .3 }),
  };
  const parts = Object.fromEntries(Object.keys(mats).map(k => [k, []]));
  const place = (list, geo, x, y, z, ry = 0) => { if (ry) geo.rotateY(ry); geo.translate(x, y, z); list.push(geo); };
  const box = (key, w, h, d, x, y, z, ry = 0) => place(parts[key], new THREE.BoxGeometry(w, h, d), x, y, z, ry);
  const cyl = (key, rt, rb, h, x, y, z, seg = 10) => place(parts[key], new THREE.CylinderGeometry(rt, rb, h, seg), x, y, z);
  const ball = (key, r, x, y, z) => place(parts[key], new THREE.IcosahedronGeometry(r, 1), x, y, z);

  function cardboard(x, z, ground, ry, tall = 2) {
    let y = ground;
    for (let i = 0; i < tall; i++) {
      const h = i === tall - 1 && tall === 3 ? .13 : .36;
      const w = .52 - i * .03, d = .42 - i * .02;
      box('card', w, h, d, x, y + h / 2, z, ry + i * .14);
      box('cardDark', w, .012, .09, x, y + h + .004, z, ry + i * .14);
      y += h;
    }
    if (solid) solid(x, ground + .4, z, .6, .8, .55);
  }
  function crates(x, z, ground, ry, key) {
    for (let i = 0; i < 2; i++) {
      const y = ground + i * .33;
      box(key, .54, .31, .38, x, y + .155, z, ry);
      if (i === 1) box('bucket', .46, .02, .30, x, y + .30, z, ry); // dark inset on the top crate, reads as its hollow from above
    }
    if (solid) solid(x, ground + .35, z, .6, .7, .45);
  }
  function stool(x, z, ground, key) {
    cyl(key, .155, .125, .29, x, ground + .145, z, 12);
    cyl(key, .165, .165, .03, x, ground + .30, z, 12);
  }
  function plant(x, z, ground, s = 1) {
    cyl('terra', .13 * s, .095 * s, .24 * s, x, ground + .12 * s, z, 9);
    ball('leaf', .21 * s, x, ground + .42 * s, z);
    ball('leaf2', .15 * s, x + .13 * s, ground + .36 * s, z + .06 * s);
    ball('leaf2', .13 * s, x - .12 * s, ground + .50 * s, z - .05 * s);
  }
  function bucket(x, z, ground) {
    cyl('bucket', .145, .11, .27, x, ground + .135, z, 12);
    cyl('bucket', .15, .15, .03, x, ground + .28, z, 12);
  }

  // Cardboard: arcade edges and the back lane.
  cardboard(3.78, -11.4, .13, .2, 2);
  cardboard(-3.62, -6.5, .14, -.15, 3);
  cardboard(-3.3, -50.5, .13, .1, 2);
  cardboard(-20.5, -29.75, 0, .35, 3);
  cardboard(16.5, -29.75, 0, -.3, 2);
  // Drink crates.
  crates(2.5, -29.7, 0, .1, 'crateBlue');
  crates(-3.55, 15.5, .14, -.12, 'crateRed');
  box('crateBlue', .54, .31, .38, 3.3, .13 + .155, -66.5, .3);
  box('crateRed', .54, .31, .38, 3.32, .13 + .31 + .155, -66.48, .18);
  // Plastic stools near shopfronts.
  stool(3.45, -19.9, .1, 'red'); stool(3.88, -19.65, .1, 'blue');
  stool(-3.5, 10.5, .14, 'blue');
  stool(-3.35, -61.5, .13, 'red');
  // Potted plants at doorways and corners.
  plant(-3.7, -20.9, .1, 1.05); plant(-13.5, -20.9, .1, .9);
  plant(3.35, -44.5, .13, 1); plant(-3.35, -70.5, .13, 1.1);
  // Buckets.
  bucket(6.5, -29.8, 0);
  bucket(3.3, -73.5, .13);

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
  for (const [key, geos] of Object.entries(parts)) {
    if (!geos.length) continue;
    const mesh = new THREE.Mesh(merge(geos), mats[key]);
    mesh.castShadow = true; mesh.receiveShadow = true;
    root.add(mesh);
  }
}
