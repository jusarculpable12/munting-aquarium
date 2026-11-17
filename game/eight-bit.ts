/** RGB332 gives an 8-bit, 256-color palette while retaining the original hues. */
export function applyEightBitPalette(context: CanvasRenderingContext2D) {
  const { width, height } = context.canvas;
  const image = context.getImageData(0, 0, width, height);
  const pixels = image.data;
  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i] = Math.round(pixels[i] / 255 * 7) * 255 / 7;
    pixels[i + 1] = Math.round(pixels[i + 1] / 255 * 7) * 255 / 7;
    pixels[i + 2] = Math.round(pixels[i + 2] / 255 * 3) * 255 / 3;
  }
  context.putImageData(image, 0, 0);
}
