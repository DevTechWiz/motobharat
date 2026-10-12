import { describe, expect, it } from "vitest";
import { sniffImageBuffer } from "./media";
import { isBlockedIp } from "./url-image";

describe("isBlockedIp", () => {
  it("blocks IPv4 loopback, private, link-local, CGNAT and unspecified", () => {
    for (const ip of [
      "127.0.0.1",
      "127.10.0.9",
      "10.1.2.3",
      "172.16.0.1",
      "172.31.255.255",
      "192.168.1.1",
      "169.254.169.254",
      "100.64.0.1",
      "100.127.255.255",
      "0.0.0.0",
      "::ffff:127.0.0.1",
      "::ffff:192.168.0.1",
    ]) {
      expect(isBlockedIp(ip), ip).toBe(true);
    }
  });

  it("allows public IPv4 and boundary addresses", () => {
    for (const ip of ["8.8.8.8", "1.1.1.1", "172.32.0.1", "172.15.255.255", "100.63.0.1", "100.128.0.1"]) {
      expect(isBlockedIp(ip), ip).toBe(false);
    }
  });

  it("blocks IPv6 loopback, ULA, link-local and multicast", () => {
    for (const ip of ["::1", "::", "fc00::1", "fd12:3456::1", "fe80::1", "ff02::1"]) {
      expect(isBlockedIp(ip), ip).toBe(true);
    }
  });

  it("allows public IPv6", () => {
    expect(isBlockedIp("2606:4700:4700::1111")).toBe(false);
    expect(isBlockedIp("2400:cb00::1")).toBe(false);
  });

  it("blocks unparseable input", () => {
    expect(isBlockedIp("not-an-ip")).toBe(true);
    expect(isBlockedIp("1.2.3")).toBe(true);
  });
});

describe("sniffImageBuffer", () => {
  it("detects JPEG", () => {
    expect(sniffImageBuffer(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
  });

  it("detects WebP", () => {
    const head = new Uint8Array(16);
    head.set([0x52, 0x49, 0x46, 0x46]); // RIFF
    head.set([0x57, 0x45, 0x42, 0x50], 8); // WEBP
    expect(sniffImageBuffer(head)).toBe("image/webp");
  });

  it("detects PNG", () => {
    const head = new Uint8Array(16);
    head.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(sniffImageBuffer(head)).toBe("image/png");
  });

  it("rejects SVG and other payloads", () => {
    expect(sniffImageBuffer(new TextEncoder().encode("<svg xmlns='…'><script>"))).toBe(null);
    expect(sniffImageBuffer(new Uint8Array([0x47, 0x49, 0x46, 0x38]))).toBe(null); // GIF
  });
});
