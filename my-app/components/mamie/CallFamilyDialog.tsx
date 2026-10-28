"use client";

import Image from "next/image";
import { useEffect } from "react";

import { demoData } from "@/lib/demo-data";
import { telHref } from "@/lib/phone";

export function CallFamilyDialog({
  open,
  onClose,
}: {
  open: boolean;
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
              Call your family
            </h2>
            <p className="text-[18px] leading-snug text-on-surface-variant">
              Choose who you want to call.
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

        <div className="mt-4 flex flex-col gap-3">
          {demoData.members.map((member) => (
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
