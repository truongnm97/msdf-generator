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
import generateBMFont from 'msdf-bmfont-xml';
const fontWeightNames = ['Thin', 'ExtraLight', 'Light', 'Regular', 'Medium', 'SemiBold', 'Bold', 'ExtraBold', 'Black'];
let fontSrcDir = '';
let fontDstDir = '';
let overridesPath = '';
let charsetPath = '';
/**
 * Set the paths for the font source and destination directories.
 *
 * @param srcDir
 * @param dstDir
 */
export function setGeneratePaths(srcDir, dstDir) {
    fontSrcDir = srcDir;
    fontDstDir = dstDir;
    overridesPath = path.join(fontSrcDir, 'overrides.json');
    charsetPath = path.join(fontSrcDir, 'charset.txt');
}
/**
 * Generates a font file in the specified field type.
 * @param fontFileName - The name of the font.
 * @param fieldType - The type of the font field (msdf, ssdf or mtsdf).
 * @param singleAtlas - Combine all fonts in one atlas.
 * @returns {Promise<void>} - A promise that resolves when the font generation is complete.
 */
export async function genFont(fontFileName, fieldType, singleAtlas, fontFaceName = 'atlas') {
    console.log(chalk.blue(`Generating ${fieldType} font from ${chalk.bold(fontFileName)}...`));
    if (fieldType !== 'msdf' && fieldType !== 'ssdf' && fieldType !== 'mtsdf' && fieldType !== 'sdf') {
        console.log(`Invalid field type ${fieldType}`);
        return null;
    }
    const fontPath = path.join(fontSrcDir, fontFileName);
    if (!fs.existsSync(fontPath)) {
        console.log(`Font ${fontFileName} does not exist`);
        return null;
    }
    let bmfont_field_type = fieldType;
    if (bmfont_field_type === 'ssdf') {
        bmfont_field_type = 'sdf';
    }
    const fontNameNoExt = fontFileName.split('.')[0];
    const fontName = singleAtlas ? fontFaceName : fontNameNoExt;
    const overrides = fs.existsSync(overridesPath) ? JSON.parse(fs.readFileSync(overridesPath, 'utf8')) : {};
    const font_size = overrides[fontName]?.[fieldType]?.fontSize || 42;
    const distance_range = overrides[fontName]?.[fieldType]?.distanceRange || 4;
    const configPath = path.join(fontDstDir, `${fontName}.${fieldType}.cfg`);
    const pngPath = path.join(fontDstDir, `${fontName}.${fieldType}.png`);
    const jsonPath = path.join(fontDstDir, `${fontName}.${fieldType}.json`);
    let options = {
        fieldType: bmfont_field_type,
        outputType: 'json',
        roundDecimal: 6,
        smartSize: true,
        pot: true,
        fontSize: font_size,
        distanceRange: distance_range,
        rtl: true,
        textureSize: [2048, 2048],
        filename: pngPath,
    };
    if (singleAtlas) {
        options.reuse = configPath;
    }
    if (fs.existsSync(charsetPath)) {
        options['charset'] = fs.readFileSync(charsetPath, 'utf8');
    }
    await generateFont({
        fontSrcPath: fontPath,
        fontDestPath: fontDstDir,
        jsonPath,
        fontFaceName,
        fontNameNoExt,
        options
    });
    const info = {
        fontName,
        fieldType,
        jsonPath,
        pngPath,
        fontPath,
        dstDir: fontDstDir,
    };
    return info;
}
const generateFont = ({ fontFaceName, jsonPath, fontNameNoExt, options, fontSrcPath, fontDestPath, }) => {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(fontDestPath)) {
            fs.mkdirSync(fontDestPath, { recursive: true });
        }
        generateBMFont(fontSrcPath, options, (err, textures, font) => {
            if (err) {
                console.error(err);
                reject(err);
            }
            else {
                textures.forEach((texture) => {
                    try {
                        fs.writeFileSync(`${texture.filename}.png`, texture.texture);
                    }
                    catch (e) {
                        console.error(e);
                        reject(e);
                    }
                });
                try {
                    if (options.reuse) {
                        // Create/Update atlas json file
                        const fontData = JSON.parse(font.data);
                        // Suppose font name format: [fontFaceName]-[fontWeight]
                        const fontWeight = fontNameNoExt.includes(fontFaceName)
                            ? fontNameNoExt
                                .split("-")
                                .filter((f) => f !== fontFaceName)?.[0] || fontNameNoExt
                            : fontNameNoExt;
                        if (!fontWeightNames.includes(fontWeight)) {
                            console.log(chalk.yellow(`${chalk.bold(fontWeight)} is not following the format ${chalk.bold('[fontFaceName]-[fontWeight].[ext]')} or ${chalk.bold('[fontFaceName]')} is not defined correctly, your font may not working correctly`));
                        }
                        let atlasJsonData;
                        if (fs.existsSync(jsonPath)) {
                            atlasJsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
                            atlasJsonData.chars[fontWeight] = fontData.chars;
                        }
                        else {
                            atlasJsonData = fontData;
                            atlasJsonData.chars = { [fontWeight]: fontData.chars };
                            atlasJsonData.info.face = fontFaceName;
                        }
                        fs.writeFileSync(jsonPath, JSON.stringify(atlasJsonData, null, 2));
                        // Create/Update atlas config file
                        fs.writeFileSync(options.reuse, JSON.stringify(font.settings, null, '\t'));
                    }
                    else {
                        // Create atlas json file
                        fs.writeFileSync(jsonPath, font.data);
                    }
                    resolve();
                }
                catch (e) {
                    console.error(err);
                    reject(e);
                }
            }
        });
    });
};
//# sourceMappingURL=genFont.js.map