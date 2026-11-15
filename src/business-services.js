// Original service-shop furnishings. Coordinates are local to the shop and
// all lettering is scenery: these props do not simulate financial services,
// telephone subscriptions, repairs, or actual property advertisements.
export function furnishServices(type, api) {
  const {width, front, back, entryX, b, c, s, label, hit, m} = api;
  if (!['bank', 'phone', 'estate'].includes(type)) return {features: []};

  const steel = m('business steel', '#a0a8a8');
  const ivory = m('business ivory', '#e1dccf');
  const charcoal = m('business charcoal', '#323d40');
  const wood = m('business wood', '#9c7654');
  const red = m('business red', '#a94938');
  const teal = m('business teal', '#367c7a');
  const paper = m('business document paper', '#f1ecdb', {roughness: .93});
  const screen = m('business display screen', '#344c57', {roughness: .26});
  const paleScreen = m('business display glow', '#a7d6d2', {
    emissive: '#6eaaa3', emissiveIntensity: .12, roughness: .34,
  });
  const glass = m('business service glass', '#c0d7cf', {
    transparent: true, opacity: .16, depthWrite: false, roughness: .22,
  });
  const rear = back + .20;
  const ink = {bg: '#f1ecdb', fg: '#334740'};
  const rightMin = entryX + .65;
  const rightMax = width / 2 - .25;
  const rightCenter = (rightMin + rightMax) / 2;
  const rightWidth = rightMax - rightMin;

  // Backrests and separate legs give the furniture a useful silhouette even
  // when the tiny product lettering is too distant to read.
  function chair(x, z, facing = 1, upholstery = teal, seatWidth = .48) {
    b(upholstery, x, .59, z, seatWidth, .09, .43);
    b(upholstery, x, .87, z - facing * .19, seatWidth, .49, .075);
    for (const dx of [-seatWidth * .36, seatWidth * .36]) {
      for (const dz of [-.145, .145]) b(steel, x + dx, .35, z + dz, .035, .40, .035);
    }
    hit(x, .62, z, seatWidth + .04, .96, .47);
  }

  function monitor(x, y, z, facing = 1) {
    b(charcoal, x, y, z, .29, .035, .18);
    b(steel, x, y + .10, z, .045, .19, .045);
    b(charcoal, x, y + .28, z, .43, .28, .055);
    b(screen, x, y + .28, z + facing * .031, .38, .23, .008);
    b(paleScreen, x - .08, y + .31, z + facing * .037, .17, .012, .006);
    b(paleScreen, x - .11, y + .27, z + facing * .037, .11, .009, .006);
  }

  if (type === 'bank') {
    // ATM is beside, rather than in, the entrance. Its slots, keypad and
    // recessed screen read as a machine instead of a painted upright box.
    const ax = rightMin + .62, az = front - 1.12;
    b(steel, ax, .96, az, .83, 1.64, .56);
    b(teal, ax, 1.82, az, .91, .16, .60);
    // A recessed display above a separate projecting control console. Ports
    // are distinct openings with a metallic lip instead of dark rectangles
    // painted on the cabinet face; this is a fictional, nonfunctional ATM.
    b(charcoal, ax, 1.40, az + .287, .72, .55, .025);
    const atmDisplay=m('business atm display','#578c8c',{emissive:'#315e61',emissiveIntensity:.16,roughness:.3});
    b(atmDisplay, ax, 1.40, az + .304, .48, .38, .018);
    b(paleScreen, ax, 1.51, az + .318, .32, .020, .008);
    for(const sy of [1.44,1.38,1.32]){
      b(paper, ax-.10, sy, az+.319, .12, .014, .006);
      b(paper, ax+.10, sy, az+.319, .12, .014, .006);
    }
    for (const dx of [-.305, .305]) {
      for (let i = 0; i < 3; i++) b(ivory, ax + dx, 1.48 - i * .085, az + .312, .045, .027, .018);
    }
    // Console fascia sits ahead of the cabinet, with two independent upper
    // ports. Light bezels surround deep, dark slits and labels name their use.
    b(steel, ax, .935, az + .302, .73, .40, .050);
    for(const [dx,caption] of [[-.19,'明細'],[.19,'卡片']]){
      const sx=ax+dx;
      b(ivory,sx,1.068,az+.340,.25,.075,.040);
      b(charcoal,sx,1.069,az+.364,.18,.027,.012);
      b(steel,sx,1.049,az+.373,.19,.009,.018);
      label({text:caption,x:sx,y:1.010,z:az+.373,width:.22,height:.045,bg:'#a0a8a8',fg:'#263838'});
    }
    // Cash bay includes a frame, an inset shadow and a shelf lip. The keypad
    // is a separate 4x4 pad with differently coloured action keys.
    b(ivory,ax-.19,.87,az+.338,.29,.13,.038);
    b(charcoal,ax-.19,.869,az+.362,.23,.070,.015);
    b(steel,ax-.19,.826,az+.378,.24,.018,.038);
    label({text:'取款',x:ax-.19,y:.77,z:az+.360,width:.25,height:.047,bg:'#a0a8a8',fg:'#263838'});
    b(charcoal,ax+.18,.87,az+.339,.23,.21,.040);
    const keyRed=m('business atm key red','#a6433e');
    const keyYellow=m('business atm key yellow','#be9d42');
    const keyGreen=m('business atm key green','#518f6e');
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const km=col===3?[keyRed,keyYellow,keyGreen,steel][row]:ivory;
        b(km,ax+.108+col*.048,.939-row*.045,az+.365,.036,.030,.012);
      }
    }
    label({text: 'ATM', x: ax, y: 1.82, z: az + .311, width: .57, height: .12, bg: '#367c7a', fg: '#fff7df'});
    b(ivory, ax, 2.08, az + .012, 1.04, .23, .035);
    for(const side of [-1,1])b(steel,ax+side*.30,1.98,az,.018,.23,.018);
    label({text: '自動櫃員機', x: ax, y: 2.08, z: az + .03, width: 1.02, height: .21, ...ink});
    hit(ax, 1.02, az, .88, 1.76, .64);

    const counterWidth = rightWidth - .62;
    const tx = rightCenter + .07, tz = back + 1.33;
    b(wood, tx, .59, tz, counterWidth, .90, .55);
    b(ivory, tx, 1.06, tz, counterWidth + .07, .08, .65);
    b(teal, tx, .80, tz + .28, counterWidth - .12, .10, .018);
    for (const offset of [-counterWidth * .25, counterWidth * .25]) {
      const x = tx + offset;
      b(glass, x, 1.57, tz + .10, counterWidth * .43, .86, .025);
      for (const dx of [-counterWidth * .22, counterWidth * .22]) b(steel, x + dx, 1.57, tz + .11, .025, .89, .035);
      b(steel, x, 2.01, tz + .11, counterWidth * .46, .035, .035);
      b(steel, x, 1.15, tz + .11, counterWidth * .46, .025, .035);
      b(charcoal, x, 1.108, tz + .21, .34, .015, .20);
      monitor(x + .18, 1.11, tz - .18, -1);
      chair(x, back + .43, 1, charcoal, .46);
    }
    label({text: '服務櫃檯', x: tx, y: .65, z: tz + .286, width: 1.30, height: .21, bg: '#9c7654', fg: '#fff6de'});
    hit(tx, .63, tz, counterWidth + .07, .98, .65);

    const qx = Math.min(rightMin + 1.92, rightMax - .35), qz = front - 1.04;
    c(steel, qx, .18, qz, .18, .08);
    c(steel, qx, .62, qz, .045, .86);
    b(teal, qx, 1.12, qz, .34, .31, .26);
    b(screen, qx, 1.15, qz + .139, .25, .14, .014);
    b(charcoal, qx, 1.025, qz + .142, .19, .025, .02);
    b(paper, qx, .993, qz + .16, .09, .05, .01);
    b(steel,qx,1.31,qz+.10,.018,.18,.018);
    b(ivory,qx,1.40,qz+.11,.71,.18,.025);
    label({text: '請先取號', x: qx, y: 1.40, z: qz + .13, width: .69, height: .16, ...ink});
    hit(qx, .73, qz, .38, 1.18, .34);

    const leftMin = -width / 2 + .25, leftMax = entryX - .65;
    if (leftMax - leftMin > .65) {
      const waitX = (leftMin + leftMax) / 2;
      for (const z of [back + 1.13, front - .87]) chair(waitX, z, 1, teal, .58);
      label({text: '等候區', x: waitX, y: 1.63, z: rear + .02, width: .70, height: .20, ...ink});
    }
    return {features: ['ATM beside entrance', 'two teller windows', 'ticket dispenser', 'waiting chairs']};
  }

  if (type === 'phone') {
    const iconBlue=m('business phone icon blue','#7aaeb1',{emissive:'#456d70',emissiveIntensity:.10});
    const iconWarm=m('business phone icon warm','#d3a77c',{emissive:'#705740',emissiveIntensity:.08});
    const iconLight=m('business phone icon light','#d9dfd2',{emissive:'#777b6e',emissiveIntensity:.08});
    // Each phone is one thin slab. The screen and small UI marks use the
    // same tilt and transformed surface normal, preserving a flat face.
    function displayPhone(x, y, z, color, variant) {
      const tilt = -.30, ct = Math.cos(tilt), st = Math.sin(tilt);
      const py = y + .10, pz = z - .012;
      const face = (material, lx, ly, lz, w, h, d) =>
        b(material, x + lx, py + ly * ct - lz * st,
          pz + ly * st + lz * ct, w, h, d, 0, tilt);
      b(steel, x, y - .010, z - .025, .11, .014, .13);
      b(steel, x, y + .025, z - .025, .028, .06, .035);
      b(charcoal, x, y + .012, z + .010, .102, .015, .032);
      face(variant%2 ? steel : charcoal, 0, 0, 0, .09, .185, .010);
      face(charcoal, 0, 0, .0054, .085, .175, .001);
      face(color, 0, 0, .0062, .079, .166, .0015);
      face(charcoal, 0, .074, .0071, .024, .004, .001);
      face(charcoal, .027, .074, .0074, .004, .004, .001);
      const ui = variant % 2 ? screen : paper;
      face(ui, -.012, .032, .0072, .036, .006, .001);
      face(ui, -.017, .020, .0072, .025, .003, .001);
      // Individual small icon tiles make the active screens read as phones
      // rather than featureless slabs, without imitating a real brand's UI.
      for(let row=0;row<2;row++)for(let col=0;col<3;col++){
        const icon=[iconBlue,iconWarm,iconLight][(row+col+variant)%3];
        face(icon,-.022+col*.022,-.012-row*.023,.0072,.014,.014,.001);
      }
      face(ui, 0, -.070, .0072, .026, .002, .001);
      b(paper, x, y - .014, z + .105, .11, .006, .060);
      for (let line = 0; line < 3; line++) b(charcoal, x, y - .010, z + .090 + line * .015, .072 - line * .014, .002, .003);
    }

    const tableWidth = Math.min(2.35, rightWidth - .32);
    const dx = rightCenter, dz = front - 1.12;
    b(ivory, dx, .91, dz, tableWidth, .085, .72);
    for (const legX of [-tableWidth * .42, tableWidth * .42]) b(steel, dx + legX, .51, dz, .045, .73, .52);
    b(teal, dx, .79, dz + .363, tableWidth - .10, .14, .024);
    for (let i = 0; i < 4; i++) {
      const x = dx + (i - 1.5) * tableWidth / 4.5;
      displayPhone(x, .97, dz + .04, i % 2 ? paleScreen : teal, i);
    }
    hit(dx, .55, dz, tableWidth + .04, .83, .76);

    const boardWidth = rightWidth - .10, boardX = rightCenter;
    b(ivory, boardX, 1.88, rear, boardWidth, 1.46, .045);
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 10; col++) {
        b(charcoal, boardX - boardWidth * .44 + col * boardWidth * .098, 1.33 + row * .30, rear + .027, .012, .012, .007);
      }
    }
    for (let i = 0; i < 6; i++) {
      const x = boardX - boardWidth * .38 + i * boardWidth * .15;
      const caseColor = [teal, red, charcoal][i % 3];
      b(paper, x, 1.99, rear + .055, .27, .45, .028);
      b(steel, x, 2.25, rear + .069, .025, .065, .025);
      b(caseColor, x, 1.98, rear + .083, .19, .32, .035);
      b(ivory, x, 1.97, rear + .106, .151, .27, .013);
      b(caseColor, x - .048, 2.074, rear + .116, .047, .052, .012);
      s(charcoal, x - .047, 2.08, rear + .126, .018, .018, .007);
    }
    // Cable packs below the cases have light loops and connector ends.
    for (let i = 0; i < 4; i++) {
      const x = boardX - boardWidth * .33 + i * boardWidth * .22;
      b(paper, x, 1.46, rear + .06, .31, .33, .03);
      c(charcoal, x, 1.47, rear + .086, .103, .015, Math.PI / 2);
      c(paper, x, 1.47, rear + .098, .078, .015, Math.PI / 2);
      b(steel, x - .044, 1.365, rear + .106, .027, .054, .015);
      b(steel, x + .044, 1.365, rear + .106, .027, .054, .015);
    }
    label({text: '手機配件', x: boardX, y: 2.50, z: rear + .035, width: 1.33, height: .20, ...ink});

    const sx = rightMax - .64, sz = back + .65;
    b(wood, sx, .61, sz, 1.13, .94, .57);
    b(charcoal, sx, 1.11, sz, 1.20, .06, .65);
    monitor(sx + .18, 1.155, sz - .03, -1);
    b(teal, sx - .33, 1.15, sz + .04, .27, .025, .31);
    b(charcoal, sx - .33, 1.175, sz + .04, .12, .025, .23);
    b(steel, sx - .49, 1.17, sz + .03, .014, .013, .19);
    label({text: '維修服務', x: sx, y: .77, z: sz + .296, width: .87, height: .19, bg: '#9c7654', fg: '#fff8df'});
    hit(sx, .65, sz, 1.20, 1.02, .65);
    return {features: ['four angled display phones', 'phone-case pegboard', 'packaged cables', 'repair service counter']};
  }

  // Estate agent: recognizable window listings, a consultation table and
  // ordinary office equipment; the listings contain no real address or price.
  // Flyer pockets are closer to paper proportions and leave a view through
  // the window. The former near-metre-wide cards obscured the whole office.
  const cardWidth = .48, cardHeight = .62;
  const cardXs = [rightMin + .37, rightCenter, rightMax - .37];
  const cardZ = front - .23;
  const listingData = [
    ['公寓出售', '2房1廳'], ['華廈出售', '3房2廳'], ['套房出租', '獨立套房'],
    ['店面出租', '臨路店面'], ['公寓出租', '2房1廳'], ['住宅出售', '3房1廳'],
  ];
  for (let col = 0; col < 3; col++) {
    const x = cardXs[col];
    for (const dx of [-cardWidth * .36, cardWidth * .36]) c(steel, x + dx, 1.76, cardZ - .04, .009, 1.89);
    for (let row = 0; row < 2; row++) {
      const y = 1.26 + row * .76;
      const [title, rooms] = listingData[row * 3 + col];
      b(teal, x, y, cardZ, cardWidth + .035, cardHeight + .035, .026);
      b(paper, x, y, cardZ + .018, cardWidth, cardHeight, .016);
      label({text: title, x, y: y + .224, z: cardZ + .031, width: cardWidth - .055, height: .12, bg: '#367c7a', fg: '#fff7df'});
      label({text: rooms, x, y: y - .225, z: cardZ + .031, width: cardWidth - .06, height: .10, ...ink});
      const fy = y - .015, fz = cardZ + .033, fw = cardWidth * .72, fh = .26;
      for (const side of [-1, 1]) {
        b(charcoal, x + side * fw / 2, fy, fz, .016, fh, .009);
        b(charcoal, x, fy + side * fh / 2, fz, fw, .016, .009);
      }
      // Deliberate gaps in the internal walls indicate doorways.
      b(charcoal, x - .035, fy + .045, fz, .011, .14, .009);
      b(charcoal, x + .08, fy + .015, fz, .12, .011, .009);
      b(charcoal, x + .13, fy - .065, fz, .011, .09, .009);
      b(teal, x - .11, fy + .055, fz + .005, .07, .05, .006);
      b(wood, x + .07, fy - .065, fz + .005, .08, .035, .006);
      for (const dx of [-.10, .10]) b(paleScreen, x + dx, fy + fh / 2, fz + .008, .07, .012, .005);
    }
  }
  const deskX = rightCenter - .13, deskZ = back + 1.30;
  const deskWidth = Math.min(1.85, rightWidth - .72);
  b(wood, deskX, .90, deskZ, deskWidth, .08, .69);
  for (const dx of [-deskWidth * .42, deskWidth * .42]) b(steel, deskX + dx, .50, deskZ, .045, .72, .58);
  b(ivory, deskX, .60, deskZ - .20, deskWidth - .16, .40, .035);
  monitor(deskX + .44, .955, deskZ - .08, -1);
  b(paper, deskX - .26, .947, deskZ + .04, .32, .013, .25);
  for (let i = 0; i < 3; i++) b(charcoal, deskX - .26, .957, deskZ - .02 + i * .05, .22, .004, .007);
  c(ivory, deskX - .61, 1.01, deskZ + .05, .045, .13);
  hit(deskX, .55, deskZ, deskWidth + .04, .82, .73);
  chair(deskX - .40, deskZ + .85, -1, teal, .46);
  chair(deskX + .38, deskZ + .85, -1, teal, .46);
  chair(deskX, back + .43, 1, charcoal, .46);

  const cabinetX = rightMax - .23;
  b(ivory, cabinetX, .67, back + .70, .43, 1.06, .83);
  for (let i = 0; i < 3; i++) {
    b(steel, cabinetX, .36 + i * .30, back + 1.122, .37, .014, .012);
    b(charcoal, cabinetX, .45 + i * .30, back + 1.135, .10, .025, .021);
  }
  hit(cabinetX, .68, back + .70, .45, 1.08, .86);
  b(wood, rightCenter, 1.55, rear + .11, rightWidth - .12, .045, .27);
  for (let i = 0; i < 9; i++) {
    const x = rightMin + .25 + i * .22;
    b(i % 3 ? teal : red, x, 1.73, rear + .10, .12, .31, .20);
    b(paper, x, 1.73, rear + .206, .073, .13, .008);
  }
  label({text: '買屋・賣屋・租屋', x: rightCenter, y: 2.30, z: rear + .035, width: 2.04, height: .24, ...ink});
  return {features: ['six window property cards with floorplans', 'consultation desk and chairs', 'rear office files']};
}
