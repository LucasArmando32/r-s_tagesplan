export default function CarIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 16"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <path
        d="M3 11 4.6 6.4A2 2 0 0 1 6.5 5h11a2 2 0 0 1 1.9 1.4L21 11"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="2"
        y="11"
        width="20"
        height="3"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="7" cy="14" r="1.3" fill="currentColor" />
      <circle cx="17" cy="14" r="1.3" fill="currentColor" />
    </svg>
  );
}
