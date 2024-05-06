import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import opentype from 'opentype.js';
import type { SdfFontInfo } from "./genFont.js";

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
export async function adjustFont(fontInfo: SdfFontInfo) {
  console.log(chalk.magenta(`Adjusting ${chalk.bold(path.basename(fontInfo.jsonPath))}...`));
  const [
    jsonFileContents,
    font,
  ] = await Promise.all([
    fs.readFile(fontInfo.jsonPath, 'utf8'),
    opentype.load(fontInfo.fontPath),
  ]);
  const json = JSON.parse(jsonFileContents);
  const distanceField = json.distanceField.distanceRange;
  /**
   * `pad` used by msdf-bmfont-xml
   *
   * (This is really just distanceField / 2 but guarantees a truncated integer result)
   */
  const pad = (distanceField >> 1);

  // Remove 1x pad from the baseline
  json.common.base = json.common.base - pad;

  // Remove 2x pad from the y-offset of every character
  for (const char of json.chars) {
    char.yoffset = char.yoffset - pad - pad;
  }

  const fontMetrics = {
    ascender: font.tables.os2!.sTypoAscender as number,
    descender: font.tables.os2!.sTypoDescender as number,
    lineGap: font.tables.os2!.sTypoLineGap as number,
    unitsPerEm: font.unitsPerEm,
  };

  // Add the font metrics to the JSON
  json.lightningMetrics = fontMetrics;

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