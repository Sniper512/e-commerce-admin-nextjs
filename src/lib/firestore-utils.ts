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

/**
 * Create a Firestore-ready update object with timestamp
 */
export function createUpdatePayload(updates: any) {
  return {
    ...sanitizeForFirestore(updates),
    updatedAt: new Date().toISOString(),
    updatedBy: "current-user", // TODO: Get from auth context
  };
}

/**
 * Create a Firestore-ready create object with timestamps
 */
export function createCreatePayload(data: any) {
  return {
    ...sanitizeForFirestore(data),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "current-user", // TODO: Get from auth context
    updatedBy: "current-user",
  };
}
