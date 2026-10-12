import { describe, it, expect } from "vitest";
import { formatIndianPhone, validateIndianPhone, isValidIndianPhone } from "./phone";

describe("formatIndianPhone (autocorrection & formatting)", () => {
  it("autocorrects numbers typed without +91 prefix", () => {
    expect(formatIndianPhone("868195156")).toBe("+91 86819 5156");
    expect(formatIndianPhone("8681951567")).toBe("+91 86819 51567");
    expect(formatIndianPhone("9876543210")).toBe("+91 98765 43210");
  });

  it("handles numbers typed with +91 prefix without duplicating it", () => {
    expect(formatIndianPhone("+91868195156")).toBe("+91 86819 5156");
    expect(formatIndianPhone("+918681951567")).toBe("+91 86819 51567");
    expect(formatIndianPhone("+91 98765 43210")).toBe("+91 98765 43210");
  });

  it("handles numbers pasted with 91 prefix", () => {
    expect(formatIndianPhone("918681951567")).toBe("+91 86819 51567");
  });

  it("handles numbers pasted with leading 0", () => {
    expect(formatIndianPhone("08681951567")).toBe("+91 86819 51567");
  });

  it("caps input at 10 national digits", () => {
    expect(formatIndianPhone("9876543210999")).toBe("+91 98765 43210");
  });

  it("handles empty or partial inputs gracefully", () => {
    expect(formatIndianPhone("")).toBe("");
    expect(formatIndianPhone("+91")).toBe("+91 ");
  });
});

describe("validateIndianPhone", () => {
  it("validates correct 10-digit Indian numbers starting with 6, 7, 8, or 9", () => {
    const res1 = validateIndianPhone("+91 86819 51567");
    expect(res1.valid).toBe(true);
    expect(res1.formatted).toBe("+91 86819 51567");

    const res2 = validateIndianPhone("8681951567");
    expect(res2.valid).toBe(true);
    expect(res2.formatted).toBe("+91 86819 51567");

    const res3 = validateIndianPhone("+919876543210");
    expect(res3.valid).toBe(true);

    const res4 = validateIndianPhone("7012345678");
    expect(res4.valid).toBe(true);

    const res5 = validateIndianPhone("6234567890");
    expect(res5.valid).toBe(true);
  });

  it("rejects non-Indian country codes", () => {
    const res = validateIndianPhone("+1 555 123 4567");
    expect(res.valid).toBe(false);
    expect(res.error).toContain("Only Indian mobile numbers (+91) are supported");
  });

  it("rejects invalid lengths", () => {
    const res1 = validateIndianPhone("868195156");
    expect(res1.valid).toBe(false);
    expect(res1.error).toContain("must be 10 digits");

    const res2 = validateIndianPhone("868195156789");
    expect(res2.valid).toBe(false);
    expect(res2.error).toContain("must be 10 digits");
  });

  it("rejects numbers starting with invalid digits (0-5)", () => {
    const res1 = validateIndianPhone("5123456789");
    expect(res1.valid).toBe(false);
    expect(res1.error).toContain("must start with 6, 7, 8, or 9");

    const res2 = validateIndianPhone("1234567890");
    expect(res2.valid).toBe(false);
  });

  it("checks isValidIndianPhone helper", () => {
    expect(isValidIndianPhone("+91 98765 43210")).toBe(true);
    expect(isValidIndianPhone("9876543210")).toBe(true);
    expect(isValidIndianPhone("+1 9876543210")).toBe(false);
    expect(isValidIndianPhone("1234567890")).toBe(false);
  });
});

