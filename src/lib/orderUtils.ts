/**
 * Generates a readable order ID in the format: YYMMDD-XXX
 * Example: 241128-A3F
 */
export function generateOrderId(): string {
  // Get current date in YYMMDD format
  const now = new Date();
  const year = String(now.getFullYear()).slice(-2); // Last 2 digits of year
  const month = String(now.getMonth() + 1).padStart(2, '0'); // Month (01-12)
  const day = String(now.getDate()).padStart(2, '0'); // Day (01-31)

  const datePart = `${year}${month}${day}`; // YYMMDD

  // Generate 3-character random suffix (alphanumeric, uppercase)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomPart = '';
  for (let i = 0; i < 3; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `${datePart}-${randomPart}`;
}