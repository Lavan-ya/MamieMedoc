import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "MamieMédoc — Family medication companion",
};

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary";

function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`mx-auto w-full max-w-[1200px] px-5 md:px-12 ${className}`}
    >
      {children}
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-surface/85 shadow-[0_1px_8px_rgba(28,40,38,0.04)] backdrop-blur-md">
      <Container className="flex h-20 items-center justify-between gap-4">
        <Link
          href="/"
          className={`flex min-w-0 items-center gap-3 rounded-full ${focusRing}`}
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary-container text-primary">
            <span
              className="material-symbols-outlined text-[24px]"
              aria-hidden="true"
            >
              pill
            </span>
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="whitespace-nowrap font-headline text-[20px] font-bold leading-none text-primary">
              MamieMédoc
            </span>
            <span className="mt-1 text-[18px] leading-tight text-on-surface-variant">
              Family medication companion
            </span>
          </div>
        </Link>

        <Link
          href="/signin"
          aria-label="Sign in"
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary shadow-[0_1px_4px_rgba(46,125,50,0.12)] transition-transform hover:scale-105 ${focusRing}`}
        >
          <span
            className="material-symbols-outlined text-[20px]"
            aria-hidden="true"
          >
            person
          </span>
        </Link>
      </Container>
    </header>
  );
}

type CardContent = {
  title: string;
  icon: string;
  desktopIcon?: string;
  tone: string;
};

function FeatureCard({ title, icon, desktopIcon, tone }: CardContent) {
  return (
    <div className="flex items-center gap-4 rounded-lg bg-surface-container-lowest p-4 text-left shadow-sm transition-shadow hover:shadow-md md:flex-col md:items-start md:gap-6 md:rounded-3xl md:p-8">
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full md:h-16 md:w-16 ${tone}`}
      >
        <span
          className="material-symbols-outlined text-[26px] md:hidden"
          aria-hidden="true"
        >
          {icon}
        </span>
        <span
          className="material-symbols-outlined hidden text-3xl md:block"
          aria-hidden="true"
        >
          {desktopIcon ?? icon}
        </span>
      </div>
      <p className="font-body text-[20px] font-semibold leading-snug text-on-surface md:font-headline">
        {title}
      </p>
    </div>
  );
}

function DesktopPhonePreview() {
  return (
    <div className="w-full max-w-[360px] rounded-3xl bg-surface-container-lowest p-4 shadow-xl shadow-secondary/10">
      <div className="flex flex-col gap-5 rounded-2xl bg-surface p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-headline text-[20px] font-semibold leading-tight text-on-surface">
              Good morning Jeanne
            </p>
            <p className="text-[18px] text-on-surface-variant">
              Thursday, Oct 24
            </p>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary-container text-primary">
            <span
              className="material-symbols-outlined text-[20px]"
              aria-hidden="true"
            >
              favorite
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl bg-surface-container-lowest p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="rounded-full bg-tertiary-fixed/40 px-3 py-1 font-headline text-[18px] font-semibold text-tertiary">
              Next dose · 8:00 AM
            </span>
            <span
              className="material-symbols-outlined text-[20px] text-tertiary"
              aria-hidden="true"
            >
              schedule
            </span>
          </div>
          <div>
            <p className="font-headline text-[24px] font-bold leading-snug text-on-surface">
              Kardégic 75 mg
            </p>
            <p className="mt-1 text-[20px] text-on-surface-variant">
              1 sachet in water
            </p>
          </div>
        </div>

        <div className="flex min-h-[72px] items-center justify-center gap-3 rounded-full bg-primary-container px-6 py-4 text-center font-headline text-[20px] font-semibold text-on-primary shadow-md">
          <span
            className="material-symbols-outlined text-[30px]"
            aria-hidden="true"
          >
            check_circle
          </span>
          <span>I have taken my medicine</span>
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-secondary-container/40 p-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-container-lowest text-[24px] shadow-sm"
            aria-hidden="true"
          >
            🌱
          </div>
          <p className="text-[19px] font-medium leading-snug text-on-surface">
            Your plant grows with you 🌱
          </p>
        </div>
      </div>
    </div>
  );
}

