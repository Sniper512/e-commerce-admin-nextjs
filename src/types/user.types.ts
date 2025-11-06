// User Types
export type UserRole = "admin" | "manager" | "staff";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}
