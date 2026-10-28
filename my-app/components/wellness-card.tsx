import { Sparkles } from "lucide-react";

function GardenScene() {
  return (
    <div className="garden-scene" aria-hidden="true">
      <svg viewBox="0 0 380 148" preserveAspectRatio="xMidYMax slice">
        <defs>
          <linearGradient id="garden-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#F7FBF4" />
            <stop offset="1" stopColor="#EAF4E7" />
          </linearGradient>
          <linearGradient id="garden-ground" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#D8EAD3" />
            <stop offset="1" stopColor="#C8E0C4" />
          </linearGradient>
        </defs>

        <rect width="380" height="148" fill="url(#garden-sky)" />
        <circle cx="320" cy="32" r="19" fill="#F6D789" opacity=".78" />
        <circle cx="320" cy="32" r="27" fill="#F6D789" opacity=".15" />
        <path d="M0 92c47-18 87-18 127-5 44 14 78 16 124 1 45-14 83-13 129 2v58H0V92Z" fill="#E0EFDC" />
        <path d="M0 108c48-14 86-7 133 4 50 11 92 8 132-2 42-10 78-7 115 3v35H0v-40Z" fill="url(#garden-ground)" />

        <g className="garden-flower garden-flower--1">
          <path d="M65 122c-1-21 1-39 2-56" stroke="#4B7A4E" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M66 91c-9-1-14-6-16-13 9-1 15 3 16 13Z" fill="#77A56F" />
          <path d="M66 104c9-2 14-7 15-14-9-1-14 4-15 14Z" fill="#6E9C68" />
          <g transform="translate(67 58)">
            <circle cx="0" cy="-9" r="7" fill="#EA968C" />
            <circle cx="8.5" cy="-3" r="7" fill="#EA968C" />
            <circle cx="5.5" cy="7" r="7" fill="#F0A198" />
            <circle cx="-5.5" cy="7" r="7" fill="#F0A198" />
            <circle cx="-8.5" cy="-3" r="7" fill="#E58980" />
            <circle r="5" fill="#F3C560" />
          </g>
        </g>

        <g className="garden-flower garden-flower--2">
          <path d="M132 126c0-22 0-42 2-60" stroke="#547F50" strokeWidth="2" strokeLinecap="round" />
          <path d="M133 92c-10-1-15-6-17-14 10 0 16 4 17 14Z" fill="#7CA674" />
          <path d="M134 105c8-3 12-8 13-15-9 0-13 5-13 15Z" fill="#6B9966" />
          <g transform="translate(134 56)">
            <circle cx="0" cy="-8" r="6" fill="#F7F1DF" />
            <circle cx="8" cy="-3" r="6" fill="#FAF6E8" />
            <circle cx="5" cy="7" r="6" fill="#FFF9EE" />
            <circle cx="-5" cy="7" r="6" fill="#F7F1DF" />
            <circle cx="-8" cy="-3" r="6" fill="#FAF6E8" />
            <circle r="4.6" fill="#EFC264" />
          </g>
        </g>

        <g className="garden-flower garden-flower--3">
          <path d="M232 128c1-26 1-46 3-69" stroke="#4B7A4E" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M233 96c-11-1-17-7-18-15 10-1 17 4 18 15Z" fill="#709D69" />
          <path d="M235 83c9-2 14-8 15-15-9-1-14 4-15 15Z" fill="#7EA777" />
          <g transform="translate(236 52)">
            <path d="M0-9c6 0 10 4 10 9 0 6-4 9-10 9s-10-3-10-9c0-5 4-9 10-9Z" fill="#F1C661" />
            <path d="M-2-8c-5-4-3-10 2-9 3-5 9-2 8 3 5 2 3 8-2 8" fill="none" stroke="#D9AF4F" strokeWidth="1.4" />
            <circle cx="0" cy="0" r="4" fill="#DFA53D" />
          </g>
        </g>

        <g className="garden-flower garden-flower--4">
          <path d="M300 125c1-17 2-31 3-43" stroke="#587F53" strokeWidth="2" strokeLinecap="round" />
          <path d="M302 101c7-2 11-7 12-13-8-1-12 4-12 13Z" fill="#7AA373" />
          <g transform="translate(303 72)">
            <circle cx="0" cy="-5" r="4.3" fill="#D5C4DD" />
            <circle cx="5" cy="0" r="4.3" fill="#DCCDE3" />
            <circle cx="0" cy="5" r="4.3" fill="#CEBBDA" />
            <circle cx="-5" cy="0" r="4.3" fill="#D5C4DD" />
            <circle r="3.4" fill="#EDC469" />
          </g>
        </g>

        <g className="garden-flower garden-flower--5">
          <path d="M37 130c0-12 1-20 2-27" stroke="#5E8658" strokeWidth="1.7" strokeLinecap="round" />
          <g transform="translate(39 98)">
            <circle cx="0" cy="-4" r="3.5" fill="#F4F0E2" />
            <circle cx="4" cy="1" r="3.5" fill="#FAF6E9" />
            <circle cx="-4" cy="1" r="3.5" fill="#F4F0E2" />
            <circle r="2.5" fill="#E4B957" />
          </g>
        </g>

        <g fill="#6E9C68">
          <path d="M14 131c2-8 8-13 15-13-1 8-6 13-15 13Z" />
          <path d="M356 132c-2-9-8-14-15-14 1 9 6 14 15 14Z" />
          <path d="M166 133c3-7 9-10 15-10-2 7-7 10-15 10Z" opacity=".85" />
        </g>

        <g opacity=".8">
          <circle cx="195" cy="84" r="2.2" fill="#EFC264" />
          <circle cx="205" cy="88" r="1.6" fill="#E9988D" />
          <circle cx="281" cy="96" r="1.8" fill="#EFC264" />
          <circle cx="92" cy="86" r="1.5" fill="#D4C1DC" />
        </g>

        <path
          d="M266 55c-5-2-8-7-6-12 5-1 9 2 10 6 2-4 7-5 10-2 0 6-5 10-10 9"
          fill="none"
          stroke="#D9B86C"
          strokeWidth="1.3"
          strokeLinecap="round"
          opacity=".7"
        />
      </svg>
    </div>
  );
}

export function WellnessCard() {
  return (
    <section className="card wellness-card" id="wellness" aria-labelledby="wellness-title">
      <div className="wellness-topline">
        <span className="wellness-eyebrow">
          <Sparkles size={13} strokeWidth={2} aria-hidden="true" />
          Wellness Streak
        </span>
        <span className="level-pill">Level 4 &bull; Blooming</span>
      </div>

      <h2 id="wellness-title">Jeanne&apos;s Garden of Care</h2>
      <p className="wellness-copy">
        Seven days of little wins, tended with love by everyone in her care circle.
      </p>

      <GardenScene />

      <div className="garden-progress">
        <div className="garden-progress-label">
          <span>4 of 6 blooms grown</span>
          <strong>7 day streak</strong>
        </div>
        <div
          className="progress-track"
          role="progressbar"
          aria-valuenow={67}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Garden growth"
        >
          <span style={{ width: "67%" }} />
        </div>
        <p>2 more days until the next bloom</p>
      </div>
    </section>
  );
}