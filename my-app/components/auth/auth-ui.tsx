import Link from "next/link";
import type { ReactNode } from "react";

export const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export const authPrimaryButton = `flex min-h-14 w-full items-center justify-center gap-3 rounded-full bg-primary px-6 font-headline text-[20px] font-semibold text-on-primary shadow-md transition-all duration-200 hover:bg-secondary hover:shadow-lg active:scale-[0.99] lg:min-h-16 ${focusRing}`;

export const authSecondaryButton = `flex min-h-14 w-full items-center justify-center gap-2.5 rounded-full bg-secondary-container/50 px-6 font-headline text-[20px] font-semibold text-on-secondary-container shadow-sm transition-all duration-200 hover:bg-secondary-container/80 active:scale-[0.99] lg:min-h-16 ${focusRing}`;

export const authTextLink = `inline-flex min-h-11 items-center justify-center rounded-full px-2 text-[18px] font-semibold text-primary underline decoration-2 underline-offset-4 transition-colors hover:text-on-secondary-container ${focusRing}`;

export function AuthPage({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-background">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 -top-24 hidden h-96 w-96 rounded-full bg-secondary-container/30 blur-3xl lg:block"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -right-20 hidden h-96 w-96 rounded-full bg-tertiary-fixed/40 blur-3xl lg:block"
      />

      <div className="relative z-10 flex flex-1 flex-col items-center px-5 py-10 lg:justify-center lg:py-14">
        {children}
      </div>
    </main>
  );
}

export function AuthBrand() {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-3 rounded-full bg-secondary-container px-5 py-3 shadow-sm ${focusRing}`}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
        <span
          className="material-symbols-outlined text-[24px]"
          aria-hidden="true"
        >
          pill
        </span>
      </span>
      <span className="flex flex-col text-left">
        <span className="font-headline text-[24px] font-bold leading-none text-on-secondary-container">
          MamieMédoc
        </span>
        <span className="mt-1 text-[18px] font-semibold leading-none text-on-secondary-container">
          Family space
        </span>
      </span>
    </Link>
  );
}

export function AuthCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-surface-container-lowest p-5 shadow-sm lg:p-10 ${className}`}
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-primary via-primary-container to-secondary-container"
      />
      <div className="relative">{children}</div>
    </div>
  );
}

export function AuthInfoBox({
  icon,
  children,
}: {
  icon: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-surface-container-low p-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
        <span
          className="material-symbols-outlined text-[24px]"
          aria-hidden="true"
        >
          {icon}
        </span>
      </span>
      <p className="text-[18px] leading-snug text-on-surface">{children}</p>
    </div>
  );
}

type AuthFieldProps = {
  id: string;
  name: string;
  label: string;
  type?: "text" | "email";
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  icon?: string;
  iconPosition?: "left" | "right";
};

export function AuthField({
  id,
  name,
  label,
  type = "text",
  placeholder,
  autoComplete,
  required = false,
  icon,
  iconPosition = "left",
}: AuthFieldProps) {
  return (
    <div className="flex flex-col">
      <label
        htmlFor={id}
        className="mb-2 text-[18px] font-semibold text-on-surface"
      >
        {label}
      </label>
      <div className="relative flex items-center">
        {icon && iconPosition === "left" ? (
          <span
            className="material-symbols-outlined pointer-events-none absolute left-4 text-[24px] text-outline"
            aria-hidden="true"
          >
            {icon}
          </span>
        ) : null}

        <input
          id={id}
          name={name}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          className={`h-14 w-full rounded-lg bg-surface-container-low py-3 text-[20px] text-on-surface placeholder:text-outline transition focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary ${
            icon && iconPosition === "left" ? "pl-12" : "pl-5"
          } ${icon && iconPosition === "right" ? "pr-12" : "pr-5"}`}
        />

        {icon && iconPosition === "right" ? (
          <span
            className="material-symbols-outlined pointer-events-none absolute right-4 text-[24px] text-outline"
            aria-hidden="true"
          >
            {icon}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function AuthDivider({ label = "or" }: { label?: string }) {
  return (
    <div className="relative my-6 flex items-center justify-center">
      <div className="h-px w-full bg-surface-container-high" />
      <span className="absolute bg-surface-container-lowest px-4 text-[18px] text-outline">
        {label}
      </span>
    </div>
  );
}

export function AuthFooter() {
  return (
    <footer className="mt-6 text-center text-[18px] text-on-surface-variant">
      Demo with invented data.
    </footer>
  );
}
