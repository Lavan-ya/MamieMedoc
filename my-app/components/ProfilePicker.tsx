"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

import { demoData } from "@/lib/demo-data";
import { saveProfile, type ProfileId } from "@/lib/profile";

type ProfileCard = {
  id: ProfileId;
  name: string;
  role: string;
  note?: string;
  image: string;
  mobileImage: string;
  primary?: boolean;
};

const cards: ProfileCard[] = [
  {
    id: "jeanne",
    name: "Jeanne",
    role: "Mamie",
    note: "Primary care recipient",
    image: demoData.mamie.image,
    mobileImage: "/images/jeanne-mobile.jpg",
    primary: true,
  },
  ...demoData.members.map((member) => ({
    id: member.profile,
    name: member.name,
    role: member.role,
    image: member.image,
    mobileImage: `/images/${member.profile}-mobile.jpg`,
  })),
];

function roleTone(id: ProfileId) {
  if (id === "jeanne") return "bg-primary-container text-on-primary";
  if (id === "sophie") {
    return "bg-tertiary-fixed text-on-tertiary-fixed";
  }
  return "bg-surface-container text-on-surface-variant";
}

export function ProfilePicker() {
  const router = useRouter();

  function handleSelect(profileId: ProfileId) {
    saveProfile(profileId);
    router.push(profileId === "jeanne" ? "/mamie" : "/family");
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
      {cards.map((card) => (
        <button
          key={card.id}
          type="button"
          onClick={() => handleSelect(card.id)}
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
                <Image
                  src={card.mobileImage}
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
              ) : card.id === "sophie" ? (
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
                  className={`rounded-full px-2.5 py-0.5 text-[18px] font-semibold ${roleTone(card.id)}`}
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
    </div>
  );
}
