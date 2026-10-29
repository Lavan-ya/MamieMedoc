"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent, ReactNode } from "react";

import { authPrimaryButton, authSecondaryButton } from "@/components/auth/auth-ui";
import {
  ApiError,
  SERVER_UNAVAILABLE,
  saveSession,
  signIn,
  signInAsDemo,
  signUp,
} from "@/lib/api";

type AuthMode = "signin" | "signup";

const SUBMIT_LABELS: Record<AuthMode, { idle: string; pending: string }> = {
  signin: { idle: "Sign in", pending: "Signing in..." },
  signup: { idle: "Create my family space", pending: "Creating your space..." },
};

function field(form: FormData, name: string) {
  return String(form.get(name) ?? "");
}

export function AuthForm({
  children,
  className = "",
  mode,
}: {
  children: ReactNode;
  className?: string;
  mode: AuthMode;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = field(form, "email");
    const password = field(form, "password");

    setSubmitting(true);
    setError(null);
    try {
      if (mode === "signup") {
        await signUp({
          familyName: field(form, "familyName"),
          name: field(form, "yourName"),
          email,
          password,
        });
      }
      // Sign in after sign up too, so the session carries a token.
      saveSession(await signIn(email, password));
      router.push("/profiles");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : SERVER_UNAVAILABLE);
      setSubmitting(false);
    }
  }

  const labels = SUBMIT_LABELS[mode];

  return (
    <form className={className} onSubmit={handleSubmit}>
      {children}

      <button
        type="submit"
        disabled={submitting}
        className={`${authPrimaryButton} disabled:cursor-wait disabled:opacity-70`}
      >
        <span>{submitting ? labels.pending : labels.idle}</span>
        <span
          className="material-symbols-outlined text-[24px]"
          aria-hidden="true"
        >
          arrow_forward
        </span>
      </button>

      {error ? (
        <p
          role="alert"
          className="text-center text-[20px] font-semibold leading-snug text-error"
        >
          {error}
        </p>
      ) : null}
    </form>
  );
}

export function DemoAccountButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    await signInAsDemo();
    router.push("/profiles");
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`${authSecondaryButton} disabled:cursor-wait disabled:opacity-70`}
    >
      <span
        className="material-symbols-outlined text-[24px]"
        aria-hidden="true"
      >
        play_circle
      </span>
      <span>Try the demo account</span>
    </button>
  );
}
