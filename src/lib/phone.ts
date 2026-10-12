/**
 * Indian Mobile Phone Formatting & Validation Utilities
 * Only Indian mobile numbers (+91, 10 digits starting with 6, 7, 8, or 9) are supported.
 */

/**
 * Autocorrects and formats raw user input into an Indian mobile number.
 * Examples:
 * - "868195156" -> "+91 86819 5156"
 * - "+91868195156" -> "+91 86819 5156"
 * - "8681951567" -> "+91 86819 51567"
 * - "08681951567" -> "+91 86819 51567"
 * - "918681951567" -> "+91 86819 51567"
 */
export function formatIndianPhone(raw: string): string {
  if (!raw) return "";

  const trimmed = raw.trim();
  if (trimmed === "" || trimmed === "+" || trimmed === "+9" || trimmed === "+91") {
    // If the user intentionally cleared down to just the prefix, allow blank
    return trimmed.startsWith("+") ? "+91 " : "";
  }

  let nationalDigits = "";

  if (trimmed.startsWith("+91")) {
    // User already typed +91... extract digits following it
    nationalDigits = trimmed.slice(3).replace(/\D/g, "").slice(0, 10);
  } else if (trimmed.startsWith("+")) {
    // Non-Indian country code typed with +: force/autocorrect to +91
    nationalDigits = trimmed.replace(/\D/g, "");
    if (nationalDigits.startsWith("91")) {
      nationalDigits = nationalDigits.slice(2);
    }
    nationalDigits = nationalDigits.slice(0, 10);
  } else {
    // Raw digits typed without +
    const allDigits = trimmed.replace(/\D/g, "");
    if (allDigits.length > 10 && allDigits.startsWith("91")) {
      nationalDigits = allDigits.slice(2, 12);
    } else if (allDigits.length > 10 && allDigits.startsWith("0")) {
      nationalDigits = allDigits.slice(1, 11);
    } else {
      nationalDigits = allDigits.slice(0, 10);
    }
  }

  if (nationalDigits.length === 0) {
    return "+91 ";
  }

  if (nationalDigits.length <= 5) {
    return `+91 ${nationalDigits}`;
  }

  return `+91 ${nationalDigits.slice(0, 5)} ${nationalDigits.slice(5)}`;
}

export interface IndianPhoneValidation {
  valid: boolean;
  digits: string;
  formatted: string;
  error?: string;
}

/**
 * Validates and normalizes an Indian phone number.
 * Must be 10 digits starting with 6, 7, 8, or 9 with country code +91.
 */
export function validateIndianPhone(value: string): IndianPhoneValidation {
  const trimmed = value.trim();
  if (!trimmed) {
    return {
      valid: false,
      digits: "",
      formatted: "",
      error: "Phone number is required.",
    };
  }

  // Reject explicit non-Indian country codes like +1, +44, +971
  if (trimmed.startsWith("+") && !trimmed.startsWith("+91")) {
    return {
      valid: false,
      digits: "",
      formatted: "",
      error: "Only Indian mobile numbers (+91) are supported.",
    };
  }

  // Extract digits
  let digits = trimmed.replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length === 12) {
    digits = digits.slice(2);
  } else if (digits.startsWith("0") && digits.length === 11) {
    digits = digits.slice(1);
  }

  if (digits.length !== 10) {
    return {
      valid: false,
      digits,
      formatted: "",
      error: `Indian mobile number must be 10 digits (got ${digits.length}).`,
    };
  }

  const firstDigit = digits.charAt(0);
  if (!["6", "7", "8", "9"].includes(firstDigit)) {
    return {
      valid: false,
      digits,
      formatted: "",
      error: "Indian mobile number must start with 6, 7, 8, or 9.",
    };
  }

  const formatted = `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;

  return {
    valid: true,
    digits,
    formatted,
  };
}

/**
 * Returns true if the given value is a valid 10-digit Indian mobile number.
 */
export function isValidIndianPhone(value: string): boolean {
  return validateIndianPhone(value).valid;
}
