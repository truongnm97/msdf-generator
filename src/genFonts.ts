import { adjustFont } from './adjustFont.js';
import { genFont, setGeneratePaths } from './genFont.js';
import fs from 'fs-extra';
import chalk from 'chalk';

const font_exts = ['.ttf', '.otf', '.woff', '.woff2'];

/**
 * @param fontFaceName if `singleAtlas` is true, this will be used for naming the single atlas,
 * and font name format should follow this format: `[fontFaceName]-[fontWeight].[ext]`. For ex: Inter-Bold.tff
 */
export default async function generateFonts(singleAtlas?: boolean, fontFaceName?: string, fontSrcDir = 'font-src', fontDstDir = 'font-dst') {
  setGeneratePaths(fontSrcDir, fontDstDir);

  // Check if src directory exists
  if (!fs.existsSync(fontSrcDir)) {
    console.log(chalk.red.bold('`font-src` directory not found. Exiting...'));
    process.exit(1);
  }

  fs.ensureDirSync(fontDstDir);

  try {
    const files = fs.readdirSync(fontSrcDir);
    let fontsFound = 0;
    for (const file of files) {
      for (const ext of font_exts) {
        if (file.endsWith(ext)) {
          fontsFound++;
          // const ssdfFont = await genFont(file, 'ssdf', singleAtlas, fontFaceName);
          // if (ssdfFont) await adjustFont(ssdfFont);
          //
          // const msdfFont = await genFont(file, 'msdf', singleAtlas, fontFaceName);
          // if (msdfFont) await adjustFont(msdfFont);

          const mtsdfFont = await genFont(file, 'mtsdf', singleAtlas, fontFaceName);
          if (mtsdfFont) await adjustFont(mtsdfFont);
        }
      }
    }
    if (fontsFound === 0) {
      console.log(chalk.red.bold('No font files found in `font-src` directory. Exiting...'));
      process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red('Error generating fonts:'), error);
    process.exit(1);
  }
}


