import { describe, expect, it } from "vitest";
import { extractDriveFileId, normalizeImageUrl } from "./image-link";

describe("extractDriveFileId", () => {
  it("extracts ID from Drive viewer links", () => {
    expect(extractDriveFileId("https://drive.google.com/file/d/1zUwlxpAgdcx32tvXVXTkMp-ZpaiSHTL7/view?usp=sharing")).toBe(
      "1zUwlxpAgdcx32tvXVXTkMp-ZpaiSHTL7",
    );
  });

  it("extracts ID from Drive open links", () => {
    expect(extractDriveFileId("https://drive.google.com/open?id=ABC123")).toBe("ABC123");
  });

  it("extracts ID from uc links", () => {
    expect(extractDriveFileId("https://drive.google.com/uc?export=download&id=ABC123")).toBe("ABC123");
    expect(extractDriveFileId("https://drive.google.com/uc?id=XYZ789")).toBe("XYZ789");
  });

  it("extracts ID from lh3 URLs", () => {
    expect(extractDriveFileId("https://lh3.googleusercontent.com/d/ABC123")).toBe("ABC123");
    expect(extractDriveFileId("https://lh3.googleusercontent.com/d/ABC123=s1600-rw")).toBe("ABC123");
  });

  it("returns null for non-Drive hosts", () => {
    expect(extractDriveFileId("https://example.com/photo.jpg")).toBeNull();
    expect(extractDriveFileId("not a url")).toBeNull();
    expect(extractDriveFileId("")).toBeNull();
  });
});

describe("normalizeImageUrl", () => {
  it("rewrites Drive viewer links to Google CDN", () => {
    expect(normalizeImageUrl("https://drive.google.com/file/d/1zUwlxpAgdcx32tvXVXTkMp-ZpaiSHTL7/view?usp=sharing")).toBe(
      "https://lh3.googleusercontent.com/d/1zUwlxpAgdcx32tvXVXTkMp-ZpaiSHTL7",
    );
  });

  it("rewrites Drive open and uc links to Google CDN", () => {
    expect(normalizeImageUrl("https://drive.google.com/open?id=ABC123")).toBe(
      "https://lh3.googleusercontent.com/d/ABC123",
    );
    expect(normalizeImageUrl("https://drive.google.com/uc?export=download&id=ABC123")).toBe(
      "https://lh3.googleusercontent.com/d/ABC123",
    );
  });

  it("leaves non-Drive hosts untouched", () => {
    expect(normalizeImageUrl("https://example.com/photo.jpg")).toBe("https://example.com/photo.jpg");
    expect(normalizeImageUrl("not a url")).toBe("not a url");
    expect(normalizeImageUrl("")).toBe("");
  });
});

