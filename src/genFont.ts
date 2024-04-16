import { execa } from 'execa';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

let fontSrcPath: string = '';
let fontDstPath: string = '';
let overrides_path = '';
let charset_path = '';

/**
 * Set the paths for the font source and destination directories.
 *
 * @param srcPath
 * @param dstPath
 */
export function setGeneratePaths(srcPath: string, dstPath: string) {
  fontSrcPath = srcPath;
  fontDstPath = dstPath;
  overrides_path = path.join(fontSrcPath, 'overrides.json');
  charset_path = path.join(fontSrcPath, 'charset.txt');
}

export interface SdfFontInfo {
  fontName: string;
  fieldType: 'ssdf' | 'msdf';
  jsonPath: string;
  pngPath: string;
}

/**
 * Generates a font file in the specified field type.
 * @param fontFileName - The name of the font.
 * @param fieldType - The type of the font field (msdf or ssdf).
 * @returns {Promise<void>} - A promise that resolves when the font generation is complete.
 */
export async function genFont(fontFileName: string, fieldType: 'ssdf' | 'msdf'): Promise<SdfFontInfo> {
  console.log(chalk.blue(`Generating ${fieldType} font from ${chalk.bold(fontFileName)}...`));
  if (fieldType !== 'msdf' && fieldType !== 'ssdf') {
    console.log(`Invalid field type ${fieldType}`);
    process.exit(1);
  }

  if (!fs.existsSync(path.join(fontSrcPath, fontFileName))) {
    console.log(`Font ${fontFileName} does not exist`);
    process.exit(1);
  }

  let bmfont_field_type: string = fieldType;
  if (bmfont_field_type === 'ssdf') {
    bmfont_field_type = 'sdf';
  }

  const fontNameNoExt = fontFileName.split('.')[0]!;
  const overrides = JSON.parse(fs.readFileSync(overrides_path, 'utf8'));
  const font_size = overrides[fontNameNoExt]?.[fieldType]?.fontSize || 42;
  const distance_range =
    overrides[fontNameNoExt]?.[fieldType]?.distanceRange || 4;

  await execa('msdf-bmfont', [
    '--field-type',
    bmfont_field_type,
    '--output-type',
    'json',
    '--round-decimal',
    '6',
    '--smart-size',
    '--pot',
    '--font-size',
    `${font_size}`,
    '--distance-range',
    `${distance_range}`,
    '--charset-file',
    charset_path,
    path.join(fontSrcPath, fontFileName),
  ]);

  const info = {
    fontName: fontNameNoExt,
    fieldType,
    jsonPath: path.join(fontDstPath, `${fontNameNoExt}.${fieldType}.json`),
    pngPath: path.join(fontDstPath, `${fontNameNoExt}.${fieldType}.png`),
  };

  fs.renameSync(
    path.join(fontSrcPath, `${fontNameNoExt}.json`),
    info.jsonPath,
  );
  fs.renameSync(
    path.join(fontSrcPath, `${fontNameNoExt}.png`),
    info.pngPath,
  );

  return info;
}

