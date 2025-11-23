import { Timestamp } from "firebase/firestore";

/**
 * Sanitize data for Firestore by:
 * - Removing undefined values (Firestore doesn't support undefined)
 * - Converting Date objects to Firestore Timestamps
 * - Recursively processing nested objects and arrays
 * - Preserving null values (valid in Firestore)
 */
export function sanitizeForFirestore(value: any): any {
  // Handle undefined - remove from object
  if (value === undefined) return undefined;

  // Handle null - preserve it
  if (value === null) return null;

  // Convert Date to Firestore Timestamp
  if (value instanceof Date) {
    return Timestamp.fromDate(value);
  }

  // Handle arrays recursively
  if (Array.isArray(value)) {
    return value
      .map((v) => sanitizeForFirestore(v))
      .filter((v) => v !== undefined); // Remove undefined entries
  }

  // Handle objects recursively
  if (typeof value === "object") {
    const sanitized: any = {};
    for (const key of Object.keys(value)) {
      const sanitizedValue = sanitizeForFirestore(value[key]);
      // Only include if not undefined
      if (sanitizedValue !== undefined) {
        sanitized[key] = sanitizedValue;
      }
    }
    return sanitized;
  }

  // Return primitives as-is (string, number, boolean)
  return value;
}

/**
 * Convert Firestore Timestamp to JavaScript Date
 * Handles multiple input formats for robustness
 */
export function convertTimestamp(timestamp: any): Date {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  if (typeof timestamp === "string") {
    const parsed = new Date(timestamp);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  }
  if (
    timestamp &&
    typeof timestamp === "object" &&
    timestamp._seconds !== undefined
  ) {
    // Handle Firestore Timestamp-like objects
    return new Date(timestamp._seconds * 1000);
  }
  // Fallback to current date
  return new Date();
}

/**
 * Safely serialize data to JSON, handling circular references
 */
export function safeJsonSerialize(obj: any): string {
  const seen = new WeakSet();

  return JSON.stringify(obj, (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return "[Circular Reference]";
      }
      seen.add(value);
    }
    return value;
  });
}

/**
 * Safely parse and serialize data for client components
 */
export function safeSerializeForClient<T>(data: T): T {
  try {
    // First try normal JSON serialization
    return JSON.parse(JSON.stringify(data));
  } catch (error) {
    // If that fails (likely due to circular references), use safe serialization
    console.warn("Normal JSON serialization failed, using safe serialization:", error);
    try {
      const serialized = safeJsonSerialize(data);
      return JSON.parse(serialized);
    } catch (safeError) {
      console.error("Safe serialization also failed:", safeError);
      // Return a basic version without problematic properties
      return JSON.parse(JSON.stringify({ ...data, batchStock: undefined }));
    }
  }
}

/**
 * Generate URL-friendly slug from text
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}