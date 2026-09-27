// Extend the bundled typeface with composed Latin accents; no remote fonts.
const accents = {
  '\u0301': [[[-70,1080],[30,1080],[170,1250],[40,1250]]],
  '\u0300': [[[70,1080],[-30,1080],[-170,1250],[-40,1250]]],
  '\u0308': [[[-170,1080],[-60,1080],[-60,1190],[-170,1190]],[[60,1080],[170,1080],[170,1190],[60,1190]]],
  '\u030c': [[[-190,1240],[-80,1240],[0,1150],[80,1240],[190,1240],[50,1070],[-50,1070]]],
  '\u0306': [[[-190,1220],[-90,1220],[-60,1150],[60,1150],[90,1220],[190,1220],[120,1070],[-120,1070]]],
  '\u030a': [
    Array.from({ length: 20 }, (_, i) => [110 * Math.cos(i * Math.PI / 10), 1190 + 110 * Math.sin(i * Math.PI / 10)]),
    Array.from({ length: 20 }, (_, i) => [45 * Math.cos(-i * Math.PI / 10), 1190 + 45 * Math.sin(-i * Math.PI / 10)]),
  ],
  '\u0327': [[[-30,0],[70,0],[40,-70],[100,-100],[100,-210],[-60,-240],[-100,-160],[20,-150],[20,-120],[-50,-90]]],
  '\u0328': [[[30,0],[130,0],[40,-90],[40,-150],[130,-150],[130,-230],[-40,-230],[-60,-100]]],
  '\u0326': [[[-40,-70],[60,-70],[60,-170],[-10,-240],[-60,-210],[-10,-150],[-40,-150]]],
};

export function extendTitleFont(font, text) {
  for (const character of text.normalize('NFC')) {
    if (font.data.glyphs[character]) continue;
    const [base, ...marks] = [...character.normalize('NFD')];
    const glyph = font.data.glyphs[base];
    if (!glyph || !marks.length || marks.some(mark => !accents[mark])) {
      throw new Error(`Unsupported 3D title character: ${character}`);
    }
    const center = (glyph.x_min + glyph.x_max) / 2;
    const outline = marks.flatMap(mark => accents[mark]).map(points =>
      points.map(([x,y], index) => `${index ? 'l' : 'm'} ${Math.round(x + center)} ${y}`).join(' ')
      + ` l ${Math.round(points[0][0] + center)} ${points[0][1]} `).join('');
    font.data.glyphs[character] = { ...glyph, o: glyph.o + outline };
    delete font.data.glyphs[character]._cachedOutline;
  }
  return font;
}
