"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppProvider";
import { bankAccountsFor, type BankAccount } from "@/lib/bankDetails";

const fields: { key: keyof BankAccount; label: string }[] = [
  { key: "holder", label: "Account holder" },
  { key: "bank", label: "Bank" },
  { key: "accountNumber", label: "Account number" },
  { key: "ifsc", label: "IFSC" },
  { key: "branch", label: "Branch" },
  { key: "accountType", label: "Account type" },
  { key: "upi", label: "UPI" },
];

export default function ProfileView() {
  const router = useRouter();
  const { user, ready } = useApp();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  useEffect(() => {
    if (!user) return;
    setAccounts(bankAccountsFor(user.email));
  }, [user]);

  if (!ready || !user) return null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-10">
      <p className="text-sm font-medium text-primary">Profile</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{user.name}</h1>
      <p className="mt-2 text-sm text-muted">{user.email}</p>

      <h2 className="mt-10 text-lg font-semibold">Bank details</h2>
      {accounts.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No bank details saved for this account.</p>
      ) : (
        <ul className="mt-4 grid gap-4">
          {accounts.map((account) => (
            <li
              key={account.id}
              className="rounded-3xl border border-border bg-background p-5 shadow-sm sm:p-6"
            >
              <p className="text-sm font-medium text-primary">{account.accountType}</p>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                {fields.map((field) => (
                  <div key={field.key}>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                      {field.label}
                    </dt>
                    <dd className="mt-1 text-sm">{account[field.key]}</dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
