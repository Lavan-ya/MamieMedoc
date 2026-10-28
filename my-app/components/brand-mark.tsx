export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      role="img"
      aria-label="MamieMedoc leaf and cross logo"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="40" height="40" rx="13" fill="#2B7635" />
      <path
        d="M12.2 25.9c-2-7 2.9-14.7 12.7-14.5.8 7.9-4.1 14.8-12.7 14.5Z"
        fill="#F7FBF5"
      />
      <path
        d="M13.7 28.3c2.5-6.4 6.2-10.5 11.1-14.1"
        stroke="#2B7635"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M25.8 23.2v6.1M22.8 26.2h6.1"
        stroke="#F7FBF5"
        strokeWidth="2.3"
        strokeLinecap="round"
      />
      <circle cx="28.8" cy="11.4" r="2.1" fill="#F6C76D" />
    </svg>
  );
}