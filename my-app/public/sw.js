// MamieMédoc service worker: shows medication reminders sent by the API
// (Web Push), even when no MamieMédoc tab is open or the screen is locked.
// Registered from components/mamie/ReminderNotifications.tsx as
// /sw.js?api=<API URL>.

const API_URL = new URL(self.location.href).searchParams.get("api") || "http://localhost:4000";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let reminder;
  try {
    reminder = event.data.json();
  } catch {
    reminder = { title: "MamieMédoc", body: event.data ? event.data.text() : "" };
  }

  const actions = [];
  if (reminder.doseId) {
    actions.push({ action: "taken", title: "I have taken it" });
    if (reminder.snoozesLeft > 0) actions.push({ action: "snooze", title: "Remind me in 15 min" });
  }

  event.waitUntil(
    self.registration.showNotification(reminder.title, {
      body: reminder.body,
      icon: "/icon.svg",
      badge: "/icon.svg",
      // One notification per dose: a snoozed reminder replaces the previous one.
      tag: reminder.doseId ? `dose-${reminder.doseId}` : "mamiemedoc",
      renotify: true,
      // Stays on screen until Jeanne answers it.
      requireInteraction: true,
      vibrate: [400, 150, 400, 150, 400],
      data: { doseId: reminder.doseId },
      actions,
    }),
  );
});

async function openCareView() {
  const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  const existing = windows.find((client) => new URL(client.url).pathname.startsWith("/mamie"));
  if (existing) return existing.focus();
  return self.clients.openWindow("/mamie");
}

async function answer(doseId, action) {
  const response = await fetch(`${API_URL}/doses/${doseId}/${action === "taken" ? "taken" : "snooze"}`, {
    method: "POST",
  });
  if (!response.ok) throw new Error(`API ${response.status}`);
  if (action === "taken") {
    await self.registration.showNotification("Well done!", {
      body: "Your family has been told you took your medicine.",
      icon: "/icon.svg",
      tag: `dose-${doseId}`,
    });
  }
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const { doseId } = event.notification.data || {};

  if (doseId && (event.action === "taken" || event.action === "snooze")) {
    // If saving fails (no network), open the page so Jeanne can answer there.
    event.waitUntil(answer(doseId, event.action).catch(openCareView));
    return;
  }
  event.waitUntil(openCareView());
});
