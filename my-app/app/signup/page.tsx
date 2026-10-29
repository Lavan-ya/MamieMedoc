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
  focusRing,
} from "@/components/auth/auth-ui";
import { PasswordField } from "@/components/auth/password-field";

export const metadata: Metadata = {
  title: "Create your family space — MamieMédoc",
};

export default function SignUpPage() {
  return (
    <AuthPage>
      <AuthBrand />

      <div className="mt-6 w-full max-w-lg">
        <div className="mb-6 flex flex-col items-center text-center lg:hidden">
          <div className="relative h-20 w-20">
            <Image
              src="/images/signup-illustration.jpg"
              alt="A grandmother surrounded by her caring family."
              width={286}
              height={512}
              sizes="80px"
              className="h-full w-full rounded-full object-cover object-top shadow-sm"
            />
            <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-on-primary">
              <span
                className="material-symbols-outlined text-[16px]"
                aria-hidden="true"
              >
                favorite
              </span>
            </span>
          </div>
          <h1 className="mt-4 font-headline text-[28px] font-bold tracking-tight text-on-surface">
            Create your family space
          </h1>
          <p className="mt-2 text-[20px] leading-relaxed text-on-surface-variant">
            Connect everyone around your loved one.
          </p>
        </div>

        <AuthCard>
          <div className="hidden text-center lg:block">
            <h1 className="font-headline text-[32px] font-bold tracking-tight text-on-surface">
              Create your family space
            </h1>
            <p className="mt-2 text-[20px] leading-relaxed text-on-surface-variant">
              Connect everyone around your loved one.
            </p>
          </div>

          <div className="mt-0 lg:mt-6">
            <AuthInfoBox icon="groups">
              Next, you can add Jeanne’s medicines and invite the rest of the
              family.
            </AuthInfoBox>
          </div>

          <AuthForm mode="signup" className="mt-6 flex flex-col gap-5">
            <AuthField
              id="family-name"
              name="familyName"
              label="Family name"
              placeholder="Dupont Family"
              autoComplete="organization"
              icon="cottage"
              iconPosition="left"
              required
            />

            <AuthField
              id="your-name"
              name="yourName"
              label="Your name"
              placeholder="Lavanya Dupont"
              autoComplete="name"
              icon="person"
              iconPosition="left"
              required
            />

            <AuthField
              id="email"
              name="email"
              label="Email"
              type="email"
              placeholder="lavanya@example.com"
              autoComplete="email"
              icon="mail"
              iconPosition="left"
              required
            />

            <PasswordField
              id="password"
              name="password"
              label="Password"
              hint="At least 8 characters"
              autoComplete="new-password"
              placeholder="••••••••••••"
              required
              minLength={8}
              leftIcon="lock"
            />
          </AuthForm>

          <div className="mt-5 text-center">
            <p className="text-[18px] text-on-surface-variant">
              Already have an account?{" "}
              <Link
                href="/signin"
                className={`rounded-full font-semibold text-primary underline decoration-2 underline-offset-4 transition-colors hover:text-on-secondary-container ${focusRing}`}
              >
                Sign in
              </Link>
            </p>
          </div>

          <AuthDivider label="or explore first" />

          <DemoAccountButton />
        </AuthCard>

        <AuthFooter />
      </div>
    </AuthPage>
  );
}
