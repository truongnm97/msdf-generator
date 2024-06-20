/*
 * Copyright 2023 Comcast Cable Communications Management, LLC
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { adjustFont } from './adjustFont.js';
import { genFont, setGeneratePaths } from './genFont.js';
import fs from 'fs-extra';
import chalk from 'chalk';

const font_exts = ['.ttf', '.otf', '.woff', '.woff2'];

/**
 * @param fontFaceName if `singleAtlas` is true, this will be used for naming the single atlas,
 * and font name format should follow this format: `[fontFaceName]-[fontWeight].[ext]`. For ex: Inter-Bold.tff
 */
export async function generateFonts(singleAtlas?: boolean, fontFaceName?: string, fontSrcDir = 'font-src', fontDstDir = 'font-dst') {
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
          const ssdfFont = await genFont(file, 'ssdf', singleAtlas, fontFaceName);
          if (ssdfFont) await adjustFont(ssdfFont);

          const msdfFont = await genFont(file, 'msdf', singleAtlas, fontFaceName);
          if (msdfFont) await adjustFont(msdfFont);

          // const mtsdfFont = await genFont(file, 'mtsdf', singleAtlas, fontFaceName);
          // if (mtsdfFont) await adjustFont(mtsdfFont);
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

(async () => {
  await generateFonts(true);
})().catch((err) => {
  console.log(err);
});

