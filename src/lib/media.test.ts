import { describe, expect, it } from "vitest";
import {
  parseImageDimensions,
  parseJpegDimensions,
  parsePngDimensions,
  parseWebpDimensions,
  sniffImageBuffer,
} from "./media";

describe("parseJpegDimensions", () => {
  it("parses baseline SOF0 JPEG dimensions correctly", () => {
    // Construct minimal valid JPEG headers with SOF0 marker
    const width = 1920;
    const height = 1080;
    const buf = new Uint8Array([
      0xff, 0xd8, // SOI
      0xff, 0xe0, 0x00, 0x10, // APP0 marker length 16
      0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
      0xff, 0xc0, // SOF0 marker
      0x00, 0x11, // length 17
      0x08, // precision 8
      (height >> 8) & 0xff, height & 0xff, // height
      (width >> 8) & 0xff, width & 0xff, // width
      0x03, // 3 components
      0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
      0xff, 0xd9, // EOI
    ]);

    expect(sniffImageBuffer(buf)).toBe("image/jpeg");
    expect(parseJpegDimensions(buf)).toEqual({ width: 1920, height: 1080 });
    expect(parseImageDimensions(buf)).toEqual({ width: 1920, height: 1080 });
  });

  it("returns null on truncated or invalid JPEG", () => {
    expect(parseJpegDimensions(new Uint8Array([0xff, 0xd8]))).toBe(null);
    expect(parseJpegDimensions(new Uint8Array([0x00, 0x00, 0x00, 0x00]))).toBe(null);
  });
});

describe("parsePngDimensions", () => {
  it("parses IHDR PNG dimensions correctly", () => {
    const width = 800;
    const height = 600;
    const buf = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
      0x00, 0x00, 0x00, 0x0d, // IHDR chunk length 13
      0x49, 0x48, 0x44, 0x52, // "IHDR"
      (width >> 24) & 0xff, (width >> 16) & 0xff, (width >> 8) & 0xff, width & 0xff,
      (height >> 24) & 0xff, (height >> 16) & 0xff, (height >> 8) & 0xff, height & 0xff,
      0x08, 0x06, 0x00, 0x00, 0x00,
    ]);

    expect(sniffImageBuffer(buf)).toBe("image/png");
    expect(parsePngDimensions(buf)).toEqual({ width: 800, height: 600 });
    expect(parseImageDimensions(buf)).toEqual({ width: 800, height: 600 });
  });
});

describe("parseWebpDimensions", () => {
  it("parses VP8 lossy WebP dimensions correctly", () => {
    const width = 1280;
    const height = 720;
    const buf = new Uint8Array(32);
    buf.set([0x52, 0x49, 0x46, 0x46]); // RIFF
    buf.set([0x57, 0x45, 0x42, 0x50], 8); // WEBP
    buf.set([0x56, 0x50, 0x38, 0x20], 12); // "VP8 "
    buf[23] = 0x9d;
    buf[24] = 0x01;
    buf[25] = 0x2a;
    buf[26] = width & 0xff;
    buf[27] = (width >> 8) & 0x3f;
    buf[28] = height & 0xff;
    buf[29] = (height >> 8) & 0x3f;

    expect(sniffImageBuffer(buf)).toBe("image/webp");
    expect(parseWebpDimensions(buf)).toEqual({ width: 1280, height: 720 });
    expect(parseImageDimensions(buf)).toEqual({ width: 1280, height: 720 });
  });

  it("parses VP8X extended WebP dimensions correctly", () => {
    const width = 1600;
    const height = 900;
    const buf = new Uint8Array(32);
    buf.set([0x52, 0x49, 0x46, 0x46]); // RIFF
    buf.set([0x57, 0x45, 0x42, 0x50], 8); // WEBP
    buf.set([0x56, 0x50, 0x38, 0x58], 12); // "VP8X"
    // width - 1 (24-bit LE)
    const w = width - 1;
    buf[24] = w & 0xff;
    buf[25] = (w >> 8) & 0xff;
    buf[26] = (w >> 16) & 0xff;
    // height - 1 (24-bit LE)
    const h = height - 1;
    buf[27] = h & 0xff;
    buf[28] = (h >> 8) & 0xff;
    buf[29] = (h >> 16) & 0xff;

    expect(sniffImageBuffer(buf)).toBe("image/webp");
    expect(parseWebpDimensions(buf)).toEqual({ width: 1600, height: 900 });
    expect(parseImageDimensions(buf)).toEqual({ width: 1600, height: 900 });
  });
});
