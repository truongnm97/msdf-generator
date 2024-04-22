
import { adjustFont } from './adjustFont.js';
import { genFont, setGeneratePaths, type SdfFontInfo } from './genFont.js';
import fs from 'fs';

const fontSrcPath = 'font-src';
const fontDstPath = 'font-dst';
const font_exts = ['.ttf', '.otf', '.woff', '.woff2'];

if (!fs.existsSync(fontDstPath)) {
  fs.mkdirSync(fontDstPath, { recursive: true });
}

export async function generateFonts() {
  const files = fs.readdirSync(fontSrcPath);
  for (const file of files) {
    for (const ext of font_exts) {
      if (file.endsWith(ext)) {
        await adjustFont(await genFont(file, 'msdf'));
        await adjustFont(await genFont(file, 'ssdf'));
      }
    }
  }
}

(async () => {
  setGeneratePaths(fontSrcPath, fontDstPath);
  await generateFonts();
})().catch((err) => {
  console.log(err);
});