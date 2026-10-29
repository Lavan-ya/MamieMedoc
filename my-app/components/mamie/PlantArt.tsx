import { GROWTH_DAYS, type PlantVariety } from "@/lib/plant";

const GROUND = 132;
// Leaves at each growth step (0 = seed ... 7 = in flower).
const LEAVES = [0, 2, 2, 3, 4, 5, 6, 6];

function Leaf({ y, side, size, tone }: { y: number; side: 1 | -1; size: number; tone: string }) {
  return (
    <path
      d="M0 0C7 -11 24 -12 30 -2C24 6 8 7 0 0Z"
      fill={tone}
      transform={`translate(80 ${y}) scale(${side * size} ${size}) rotate(-18)`}
    />
  );
}

function Flower({ variety, x, y }: { variety: PlantVariety; x: number; y: number }) {
  const { petals, center, shape } = variety;
  if (shape === "tulip") {
    return (
      <g transform={`translate(${x} ${y}) scale(1.5)`}>
        <path d="M-11 -2C-12 -14 -6 -20 0 -14C6 -20 12 -14 11 -2C9 6 -9 6 -11 -2Z" fill={petals} />
        <path d="M-4 -15C0 -20 4 -15 4 -15L0 2Z" fill={center} />
      </g>
    );
  }
  if (shape === "lavender") {
    return (
      <g transform={`translate(${x} ${y + 4}) scale(1.2)`}>
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <g key={index}>
            <ellipse cx={-3.5} cy={-index * 5} rx="3.2" ry="4" fill={index % 2 ? petals : center} />
            <ellipse cx={3.5} cy={-index * 5 - 2} rx="3.2" ry="4" fill={index % 2 ? center : petals} />
          </g>
        ))}
      </g>
    );
  }
  if (shape === "rose") {
    return (
      <g transform={`translate(${x} ${y}) scale(1.5)`}>
        <circle r="12" fill={petals} />
        <circle r="8" fill={center} />
        <path d="M-4 -2C-2 -7 5 -6 4 0C3 4 -3 4 -3 0" stroke={petals} strokeWidth="2" fill="none" />
      </g>
    );
  }
  const count = shape === "sunflower" ? 12 : 8;
  const length = shape === "sunflower" ? 11 : 9;
  return (
    <g transform={`translate(${x} ${y}) scale(1.5)`}>
      {Array.from({ length: count }, (_, index) => (
        <ellipse
          key={index}
          cx="0"
          cy={-length}
          rx={shape === "sunflower" ? 3.6 : 3.8}
          ry={length * 0.7}
          fill={petals}
          stroke={petals === "#FFFFFF" ? "#E5E2DA" : "none"}
          strokeWidth="0.8"
          transform={`rotate(${(360 / count) * index})`}
        />
      ))}
      <circle r={shape === "sunflower" ? 8 : 5.5} fill={center} />
    </g>
  );
}

/**
 * The weekly plant at a growth step (0-7). `potted` draws this week's plant in
 * its pot; garden plants stand in the soil.
 */
export function PlantArt({
  variety,
  grown,
  potted = true,
  sway = false,
  sparkle = false,
  className,
}: {
  variety: PlantVariety;
  grown: number;
  potted?: boolean;
  sway?: boolean;
  sparkle?: boolean;
  className?: string;
}) {
  const step = Math.max(0, Math.min(GROWTH_DAYS, grown));
  const stem = step === 0 ? 0 : 14 + step * 12.5;
  const top = GROUND - stem;
  const leafSize = 0.55 + step * 0.07;
  const tones = ["#2E7D32", "#1B6D24", "#388E3C", "#286B33"];
  const leaves = LEAVES[step];

  return (
    <svg viewBox="0 -14 160 184" className={className} aria-hidden="true" focusable="false">
      {potted ? <ellipse cx="80" cy="164" rx="46" ry="4" fill="#000" opacity="0.06" /> : null}

      <g className={sway ? "plant-sway" : undefined} style={{ transformOrigin: `80px ${GROUND}px` }}>
        {step === 0 ? (
          // A seed just under the soil, with the first tip showing
          <g>
            <ellipse cx="80" cy={GROUND - 1} rx="6" ry="4" fill="#8B5A2B" />
            <path d={`M80 ${GROUND - 3}C80 ${GROUND - 10} 84 ${GROUND - 12} 86 ${GROUND - 13}`} stroke="#4E8F4F" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </g>
        ) : (
          <>
            <path
              d={`M80 ${GROUND}C79 ${GROUND - stem * 0.4} 81 ${GROUND - stem * 0.7} 80 ${top}`}
              stroke="#2E6B31"
              strokeWidth={2.4 + step * 0.35}
              strokeLinecap="round"
              fill="none"
            />
            {Array.from({ length: leaves }, (_, index) => (
              <Leaf
                key={index}
                y={GROUND - (stem * (index + 1)) / (leaves + 1.4)}
                side={index % 2 === 0 ? -1 : 1}
                size={leafSize * (1 - index * 0.05)}
                tone={tones[index % tones.length]}
              />
            ))}
            {step < 6 ? <circle cx="80" cy={top} r={2.5 + step * 0.3} fill="#88D982" /> : null}
            {step === 6 ? (
              <g transform={`translate(80 ${top})`}>
                <path d="M0 2C-6 -2 -5 -13 0 -17C5 -13 6 -2 0 2Z" fill={variety.petals === "#FFFFFF" ? "#DCE8D2" : variety.petals} />
                <path d="M0 2C-4 0 -6 -5 -5 -9M0 2C4 0 6 -5 5 -9" stroke="#4B7A4E" strokeWidth="1.6" fill="none" />
              </g>
            ) : null}
            {step === 7 ? <Flower variety={variety} x={80} y={top - 10} /> : null}
          </>
        )}
      </g>

      {sparkle ? (
        <g className="plant-sparkle" fill="#F3C560">
          <path d={`M112 ${Math.min(top, GROUND - 30) - 6}l2 5 5 2-5 2-2 5-2-5-5-2 5-2z`} />
          <path d={`M44 ${Math.min(top, GROUND - 30) + 8}l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z`} />
          <circle cx="120" cy={Math.min(top, GROUND - 30) + 26} r="2" />
        </g>
      ) : null}

      {potted ? (
        <>
          <path d="M50 132H110L104 162C103.4 164.4 101.6 166 99 166H61C58.4 166 56.6 164.4 56 162Z" fill={variety.pot} />
          <rect x="46" y="126" width="68" height="10" rx="4" fill={variety.pot} />
          <rect x="46" y="126" width="68" height="10" rx="4" fill="#000" opacity="0.12" />
        </>
      ) : (
        <path d="M30 134C50 128 110 128 130 134C120 140 40 140 30 134Z" fill="#7A5230" opacity="0.85" />
      )}
    </svg>
  );
}
