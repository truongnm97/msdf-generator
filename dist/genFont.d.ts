/**
 * Set the paths for the font source and destination directories.
 *
 * @param srcDir
 * @param dstDir
 */
export declare function setGeneratePaths(srcDir: string, dstDir: string): void;
export interface SdfFontInfo {
    fontName: string;
    fieldType: 'ssdf' | 'msdf';
    fontPath: string;
    jsonPath: string;
    pngPath: string;
    dstDir: string;
}
/**
 * Generates a font file in the specified field type.
 * @param fontFileName - The name of the font.
 * @param fieldType - The type of the font field (msdf or ssdf).
 * @returns {Promise<void>} - A promise that resolves when the font generation is complete.
 */
export declare function genFont(fontFileName: string, fieldType: 'ssdf' | 'msdf'): Promise<SdfFontInfo | null>;
