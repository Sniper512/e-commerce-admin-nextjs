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
 * Strip Firestore-specific properties and convert Timestamps to ISO strings
 * This prevents circular reference issues when serializing for client components
 */
export function stripFirestoreProps(obj: any): any {
  return JSON.parse(JSON.stringify(obj, (key, value) => {
    // Skip Firestore-specific properties that cause circular references
    if (key === '_firestore' || key === 'firestore' || key === '__proto__' ||
        key === 'constructor' || key === '_key' || key === '_document' ||
        key === '_firestoreImpl' || key === '_databaseId') {
      return undefined;
    }

    // Handle Firestore Timestamps
    if (typeof value === 'object' && value !== null) {
      if (value.constructor && value.constructor.name === 'Timestamp') {
        return value.toDate().toISOString();
      }

      // Skip other custom objects that might cause issues
      if (value.constructor && value.constructor.name !== 'Object' && value.constructor.name !== 'Array') {
        return undefined;
      }

      // Limit array sizes to prevent huge data transfer
      if (Array.isArray(value) && value.length > 100) {
        return value.slice(0, 100);
      }
    }

    return value;
  }));
}

/**
 * Safely parse and serialize data for client components
 * Simplified version to avoid circular reference issues
 */
export function safeSerializeForClient<T>(data: T): T {
  return stripFirestoreProps(data);
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