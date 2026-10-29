"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

import { isMamie } from "@/lib/access";
import { demoData } from "@/lib/demo-data";
import {
  PROFILE_CHANGED_EVENT,
  readProfile,
  type ProfileId,
} from "@/lib/profile";

type NavTab = {
  href: string;
  label: string;
  mobileLabel: string;
  icon: string;
};

type ProfileInfo = {
  name: string;
  shortName: string;
  role: string;
  image: string;
};

const mamieTab: NavTab = {
  href: "/mamie",
  label: "Mamie Jeanne Care View",
  mobileLabel: "Mamie",
  icon: "favorite",
};

const prescriptionsTab: NavTab = {
  href: "/prescriptions",
  label: "Prescription Scan & Review",
  mobileLabel: "Scan",
  icon: "medication",
};

const familyTabs: NavTab[] = [
  {
    href: "/family",
    label: "Family Dashboard",
    mobileLabel: "Family",
    icon: "dashboard",
  },
  prescriptionsTab,
];


function getProfileInfo(profileId: ProfileId): ProfileInfo {
  if (profileId === "jeanne") {
    return {
      name: `${demoData.mamie.name}, ${demoData.mamie.age}`,
      shortName: "Jeanne",
      role: "Mamie",
      image: demoData.mamie.image,
    };
  }

  const member = demoData.members.find(
    (candidate) => candidate.profile === profileId,
  );

  if (!member) {
    return {
      name: "Profile",
      shortName: "Profile",
      role: "",
      image: demoData.mamie.image,
    };
  }

  return {
    name: member.name,
    shortName: member.name,
    role: member.role,
    image: member.image,
  };
}

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function subscribeToProfile(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(PROFILE_CHANGED_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(PROFILE_CHANGED_EVENT, onStoreChange);
  };
}

function getProfileSnapshot(): ProfileId | null {
  return readProfile();
}

function getServerProfileSnapshot(): ProfileId | null {
  return null;
}

function subscribeToClient() {
  return () => {};
}

function getIsClient() {
  return true;
}

function getIsServer() {
  return false;
}

/**
 * Shared app navigation.
 *
 * Renders a fixed top bar and a mobile bottom tab bar. Add `pb-24 xl:pb-0`
 * to the page content so the bottom bar does not cover it.
 */
export function AppNav() {
  const pathname = usePathname();
  const isReady = useSyncExternalStore(
    subscribeToClient,
    getIsClient,
    getIsServer,
  );
  const profileId = useSyncExternalStore(
    subscribeToProfile,
    getProfileSnapshot,
    getServerProfileSnapshot,
  );

  // Same split as proxy.ts: Jeanne sees her care view and the prescription
  // scan; family members everything except her care view.
  const tabs = profileId
    ? isMamie(profileId)
      ? [mamieTab, prescriptionsTab]
      : familyTabs
    : [];

  const profile = profileId ? getProfileInfo(profileId) : null;

  const profileLink = profile ? (
    <Link
      href="/profiles"
      aria-label={`Switch profile (currently ${profile.name})`}
      className="flex min-h-11 items-center gap-2 rounded-full px-1 py-1 transition-colors hover:bg-surface-container-low focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <span className="flex flex-col text-right sm:hidden">
        <span className="text-[18px] font-semibold leading-tight text-on-surface">
          {profile.shortName}
        </span>
        <span className="text-[18px] leading-tight text-on-surface-variant">
          {profile.role}
        </span>
      </span>
      <span className="hidden flex-col text-right sm:flex">
        <span className="text-[18px] font-semibold leading-tight text-on-surface">
          {profile.name}
        </span>
        <span className="text-[18px] leading-tight text-on-surface-variant">
          {profile.role}
        </span>
      </span>
      <span className="h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-primary-fixed">
        <Image
          src={profile.image}
          alt=""
          width={80}
          height={80}
          className="h-full w-full object-cover"
        />
      </span>
    </Link>
  ) : (
    <Link
      href="/profiles"
      className="flex min-h-11 items-center gap-2 rounded-full px-1 py-1 transition-colors hover:bg-surface-container-low focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <span className="text-[18px] font-semibold text-on-surface">
        Choose profile
      </span>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant">
        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
          person
        </span>
      </span>
    </Link>
  );

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 bg-surface/90 shadow-[0_1px_8px_rgba(28,40,38,0.06)] backdrop-blur-xl">
        <div className="mx-auto flex h-20 w-full max-w-[1200px] items-center justify-between gap-3 px-4 lg:px-5 xl:px-8">
          <Link
            href="/"
            aria-label="MamieMédoc home"
            className="flex min-w-0 items-center gap-2.5 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary-container text-primary">
              <span
                className="material-symbols-outlined text-[24px]"
                aria-hidden="true"
              >
                medication
              </span>
            </span>
            <span className="hidden min-w-0 flex-col sm:flex">
              <span className="whitespace-nowrap font-headline text-[20px] font-bold leading-none text-primary">
                MamieMédoc
              </span>
              <span className="mt-1 text-[18px] leading-none text-on-surface-variant">
                Safe Care
              </span>
            </span>
          </Link>

          {tabs.length > 0 ? (
            <nav
              aria-label="Main navigation"
              className="hidden items-center gap-1 rounded-full bg-surface-container-low p-1.5 xl:flex"
            >
              {tabs.map((tab) => {
                const active = isActivePath(pathname, tab.href);
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    aria-current={active ? "page" : undefined}
                    className={`whitespace-nowrap rounded-full px-2.5 py-2 text-[18px] font-semibold transition-all xl:px-2 ${
                      active
                        ? "bg-primary-container text-on-primary shadow-[0_4px_12px_rgba(46,125,50,0.12)]"
                        : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                    }`}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </nav>
          ) : null}

          {isReady ? (
            profileLink
          ) : (
            <div
              aria-hidden="true"
              className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-surface-container-high"
            />
          )}
        </div>
      </header>

      <div aria-hidden="true" className="h-20" />

      {isReady && tabs.length > 0 ? (
        <nav
          aria-label="Main navigation"
          className="fixed inset-x-0 bottom-0 z-50 border-t border-surface-container-high bg-surface/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_8px_rgba(28,40,38,0.06)] backdrop-blur-xl xl:hidden"
        >
          <div className="mx-auto flex max-w-2xl items-stretch gap-1 px-2 pb-1.5 pt-1">
            {tabs.map((tab) => {
              const active = isActivePath(pathname, tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  aria-label={tab.label}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-16 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1.5 text-[18px] font-semibold transition-colors ${
                    active ? "text-primary" : "text-on-surface-variant"
                  }`}
                >
                  <span
                    className={`flex h-8 w-12 items-center justify-center rounded-full transition-colors ${
                      active ? "bg-secondary-container" : ""
                    }`}
                  >
                    <span
                      className="material-symbols-outlined text-[24px]"
                      aria-hidden="true"
                    >
                      {tab.icon}
                    </span>
                  </span>
                  <span className="leading-none">{tab.mobileLabel}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      ) : null}
    </>
  );
}
