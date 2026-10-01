import type { Metadata } from "next";
import LoginForm from "@/components/auth/LoginForm";
import { pageMetadata } from "@/config/projectmanager";

export const metadata: Metadata = pageMetadata("/login");

export default function LoginPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
      <div className="rounded-3xl border border-border bg-background p-6 shadow-sm sm:p-8">
        <p className="text-sm font-medium text-primary">JsExport</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Log in</h1>
        <p className="mt-2 text-sm text-muted">
          Use your email and password to open the lessons.
        </p>
        <LoginForm />
      </div>
    </div>
  );
}
