import { useId } from "react";

type Props = {
  size?: number;
  className?: string;
};

export function LogoMark({ size = 32, className = "" }: Props) {
  const uid = useId().replace(/:/g, "");
  const ring = `qRing-${uid}`;
  const bars = `qBars-${uid}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id={ring} x1="8" y1="6" x2="58" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38BDF8" />
          <stop offset="1" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id={bars} x1="22" y1="18" x2="44" y2="46" gradientUnits="userSpaceOnUse">
          <stop stopColor="#67E8F9" />
          <stop offset="1" stopColor="#00D1C1" />
        </linearGradient>
      </defs>
      <ellipse
        cx="32"
        cy="33"
        rx="28"
        ry="11"
        transform="rotate(-22 32 33)"
        stroke="#22D3EE"
        strokeWidth="2.2"
        opacity="0.85"
      />
      <circle cx="10" cy="24" r="3.1" fill="#22D3EE" />
      <circle cx="54" cy="42" r="3.1" fill="#67E8F9" />
      <path
        d="M32 12c11 0 20 9 20 20 0 8.4-5.2 15.6-12.6 18.5L47 59H39.4l-5.2-7.1C33.5 52 32.8 52 32 52 21 52 12 43 12 32S21 12 32 12Z"
        fill={`url(#${ring})`}
      />
      <circle cx="32" cy="32" r="13.5" fill="#0B1B3A" />
      <rect x="22.2" y="28" width="3.4" height="10" rx="1.2" fill={`url(#${bars})`} />
      <rect x="27.6" y="22" width="3.4" height="16" rx="1.2" fill={`url(#${bars})`} />
      <rect x="33" y="26" width="3.4" height="12" rx="1.2" fill={`url(#${bars})`} />
      <rect x="38.4" y="24" width="3.4" height="14" rx="1.2" fill={`url(#${bars})`} />
    </svg>
  );
}

export function LogoLockup({ size = 36 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark size={size} />
      <div className="leading-tight">
        <p className="text-[17px] font-semibold tracking-tight text-ink dark:text-white">Quantum</p>
        <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-sky-600 dark:text-cyan-300">
          Trading Journal
        </p>
      </div>
    </div>
  );
}
