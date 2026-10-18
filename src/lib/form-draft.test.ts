import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getStoredDraft,
  setStoredDraft,
  removeStoredDraft,
  isDraftDifferent,
  serializeForm,
} from "./form-draft";

describe("form-draft", () => {
  const mockStorage: Record<string, string> = {};

  beforeEach(() => {
    for (const key of Object.keys(mockStorage)) {
      delete mockStorage[key];
    }

    vi.stubGlobal("localStorage", {
      getItem: (key: string) => mockStorage[key] ?? null,
      setItem: (key: string, value: string) => {
        mockStorage[key] = value;
      },
      removeItem: (key: string) => {
        delete mockStorage[key];
      },
      clear: () => {
        for (const key of Object.keys(mockStorage)) {
          delete mockStorage[key];
        }
      },
    });

    vi.stubGlobal("window", {
      localStorage: globalThis.localStorage,
    });
  });

  it("stores and retrieves a form draft", () => {
    const key = "test_draft_1";
    const data = { display_name: "Rider Warangal", phone: "+91 98765 43210" };

    const ok = setStoredDraft(key, data);
    expect(ok).toBe(true);

    const draft = getStoredDraft(key);
    expect(draft).not.toBeNull();
    expect(draft?.data).toEqual(data);
    expect(draft?.savedAt).toBeTypeOf("number");
  });

  it("safely removes a stored draft", () => {
    const key = "test_draft_2";
    setStoredDraft(key, { city: "Warangal" });
    expect(getStoredDraft(key)).not.toBeNull();

    removeStoredDraft(key);
    expect(getStoredDraft(key)).toBeNull();
  });

  it("handles malformed JSON gracefully", () => {
    mockStorage["bad_json"] = "not-a-valid-json";
    const draft = getStoredDraft("bad_json");
    expect(draft).toBeNull();
  });

  it("detects differences between draft and baseline", () => {
    const baseline = {
      display_name: "Old Name",
      city: "Warangal",
      declaration_confirmed: false,
    };

    // Identical
    expect(isDraftDifferent({ display_name: "Old Name", city: "Warangal" }, baseline)).toBe(false);

    // Modified string
    expect(isDraftDifferent({ display_name: "New Name" }, baseline)).toBe(true);

    // Modified boolean
    expect(isDraftDifferent({ declaration_confirmed: true }, baseline)).toBe(true);

    // Empty draft
    expect(isDraftDifferent({}, baseline)).toBe(false);
  });

  it("serializes form inputs correctly", () => {
    const mockForm = {
      elements: [
        { name: "city", type: "text", value: "Hyderabad" },
        { name: "confirmed", type: "checkbox", checked: true },
        { name: "dl_document", type: "file", value: "test.png" },
        { name: "$ACTION_ID_123", type: "hidden", value: "internal" },
        { name: "", type: "text", value: "ignored" },
      ],
    } as unknown as HTMLFormElement;

    const serialized = serializeForm(mockForm);
    expect(serialized).toEqual({
      city: "Hyderabad",
      confirmed: true,
    });
    expect(serialized.dl_document).toBeUndefined();
    expect(serialized["$ACTION_ID_123"]).toBeUndefined();
  });
});
