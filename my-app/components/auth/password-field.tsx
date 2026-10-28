"use client";

import { useState } from "react";
import type { ReactNode } from "react";

type PasswordFieldProps = {
  id: string;
  name: string;
  label?: string;
  hint?: string;
  labelAction?: ReactNode;
  leftIcon?: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
};

export function PasswordField({
  id,
  name,
  label = "Password",
  hint,
  labelAction,
  leftIcon,
  placeholder,
  autoComplete,
  required = false,
  minLength,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="flex flex-col">
      <div className="mb-2 flex items-center justify-between gap-3">
        <label
          htmlFor={id}
          className="text-[18px] font-semibold text-on-surface"
        >
          {label}
        </label>
        {hint ? (
          <span className="text-[18px] text-on-surface-variant">{hint}</span>
        ) : null}
        {labelAction}
      </div>

      <div className="relative flex items-center">
        {leftIcon ? (
          <span
            className="material-symbols-outlined pointer-events-none absolute left-4 text-[24px] text-outline"
            aria-hidden="true"
          >
            {leftIcon}
          </span>
        ) : null}

        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          className={`h-14 w-full rounded-lg bg-surface-container-low py-3 pr-14 text-[20px] text-on-surface placeholder:text-outline transition focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary ${
            leftIcon ? "pl-12" : "pl-5"
          }`}
        />

        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-2 flex h-11 w-11 items-center justify-center rounded-full text-outline transition-colors hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <span
            className="material-symbols-outlined text-[24px]"
            aria-hidden="true"
          >
            {visible ? "visibility_off" : "visibility"}
          </span>
        </button>
      </div>
    </div>
  );
}
