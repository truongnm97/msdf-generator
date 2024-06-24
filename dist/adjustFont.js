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
import opentype from 'opentype.js';
const metricsSubDir = 'metrics';
/**
 * Adjusts the font data for the generated fonts.
 *
 * @remarks
 * A bug in the msdf-bmfont-xml package causes both the baseline and y-offsets
 * of every character to be incorrect which results in the text being rendered
 * out of intended alignment. This function corrects that data.
 *
 * See the following GitHub issue for more information:
 * https://github.com/soimy/msdf-bmfont-xml/pull/93
 *
 * @param fontInfo
 */
export async function adjustFont(fontInfo) {
    console.log(chalk.magenta(`Adjusting ${chalk.bold(path.basename(fontInfo.jsonPath))}...`));
    const [jsonFileContents, font,] = await Promise.all([
        fs.readFile(fontInfo.jsonPath, 'utf8'),
        opentype.load(fontInfo.fontPath),
    ]);
    const json = JSON.parse(jsonFileContents);
    let fontData = fontInfo.fontWeight ? json[fontInfo.fontWeight] : json;
    const distanceField = fontData.distanceField.distanceRange;
    /**
     * `pad` used by msdf-bmfont-xml
     *
     * (This is really just distanceField / 2 but guarantees a truncated integer result)
     */
    const pad = (distanceField >> 1);
    // Remove 1x pad from the baseline
    fontData.common.base = fontData.common.base - pad;
    // Remove 2x pad from the y-offset of every character
    for (const char of fontData.chars) {
        char.yoffset = char.yoffset - pad - pad;
    }
    const fontMetrics = {
        ascender: font.tables.os2.sTypoAscender,
        descender: font.tables.os2.sTypoDescender,
        lineGap: font.tables.os2.sTypoLineGap,
        unitsPerEm: font.unitsPerEm,
    };
    // Add the font metrics to the JSON
    fontData.lightningMetrics = fontMetrics;
    // And also write the metrics to a separate file
    const metricsDir = path.join(fontInfo.dstDir, metricsSubDir);
    const metricsFilePath = path.join(metricsDir, `${fontInfo.fontName}.metrics.json`);
    // Write the metrics file
    await Promise.all([
        (async () => {
            await fs.ensureDir(metricsDir);
            await fs.writeFile(metricsFilePath, JSON.stringify(fontMetrics, null, 2));
        })(),
        fs.writeFile(fontInfo.jsonPath, JSON.stringify(json, null, 2))
    ]);
}
//# sourceMappingURL=adjustFont.js.map