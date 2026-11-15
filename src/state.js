export const STORAGE_KEY = 'taiwan-lane-layout-v1';
export const MAX_OBJECTS = 60;
// The editable area follows the same world boundary as walking. Keep these
// limits in one place so drag, creation, import and local saves agree.
export const PLACEMENT_BOUNDS = Object.freeze({minX:-28,maxX:28,minZ:-37,maxZ:21});
export const ASSETS = {
  postboxRed: {name:'赤いポスト', file:'vendor/taiwan_postbox_red_dual/model.glb', size:[0.44,1.425,0.422]},
  postboxGreen: {name:'緑のポスト', file:'vendor/taiwan_postbox_green_dual/model.glb', size:[0.44,1.425,0.422]},
  stall: {name:'麵の屋台', file:'02_NoodleStall.glb', size:[2.02,1,1]},
  shelf: {name:'商品棚', file:'03_ProductShelf.glb', size:[1.25,1.84,0.507]},
  checkout: {name:'レジ', file:'04_Checkout.glb', size:[1.48,0.98,0.74]},
  teaEgg: {name:'茶葉蛋の鍋', file:'05_TeaEggPot.glb', size:[0.588,0.388,0.546]},
};

export function validateLayout(value) {
  if (!value || value.version !== 1 || !Array.isArray(value.objects) || value.objects.length > MAX_OBJECTS) throw new Error('この街区の配置ファイルではないか、パーツが60個を超えています。');
  const ids = new Set();
  const objects = value.objects.map((item, index) => {
    if (!item || !Object.hasOwn(ASSETS,item.kind) || !['x','y','z','rotation'].every(k => typeof item[k] === 'number' && Number.isFinite(item[k]))) throw new Error('パーツの種類や位置に読み取れない値があります。');
    if (item.x < PLACEMENT_BOUNDS.minX || item.x > PLACEMENT_BOUNDS.maxX || item.z < PLACEMENT_BOUNDS.minZ || item.z > PLACEMENT_BOUNDS.maxZ || item.y < 0 || item.y > 4 || Math.abs(item.rotation) > 1000) throw new Error('パーツの位置が街区の範囲を超えています。');
    const id = typeof item.id === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(item.id) ? item.id : `imported-${index}`;
    if(ids.has(id)) throw new Error('パーツのIDが重複しています。');
    ids.add(id);
    return {id, kind:item.kind, x:item.x,y:item.y,z:item.z, rotation:item.rotation};
  });
  return {version:1,objects};
}

export function makeLayout(objects) { return validateLayout({version:1,objects}); }
export function newId() {return `prop-${crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2)}`;}
