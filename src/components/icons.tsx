/* ---------------------------------------------------------------------------
   Custom inline SVG icon set — single stroke language, drawn for VLT/STRT
--------------------------------------------------------------------------- */
type P = { className?: string };
const base = "inline-block shrink-0";

export const IconBolt = ({ className = "w-4 h-4" }: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={`${base} ${className}`} aria-hidden>
    <path d="M13.4 2 5 13.2h5.2L9.4 22l8.8-11.6h-5.4L13.4 2Z" />
  </svg>
);

export const IconSpark = ({ className = "w-3 h-3" }: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={`${base} ${className}`} aria-hidden>
    <path d="M12 1.8c.9 5.6 4.6 9.3 10.2 10.2C16.6 12.9 12.9 16.6 12 22.2 11.1 16.6 7.4 12.9 1.8 12 7.4 11.1 11.1 7.4 12 1.8Z" />
  </svg>
);

export const IconBag = ({ className = "w-5 h-5" }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={`${base} ${className}`} aria-hidden>
    <path d="M5.5 8h13l-.9 12.2a1.6 1.6 0 0 1-1.6 1.5H8a1.6 1.6 0 0 1-1.6-1.5L5.5 8Z" strokeLinejoin="round" />
    <path d="M8.5 10.5V6.8a3.5 3.5 0 0 1 7 0v3.7" strokeLinecap="round" />
  </svg>
);

export const IconSearch = ({ className = "w-5 h-5" }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={`${base} ${className}`} aria-hidden>
    <circle cx="10.5" cy="10.5" r="6.2" />
    <path d="m15.3 15.3 5.2 5.2" strokeLinecap="round" />
  </svg>
);

export const IconClose = ({ className = "w-5 h-5" }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={`${base} ${className}`} aria-hidden>
    <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
  </svg>
);

export const IconPlus = ({ className = "w-4 h-4" }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`${base} ${className}`} aria-hidden>
    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
  </svg>
);

export const IconMinus = ({ className = "w-4 h-4" }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`${base} ${className}`} aria-hidden>
    <path d="M5 12h14" strokeLinecap="round" />
  </svg>
);

export const IconTrash = ({ className = "w-4 h-4" }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={`${base} ${className}`} aria-hidden>
    <path d="M4.5 6.5h15M9.5 6.5V4.8A1.3 1.3 0 0 1 10.8 3.5h2.4a1.3 1.3 0 0 1 1.3 1.3v1.7M6.5 6.5l.8 12.7a1.6 1.6 0 0 0 1.6 1.5h6.2a1.6 1.6 0 0 0 1.6-1.5l.8-12.7" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10.2 10.5v6M13.8 10.5v6" strokeLinecap="round" />
  </svg>
);

export const IconArrow = ({ className = "w-4 h-4" }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`${base} ${className}`} aria-hidden>
    <path d="M4 12h15M13.5 5.5 20 12l-6.5 6.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconCheck = ({ className = "w-4 h-4" }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className={`${base} ${className}`} aria-hidden>
    <path d="m4.5 12.8 5 5L19.5 6.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconTruck = ({ className = "w-5 h-5" }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={`${base} ${className}`} aria-hidden>
    <path d="M2.8 6.5h11.4v10H2.8zM14.2 9.5h4l3 3.4v3.6h-7" strokeLinejoin="round" />
    <circle cx="6.8" cy="17.6" r="1.9" />
    <circle cx="17.4" cy="17.6" r="1.9" />
  </svg>
);

export const IconShield = ({ className = "w-5 h-5" }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={`${base} ${className}`} aria-hidden>
    <path d="M12 3 5 5.8v5.4c0 4.5 2.9 7.6 7 9.3 4.1-1.7 7-4.8 7-9.3V5.8L12 3Z" strokeLinejoin="round" />
    <path d="m8.8 11.6 2.3 2.3 4.1-4.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconLayers = ({ className = "w-5 h-5" }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={`${base} ${className}`} aria-hidden>
    <path d="m12 3 8.5 4.5L12 12 3.5 7.5 12 3Z" strokeLinejoin="round" />
    <path d="m4.5 12.3 7.5 4 7.5-4M4.5 16.5l7.5 4 7.5-4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconWhatsApp = ({ className = "w-5 h-5" }: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={`${base} ${className}`} aria-hidden>
    <path d="M12 2.2A9.7 9.7 0 0 0 3.6 16.8L2.3 21.7l5-1.3A9.7 9.7 0 1 0 12 2.2Zm0 17.7a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 19.9Zm4.4-6c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.6.1-.2.2-.7.8-.8 1-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3 0-.2 0-.3-.1-.4l-.7-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.7.3-.2.3-.9.9-.9 2.2s1 2.5 1.1 2.7c.1.2 1.9 3 4.7 4.2.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.4-.6 1.6-1.2.2-.6.2-1.1.2-1.2-.1-.2-.3-.2-.6-.4Z" />
  </svg>
);

export const IconDatabase = ({ className = "w-5 h-5" }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={`${base} ${className}`} aria-hidden>
    <ellipse cx="12" cy="5.5" rx="7.5" ry="2.8" />
    <path d="M4.5 5.5v13c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8v-13" />
    <path d="M4.5 12c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8" />
  </svg>
);

export const IconReceipt = ({ className = "w-5 h-5" }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={`${base} ${className}`} aria-hidden>
    <path d="M6 3.5h12V21l-2.4-1.5L13.2 21l-2.4-1.5L8.4 21 6 19.5V3.5Z" strokeLinejoin="round" />
    <path d="M9 8h6M9 11.5h6M9 15h3.5" strokeLinecap="round" />
  </svg>
);

export const IconHeart = ({ className = "w-5 h-5", filled = false }: P & { filled?: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="1.8"
    className={`${base} ${className}`}
    aria-hidden
  >
    <path
      d="M12 20.2S4 15.3 4 9.9C4 7 6.2 5 8.6 5c1.5 0 2.7.7 3.4 1.8C12.7 5.7 13.9 5 15.4 5 17.8 5 20 7 20 9.9c0 5.4-8 10.3-8 10.3Z"
      strokeLinejoin="round"
    />
  </svg>
);

export const IconCash = ({ className = "w-5 h-5" }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={`${base} ${className}`} aria-hidden>
    <rect x="2.8" y="6.5" width="18.4" height="11" rx="1.4" />
    <circle cx="12" cy="12" r="2.6" />
    <path d="M6 9.5h.01M18 14.5h.01" strokeLinecap="round" strokeWidth="2.4" />
  </svg>
);

export const IconCopy = ({ className = "w-5 h-5" }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={`${base} ${className}`} aria-hidden>
    <rect x="8.5" y="8.5" width="11.5" height="12" rx="1" />
    <path d="M15.5 8.5v-3a1.5 1.5 0 0 0-1.5-1.5H5A1.5 1.5 0 0 0 3.5 5.5V14A1.5 1.5 0 0 0 5 15.5h3.5" strokeLinecap="round" />
  </svg>
);

export const IconBank = ({ className = "w-5 h-5" }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={`${base} ${className}`} aria-hidden>
    <path d="m3.5 8.5 8.5-5 8.5 5v1.2h-17V8.5ZM5.5 9.7v7M9.8 9.7v7M14.2 9.7v7M18.5 9.7v7M3.5 16.7h17v2.3h-17z" strokeLinejoin="round" />
  </svg>
);
