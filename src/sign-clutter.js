// Taiwan streetscape clutter (POLICY_MUSE_JA.md section 7, 2026-11-14):
// the paper layer of a Taiwanese lane — rental and sale posters, mover /
// drain / locksmith stickers pasted on utility poles, tutoring ads and
// lost-property notices on the back-lane walls. All texts are original
// generic service notices (no real businesses or phone numbers), drawn
// through the existing street-signage atlas before it is finalised.
export function addSignClutter(addSign) {
  const P = (text, opts) => addSign({ text, width: .30, height: .40, ...opts });
  // --- Utility-pole posters (pole positions from utility-wires.js) ---
  // West poles face +x (yaw PI/2), east poles face -x (yaw -PI/2),
  // cross-street poles face +z (yaw 0). Offset .18 = pole surface.
  P('租', { detail: '套房出租', x: -4.07, y: 2.42, z: 14, yaw: Math.PI / 2, bg: '#b3392e', fg: '#fdf6e3' });
  P('通水管', { detail: '抓漏・防水', x: -4.07, y: 2.62, z: -4, yaw: Math.PI / 2, bg: '#e8c832', fg: '#3a3428' });
  P('搬家', { detail: '專業搬家・廢棄物處理', x: -4.07, y: 2.30, z: -20.8, yaw: Math.PI / 2, bg: '#2e5f8a', fg: '#f4f7fa' });
  P('招生', { detail: '英文・數學・作文', x: -4.05, y: 2.78, z: -20.72, yaw: Math.PI / 2, bg: '#2e6654', fg: '#f2f7ee' });
  P('當舖', { detail: '汽機車・黃金・名錶', x: -4.07, y: 2.52, z: -40, yaw: Math.PI / 2, bg: '#7a2e35', fg: '#f7e8c9' });
  P('修理', { detail: '冷氣・冰箱・洗衣機', x: -4.07, y: 2.44, z: -58, yaw: Math.PI / 2, bg: '#dce9ec', fg: '#2c4a55' });
  P('售', { detail: '店面出售・洽詢', x: -4.07, y: 2.58, z: -76, yaw: Math.PI / 2, bg: '#f0ead8', fg: '#b3392e' });
  P('開鎖', { detail: '配鑰匙・換鎖', x: 4.07, y: 2.50, z: 5, yaw: -Math.PI / 2, bg: '#d97c2b', fg: '#fdf3e3' });
  P('徵人', { detail: '早班計時人員', x: 4.07, y: 2.36, z: -13, yaw: -Math.PI / 2, bg: '#f0ead8', fg: '#354d42' });
  P('檳榔', { detail: '現包・青仔・菁仔', x: 4.07, y: 2.56, z: -20.8, yaw: -Math.PI / 2, bg: '#1f6049', fg: '#ffe9a8' });
  P('租', { detail: '倉庫・車位出租', x: 4.07, y: 2.46, z: -31, yaw: -Math.PI / 2, bg: '#b3392e', fg: '#fdf6e3' });
  P('通水管', { detail: '馬桶・水管不通', x: 4.07, y: 2.68, z: -49, yaw: -Math.PI / 2, bg: '#e8c832', fg: '#3a3428' });
  P('搬家', { detail: '學生搬家・優惠', x: 4.07, y: 2.40, z: -67, yaw: -Math.PI / 2, bg: '#2e5f8a', fg: '#f4f7fa' });
  P('招生', { detail: '兒童美語・安親班', x: -16, y: 2.50, z: -29.22, yaw: 0, bg: '#2e6654', fg: '#f2f7ee' });
  P('招領', { detail: '拾獲手機一支・請洽里辦', x: 13, y: 2.42, z: -29.22, yaw: 0, bg: '#f0ead8', fg: '#354d42', width: .34, height: .44 });
  // --- Back-lane wall posters (rear faces at z = -29, facing -z) ---
  P('招生', { detail: '國中數理・個別指導', x: -22, y: 2.15, z: -29.06, yaw: Math.PI, bg: '#2e6654', fg: '#f2f7ee', width: .42, height: .56 });
  P('租', { detail: '雅房・近市場', x: -9.5, y: 1.92, z: -29.06, yaw: Math.PI, bg: '#b3392e', fg: '#fdf6e3', width: .34, height: .46 });
  P('修理', { detail: '水電・衛浴・油漆', x: 3, y: 2.38, z: -29.06, yaw: Math.PI, bg: '#dce9ec', fg: '#2c4a55', width: .40, height: .52 });
  P('售', { detail: '透天厝・靜巷', x: 17.5, y: 2.08, z: -29.06, yaw: Math.PI, bg: '#f0ead8', fg: '#b3392e', width: .36, height: .48 });
}
