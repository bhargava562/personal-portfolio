/**
 * Security utilities for input sanitization and XSS prevention.
 */

const DANGEROUS_SCHEMES = ["javascript:", "data:", "vbscript:"];
const ALLOWED_PROTOCOLS = ["http:", "https:", "mailto:", "tel:"];

/**
 * Checks whether a given URL is safe to use in href or src attributes.
 * Explicitly rejects javascript:, data:, and protocol-relative schemes.
 */
export function isSafeUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string") {
    return false;
  }

  // Remove whitespace and ASCII control characters
  const sanitized = url.trim().replace(/[\u0000-\u001F\u007F-\u009F\s]/g, "");
  const lower = sanitized.toLowerCase();

  // Explicit rejection of dangerous schemes
  for (const scheme of DANGEROUS_SCHEMES) {
    if (lower.startsWith(scheme)) {
      return false;
    }
  }

  // Reject protocol-relative URLs (e.g. //attacker.com or /\attacker.com)
  if (sanitized.startsWith("//") || sanitized.startsWith("/\\")) {
    return false;
  }

  // Allow safe relative paths and anchor links
  if (
    sanitized.startsWith("/") ||
    sanitized.startsWith("./") ||
    sanitized.startsWith("../") ||
    sanitized.startsWith("#")
  ) {
    return true;
  }

  // For absolute URLs, parse and check protocol
  try {
    const parsed = new URL(sanitized);
    return ALLOWED_PROTOCOLS.includes(parsed.protocol);
  } catch {
    // If not a valid absolute URL, ensure no scheme exists
    return !sanitized.includes(":");
  }
}

/**
 * Sanitizes a URL for use in href or src attributes.
 * Returns the sanitized URL if safe, or undefined if unsafe.
 */
export function sanitizeUrl(url: string | null | undefined): string | undefined {
  if (!url || !isSafeUrl(url)) {
    return undefined;
  }
  return url.trim().replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
}
