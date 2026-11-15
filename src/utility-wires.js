import * as THREE from 'three';

// Taiwan streetscape clutter (POLICY_MUSE_JA.md section 7, 2026-11-14):
// concrete utility poles with crossarms, pole transformers and dense
// sagging overhead wires — the most recognisable layer of a Taiwanese
// lane. Everything is procedural and merged into a handful of meshes.
// Poles register colliders; wires stay at 6.4 m or higher, clear of the
// walking space, the shop awnings and the 5.8 m lantern rows.
export function addUtilityWires(root, { solid } = {}) {
  const concreteMat = new THREE.MeshStandardMaterial({ color: '#8d8b84', roughness: .94 });
  const steelMat = new THREE.MeshStandardMaterial({ color: '#7e8a86', roughness: .5, metalness: .72 });
  const darkMat = new THREE.MeshStandardMaterial({ color: '#3a3f42', roughness: .62, metalness: .35 });
  const wireMat = new THREE.MeshStandardMaterial({ color: '#232527', roughness: .55, metalness: .25 });
  const parts = { concrete: [], steel: [], dark: [], wire: [] };

  const place = (list, geo, x, y, z, ry = 0) => {
    if (ry) geo.rotateY(ry);
    geo.translate(x, y, z);
    list.push(geo);
  };
  const box = (list, w, h, d, x, y, z, ry = 0) => place(list, new THREE.BoxGeometry(w, h, d), x, y, z, ry);
  const cyl = (list, rt, rb, h, x, y, z, seg = 10) => place(list, new THREE.CylinderGeometry(rt, rb, h, seg), x, y, z);

  // armAxis: 0 = crossarm runs along x (pole beside a north-south street),
  // Math.PI/2 = crossarm runs along z (pole beside an east-west street).
  // face: unit direction toward the street, for the distribution box.
  function pole(x, z, { h = 9.8, armAxis = 0, transformer = false, distBox = false, face = [1, 0] } = {}) {
    cyl(parts.concrete, .13, .19, h, x, h / 2, z, 10);
    // Power crossarm near the top, communications arm lower down.
    box(parts.steel, 1.9, .13, .13, x, h - .5, z, armAxis);
    box(parts.steel, 1.35, .1, .1, x, h - 1.6, z, armAxis);
    const ux = Math.cos(armAxis), uz = -Math.sin(armAxis);
    for (const o of [-.8, 0, .8]) cyl(parts.dark, .032, .045, .17, x + ux * o, h - .36, z + uz * o, 6);
    // Weathered number plate facing the street.
    box(parts.dark, .17, .26, .02, x - uz * .17, 3.1, z - ux * .17, armAxis + Math.PI / 2);
    // Grey distribution box on the street face — breaks the pole's
    // silhouette against the arcade columns behind it.
    if (distBox) box(parts.steel, .36, .52, .15, x + face[0] * .25, 2.9, z + face[1] * .25, Math.atan2(face[0], face[1]));
    if (transformer) {
      const tx = x - uz * .5, tz = z - ux * .5;
      cyl(parts.steel, .37, .37, 1.02, tx, h - 1.25, tz, 12);
      cyl(parts.dark, .05, .05, .22, tx - .14, h - .62, tz, 6);
      cyl(parts.dark, .05, .05, .22, tx + .14, h - .62, tz, 6);
      box(parts.steel, .08, .5, .08, x - uz * .28, h - 1.0, z - ux * .28);
    }
    if (solid) solid(x, h / 2, z, .44, h, .44);
    return { x, z, h, ux, uz };
  }

  function wire(a, b, sag, r = .021, lat = 0) {
    const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
    const mid = va.clone().lerp(vb, .5); mid.y -= sag;
    if (lat) {
      const dir = vb.clone().sub(va); dir.y = 0; dir.normalize();
      mid.addScaledVector(new THREE.Vector3(-dir.z, 0, dir.x), lat);
    }
    const curve = new THREE.QuadraticBezierCurve3(va, mid, vb);
    parts.wire.push(new THREE.TubeGeometry(curve, 18, r, 5, false));
  }

  // Three power conductors across the top arms plus one lower comms line.
  function span(p, q) {
    const dist = Math.hypot(q.x - p.x, q.z - p.z);
    for (const o of [-.8, 0, .8]) {
      wire([p.x + p.ux * o, p.h - .42, p.z + p.uz * o],
           [q.x + q.ux * o, q.h - .42, q.z + q.uz * o],
           .3 + dist * .032, .021, o === 0 ? .14 : -.09);
    }
    wire([p.x, p.h - 1.52, p.z], [q.x, q.h - 1.52, q.z], .38 + dist * .045, .015, .05);
  }

  // A thinner service drop from a pole top to a building point.
  function drop(p, target, sag = .34) {
    wire([p.x, p.h - .45, p.z], target, sag, .013, .06);
  }

  // A lone sagging comms cable straight across the street, facade to
  // facade — the layer that reads most strongly at eye level.
  function crossLine(z, hA, hB, sag = .5) {
    wire([-4.95, hA, z], [4.95, hB, z], sag, .013, .1);
    wire([-4.95, hA - .35, z + .45], [4.95, hB - .2, z + .45], sag * 1.25, .011, -.12);
  }

  // --- Pole layout (checked against the 2026-11-14 map captures) ---
  const P = {};
  // Main street, west edge.
  P.w1 = pole(-4.25, 14, { distBox: true });
  P.w2 = pole(-4.25, -4);
  P.j1 = pole(-4.25, -20.8, { distBox: true });          // junction, SW corner
  P.w3 = pole(-4.25, -40);
  P.w4 = pole(-4.25, -58, { transformer: true, distBox: true, face: [1, 0] });
  P.w5 = pole(-4.25, -76);
  // Main street, east edge.
  P.e1 = pole(4.25, 5, { face: [-1, 0] });
  P.e2 = pole(4.25, -13, { transformer: true, face: [-1, 0] });
  P.j2 = pole(4.25, -20.8, { face: [-1, 0] });           // junction, SE corner
  P.e25 = pole(4.25, -31, { distBox: true, face: [-1, 0] });
  P.e3 = pole(4.25, -49, { face: [-1, 0] });
  P.e4 = pole(4.25, -67, { face: [-1, 0], distBox: true });
  // Cross street (z = -25), arms along z.
  P.c1 = pole(-16, -29.4, { armAxis: Math.PI / 2, face: [0, 1] });
  P.c2 = pole(13, -29.4, { armAxis: Math.PI / 2, transformer: true, face: [0, 1] });

  // Along-street spans.
  span(P.w1, P.w2); span(P.w2, P.j1); span(P.j1, P.w3); span(P.w3, P.w4); span(P.w4, P.w5);
  span(P.e1, P.e2); span(P.e2, P.j2); span(P.j2, P.e25); span(P.e25, P.e3); span(P.e3, P.e4);
  span(P.c1, P.c2);
  // Cross and diagonal spans — the messy web over the junctions.
  span(P.w1, P.e1);
  span(P.w2, P.e2);
  span(P.j1, P.j2);
  span(P.j1, P.c1);
  span(P.j2, P.c2);
  span(P.e25, P.c2);
  span(P.w3, P.e3);
  span(P.e3, P.w4);
  span(P.w4, P.e4);
  span(P.c1, P.w3);
  span(P.c2, P.e2);
  // Facade-to-facade comms cables.
  crossLine(0, 7.1, 6.8);
  crossLine(-17, 6.7, 7.2);
  crossLine(-55, 7.3, 6.9);
  crossLine(-63.5, 6.8, 7.4);
  crossLine(-70.5, 7.2, 6.7);
  // Service drops to nearby facades.
  drop(P.w1, [-5.6, 7.4, 10.5]);
  drop(P.w2, [-5.6, 7.6, -7.5]);
  drop(P.e1, [5.6, 7.2, 8.6]);
  drop(P.e2, [5.6, 7.8, -16.5]);
  drop(P.j2, [5.8, 7.2, -18]);
  drop(P.w3, [-5.6, 7.4, -36]);
  drop(P.e25, [5.6, 7.5, -28]);
  drop(P.w4, [-5.6, 7.5, -54.5]);
  drop(P.e3, [5.6, 7.3, -45.5]);
  drop(P.c1, [-19.5, 7.6, -31.5]);
  drop(P.c2, [16.5, 7.4, -31.5]);

  // Merge each material's parts into a single mesh.
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
  const add = (geos, material, shadow) => {
    if (!geos.length) return;
    const mesh = new THREE.Mesh(merge(geos), material);
    mesh.castShadow = shadow; mesh.receiveShadow = true;
    root.add(mesh);
  };
  add(parts.concrete, concreteMat, true);
  add(parts.steel, steelMat, true);
  add(parts.dark, darkMat, false);
  add(parts.wire, wireMat, false);
}
