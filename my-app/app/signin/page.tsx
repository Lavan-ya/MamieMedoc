import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { AuthForm, DemoAccountButton } from "@/components/auth/auth-form";
import {
  AuthBrand,
  AuthCard,
  AuthDivider,
  AuthField,
  AuthFooter,
  AuthInfoBox,
  AuthPage,
  authTextLink,
  focusRing,
} from "@/components/auth/auth-ui";
import { PasswordField } from "@/components/auth/password-field";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/api";

export const metadata: Metadata = {
  title: "Sign in — MamieMédoc",
};

export default function SignInPage() {
  return (
    <AuthPage>
      <AuthBrand />

      <div className="mt-6 w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center lg:hidden">
          <div className="h-20 w-20 overflow-hidden rounded-full shadow-sm">
            <Image
              src="/images/signin-illustration.jpg"
              alt="A family sharing tea together in warm daylight."
              width={512}
              height={279}
              sizes="80px"
              className="h-full w-full object-cover"
            />
          </div>
          <h1 className="mt-4 font-headline text-[28px] font-bold tracking-tight text-on-surface">
            Welcome back
          </h1>
          <p className="mt-2 text-[20px] leading-relaxed text-on-surface-variant">
            One family space for Jeanne and everyone who cares for her.
          </p>
        </div>

        <AuthCard>
          <div className="hidden text-center lg:block">
            <h1 className="font-headline text-[32px] font-bold tracking-tight text-on-surface">
              Welcome back
            </h1>
            <p className="mt-2 text-[20px] leading-relaxed text-on-surface-variant">
              One family space for Jeanne and everyone who cares for her.
            </p>
          </div>

          <div className="mt-0 lg:mt-6">
            <AuthInfoBox icon="diversity_1">
              One account for the family. Everyone picks their profile next.
            </AuthInfoBox>
          </div>

          <AuthForm mode="signin" className="mt-6 flex flex-col gap-5">
            <AuthField
              id="email"
              name="email"
              label="Email"
              type="email"
              placeholder="jeanne.family@example.com"
              autoComplete="email"
              icon="mail"
              iconPosition="right"
              required
            />

            <PasswordField
              id="password"
              name="password"
              autoComplete="current-password"
              placeholder="••••••••••••"
              required
              labelAction={
                <button
                  type="button"
                  className={`rounded-full px-2 py-1 text-[18px] font-semibold text-primary transition-colors hover:underline ${focusRing}`}
                >
                  Forgot password?
                </button>
              }
            />
          </AuthForm>

          <p className="mt-4 text-center text-[16px] text-on-surface-variant">
            Demo account: {DEMO_EMAIL} · {DEMO_PASSWORD}
          </p>

          <div className="mt-5 text-center">
            <Link href="/signup" className={authTextLink}>
              New here? Create your family space
            </Link>
          </div>

          <AuthDivider label="or" />

          <DemoAccountButton />
        </AuthCard>

        <AuthFooter />
      </div>
    </AuthPage>
  );
}
