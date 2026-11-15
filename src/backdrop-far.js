import * as THREE from 'three';

// Far backdrop for the town's open north end (POLICY_MUSE_JA.md section 8,
// 2026-11-15): a hazy Taipei 101 silhouette on the main axis beyond the
// school row, a mid-ground row of low townhouse rooftops in front of it,
// and a few generic high-rise silhouettes flanking. The camera only draws
// 150 m and the finished scene fogs out by ~145 m, so a literal distant
// tower is impossible; the backdrop lives just past the town edge and
// fakes the distance with haze-matched colours and a base gradient.
// Everything is fog-exempt basic material whose colours/textures swap
// with the time-of-day and weather, like an air-perspective layer.
// No colliders: all of it sits beyond the walkable streets.

function towerTexture(top, bottom, windows) {
  const canvas = document.createElement('canvas');
  canvas.width = 128; canvas.height = 512;
  const c = canvas.getContext('2d');
  const grad = c.createLinearGradient(0, 512, 0, 0);
  grad.addColorStop(0, bottom);
  grad.addColorStop(.38, top);
  grad.addColorStop(1, top);
  c.fillStyle = grad; c.fillRect(0, 0, 128, 512);
  if (windows) {
    c.fillStyle = '#ffd9a0';
    let seed = 7;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let i = 0; i < 260; i++) {
      if (rnd() < .42) continue;
      const x = 8 + rnd() * 112, y = 20 + rnd() * 430;
      c.globalAlpha = .35 + rnd() * .6;
      c.fillRect(x, y, 2.2, 3.2);
    }
    c.globalAlpha = 1;
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function addFarBackdrop(root) {
  const group = new THREE.Group();

  const textures = {
    day: towerTexture('#b7c7d4', '#cfd9dd', false),
    evening: towerTexture('#5d6f80', '#a08b74', true),
    rain: towerTexture('#a3b3b8', '#a6b2b6', false),
  };
  const towerMat = new THREE.MeshBasicMaterial({ map: textures.day, fog: false });
  const midMat = new THREE.MeshBasicMaterial({ color: '#a9bfcb', fog: false });
  const highMat = new THREE.MeshBasicMaterial({ color: '#b3c3cf', fog: false });

  // --- Taipei 101 silhouette at (0, -134): podium, eight stacked tiers
  // with a wider slab at each tier base, top section and spire. Total
  // height ~44 m, slimmed to the real tower's proportions.
  const tower = new THREE.Group();
  const part = (geo, y) => {
    const mesh = new THREE.Mesh(geo, towerMat);
    mesh.position.y = y; mesh.rotation.y = Math.PI / 4;
    tower.add(mesh);
  };
  part(new THREE.BoxGeometry(30, 3, 30), 1.5);
  let y = 3, r = 13.2;
  for (let i = 0; i < 8; i++) {
    part(new THREE.CylinderGeometry(r * 1.07, r * 1.07, .7, 4), y + .35);
    part(new THREE.CylinderGeometry(r * .84, r, 3.5, 4), y + .7 + 1.75);
    y += 4.0; r *= .925;
  }
  part(new THREE.CylinderGeometry(r * .62, r * .85, 3, 4), y + 1.5);
  const spire = new THREE.Mesh(new THREE.CylinderGeometry(.5, 1.1, 5.5, 8), towerMat);
  spire.position.y = y + 3 + 2.75;
  tower.add(spire);
  tower.position.set(0, 0, -127);
  group.add(tower);

  // --- Mid-ground townhouse row at z ~ -97: low masses, a few pitched
  // roof slabs and rooftop water tanks, so the tower rises behind a
  // believable residential layer instead of the bare school row.
  const mid = new THREE.Group();
  const houses = [
    [-33, 9, 8.5], [-24, 11, 11], [-15.5, 8, 9.5], [-6.5, 10, 12.5],
    [3.5, 9, 10], [12.5, 11, 9], [21.5, 8.5, 11.5], [30.5, 10, 9.5],
  ];
  for (const [hx, w, h] of houses) {
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, 7), midMat);
    body.position.set(hx, h / 2, -97);
    mid.add(body);
    if ((hx + w) % 2 < 1) {
      const roof = new THREE.Mesh(new THREE.BoxGeometry(w * .92, .5, 7.6), midMat);
      roof.position.set(hx, h + .25, -97); roof.rotation.z = .06;
      mid.add(roof);
    } else {
      const tank = new THREE.Mesh(new THREE.CylinderGeometry(.9, .9, 1.6, 10), midMat);
      tank.position.set(hx + w * .22, h + .8, -97);
      mid.add(tank);
    }
  }
  group.add(mid);

  // --- Flanking generic high-rises, lighter and vaguer than the tower.
  const highs = [[-41, -122, 13, 30], [35, -118, 11, 26], [47, -128, 14, 34]];
  for (const [hx, hz, w, h] of highs) {
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, 10), highMat);
    body.position.set(hx, h / 2, hz);
    group.add(body);
  }

  root.add(group);

  let time = 'day', weather = 'clear';
  const palettes = {
    day: { mid: '#a9bfcb', high: '#b3c3cf' },
    evening: { mid: '#6f7a84', high: '#76828c' },
    rain: { mid: '#9dafb5', high: '#a4b4b9' },
  };
  function apply() {
    const key = weather === 'rain' ? 'rain' : time;
    towerMat.map = textures[key];
    towerMat.needsUpdate = true;
    midMat.color.set(palettes[key].mid);
    highMat.color.set(palettes[key].high);
  }
  return {
    setTime(mode) { time = mode === 'evening' ? 'evening' : 'day'; apply(); },
    setWeather(mode) { weather = mode === 'rain' ? 'rain' : 'clear'; apply(); },
  };
}
