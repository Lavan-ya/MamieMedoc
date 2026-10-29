"use client";

import Image from "next/image";
import { useEffect } from "react";

import {
  EMERGENCY_NUMBER,
  EUROPEAN_EMERGENCY_NUMBER,
  type CallMember,
} from "@/lib/mamie";
import { telHref } from "@/lib/phone";

export function CallFamilyDialog({
  open,
  members,
  onClose,
}: {
  open: boolean;
  members: CallMember[];
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-on-surface/40 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="call-family-title"
        className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-xl bg-surface-container-lowest p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2
              id="call-family-title"
              className="font-headline text-[24px] font-bold tracking-tight text-on-surface"
            >
              Who do you want to call?
            </h2>
            <p className="text-[18px] leading-snug text-on-surface-variant">
              Tap a name. Your phone will start the call.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            autoFocus
            aria-label="Close call dialog"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-container-low text-on-surface transition-colors hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <span
              className="material-symbols-outlined text-[24px]"
              aria-hidden="true"
            >
              close
            </span>
          </button>
        </div>

        <a
          href={telHref(EMERGENCY_NUMBER)}
          aria-label={`Call emergency services, ${EMERGENCY_NUMBER}`}
          className="mt-4 flex min-h-16 items-center justify-between gap-3 rounded-2xl bg-error p-4 text-on-error shadow-md transition-colors hover:bg-on-error-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error"
        >
          <span className="flex min-w-0 flex-col">
            <span className="font-headline text-[22px] font-bold leading-tight">
              Emergency · {EMERGENCY_NUMBER}
            </span>
            <span className="text-[18px] leading-tight">
              Medical help (SAMU), day and night
            </span>
          </span>
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-on-error text-error">
            <span className="material-symbols-outlined text-[26px]" aria-hidden="true">
              emergency
            </span>
          </span>
        </a>

        <div className="mt-3 flex flex-col gap-3">
          {members.map((member) => (
            <a
              key={member.id}
              href={telHref(member.phone)}
              aria-label={`Call ${member.name}`}
              className="flex min-h-16 items-center justify-between gap-3 rounded-2xl bg-surface-container-low p-4 transition-colors hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="h-12 w-12 shrink-0 overflow-hidden rounded-full shadow-sm">
                  <Image
                    src={member.image}
                    alt=""
                    width={64}
                    height={64}
                    className="h-full w-full object-cover"
                  />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="font-headline text-[20px] font-bold leading-tight text-on-surface">
                    Call {member.name}
                  </span>
                  <span className="text-[18px] leading-tight text-on-surface-variant">
                    {[member.role, member.city].filter(Boolean).join(" · ")}
                  </span>
                </span>
              </span>
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary shadow-sm">
                <span
                  className="material-symbols-outlined text-[24px]"
                  aria-hidden="true"
                >
                  call
                </span>
              </span>
            </a>
          ))}
        </div>

        <p className="mt-4 text-center text-[18px] text-on-surface-variant">
          Anywhere in Europe you can also call{" "}
          <a
            href={telHref(EUROPEAN_EMERGENCY_NUMBER)}
            className="font-bold text-error underline underline-offset-4"
          >
            {EUROPEAN_EMERGENCY_NUMBER}
          </a>
          .
        </p>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 min-h-14 w-full rounded-full bg-surface-container-high px-4 text-[18px] font-semibold text-on-surface transition-colors hover:bg-surface-container-highest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Close
        </button>
      </div>
    </div>
  );
}
