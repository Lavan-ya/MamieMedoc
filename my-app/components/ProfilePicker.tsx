"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import {
  AuthField,
  authPrimaryButton,
  authSecondaryButton,
} from "@/components/auth/auth-ui";
import {
  addFamilyMember,
  ApiError,
  getProfiles,
  SERVER_UNAVAILABLE,
  type Profile,
} from "@/lib/api";
import { demoData } from "@/lib/demo-data";
import { saveProfile, type ProfileId, type ProfileType } from "@/lib/profile";

type ProfileCard = {
  id: ProfileId;
  type: ProfileType;
  name: string;
  role: string;
  note?: string;
  image: string | null;
  mobileImage: string | null;
  primary?: boolean;
};

// Shown when the API cannot be reached, so the demo always works.
const demoCards: ProfileCard[] = [
  {
    id: "jeanne",
    type: "patient",
    name: "Jeanne",
    role: "Mamie",
    note: "Primary care recipient",
    image: demoData.mamie.image,
    mobileImage: "/images/jeanne-mobile.jpg",
    primary: true,
  },
  ...demoData.members.map((member) => ({
    id: member.profile,
    type: "family" as const,
    name: member.name,
    role: member.role,
    image: member.image,
    mobileImage: `/images/${member.profile}-mobile.jpg`,
  })),
];

function toCard(profile: Profile): ProfileCard {
  const patient = profile.type === "patient";
  return {
    id: profile.key,
    type: profile.type,
    name: profile.firstName,
    role: profile.role,
    note: patient ? "Primary care recipient" : undefined,
    image: profile.avatarUrl,
    mobileImage: profile.avatarUrl,
    primary: patient,
  };
}

function isNurse(card: ProfileCard) {
  return card.role.toLowerCase().includes("nurse");
}

function roleTone(card: ProfileCard) {
  if (card.primary) return "bg-primary-container text-on-primary";
  if (isNurse(card)) {
    return "bg-tertiary-fixed text-on-tertiary-fixed";
  }
  return "bg-surface-container text-on-surface-variant";
}

type Status = "loading" | "online" | "offline";

