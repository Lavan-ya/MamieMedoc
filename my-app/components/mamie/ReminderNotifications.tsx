"use client";

import { useEffect, useState } from "react";

import {
  API_URL,
  getPushPublicKey,
  removePushSubscription,
  savePushSubscription,
  sendTestReminder,
} from "@/lib/api";

type State =
  | "checking"
  | "unsupported" // no service worker / Web Push (e.g. iPad Safari tab)
  | "insecure" // http:// on a network address: browsers require https
  | "denied" // notifications blocked in the browser settings
  | "off"
  | "on";

const SERVICE_WORKER = `/sw.js?api=${encodeURIComponent(API_URL)}`;

/** VAPID public key (base64url) -> bytes for pushManager.subscribe(). */
function keyToBytes(base64url: string) {
  const padded = `${base64url}${"=".repeat((4 - (base64url.length % 4)) % 4)}`;
  const raw = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

function supportState(): State | null {
  if (!window.isSecureContext) return "insecure";
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    return "unsupported";
  }
  if (Notification.permission === "denied") return "denied";
  return null;
}

/**
 * Lets Jeanne's tablet receive medication reminders as system notifications,
 * so they arrive even when MamieMédoc is closed or the screen is locked.
 */
export function ReminderNotifications() {
  const [state, setState] = useState<State>("checking");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // On every visit: keep the service worker installed and the server in sync.
  useEffect(() => {
    let ignore = false;
    async function check() {
      const blocked = supportState();
      if (blocked) return blocked;
      const registration = await navigator.serviceWorker.register(SERVICE_WORKER);
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription || Notification.permission !== "granted") return "off";
      await savePushSubscription(subscription.toJSON());
      return "on";
    }
    check()
      .then((next) => {
        if (!ignore) setState(next);
      })
      .catch(() => {
        if (!ignore) setState("off");
      });
    return () => {
      ignore = true;
    };
  }, []);

  async function turnOn() {
    setBusy(true);
    setMessage(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "off");
        return;
      }
      const registration = await navigator.serviceWorker.register(SERVICE_WORKER);
      await navigator.serviceWorker.ready;
      const { publicKey } = await getPushPublicKey();
      if (!publicKey) throw new Error("Reminders are not set up on the server yet.");
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: keyToBytes(publicKey),
        }));
      await savePushSubscription(subscription.toJSON());
      setState("on");
      setMessage("Reminders are on. Try a test reminder.");
    } catch (error) {
      setMessage((error as Error).message || "Could not turn on reminders.");
    } finally {
      setBusy(false);
    }
  }

  async function turnOff() {
    setBusy(true);
    setMessage(null);
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await removePushSubscription(subscription.endpoint);
        await subscription.unsubscribe();
      }
      setState("off");
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setBusy(true);
    setMessage(null);
    try {
      const { sent } = await sendTestReminder();
      setMessage(
        sent > 0
          ? "Test sent. A notification should appear in a few seconds."
          : "No tablet received it. Turn reminders off and on again.",
      );
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (state === "checking") return null;

  const on = state === "on";
  return (
    <section
      aria-labelledby="reminders-title"
      className={`flex flex-col gap-3 rounded-lg p-5 shadow-md ${
        on ? "bg-secondary-container/50" : "bg-tertiary-fixed/50"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
            on ? "bg-primary text-on-primary" : "bg-tertiary-fixed text-on-tertiary-fixed"
          }`}
        >
          <span className="material-symbols-outlined text-[26px]" aria-hidden="true">
            {on ? "notifications_active" : "notifications_off"}
          </span>
        </span>
        <div className="flex flex-col gap-1">
          <h2 id="reminders-title" className="font-headline text-[22px] font-bold leading-tight text-on-surface">
            {on ? "Reminders are on" : "Reminders on this tablet"}
          </h2>
          <p className="text-[18px] leading-snug text-on-surface-variant">
            {state === "on" &&
              "Your medicine reminders will ring even when the tablet is asleep."}
            {state === "off" &&
              "Turn them on so reminders ring even when MamieMédoc is closed or the screen is off."}
            {state === "denied" &&
              "Notifications are blocked. Ask your family to allow them for MamieMédoc in the browser settings."}
            {state === "insecure" &&
              "This address is not secure (https), so the tablet cannot receive reminders while closed."}
            {state === "unsupported" &&
              "This browser cannot show reminders when closed. On an iPad, add MamieMédoc to the Home Screen first, then open it from there."}
          </p>
        </div>
      </div>

      {state === "off" ? (
        <button
          type="button"
          onClick={turnOn}
          disabled={busy}
          className="flex min-h-16 w-full items-center justify-center gap-3 rounded-full bg-primary-container px-6 text-[20px] font-bold text-on-primary shadow-md transition-all hover:bg-primary active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
        >
          <span className="material-symbols-outlined text-[28px]" aria-hidden="true">
            notifications_active
          </span>
          Turn on reminders
        </button>
      ) : null}

      {on ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={test}
            disabled={busy}
            className="flex min-h-14 flex-1 items-center justify-center gap-2 rounded-full bg-surface-container-lowest px-5 text-[18px] font-semibold text-on-surface shadow-sm transition-colors hover:bg-surface-container-low focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[22px] text-primary" aria-hidden="true">
              send
            </span>
            Send a test reminder
          </button>
          <button
            type="button"
            onClick={turnOff}
            disabled={busy}
            className="min-h-14 rounded-full px-5 text-[18px] font-semibold text-on-surface-variant underline underline-offset-4 transition-colors hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
          >
            Turn off
          </button>
        </div>
      ) : null}

      {message ? (
        <p role="status" className="text-[18px] font-semibold text-on-surface">
          {message}
        </p>
      ) : null}
    </section>
  );
}