function MobilePhonePreview() {
  return (
    <div className="mt-4 w-full max-w-sm overflow-hidden rounded-xl bg-surface-container-lowest p-4 text-left shadow-md lg:hidden">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary-container">
            <span
              className="material-symbols-outlined text-[18px] text-on-secondary-container"
              aria-hidden="true"
            >
              wb_sunny
            </span>
          </div>
          <span className="font-headline text-[20px] font-bold text-on-surface">
            Good morning Jeanne
          </span>
        </div>
        <span className="shrink-0 rounded-full bg-surface-container-low px-2 py-1 text-[18px] text-on-surface-variant">
          Today
        </span>
      </div>

      <div className="mb-4 rounded-lg bg-surface-container-low p-3">
        <p className="mb-1 text-[18px] text-on-surface-variant">Next dose</p>
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="font-headline text-[24px] font-bold text-on-surface">
            8:00 AM
          </span>
          <span className="text-[20px] text-on-surface-variant">
            · Kardégic 75 mg
          </span>
        </div>
      </div>

      <div className="flex min-h-14 items-center justify-center gap-2 rounded-full bg-primary-container px-4 py-3 text-center font-headline text-[20px] font-semibold text-on-primary shadow-sm">
        <span
          className="material-symbols-outlined text-[24px]"
          aria-hidden="true"
        >
          check_circle
        </span>
        <span>I have taken my medicine</span>
      </div>

      <div className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-surface-container p-2 text-center">
        <span
          className="material-symbols-outlined text-[20px] text-secondary"
          aria-hidden="true"
        >
          potted_plant
        </span>
        <span className="text-[18px] text-on-surface-variant">
          Your plant grows with you 🌱
        </span>
      </div>
    </div>
  );
}

function SiteFooter() {
  return (
    <footer className="bg-surface-container-low py-6">
      <Container>
        <p className="flex flex-col items-center justify-center gap-2 text-center text-[18px] leading-relaxed text-on-surface-variant sm:flex-row">
          <span
            className="material-symbols-outlined text-[18px] text-secondary"
            aria-hidden="true"
          >
            verified_user
          </span>
          <span>
            © 2026 MamieMedoc · Hacktelier HETIC 2026 · Demo with invented
            data · Not a medical device
          </span>
        </p>
      </Container>
    </footer>
  );
}

const howItWorks: CardContent[] = [
  {
    title: "Snap the prescription",
    icon: "photo_camera",
    desktopIcon: "document_scanner",
    tone:
      "bg-secondary-container text-on-secondary-container md:text-primary",
  },
  {
    title: "Tap one big button at each dose",
    icon: "touch_app",
    tone:
      "bg-secondary-container text-on-secondary-container md:bg-primary-fixed md:text-primary",
  },
  {
    title: "Running low? Don’t worry, the family is already on it.",
    icon: "volunteer_activism",
    desktopIcon: "family_restroom",
    tone:
      "bg-secondary-container text-on-secondary-container md:bg-tertiary-fixed md:text-tertiary",
  },
];

const whyDifferent: CardContent[] = [
  {
    title: "One screen, one button, easy for everyone",
    icon: "smartphone",
    desktopIcon: "touch_long",
    tone:
      "bg-surface-container text-primary md:bg-secondary-container md:text-primary",
  },
  {
    title: "A plant that grows and never punishes",
    icon: "yard",
    desktopIcon: "potted_plant",
    tone:
      "bg-surface-container text-primary md:bg-secondary-fixed md:text-secondary",
  },
  {
    title: "Nothing to install",
    icon: "bolt",
    tone:
      "bg-surface-container text-primary md:bg-tertiary-fixed md:text-tertiary",
  },
];

const ctaClasses = `inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-primary px-8 font-headline text-[20px] font-semibold text-on-primary shadow-md transition-all duration-200 hover:bg-secondary hover:shadow-xl active:scale-95 md:min-h-16 md:px-10 ${focusRing}`;

