const SIZES = {
  md: { box: "h-9 w-9", boxText: "text-sm", label: "text-lg" },
  lg: { box: "h-20 w-20", boxText: "text-2xl", label: "text-3xl" },
};

export default function Logo({ inverted = false, size = "md", showLabel = true }) {
  const { box, boxText, label } = SIZES[size] ?? SIZES.md;

  return (
    <span className="inline-flex items-center gap-2.5 font-semibold tracking-tight">
      <span
        className={`flex ${box} items-center justify-center rounded-xl ${boxText} font-bold shadow-sm ring-1 ${
          inverted
            ? "bg-white text-[var(--color-brand)] ring-white/30"
            : "bg-gradient-to-br from-[var(--color-brand)] to-[var(--color-brand-darker)] text-white ring-black/5"
        }`}
      >
        RS
      </span>
      {showLabel && (
        <span
          className={`hidden ${label} sm:inline ${
            inverted ? "text-white" : "text-[var(--foreground)]"
          }`}
        >
          Tagesplan
        </span>
      )}
    </span>
  );
}
