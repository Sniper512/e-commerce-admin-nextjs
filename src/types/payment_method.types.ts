export type PaymentMethodType =
  | "easypaisa"
  | "jazzcash"
  | "bank_transfer"
  | "cash_on_delivery";

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  accountDetails?: {
    accountNumber: string;
    accountTitle: string;
    bankName?: string;
  };
}
