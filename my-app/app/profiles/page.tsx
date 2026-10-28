import type { Metadata } from "next";

import { ProfilePicker } from "@/components/ProfilePicker";

export const metadata: Metadata = {
  title: "Choose your profile — MamieMédoc",
};

export default function ProfilesPage() {
  return (
    <main className="min-h-dvh bg-background px-5 py-10 lg:px-12 lg:py-16">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col">
        <header className="mb-8 flex flex-col items-center text-center lg:mb-12">
          <div className="mb-6 inline-flex items-center gap-3 rounded-full bg-surface-container-lowest px-5 py-2.5 shadow-sm">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
              <span
                className="material-symbols-outlined text-[24px]"
                aria-hidden="true"
              >
                pill
              </span>
            </span>
            <span className="font-headline text-[20px] font-bold tracking-tight text-primary lg:text-[24px]">
              MamieMédoc
            </span>
          </div>

          <h1 className="max-w-2xl font-headline text-[24px] font-extrabold leading-tight tracking-tight text-on-surface lg:text-[44px]">
            Who is using MamieMédoc?
          </h1>
          <p className="mt-2 text-[20px] text-on-surface-variant">
            Choose your profile.
          </p>
        </header>

        <ProfilePicker />

        <footer className="mt-8 flex items-center justify-center gap-2 text-center text-[18px] text-outline">
          <span
            className="material-symbols-outlined text-[18px] text-outline"
            aria-hidden="true"
          >
            verified_user
          </span>
          <span>Demo with invented profiles. No password needed.</span>
        </footer>
      </div>
    </main>
  );
}
