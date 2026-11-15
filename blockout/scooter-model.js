import * as THREE from 'three';

// The source GLB is metre-based, with its longitudinal axis along X. Keep one
// geometry/most materials shared by the six clones. Paint is varied separately.
export function createScooterFactory(prototype) {
  prototype.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(prototype);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  let meshes = 0;
  let paint = null;
  prototype.traverse(node => {
    if (node.isMesh && node.geometry?.getAttribute('position')?.count > 0) {
      meshes++;
      node.castShadow = true;
      node.receiveShadow = true;
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      for (const material of materials) {
        if (material?.name === 'Original teal enamel paint') {
          if (paint && paint !== material) throw new Error('Scooter GLB has ambiguous body paint');
          paint = material;
        }
      }
    }
  });
  if (bounds.isEmpty() || !meshes || !paint || ![size.x,size.y,size.z].every(Number.isFinite) ||
      size.x < 1 || size.x > 3 || size.y < .5 || size.y > 2 || size.z < .3 || size.z > 1.5 || size.x <= size.z) {
    throw new Error('Scooter GLB has empty geometry or unexpected dimensions');
  }
  const paintVariants = new Map();
  const plateBackGeometry = new THREE.BoxGeometry(.014, .11, .22);
  const plateFaceGeometry = new THREE.PlaneGeometry(.214, .104);
  const plateBracketGeometry = new THREE.BoxGeometry(.045, .14, .032);
  const plateBackMaterial = new THREE.MeshStandardMaterial({color: '#353b3a', roughness: .7});
  // The imported tire vertices touch the ground near source X=-.651 and
  // X=.677m. A small transparent contact shadow supports that visual contact
  // in the shaded parking area without changing the world's lighting.
  const contactCanvas = document.createElement('canvas');
  contactCanvas.width = contactCanvas.height = 64;
  const contactContext = contactCanvas.getContext('2d');
  if (!contactContext) throw new Error('Could not create scooter contact shadow');
  const fade = contactContext.createRadialGradient(32, 32, 1, 32, 32, 31);
  fade.addColorStop(0, 'rgba(0,0,0,0.64)');
  fade.addColorStop(.5, 'rgba(0,0,0,0.28)');
  fade.addColorStop(1, 'rgba(0,0,0,0)');
  contactContext.fillStyle = fade; contactContext.fillRect(0, 0, 64, 64);
  const contactTexture = new THREE.CanvasTexture(contactCanvas);
  const contactMaterial = new THREE.MeshBasicMaterial({map: contactTexture, transparent: true,
    opacity: .68, depthWrite: false, toneMapped: false});
  const contactGeometry = new THREE.PlaneGeometry(.36, .28);
  // A second, much softer patch under the chassis keeps shaded wheels from
  // appearing suspended. The translucent falloff preserves pavement detail.
  const bodyShadowMaterial = new THREE.MeshBasicMaterial({map: contactTexture, transparent: true,
    opacity: .42, depthWrite: false, toneMapped: false});
  const bodyShadowGeometry = new THREE.PlaneGeometry(1.38, .55);
  let nextPlateNumber = 1;
  function addRearPlate(parent) {
    // Fictional registrations, not copied from the real reference photograph.
    const number = `TWN-${String(nextPlateNumber++).padStart(4, '0')}`;
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not create scooter plate texture');
    ctx.fillStyle = '#eeeae0'; ctx.fillRect(0, 0, 512, 256);
    ctx.strokeStyle = '#444b49'; ctx.lineWidth = 7; ctx.strokeRect(6, 6, 500, 244);
    ctx.fillStyle = '#1d2524'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = 'bold 75px Arial, sans-serif'; ctx.fillText(number, 256, 133, 470);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const plateMaterial = new THREE.MeshStandardMaterial({map: texture, roughness: .8});
    const plateGroup = new THREE.Group();
    plateGroup.name = 'Scooter license plate';
    plateGroup.userData.scooterLicensePlate = true;
    const back = new THREE.Mesh(plateBackGeometry, plateBackMaterial);
    const face = new THREE.Mesh(plateFaceGeometry, plateMaterial);
    const bracket = new THREE.Mesh(plateBracketGeometry, plateBackMaterial);
    // Model X points forward. Attach below the tail lamp and face towards -X.
    const rear = bounds.min.x - center.x - .025;
    back.position.set(rear, .42, 0);
    face.position.set(rear - .008, .42, 0); face.rotation.y = -Math.PI / 2;
    bracket.position.set(rear + .028, .51, 0);
    for (const mesh of [back, face, bracket]) {
      mesh.userData.scooterAccessory = true;
      mesh.userData.scooterPlatePart = true;
      mesh.castShadow = true; mesh.receiveShadow = true;
      plateGroup.add(mesh);
    }
    back.name = 'Scooter license plate backing';
    face.name = 'Scooter license plate face'; face.userData.plateNumber = number;
    bracket.name = 'Scooter license plate bracket';
    parent.add(plateGroup);
  }
  function bodyPaint(color) {
    if (typeof color !== 'string' || !/^#?[0-9a-f]{6}$/i.test(color)) {
      throw new Error('Scooter body color must be a six-digit hex color');
    }
    const hex = color.replace(/^#/, '').toLowerCase();
    if (!paintVariants.has(hex)) {
      const material = paint.clone();
      // The source teal map is almost uniform (channel standard deviation
      // about 0.5/255); dropping it avoids tinting red/cream through teal.
      // Its tiny surface texture is lost, while roughness/specular remain.
      material.map = null;
      material.color.set(`#${hex}`);
      paintVariants.set(hex, material);
    }
    return paintVariants.get(hex);
  }
  return (x, z, angle, floor, color) => {
    const object = new THREE.Group();
    object.name = 'Parked scooter';
    object.userData.scooter = {x,z,angle,floor,referenceColor:color};
    object.position.set(x,floor,z);
    object.rotation.y = angle;
    const aligned = new THREE.Group();
    aligned.rotation.y = -Math.PI / 2;
    const model = prototype.clone(true);
    const variant = bodyPaint(color);
    model.traverse(node => {
      if (!node.isMesh) return;
      if (Array.isArray(node.material)) node.material = node.material.map(m => m === paint ? variant : m);
      else if (node.material === paint) node.material = variant;
    });
    model.position.sub(new THREE.Vector3(center.x, bounds.min.y, center.z));
    aligned.add(model);
    addRearPlate(aligned);
    const bodyShadow = new THREE.Mesh(bodyShadowGeometry, bodyShadowMaterial);
    bodyShadow.name = 'Scooter soft body contact shadow';
    bodyShadow.userData.scooterAccessory = true;
    bodyShadow.userData.scooterBodyContactShadow = true;
    bodyShadow.rotation.x = -Math.PI / 2;
    bodyShadow.position.set(-center.x, .0015, -center.z);
    aligned.add(bodyShadow);
    for (const [index, wheelX] of [-.651, .677].entries()) {
      const shadow = new THREE.Mesh(contactGeometry, contactMaterial);
      shadow.name = index ? 'Scooter front wheel contact shadow' : 'Scooter rear wheel contact shadow';
      shadow.userData.scooterAccessory = true;
      shadow.userData.scooterContactShadow = true;
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.set(wheelX - center.x, .002, -center.z);
      aligned.add(shadow);
    }
    object.add(aligned);
    // With the 90-degree alignment, the original X length runs along local Z.
    return {object, collider:{position:[x,floor+size.y/2,z],size:[size.z,size.y,size.x],rotation:angle}};
  };
}
