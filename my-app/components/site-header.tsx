"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";

const NAV_ITEMS = [
  { label: "Family Dashboard", href: "#overview", active: true },
  { label: "Mamie Jeanne Care View", href: "#doses", active: false },
  { label: "Prescriptions & Stock", href: "#inventory", active: false },
  { label: "Care Circle", href: "#wellness", active: false },
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="topbar">
      <div className="topbar-main">
        <a className="brand" href="#overview" aria-label="MamieMedoc dashboard home">
          <BrandMark className="brand-mark" />
          <span className="brand-name">
            Mamie<span>Medoc</span>
          </span>
        </a>

        <nav className="desktop-nav" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => (
            <a
              className={`nav-item${item.active ? " is-active" : ""}`}
              href={item.href}
              key={item.label}
              aria-current={item.active ? "page" : undefined}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="topbar-actions">
          <div className="wellbeing-pill" aria-label="Jeanne is doing well today">
            <span className="wellbeing-dot" aria-hidden="true" />
            <span>Jeanne is doing well today</span>
          </div>

          <div className="profile">
            <div className="profile-copy">
              <strong>Jeanne Dupont</strong>
              <span>Mamie &middot; 82 ans</span>
            </div>
            <img
              className="profile-avatar"
              src="/avatar-jeanne.svg"
              alt="Jeanne Dupont"
              width="40"
              height="40"
            />
          </div>

          <button
            type="button"
            className="menu-button"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <nav className="mobile-nav" id="mobile-navigation" aria-label="Mobile navigation">
          {NAV_ITEMS.map((item) => (
            <a
              className={`mobile-nav-item${item.active ? " is-active" : ""}`}
              href={item.href}
              key={item.label}
              aria-current={item.active ? "page" : undefined}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </a>
          ))}
          <div className="mobile-wellbeing">
            <span className="wellbeing-dot" aria-hidden="true" />
            Jeanne is doing well today
          </div>
        </nav>
      ) : null}
    </header>
  );
}