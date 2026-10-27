# MamieMédoc

> Snap the prescription once; every pill Mamie takes grows her plant, and every low stock gets one family member to pick it up.

MamieMédoc is a web app that keeps an elderly person and her family connected around her daily medication. Mamie confirms each dose with one big button; her family sees that she took it and steps in before her stock runs out.

**Status:** learning project, built in 3 days by a team of 2 with Claude writing most of the code. Demo with **invented data only**. Not a medical device and not for real patients.

---

## Features

### For Mamie (the elderly user)

- **Dose reminder**: a large full-screen reminder at dose time with the medicine name and dose, repeated if not confirmed.
- **One big button**: "J'ai pris mon médicament" confirms the dose and updates the stock.
- **Growing plant**: grows one stage for each day all doses were confirmed. It never shrinks.
- **Refill message**: shows which family member is bringing the medicine and when.
- **Emergency button**: a pop-up with each family member's name, number and a call button.
- **Spoken reminder** _(optional)_: reads the reminder out loud.

### For the family

- **Family space**: a family member creates Mamie's account and adds other family members.
- **Prescription scan (AI)**: photo of a printed or handwritten ordonnance; the AI extracts each medicine, dose, times of day and duration.
- **Review pop-up**: the family checks and corrects what the AI read, confirms the pills on hand, then saves. The daily schedule is built automatically.
- **BDPM check**: every extracted medicine is matched against the official French medicines database.
- **Family dashboard**: today's doses, the last 7 days, days of stock left, the plant and the prescription details.
- **"Je m'en occupe"**: when stock is low, one family member takes charge of the refill and everyone sees it.

---

## How it works

1. A family member creates the family space and adds Mamie and the family.
2. They photograph the prescription. The AI reads it and each medicine is checked against BDPM.
3. They review, fix and save. The app creates the dose schedule.
4. At dose time, Mamie's screen shows a reminder. She taps the big button; the plant grows and the stock goes down.
5. When stock falls below the alert threshold, a refill alert appears for everyone.
6. One family member taps "Je m'en occupe". Mamie sees who is coming.

---

## Tech stack

| Part            | Choice                                                   |
| --------------- | -------------------------------------------------------- |
| Web app         | Next.js (React pages and server routes) — TODO: confirm  |
| Database        | SQLite with Prisma — TODO: confirm                       |
| AI extraction   | Claude API with image input, called only from the server |
| Medicine check  | BDPM file (`CIS_bdpm.txt`) loaded into a local table     |
| Design          | Google Stitch                                            |
| Installable app | PWA (manifest and service worker)                        |

The browser never calls the AI or reads the BDPM file directly; it only calls the app's server routes. The API key stays on the server.

---

## Getting started

> TODO: update these commands once the project is set up.

### Prerequisites

- Node.js (TODO: version)
- A Claude API key

### Setup

```bash
git clone TODO-repo-url
cd mamiemedoc
npm install
cp .env.example .env        # then add your API key
npx prisma migrate dev      # create the database
npm run seed                # load the invented demo family
npm run dev                 # open http://localhost:3000
```

### Environment variables

| Name                | Purpose                                                      |
| ------------------- | ------------------------------------------------------------ |
| `ANTHROPIC_API_KEY` | Claude API key for prescription extraction. Never commit it. |
| `DATABASE_URL`      | SQLite file path, e.g. `file:./dev.db`                       |

### Load the BDPM medicines list

1. Download the medicines file (`CIS_bdpm.txt`) from the [BDPM download page](https://base-donnees-publique.medicaments.gouv.fr/index.php/telechargement).
2. Put it in `data/`.
3. Run `npm run bdpm:import` (TODO: confirm script name).

The file is tab-separated with no header row. If its encoding causes problems, use the [monthly CSV conversion on data.gouv.fr](https://www.data.gouv.fr/datasets/base-de-donnees-publique-des-medicaments-en-csv-conversion-mensuelle).

---

## Demo walkthrough (about 5 minutes)

1. Create "Famille Martin" with Mamie Jeanne and one family member.
2. Upload the handwritten test prescription. Show the AI result and BDPM badges, fix one field, save.
3. Open Mamie's screen. The reminder appears; tap the big button and watch the plant grow.
4. Open the family dashboard: the dose is taken, stock shows days left.
5. Use the "Passer à la prochaine prise" demo button until the low-stock alert appears. Tap "Je m'en occupe" with "jeudi".
6. Back on Mamie's screen, the refill message shows. End with the emergency pop-up.

---

## Using it on iPhone

On iPhone, reminders while the app is closed only work once MamieMédoc is added to the Home Screen (Share → "Sur l'écran d'accueil"), opened from the icon, and allowed to send notifications. This needs iOS 16.4 or later. The app shows a pop-up explaining these steps to iPhone users.

On Android with Chrome, notifications work from the browser.

---

## Data model

| Table        | Purpose                                                                       |
| ------------ | ----------------------------------------------------------------------------- |
| Household    | The family space                                                              |
| Member       | Mamie and each family member (role, phone)                                    |
| Prescription | The photo, the AI result, who confirmed it                                    |
| Medication   | One row per medicine: dose, times, pills on hand, alert threshold, BDPM match |
| DoseLog      | Every planned dose and whether it was taken                                   |
| RefillTask   | Low-stock alert and who said "Je m'en occupe"                                 |
| BdpmMedicine | The official medicines list                                                   |

The plant is calculated from DoseLog; it has no table.

---

## Limitations and privacy

- **Invented data only.** Do not upload real prescriptions or real personal details. In France, storing real health data requires a certified health data host (HDS).
- **The AI can misread a prescription**, especially handwriting. A family member must always review the result before saving.
- **Not medical advice.** MamieMédoc does not replace a doctor or pharmacist.
- Reminders are shown while the page is open; notifications with the app closed depend on the device (see iPhone section).

---

## Not built yet

- Real logins and invitations
- SMS or phone-call reminders for phones without notifications
- Doctor appointment reminders
- Pharmacy stock checks

---

## How we built it

We used Claude to write most of the code, one feature at a time. For each step we asked Claude to plan, built only that step, asked it to explain every file it changed, tested it, and committed. What we learned is in [`NOTES.md`](NOTES.md).

---

## Team

TODO: names and roles

## Credits

- Medicine data: [Base de données publique des médicaments](https://base-donnees-publique.medicaments.gouv.fr) (ANSM, HAS, UNCAM), update of TODO-date. The licence requires citing the source and its update date.
- UI designed with Google Stitch.

## License
