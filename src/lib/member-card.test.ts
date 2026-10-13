import { describe, expect, it } from "vitest";
import { isUuid, memberIdFromUserId, verifyUrlForUser } from "./member-card";

describe("memberIdFromUserId", () => {
  it("derives a stable MB-XXXXXX id from the uuid", () => {
    expect(memberIdFromUserId("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01")).toBe("MB-AAAAAA");
  });

  it("is deterministic for the same input", () => {
    const id = "123e4567-e89b-12d3-a456-426614174000";
    expect(memberIdFromUserId(id)).toBe(memberIdFromUserId(id));
  });

  it("differs for different users", () => {
    expect(memberIdFromUserId("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01")).not.toBe(
      memberIdFromUserId("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb01"),
    );
  });

  it("uses only the hex prefix, uppercased", () => {
    expect(memberIdFromUserId("123e4567-e89b-12d3-a456-426614174000")).toBe("MB-123E45");
  });
});

describe("verifyUrlForUser", () => {
  it("builds the absolute verify URL carrying the full uuid", () => {
    expect(verifyUrlForUser("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01")).toBe(
      "https://motobharat.co/verify/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01",
    );
  });

  it("strips a trailing slash from a custom base", () => {
    expect(verifyUrlForUser("abc", "https://example.com/")).toBe(
      "https://example.com/verify/abc",
    );
  });
});

describe("isUuid", () => {
  it("accepts a valid uuid", () => {
    expect(isUuid("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01")).toBe(true);
  });

  it("rejects member ids and junk", () => {
    expect(isUuid("MB-AAAAAA")).toBe(false);
    expect(isUuid("not-a-uuid")).toBe(false);
    expect(isUuid("")).toBe(false);
  });
});
