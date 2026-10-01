"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  errorClass,
  inputClass,
  labelClass,
  primaryButtonClass,
} from "@/components/ui/classes";
import { useApp } from "@/context/AppProvider";

export default function LoginForm() {
  const { login, user, ready } = useApp();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ready && user) {
      router.replace("/dashboard");
    }
  }, [ready, user, router]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const message = login(
      String(form.get("email") ?? ""),
      String(form.get("password") ?? ""),
    );
    if (message) {
      setError(message);
      return;
    }
    router.push("/dashboard");
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
      <div>
        <label className={labelClass} htmlFor="login-email">
          Email
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass} htmlFor="login-password">
          Password
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="current-password"
          className={inputClass}
        />
      </div>
      {error ? (
        <p className={errorClass} role="alert">
          {error}
        </p>
      ) : null}
      <button type="submit" className={`${primaryButtonClass} w-full`}>
        Log in
      </button>
    </form>
  );
}