export default function Home() {
  return (
    <>
      <SiteHeader />

      <main className="flex-1 pt-20">
        <section className="relative overflow-hidden pb-12 pt-6 md:pb-28 md:pt-14">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-32 -top-32 hidden h-96 w-96 rounded-full bg-secondary-container/30 blur-3xl lg:block"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-28 top-1/2 hidden h-96 w-96 rounded-full bg-tertiary-fixed/30 blur-3xl lg:block"
          />

          <Container>
            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-8">
              <div className="relative z-10 flex flex-col items-center gap-6 text-center lg:col-span-7 lg:items-start lg:gap-8 lg:text-left">
                <div className="h-48 w-full max-w-sm overflow-hidden rounded-xl shadow-sm lg:hidden">
                  <Image
                    src="/images/landing-family.jpg"
                    alt="Jeanne and her daughter sharing tea in a sunny kitchen."
                    width={512}
                    height={279}
                    sizes="(max-width: 640px) calc(100vw - 40px), 384px"
                    loading="eager"
                    fetchPriority="high"
                    className="h-full w-full object-cover"
                  />
                </div>

                <h1 className="max-w-xl font-headline text-[28px] font-bold leading-[1.15] tracking-tight text-on-surface md:text-[40px] md:leading-[1.2]">
                  Medicine on time.
                  <br className="hidden sm:inline" />{" "}
                  <span className="text-primary">Family in the loop.</span>
                </h1>

                <p className="max-w-xl text-[20px] leading-relaxed text-on-surface-variant">
                  Snap the prescription, tap one big button when it’s time,
                  and let the family handle the refills.
                </p>

                <Link
                  href="/signin"
                  className={`${ctaClasses} w-full max-w-xs md:w-auto`}
                >
                  <span>Try the demo</span>
                  <span
                    className="material-symbols-outlined text-[24px]"
                    aria-hidden="true"
                  >
                    arrow_forward
                  </span>
                </Link>

                <MobilePhonePreview />
              </div>

              <div className="relative z-10 hidden justify-center lg:col-span-5 lg:flex lg:justify-end">
                <DesktopPhonePreview />
              </div>
            </div>
          </Container>
        </section>

        <section className="bg-surface-container-low py-10 md:bg-transparent md:py-24">
          <Container>
            <div className="mx-auto max-w-sm md:mx-0 md:max-w-none">
              <h2 className="mb-5 text-center font-headline text-[24px] font-bold tracking-tight text-on-surface md:mb-12 md:text-left md:text-[32px]">
                How it works
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-8">
                {howItWorks.map((card) => (
                  <FeatureCard key={card.title} {...card} />
                ))}
              </div>
            </div>
          </Container>
        </section>

        <Container className="py-4 lg:hidden">
          <div className="mx-auto h-40 max-w-sm overflow-hidden rounded-xl shadow-sm">
            <Image
              src="/images/landing-hands.jpg"
              alt="Two generations holding a small potted seedling together."
              width={512}
              height={279}
              sizes="384px"
              className="h-full w-full object-cover"
            />
          </div>
        </Container>

        <section className="py-10 md:py-24">
          <Container>
            <div className="mx-auto max-w-sm md:mx-0 md:max-w-none">
              <h2 className="mb-5 text-center font-headline text-[24px] font-bold tracking-tight text-on-surface md:mb-12 md:text-left md:text-[32px]">
                Why it’s different
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-8">
                {whyDifferent.map((card) => (
                  <FeatureCard key={card.title} {...card} />
                ))}
              </div>
            </div>
          </Container>
        </section>

        <section className="bg-surface-container-low py-10 md:bg-transparent md:py-24">
          <Container>
            <div className="mx-auto flex max-w-sm flex-col items-center text-center md:max-w-none md:rounded-3xl md:bg-surface-container-lowest md:p-16 md:shadow-sm">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary-container md:hidden">
                <span
                  className="material-symbols-outlined text-[30px] text-on-secondary-container"
                  aria-hidden="true"
                >
                  favorite
                </span>
              </div>
              <h2 className="max-w-2xl font-headline text-[24px] font-bold leading-tight text-on-surface md:text-[32px]">
                Set it up in 5 minutes, for yourself or for someone you love.
              </h2>
              <Link
                href="/signin"
                className={`${ctaClasses} mt-6 w-full max-w-sm md:mt-8 md:w-auto`}
              >
                <span>Try the demo</span>
                <span
                  className="material-symbols-outlined text-[24px]"
                  aria-hidden="true"
                >
                  arrow_forward
                </span>
              </Link>
            </div>
          </Container>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
