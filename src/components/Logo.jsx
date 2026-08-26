export default function Logo({ inverted = false }) {
  return (
    <span className="inline-flex items-center gap-2.5 font-semibold tracking-tight">
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold shadow-sm ring-1 ${
          inverted
            ? "bg-white text-[var(--color-brand)] ring-white/30"
            : "bg-gradient-to-br from-[var(--color-brand)] to-[var(--color-brand-darker)] text-white ring-black/5"
        }`}
      >
        RS
      </span>
      <span
        className={`hidden text-lg sm:inline ${
          inverted ? "text-white" : "text-[var(--foreground)]"
        }`}
      >
        Tagesplan
      </span>
    </span>
  );
}
