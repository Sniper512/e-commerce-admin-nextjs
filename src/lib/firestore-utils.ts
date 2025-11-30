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
  const visited = new WeakMap();

  function deepCloneAndStrip(value: any, path: string[] = []): any {
    // Handle null and undefined
    if (value === null || value === undefined) {
      return value;
    }

    // Handle primitives
    if (typeof value !== 'object') {
      return value;
    }

    // Prevent circular references
    if (visited.has(value)) {
      return undefined;
    }
    visited.set(value, true);

    // Handle Firestore Timestamps
    if (value.constructor && value.constructor.name === 'Timestamp') {
      return value.toDate().toISOString();
    }

    // Handle Dates
    if (value instanceof Date) {
      return value.toISOString();
    }

    // Convert Maps to plain objects
    if (value.constructor && value.constructor.name === 'Map') {
      const plainObject: any = {};
      for (const [mapKey, mapValue] of value) {
        plainObject[mapKey] = deepCloneAndStrip(mapValue, [...path, String(mapKey)]);
      }
      return plainObject;
    }

    // Skip other custom objects that might cause issues
    if (value.constructor && value.constructor.name !== 'Object' && value.constructor.name !== 'Array') {
      return undefined;
    }

    // Handle arrays
    if (Array.isArray(value)) {
      // Limit array sizes to prevent huge data transfer
      const limitedArray = value.length > 100 ? value.slice(0, 100) : value;
      return limitedArray.map((item, index) => deepCloneAndStrip(item, [...path, String(index)]));
    }

    // Handle plain objects
    const result: any = {};
    for (const key of Object.keys(value)) {
      // Skip Firestore-specific properties that cause circular references
      if (key === '_firestore' || key === 'firestore' || key === '__proto__' ||
          key === 'constructor' || key === '_key' || key === '_document' ||
          key === '_firestoreImpl' || key === '_databaseId') {
        continue;
      }

      const clonedValue = deepCloneAndStrip(value[key], [...path, key]);
      if (clonedValue !== undefined) {
        result[key] = clonedValue;
      }
    }

    return result;
  }

  return deepCloneAndStrip(obj);
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

/**
 * Generate words array from product name for enhanced search
 * Splits the name into individual words, removes duplicates, and filters out short words
 */
export function generateWordsArray(productName: string): string[] {
  if (!productName || typeof productName !== 'string') {
    return [];
  }

  return productName
    .toLowerCase()
    .split(/\s+/) // Split on whitespace
    .map(word => word.replace(/[^a-z0-9]/g, '')) // Remove non-alphanumeric characters
    .filter(word => word.length >= 2) // Keep words with 2+ characters
    .filter((word, index, arr) => arr.indexOf(word) === index); // Remove duplicates
}