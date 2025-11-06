// Ledger & Expense Management Types
export type ExpenseCategory =
  | "rent"
  | "salaries"
  | "utilities"
  | "inventory"
  | "marketing"
  | "transportation"
  | "maintenance"
  | "other";

export interface Expense {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: Date;
  paymentMethod: string;
  reference?: string;
  attachments?: string[];
  addedBy: string;
  createdAt: Date;
  updatedAt: Date;
}
