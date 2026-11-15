// A local TC subset keeps street glyphs consistent on phones and desktops.
// Rebuild with scripts/subset_sign_font.py when source strings change.
export const SIGN_FONT='"Taiwan Street TC", "Noto Sans TC", "Noto Sans CJK TC", "PingFang TC", "Microsoft JhengHei", sans-serif';

let loading;
export async function loadSignFont(){
  if(!loading){
    loading=(async()=>{
      const font=new FontFace('Taiwan Street TC','url("/assets/fonts/taiwan-street-tc.woff2") format("woff2")',{style:'normal',weight:'700',display:'block'});
      // Propagate a missing/invalid font to boot's error handler. Drawing before
      // this resolves would bake a device's fallback glyphs into the canvases.
      await font.load();
      document.fonts.add(font);
      await document.fonts.ready;
      return font;
    })();
  }
  return loading;
}
