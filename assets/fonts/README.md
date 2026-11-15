# Taiwan Street TC

This WOFF2 is an original-character subset of the **Traditional Chinese (Taiwan)**
face of Noto Sans CJK Bold 2.004. It is bundled locally; the world does not request
fonts from a CDN. Its primary family and PostScript names are renamed to Taiwan
Street TC / TaiwanStreetTC-Bold. The original copyright and complete SIL Open
Font License are in `../../licenses/NotoSansCJK-OFL.txt`.

The subset contains ASCII and every printable character in `dist/src/*.js`.
Rebuild after adding or changing any sign text:

```sh
/usr/bin/python3 scripts/subset_sign_font.py
```

This environment uses Debian's `fonts-noto-cjk`, `python3-fonttools` and
`python3-brotli`. Other environments can install `fonttools[woff]` and pass
`--font`, `--face`, and `--copyright` to the script. The default font is
`/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc`, Taiwan face index 3. The
copyright input is Debian's DEP-5 file, from which the complete OFL is extracted.
`subset-manifest.json` records the source hash, output hash and character count.

The TC face supplies Taiwanese glyph forms. The subset omits OpenType `locl`
substitutions so the app's Japanese UI language cannot select Japanese forms
inside these sign textures. Call and await `loadSignFont()` before generating
any Canvas sign texture; use `SIGN_FONT` with weight 700 for its canvas font.

This font is a derivative under OFL-1.1, separate from the project's MIT code and
CC0 original model assets. It is not a general-purpose full Chinese font.
