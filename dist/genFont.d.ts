/**
 * Set the paths for the font source and destination directories.
 *
 * @param srcDir
 * @param dstDir
 */
export declare function setGeneratePaths(srcDir: string, dstDir: string): void;
export type SdfFontType = 'sdf' | 'ssdf' | 'msdf' | 'mtsdf';
export interface SdfFontInfo {
    fontName: string;
    fieldType: SdfFontType;
    fontPath: string;
    jsonPath: string;
    pngPath: string;
    dstDir: string;
    fontData: any;
    fontWeight: string;
}
/**
 * Generates a font file in the specified field type.
 * @param fontFileName - The name of the font.
 * @param fieldType - The type of the font field (msdf, ssdf or mtsdf).
 * @param singleAtlas - Combine all fonts in one atlas.
 * @returns {Promise<void>} - A promise that resolves when the font generation is complete.
 */
export declare function genFont(fontFileName: string, fieldType: SdfFontType, singleAtlas?: boolean, fontFaceName?: string): Promise<SdfFontInfo | null>;
