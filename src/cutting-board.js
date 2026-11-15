import * as THREE from 'three';

// Attach an optional, already loaded and verified board to the stall prototype.
// The wrapper preserves the source glTF's own transforms and makes placement
// relative to its measured bounds rather than relying on an authored origin.
export function attachCuttingBoard(stall, board) {
  if (!stall || !board) throw new Error('The stall or cutting board is missing');
  board.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(board);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  if (bounds.isEmpty() || ![size.x, size.y, size.z, center.x, center.z, bounds.min.y].every(Number.isFinite)
      || size.x <= 0 || size.y <= 0 || size.z <= 0) {
    throw new Error('The cutting board has invalid bounds');
  }
  const scaleX = .47 / size.x, scaleZ = .29 / size.z;
  const holder = new THREE.Group();
  holder.name = 'Wooden cutting board';
  holder.position.set(.20 - center.x * scaleX, 1.025 - bounds.min.y, .21 - center.z * scaleZ);
  holder.scale.set(scaleX, 1, scaleZ);
  board.traverse(node => {
    if (node.isMesh) { node.castShadow = true; node.receiveShadow = true; }
  });
  holder.add(board);
  stall.add(holder);
  return holder;
}
