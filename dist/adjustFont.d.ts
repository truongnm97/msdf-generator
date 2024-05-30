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
 * @param fontInfo
 */
export declare function adjustFont(fontInfo: SdfFontInfo): Promise<void>;
