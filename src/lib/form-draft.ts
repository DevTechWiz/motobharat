/**
 * Form Draft Persistence Utilities
 *
 * Provides safe localStorage caching for multi-step registration forms
 * (Setup & KYC), ensuring users don't lose data on tab closes, crashes,
 * or accidental navigation.
 */

export interface FormDraftMeta {
  savedAt: number;
  data: Record<string, string | boolean>;
}

/**
 * Safely retrieves and parses a stored draft from localStorage.
 */
export function getStoredDraft<T extends Record<string, unknown> = Record<string, unknown>>(
  key: string
): { data: T; savedAt: number } | null {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.data) {
      return parsed;
    }
    // Backward compatibility if raw data was stored directly
    if (parsed && typeof parsed === "object") {
      return { data: parsed as T, savedAt: Date.now() };
    }
    return null;
  } catch (err) {
    console.warn(`[form-draft] Failed to read draft for "${key}":`, err);
    return null;
  }
}

/**
 * Safely persists a form draft to localStorage.
 */
export function setStoredDraft(
  key: string,
  data: Record<string, string | boolean>
): boolean {
  if (typeof window === "undefined" || !window.localStorage) {
    return false;
  }
  try {
    const payload: FormDraftMeta = {
      savedAt: Date.now(),
      data,
    };
    window.localStorage.setItem(key, JSON.stringify(payload));
    return true;
  } catch (err) {
    console.warn(`[form-draft] Failed to write draft for "${key}":`, err);
    return false;
  }
}

/**
 * Safely removes a form draft from localStorage.
 */
export function removeStoredDraft(key: string): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }
  try {
    window.localStorage.removeItem(key);
  } catch (err) {
    console.warn(`[form-draft] Failed to remove draft for "${key}":`, err);
  }
}

/**
 * Serializes form element values into a key-value dictionary.
 * Skips binary file inputs and internal Next.js action tokens.
 */
export function serializeForm(form: HTMLFormElement): Record<string, string | boolean> {
  const result: Record<string, string | boolean> = {};

  const elements = Array.from(form.elements) as (
    | HTMLInputElement
    | HTMLSelectElement
    | HTMLTextAreaElement
  )[];

  for (const el of elements) {
    const name = el.name;
    if (!name) continue;
    // Skip framework internal fields or file inputs
    if (name.startsWith("$ACTION_ID") || name.startsWith("$$") || el.type === "file") {
      continue;
    }

    if (el.type === "checkbox") {
      result[name] = (el as HTMLInputElement).checked;
    } else if (el.type === "radio") {
      if ((el as HTMLInputElement).checked) {
        result[name] = el.value;
      }
    } else {
      result[name] = el.value;
    }
  }

  return result;
}

/**
 * Checks whether the draft contains meaningful differences compared to a baseline.
 */
export function isDraftDifferent(
  draft: Record<string, unknown>,
  baseline: Record<string, unknown> | null | undefined
): boolean {
  if (!draft || Object.keys(draft).length === 0) return false;

  for (const [key, draftVal] of Object.entries(draft)) {
    if (key.startsWith("$") || key === "edit") continue;
    const baseVal = baseline ? baseline[key] : undefined;

    // Normalize empty strings and null/undefined
    const normDraft = draftVal === "" ? null : draftVal;
    const normBase = baseVal === "" || baseVal === undefined ? null : baseVal;

    // For booleans, compare strictly
    if (typeof normDraft === "boolean") {
      if (Boolean(normDraft) !== Boolean(normBase)) {
        return true;
      }
    } else if (normDraft != null && normDraft !== normBase) {
      return true;
    }
  }

  return false;
}
