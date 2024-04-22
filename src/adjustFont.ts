import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import type { SdfFontInfo } from "./genFont.js";

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
 * @param font
 */
export function adjustFont(font: SdfFontInfo) {
  console.log(chalk.magenta(`Adjusting ${chalk.bold(path.basename(font.jsonPath))}...`));
  const json = JSON.parse(fs.readFileSync(font.jsonPath, 'utf8'));
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
  fs.writeFileSync(font.jsonPath, JSON.stringify(json, null, 2));
}