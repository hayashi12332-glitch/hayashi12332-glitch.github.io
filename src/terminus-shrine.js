import * as THREE from 'three';

// A small land-god shrine (土地公廟) at the north lane's end
// (POLICY_MUSE_JA.md section 8, 2026-11-15). In Taiwan a lane that runs
// straight into a T-junction is a 路沖, which houses avoid, so a small
// shrine often stands guard at the terminus. This one is deliberately
// humbler than the streetside 榕安宮: a single tiny chamber, a tiled
// roof with modest swallowtail ridge ends, a gold-paper furnace
// (金爐) beside it and a small stone forecourt. Procedural throughout.
// Placement revised the same day at the user's eye: free-standing in
// the middle of the carriageway read unnatural, so the shrine now sits
// on the open ground at the lane's west edge, facing down the lane
// (+z) with its forecourt apron reaching the road edge, while the
// carriageway itself continues north into a road-works terminus
// (road-works.js).

export function addTerminusShrine(root, { solid, addSign } = {}) {
  const group = new THREE.Group();
  const plaster = new THREE.MeshStandardMaterial({ color: '#c9b797', roughness: .93 });
  const red = new THREE.MeshStandardMaterial({ color: '#923c31', roughness: .82 });
  const darkWood = new THREE.MeshStandardMaterial({ color: '#5d312b', roughness: .84 });
  const tile = new THREE.MeshStandardMaterial({ color: '#5f6e6a', roughness: .88 });
  const stone = new THREE.MeshStandardMaterial({ color: '#a9a294', roughness: .97 });
  const gold = new THREE.MeshStandardMaterial({ color: '#b98a3e', roughness: .5, metalness: .55 });
  const teal = new THREE.MeshStandardMaterial({ color: '#3f7d74', roughness: .7 });
  const glow = new THREE.MeshStandardMaterial({ color: '#7a4a28', emissive: '#ff9c46', emissiveIntensity: .15, roughness: .8 });
  const lanternGlow = new THREE.MeshStandardMaterial({ color: '#a03c2c', emissive: '#ff5a38', emissiveIntensity: .1, roughness: .7 });

  const cube = new THREE.BoxGeometry(1, 1, 1);
  const OX = -4.3; // shrine centre x: west edge of the lane end
  const add = (mat, x, y, z, w, h, d, ry = 0) => {
    const mesh = new THREE.Mesh(cube, mat);
    mesh.position.set(x + OX, y, z); mesh.scale.set(w, h, d); mesh.rotation.y = ry;
    mesh.castShadow = true; mesh.receiveShadow = true;
    group.add(mesh); return mesh;
  };
  const solidBox = (mat, x, y, z, w, h, d) => {
    add(mat, x, y, z, w, h, d);
    if (solid) solid(x + OX, y, z, w, h, d);
  };

  const CZ = -84.5; // shrine centre; front face at z = CZ + .85

  // Forecourt slab (廟埕) — flush stone, walkable, no collider.
  add(stone, 0, .045, CZ + 2.1, 4.6, .09, 2.6);

  // Chamber: two side walls, back wall, lintel over a 1.1 m doorway.
  solidBox(plaster, -1.06, 1.05, CZ, .22, 2.1, 1.7);
  solidBox(plaster, 1.06, 1.05, CZ, .22, 2.1, 1.7);
  solidBox(plaster, 0, 1.05, CZ - .76, 2.34, 2.1, .18);
  add(plaster, 0, 1.86, CZ + .76, 2.34, .48, .18);
  // Red door-frame posts and a dark interior with a warm altar glow.
  add(red, -.62, .95, CZ + .8, .14, 1.9, .1);
  add(red, .62, .95, CZ + .8, .14, 1.9, .1);
  add(darkWood, 0, .95, CZ + .45, 1.5, 1.9, .06);
  add(glow, 0, .78, CZ + .1, .8, .55, .3);
  add(gold, 0, 1.14, CZ + .1, .3, .1, .12);
  // Incense urn on the forecourt centre line.
  const urn = new THREE.Mesh(new THREE.CylinderGeometry(.17, .13, .3, 10), gold);
  urn.position.set(OX, .24, CZ + 1.55); urn.castShadow = true; group.add(urn);
  if (solid) solid(OX, .24, CZ + 1.55, .34, .48, .34);
  for (const dx of [-.05, 0, .05]) {
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, .26, 5), darkWood);
    stick.position.set(OX + dx, .5, CZ + 1.55); group.add(stick);
  }

  // Close the chamber top and the front gable so no sky slit shows
  // under the roof (the same fix the streetside temple needed).
  add(plaster, 0, 2.14, CZ, 2.34, .1, 1.7);
  add(plaster, 0, 2.32, CZ + .78, 2.34, .55, .14);

  // Roof: two sloped tile slabs meeting at a ridge, eaves upturned by
  // small angled end caps; the ridge carries swallowtail (燕尾) tips
  // and small coloured 剪黏-style blocks.
  for (const s of [-1, 1]) {
    const slab = add(tile, s * .62, 2.42, CZ, 1.55, .09, 2.3);
    slab.rotation.z = -s * .5;
    const cap = add(tile, s * 1.32, 2.18, CZ, .34, .08, 2.3);
    cap.rotation.z = -s * 1.0;
  }
  add(red, 0, 2.78, CZ, .22, .18, 2.2);
  for (const s of [-1, 1]) {
    const tip = add(red, 0, 2.92, CZ + s * 1.18, .16, .3, .3);
    tip.rotation.x = s * .5;
  }
  add(teal, 0, 2.95, CZ, .34, .16, .34);
  add(gold, -.0, 3.06, CZ, .18, .1, .18);

  // Gold-paper furnace (金爐) to the left of the forecourt: a squat
  // three-tier tower with a little hip roof and chimney opening.
  const FX = -2.05, FZ = CZ + 1.1;
  solidBox(stone, FX, .5, FZ, .78, 1.0, .78);
  add(darkWood, FX, .62, FZ + .4, .4, .34, .03);
  add(stone, FX, 1.12, FZ, .92, .12, .92);
  solidBox(stone, FX, 1.42, FZ, .58, .5, .58);
  const froof = add(tile, FX, 1.78, FZ, .85, .07, .85);
  froof.rotation.y = Math.PI / 4;
  add(red, FX, 1.95, FZ, .16, .28, .16);

  // A small 石敢當-style stele on the right side of the forecourt.
  solidBox(stone, 1.95, .42, CZ + 1.9, .34, .84, .14);

  // Two small red lanterns flank the doorway.
  for (const s of [-1, 1]) {
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(.11, 10, 8), lanternGlow);
    lamp.position.set(OX + s * .95, 1.98, CZ + .95); lamp.scale.y = .82;
    group.add(lamp);
  }

  if (addSign) {
    addSign({
      text: '福德祠', detail: '土地公廟', x: OX, y: 2.32, z: CZ + .87, yaw: 0,
      width: 1.15, height: .34, bg: '#923c31', fg: '#f5e7c8',
    });
  }

  root.add(group);
  return {
    setTime(mode) {
      const evening = mode === 'evening';
      glow.emissiveIntensity = evening ? 1.25 : .15;
      lanternGlow.emissiveIntensity = evening ? 1.6 : .1;
    },
  };
}
