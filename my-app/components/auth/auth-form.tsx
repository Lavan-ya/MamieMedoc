"use client";

import { useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";

export function AuthForm({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const router = useRouter();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push("/profiles");
  }

  return (
    <form className={className} onSubmit={handleSubmit}>
      {children}
    </form>
  );
}
