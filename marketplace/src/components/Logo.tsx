export function Logo() {
  return (
    <div className="flex items-center gap-2 select-none">
      <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
        <defs>
          <linearGradient id="lg" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0050e0" />
            <stop offset="1" stopColor="#1d8bff" />
          </linearGradient>
        </defs>
        <rect width="36" height="36" rx="9" fill="url(#lg)" />
        <path
          d="M9 11l5.5 8.2v6.3h6.7v-6.3L26.7 11h-3.6l-4 6.2L15 11H9z"
          fill="#ffd400"
        />
      </svg>
      <div className="hidden flex-col leading-none sm:flex">
        <span className="text-[17px] font-extrabold tracking-tight text-ink">
          Yantach<span className="text-brand">.</span>
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-2">
          Shop
        </span>
      </div>
    </div>
  );
}
