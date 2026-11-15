import * as THREE from 'three';

// Road-works terminus for the north lane (user's suggestion, 2026-11-15):
// the carriageway used to stop at the land-god shrine standing in its
// middle. Now the asphalt continues north and simply runs into a
// construction zone — Jersey barriers, cones, a dug-up patch with dirt
// and gravel piles, a 施工中 sign and site fencing in front of the
// mid-ground townhouse row. Roadworks are an everyday Taiwanese
// streetscape sight, so the lane ending this way reads as ordinary
// rather than as a set boundary. The shrine moved to the lane's west
// edge (terminus-shrine.js). Procedural throughout, no weathering
// registration.

export function addRoadWorks(root, { solid, addSign } = {}) {
  const group = new THREE.Group();
  const asphalt = new THREE.MeshStandardMaterial({ color: '#3d4145', roughness: .96 });
  const walk = new THREE.MeshStandardMaterial({ color: '#9b978c', roughness: .95 });
  const barrierMat = new THREE.MeshStandardMaterial({ color: '#cfd0cc', roughness: .8 });
  const orange = new THREE.MeshStandardMaterial({ color: '#d97c26', roughness: .75 });
  const coneWhite = new THREE.MeshStandardMaterial({ color: '#e8e4da', roughness: .7 });
  const earth = new THREE.MeshStandardMaterial({ color: '#4a3a2c', roughness: 1 });
  const gravel = new THREE.MeshStandardMaterial({ color: '#7b766c', roughness: 1 });
  const fenceMat = new THREE.MeshStandardMaterial({ color: '#5d6d70', roughness: .85 });
  const pipeMat = new THREE.MeshStandardMaterial({ color: '#8a8d88', roughness: .9 });
  const lampMat = new THREE.MeshStandardMaterial({ color: '#8a5a1e', emissive: '#ff9c2e', emissiveIntensity: .25, roughness: .6 });

  const cube = new THREE.BoxGeometry(1, 1, 1);
  const add = (mat, x, y, z, w, h, d, ry = 0) => {
    const mesh = new THREE.Mesh(cube, mat);
    mesh.position.set(x, y, z); mesh.scale.set(w, h, d); mesh.rotation.y = ry;
    mesh.castShadow = true; mesh.receiveShadow = true;
    group.add(mesh); return mesh;
  };
  const solidBox = (mat, x, y, z, w, h, d, ry = 0) => {
    add(mat, x, y, z, w, h, d, ry);
    if (solid) solid(x, y, z, w, h, d);
  };

  // Asphalt and sidewalks continue from the lane's end (z=-88) north.
  add(asphalt, 0, .015, -92.2, 5.8, .03, 8.6);
  add(walk, -3.35, .02, -92.2, 1.1, .04, 8.6);
  add(walk, 3.35, .02, -92.2, 1.1, .04, 8.6);
  // Faded centre dashes on the extension.
  for (const z of [-89.6, -92.4]) add(coneWhite, 0, .033, z, .14, .006, 1.1);

  // Jersey barriers across the lane, one angled at the west end.
  for (const bx of [-1.95, 0, 1.95]) {
    solidBox(barrierMat, bx, .4, -90.2, 1.9, .8, .55);
    add(orange, bx, .52, -89.91, 1.9, .18, .02);
  }
  solidBox(barrierMat, -2.85, .4, -89.2, 1.9, .8, .55, .55);
  add(orange, -2.85, .52, -89.2, 1.9, .18, .57, .55);
  // Amber warning lamp on the centre barrier.
  add(lampMat, 0, .92, -90.2, .16, .16, .16);

  // Traffic cones, a few upright and scattered through the works.
  const coneGeo = new THREE.ConeGeometry(.16, .52, 10);
  for (const [cx, cz] of [[-1.2, -88.4], [1.4, -89.0], [-.4, -92.6], [2.2, -94.6], [-2.4, -95.0], [.8, -95.8]]) {
    const cone = new THREE.Mesh(coneGeo, orange);
    cone.position.set(cx, .3, cz); cone.castShadow = true; group.add(cone);
    add(coneWhite, cx, .3, cz, .2, .09, .2);
    add(orange, cx, .02, cz, .3, .03, .3);
  }

  // Dug-up patch with a dirt mound and a gravel pile.
  add(earth, 0, .028, -93.9, 4.2, .025, 3.6);
  const mound = new THREE.Mesh(new THREE.SphereGeometry(1.05, 10, 7), earth);
  mound.position.set(-1.1, .02, -94.6); mound.scale.set(1, .42, 1); mound.castShadow = true; group.add(mound);
  const pile = new THREE.Mesh(new THREE.ConeGeometry(.85, .7, 10), gravel);
  pile.position.set(1.6, .35, -93.2); pile.castShadow = true; group.add(pile);

  // Spare concrete pipes stacked at the west side.
  for (const [px, py, pz] of [[-4.1, .31, -92.2], [-4.1, .31, -93.6], [-4.1, .9, -92.9]]) {
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, 1.6, 12, 1, true), pipeMat);
    pipe.position.set(px, py, pz); pipe.rotation.x = Math.PI / 2;
    pipe.castShadow = true; group.add(pipe);
  }

  // Site fence panels closing the works before the townhouse row.
  for (const fx of [-2, 0, 2]) solidBox(fenceMat, fx, .95, -96.4, 1.96, 1.9, .06);

  // 施工中 sign board on two posts, facing back down the lane (+z).
  add(pipeMat, 1.55, .75, -88.5, .07, 1.5, .07);
  add(pipeMat, 2.65, .75, -88.5, .07, 1.5, .07);
  add(orange, 2.1, 1.32, -88.52, 1.3, .8, .05);
  if (addSign) {
    addSign({
      text: '施工中', detail: '道路施工・請改道', x: 2.1, y: 1.32, z: -88.48, yaw: 0,
      width: 1.24, height: .74, bg: '#d97c26', fg: '#ffffff',
    });
  }

  root.add(group);
  return {
    setTime(mode) {
      lampMat.emissiveIntensity = mode === 'evening' ? 1.5 : .25;
    },
  };
}
