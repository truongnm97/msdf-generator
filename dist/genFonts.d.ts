/**
 * @param fontFaceName if `singleAtlas` is true, this will be used for naming the single atlas,
 * and font name format should follow this format: `[fontFaceName]-[fontWeight].[ext]`. For ex: Inter-Bold.tff
 */
export default function generateFonts(singleAtlas?: boolean, fontFaceName?: string, fontSrcDir?: string, fontDstDir?: string): Promise<void>;
