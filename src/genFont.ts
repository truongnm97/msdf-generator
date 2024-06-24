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

import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
// @ts-ignore
import generateBMFont from '../../msdf-bmfont-xml/index.js';

const fontWeightNames = ['Thin', 'ExtraLight', 'Light', 'Regular', 'Medium', 'SemiBold', 'Bold', 'ExtraBold', 'Black'];

let fontSrcDir: string = '';
let fontDstDir: string = '';
let overridesPath = '';
let charsetPath = '';

/**
 * Set the paths for the font source and destination directories.
 *
 * @param srcDir
 * @param dstDir
 */
export function setGeneratePaths(srcDir: string, dstDir: string) {
  fontSrcDir = srcDir;
  fontDstDir = dstDir;
  overridesPath = path.join(fontSrcDir, 'overrides.json');
  charsetPath = path.join(fontSrcDir, 'charset.txt');
}

export type SdfFontType = 'sdf' | 'ssdf' | 'msdf' | 'mtsdf';

export interface SdfFontInfo {
  fontName: string;
  fieldType: SdfFontType;
  fontPath: string;
  jsonPath: string;
  pngPath: string;
  dstDir: string;
  fontData: any;
}

type FontOptions = {
  fieldType: SdfFontType;
  outputType: 'json';
  roundDecimal: number;
  smartSize: boolean;
  pot?: boolean;
  square?: boolean;
  rot?: boolean;
  border?: number;
  fontSize: number;
  distanceRange: number;
  charset?: string;
  reuse?: string;
  rtl?: boolean;
  filename: string;
  textureSize: [number, number];
}

/**
 * Generates a font file in the specified field type.
 * @param fontFileName - The name of the font.
 * @param fieldType - The type of the font field (msdf, ssdf or mtsdf).
 * @param singleAtlas - Combine all fonts in one atlas.
 * @returns {Promise<void>} - A promise that resolves when the font generation is complete.
 */
export async function genFont(
  fontFileName: string,
  fieldType: SdfFontType,
  singleAtlas?: boolean,
  fontFaceName = 'atlas'
): Promise<SdfFontInfo | null> {
  console.log(chalk.blue(`Generating ${fieldType} font from ${chalk.bold(fontFileName)}...`));
  if (fieldType !== 'msdf' && fieldType !== 'ssdf' && fieldType !== 'mtsdf' && fieldType !== 'sdf') {
    console.log(`Invalid field type ${fieldType}`);
    return null
  }
  const fontPath = path.join(fontSrcDir, fontFileName);
  if (!fs.existsSync(fontPath)) {
    console.log(`Font ${fontFileName} does not exist`);
    return null
  }

  let bmfont_field_type = fieldType;
  if (bmfont_field_type === 'ssdf') {
    bmfont_field_type = 'sdf';
  }

  const fontNameNoExt = fontFileName.split('.')[0]!;
  const fontName = singleAtlas ? fontFaceName : fontNameNoExt
  const overrides = fs.existsSync(overridesPath) ? JSON.parse(fs.readFileSync(overridesPath, 'utf8')) : {};
  const font_size = overrides[fontName]?.[fieldType]?.fontSize || 42;
  const distance_range =
    overrides[fontName]?.[fieldType]?.distanceRange || 4;
  const configPath = path.join(fontDstDir, `${fontName}.${fieldType}.cfg`);
  const pngPath = path.join(fontDstDir, `${fontName}.${fieldType}.png`);
  const jsonPath = path.join(fontDstDir, `${fontName}.${fieldType}.json`);

  let options: FontOptions = {
    fieldType: bmfont_field_type,
    outputType: 'json',
    roundDecimal: 6,
    smartSize: true,
    fontSize: font_size,
    distanceRange: distance_range,
    rtl: true,
    textureSize: [2048, 2048],
    filename: pngPath,
  }

  if (singleAtlas) {
    options.reuse = configPath;
  }

  if (fs.existsSync(charsetPath)) {
    options['charset'] = fs.readFileSync(charsetPath, 'utf8');
  }

  const fontData = await generateFont({ 
    fontSrcPath: fontPath,
    fontDestPath: fontDstDir,
    jsonPath,
    fontFaceName,
    fontNameNoExt,
    options 
  });

  const info: SdfFontInfo = {
    fontName,
    fieldType,
    jsonPath,
    pngPath,
    fontPath,
    dstDir: fontDstDir,
    fontData,
  };

  return info;
}

const generateFont = ({
  fontFaceName,
  jsonPath,
  fontNameNoExt,
  options,
  fontSrcPath,
  fontDestPath,
}: {
  fontSrcPath: string,
  fontDestPath: string, 
  jsonPath: string,
  fontNameNoExt: string,
  fontFaceName: string,
  options: FontOptions 
}): Promise<object> => {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(fontDestPath)) {
      fs.mkdirSync(fontDestPath, { recursive: true })
    }
    generateBMFont(
      fontSrcPath,
      options,
      (err: Error | null, textures: any, font: any) => {
        if (err) {
          console.error(err)
          reject(err)
        } else {
          textures.forEach((texture: any) => {
            try {
              fs.writeFileSync(`${texture.filename}.png`, texture.texture)
            } catch (e) {
              console.error(e)
              reject(e)
            }
          })

          const fontData = JSON.parse(font.data);

          try {
            if (options.reuse) {
              // Create/Update atlas json file

              // Suppose font name format: [fontFaceName]-[fontWeight]
              let fontWeight = fontNameNoExt.includes(fontFaceName)
                ? fontNameNoExt
                    .split("-")
                    .filter((f) => f !== fontFaceName)?.[0] || fontNameNoExt
                : fontNameNoExt;

              if (!fontWeightNames.includes(fontWeight)) {
                console.log(chalk.yellow(`${chalk.bold(fontWeight)} is not following the format ${chalk.bold('[fontFaceName]-[fontWeight].[ext]')} or ${chalk.bold('[fontFaceName]')} is not defined correctly, your font may not working correctly`));
              }

              fontWeight = fontWeight.toLowerCase();
              let atlasJsonData;
              const { ...restFontData } = fontData;
              if (fs.existsSync(jsonPath)) {
                atlasJsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
                atlasJsonData[fontWeight] = restFontData;
              } else {
                atlasJsonData = { [fontWeight]: restFontData };
              }

              fs.writeFileSync(jsonPath, JSON.stringify(atlasJsonData, null, 2));

              // Create/Update atlas config file
              fs.writeFileSync(options.reuse, JSON.stringify(font.settings, null, '\t'));
            } else {
              // Create atlas json file
              fs.writeFileSync(jsonPath, font.data);
            }

            resolve(fontData);
          } catch (e) {
            console.error(err)
            reject(e)
          }
        }
      }
    )
  })
}