export function ProfilePicker() {
  const router = useRouter();
  const [cards, setCards] = useState<ProfileCard[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let active = true;
    getProfiles()
      .then((profiles) => {
        if (!active) return;
        setCards(profiles.map(toCard));
        setStatus("online");
      })
      .catch(() => {
        if (!active) return;
        setCards(demoCards);
        setStatus("offline");
      });
    return () => {
      active = false;
    };
  }, []);

  function handleSelect(card: ProfileCard) {
    saveProfile(card.id, {
      firstName: card.name,
      type: card.type,
      role: card.role,
      avatarUrl: card.image,
    });
    router.push(card.type === "patient" ? "/mamie" : "/family");
  }

  function handleAdded(profile: Profile) {
    setCards((current) => [...current, toCard(profile)]);
    setAdding(false);
  }

  if (status === "loading") {
    return (
      <p className="text-center text-[20px] text-on-surface-variant">
        Loading profiles…
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {cards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => handleSelect(card)}
            aria-label={`Enter as ${card.name}`}
            className={`group relative flex min-h-24 w-full items-center gap-4 rounded-lg p-4 text-left shadow-sm transition-all duration-300 hover:shadow-xl active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary lg:min-h-[340px] lg:flex-col lg:items-center lg:justify-between lg:rounded-[2rem] lg:p-8 lg:hover:-translate-y-1 ${
              card.primary
                ? "bg-secondary-container/50 hover:bg-secondary-container/70"
                : "bg-surface-container-lowest hover:bg-surface-container-low"
            }`}
          >
            {card.primary ? (
              <span className="absolute right-4 top-4 hidden items-center gap-1 rounded-full bg-primary px-3 py-1 text-[18px] font-semibold text-on-primary shadow-sm lg:flex">
                <span
                  className="material-symbols-outlined text-[18px]"
                  aria-hidden="true"
                >
                  star
                </span>
                Primary
              </span>
            ) : null}

            <div className="flex w-full items-center gap-4 lg:flex-col lg:items-center lg:gap-4">
              <div
                className={`relative shrink-0 rounded-full p-1 ${
                  card.primary ? "bg-primary/20" : "bg-surface-container-high"
                }`}
              >
                <div
                  className={`h-16 w-16 overflow-hidden rounded-full shadow-sm ${
                    card.primary ? "lg:h-32 lg:w-32" : "lg:h-28 lg:w-28"
                  }`}
                >
                  {card.image ? (
                    <>
                      <Image
                        src={card.mobileImage ?? card.image}
                        alt=""
                        width={512}
                        height={512}
                        sizes="(max-width: 1023px) 64px, 128px"
                        className="h-full w-full object-cover lg:hidden"
                      />
                      <Image
                        src={card.image}
                        alt=""
                        width={512}
                        height={512}
                        sizes="(max-width: 1023px) 64px, 128px"
                        className="hidden h-full w-full object-cover lg:block"
                      />
                    </>
                  ) : (
                    <span
                      aria-hidden="true"
                      className="flex h-full w-full items-center justify-center bg-primary-fixed font-headline text-[28px] font-bold text-on-primary-fixed lg:text-[48px]"
                    >
                      {card.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                {card.primary ? (
                  <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-on-primary shadow-sm">
                    <span
                      className="material-symbols-outlined text-[16px] lg:hidden"
                      aria-hidden="true"
                    >
                      favorite
                    </span>
                    <span
                      className="material-symbols-outlined hidden text-[16px] lg:block"
                      aria-hidden="true"
                    >
                      home
                    </span>
                  </span>
                ) : isNurse(card) ? (
                  <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-tertiary-fixed text-on-tertiary-fixed shadow-sm">
                    <span
                      className="material-symbols-outlined text-[15px]"
                      aria-hidden="true"
                    >
                      medical_services
                    </span>
                  </span>
                ) : null}
              </div>

              <div className="flex min-w-0 flex-1 flex-col lg:items-center lg:text-center">
                <div className="flex flex-wrap items-center gap-2 lg:flex-col lg:gap-1">
                  <span
                    className={`block font-headline font-bold tracking-tight text-on-surface ${
                      card.primary
                        ? "text-[24px] lg:text-[30px]"
                        : "text-[24px]"
                    }`}
                  >
                    {card.name}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[18px] font-semibold ${roleTone(card)}`}
                  >
                    {card.role}
                  </span>
                </div>
                {card.note ? (
                  <span className="mt-1 text-[18px] font-medium text-on-secondary-container lg:hidden">
                    {card.note}
                  </span>
                ) : null}
              </div>

              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full shadow-sm lg:hidden ${
                  card.primary
                    ? "bg-surface text-primary"
                    : "bg-surface-container text-on-surface-variant"
                }`}
              >
                <span
                  className="material-symbols-outlined text-[26px]"
                  aria-hidden="true"
                >
                  arrow_forward
                </span>
              </span>
            </div>

            <span
              className={`mt-6 hidden min-h-12 w-full items-center justify-center gap-2 rounded-full px-4 text-[18px] font-semibold transition-colors lg:flex ${
                card.primary
                  ? "bg-primary text-on-primary group-hover:bg-primary-container"
                  : "bg-surface-container-high text-on-surface group-hover:bg-primary-container group-hover:text-on-primary"
              }`}
            >
              <span>Enter as {card.name}</span>
              <span
                className="material-symbols-outlined text-[20px] transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              >
                arrow_forward
              </span>
            </span>
          </button>
        ))}

        {status === "online" ? (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="group relative flex min-h-24 w-full items-center gap-4 rounded-lg border-2 border-dashed border-outline-variant bg-surface-container-lowest p-4 text-left shadow-sm transition-all duration-300 hover:bg-surface-container-low hover:shadow-xl active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary lg:min-h-[340px] lg:flex-col lg:items-center lg:justify-center lg:gap-4 lg:rounded-[2rem] lg:p-8 lg:text-center lg:hover:-translate-y-1"
          >
            <span className="shrink-0 rounded-full bg-surface-container-high p-1">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container lg:h-28 lg:w-28">
                <span
                  className="material-symbols-outlined text-[32px] lg:text-[48px]"
                  aria-hidden="true"
                >
                  add
                </span>
              </span>
            </span>
            <span className="font-headline text-[24px] font-bold tracking-tight text-on-surface">
              + Add a family member
            </span>
          </button>
        ) : null}
      </div>

      {status === "offline" ? (
        <p className="mt-4 flex items-center justify-center gap-1.5 text-[16px] text-outline">
          <span
            className="material-symbols-outlined text-[16px]"
            aria-hidden="true"
          >
            cloud_off
          </span>
          Offline demo
        </p>
      ) : null}

      {adding ? (
        <AddFamilyMemberDialog
          onClose={() => setAdding(false)}
          onAdded={handleAdded}
        />
      ) : null}
    </>
  );
}

function AddFamilyMemberDialog({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: (profile: Profile) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    setSaving(true);
    setError(null);
    try {
      onAdded(
        await addFamilyMember({
          firstName: String(form.get("firstName") ?? ""),
          relation: String(form.get("relation") ?? ""),
          phone: String(form.get("phone") ?? ""),
        }),
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : SERVER_UNAVAILABLE);
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-member-title"
        className="max-h-full w-full max-w-md overflow-y-auto rounded-[2rem] bg-surface-container-lowest p-6 shadow-xl lg:p-8"
      >
        <h2
          id="add-member-title"
          className="font-headline text-[28px] font-bold tracking-tight text-on-surface"
        >
          Add a family member
        </h2>

        <form className="mt-6 flex flex-col gap-5" onSubmit={handleSubmit}>
          <AuthField
            id="member-first-name"
            name="firstName"
            label="First name"
            placeholder="Marc"
            autoComplete="given-name"
            required
          />
          <AuthField
            id="member-relation"
            name="relation"
            label="Relation"
            placeholder="Grandson"
            required
          />
          <AuthField
            id="member-phone"
            name="phone"
            label="Phone"
            placeholder="06 12 34 56 78"
            autoComplete="tel"
            required
          />

          {error ? (
            <p
              role="alert"
              className="text-center text-[20px] font-semibold leading-snug text-error"
            >
              {error}
            </p>
          ) : null}

          <div className="flex flex-col gap-3">
            <button
              type="submit"
              disabled={saving}
              className={`${authPrimaryButton} disabled:cursor-wait disabled:opacity-70`}
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className={authSecondaryButton}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
