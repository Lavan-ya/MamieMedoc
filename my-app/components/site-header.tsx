"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";

const NAV_ITEMS = [
  { label: "Family Dashboard", href: "/family" },
  { label: "Mamie Jeanne Care View", href: "/mamie" },
  { label: "Prescriptions & Stock", href: "/prescriptions" },
  { label: "Care Circle", href: "/family#wellness" },
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="topbar">
      <div className="topbar-main">
        <Link className="brand" href="/family" aria-label="MamieMedoc dashboard home">
          <BrandMark className="brand-mark" />
          <span className="brand-name">
            Mamie<span>Medoc</span>
          </span>
        </Link>

        <nav className="desktop-nav" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => (
            <Link
              className={`nav-item${item.href === pathname ? " is-active" : ""}`}
              href={item.href}
              key={item.label}
              aria-current={item.href === pathname ? "page" : undefined}
            >
              {item.label}
            </Link>
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
            <Link
              className={`mobile-nav-item${item.href === pathname ? " is-active" : ""}`}
              href={item.href}
              key={item.label}
              aria-current={item.href === pathname ? "page" : undefined}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </Link>
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