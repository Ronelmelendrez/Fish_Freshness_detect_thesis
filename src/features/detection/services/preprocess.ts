/**
 * Pure, worklet-safe helpers that turn a raw camera or model pixel buffer into
 * the model's expected input tensor (640×640×3 float32, normalized 0..1).
 *
 * This module is intentionally dependency-free so it can be called inside a
 * frame processor worklet.
 */

import { model } from '@/config/modelConfig';

export type PixelBuffer = Uint8Array | ArrayBuffer;

export const targetSize = model.inputSize;

/** 4-byte BGRA (common CPU pixel-order for `rgb-bgra-8-bit` frame output). */
export function bgraToRgb(bgra: Uint8Array): Uint8Array {
  const out = new Uint8Array((bgra.length / 4) * 3);
  let o = 0;
  for (let i = 0; i < bgra.length; i += 4) {
    out[o++] = bgra[i + 2]; // R
    out[o++] = bgra[i + 1]; // G
    out[o++] = bgra[i]; // B
  }
  return out;
}

/** 4-byte RGBA -> 3-byte RGB. */
export function rgbaToRgb(rgba: Uint8Array): Uint8Array {
  const out = new Uint8Array((rgba.length / 4) * 3);
  let o = 0;
  for (let i = 0; i < rgba.length; i += 4) {
    out[o++] = rgba[i];
    out[o++] = rgba[i + 1];
    out[o++] = rgba[i + 2];
  }
  return out;
}

/**
 * Nearest-neighbour scale of an RGB image to a square target. Kept inside the
 * worklet for frame-rate; bilinear would cost more without measurable gains
 * for a 640px classifier input.
 */
export function resizeRgbToSquare(
  rgb: Uint8Array,
  srcWidth: number,
  srcHeight: number,
  target = targetSize,
): Float32Array {
  const out = new Float32Array(target * target * 3);
  const xScale = srcWidth / target;
  const yScale = srcHeight / target;
  let o = 0;
  for (let y = 0; y < target; y++) {
    const srcY = Math.min(srcHeight - 1, Math.floor(y * yScale)) * srcWidth;
    for (let x = 0; x < target; x++) {
      const src = (srcY + Math.min(srcWidth - 1, Math.floor(x * xScale))) * 3;
      out[o++] = model.normalize(rgb[src]);
      out[o++] = model.normalize(rgb[src + 1]);
      out[o++] = model.normalize(rgb[src + 2]);
    }
  }
  return out;
}

/**
 * Full pipeline for a frame-format pixel buffer:
 * convert 4-channel -> RGB, downscale -> square, normalize -> float32.
 *
 * See BOUNDING-BOX NOTE in `frameProcessor.ts` for frame pixel order caveats.
 */
export function prepareFrameTensor(
  buffer: PixelBuffer,
  width: number,
  height: number,
  bytesPerRow?: number,
): Float32Array {
  const bytes = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer;
  const stride = bytesPerRow ?? width * 4;
  const rgb = new Uint8Array(width * height * 3);
  let o = 0;
  for (let y = 0; y < height; y++) {
    const rowStart = y * stride;
    for (let x = 0; x < width; x++) {
      const i = rowStart + x * 4;
      rgb[o++] = bytes[i + 2]; // R
      rgb[o++] = bytes[i + 1]; // G
      rgb[o++] = bytes[i]; // B
    }
  }
  return resizeRgbToSquare(rgb, width, height);
}