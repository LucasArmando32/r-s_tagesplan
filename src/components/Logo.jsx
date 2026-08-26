export default function Logo() {
  return (
    <span className="inline-flex items-center gap-2 font-semibold tracking-tight">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-brand)] text-sm font-bold text-white">
        RS
      </span>
      <span className="hidden text-lg text-[var(--foreground)] sm:inline">
        Tagesplan
      </span>
    </span>
  );
}
