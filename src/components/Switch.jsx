const SIZES = {
  md: { track: "h-6 w-11 p-0.5", knob: "h-5 w-5", offset: "translate-x-5" },
  lg: { track: "h-9 w-16 p-1", knob: "h-7 w-7", offset: "translate-x-7" },
};

export default function Switch({ checked, size = "md" }) {
  const { track, knob, offset } = SIZES[size] ?? SIZES.md;

  return (
    <span
      role="switch"
      aria-checked={checked}
      className={`inline-flex shrink-0 items-center rounded-full transition-colors ${track} ${
        checked ? "bg-[var(--color-brand)]" : "bg-black/20"
      }`}
    >
      <span
        className={`block transform rounded-full bg-white shadow-md ring-1 ring-black/5 transition-transform ${knob} ${
          checked ? offset : "translate-x-0"
        }`}
      />
    </span>
  );
}
