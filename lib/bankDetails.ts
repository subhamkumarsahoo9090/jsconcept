"use client";

import { demoAccount } from "@/lib/demoAccount";

export type BankAccount = {
  id: string;
  holder: string;
  bank: string;
  accountNumber: string;
  ifsc: string;
  branch: string;
  accountType: string;
  upi: string;
};

const demoBanks: BankAccount[] = [
  {
    id: "savings",
    holder: "Subham",
    bank: "Demo National Bank",
    accountNumber: "501002348761",
    ifsc: "DEMO0001234",
    branch: "Kolkata",
    accountType: "Savings",
    upi: "subham@demo",
  },
  {
    id: "current",
    holder: "Subham",
    bank: "Demo National Bank",
    accountNumber: "601009912345",
    ifsc: "DEMO0005678",
    branch: "Salt Lake",
    accountType: "Current",
    upi: "subham.biz@demo",
  },
];

function isBankAccount(item: unknown): item is BankAccount {
  if (typeof item !== "object" || item === null) return false;
  const record = item as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.holder === "string" &&
    typeof record.bank === "string" &&
    typeof record.accountNumber === "string" &&
    typeof record.ifsc === "string" &&
    typeof record.branch === "string" &&
    typeof record.accountType === "string" &&
    typeof record.upi === "string"
  );
}

export function bankAccountsFor(email: string): BankAccount[] {
  const normalized = email.trim().toLowerCase();
  if (normalized === demoAccount.email) return demoBanks;

  try {
    const raw = localStorage.getItem("masterweb.users");
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const match = parsed.find((item) => {
      if (typeof item !== "object" || item === null) return false;
      const record = item as Record<string, unknown>;
      return typeof record.email === "string" && record.email.toLowerCase() === normalized;
    }) as Record<string, unknown> | undefined;
    if (!match || !Array.isArray(match.bankAccounts)) return [];
    return match.bankAccounts.filter(isBankAccount);
  } catch {
    return [];
  }
}
