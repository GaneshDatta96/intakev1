export function GlobalFooter() {
  return (
    <footer className="border-t border-[color:var(--line)] bg-white/50 backdrop-blur-sm">
      <div className="flex w-full items-center justify-center px-5 py-4 sm:px-8 lg:px-10 2xl:px-14">
        <a
          href="https://ganeshdatta.me"
          target="_blank"
          rel="noreferrer"
          className="text-sm font-semibold tracking-[0.01em] text-[color:var(--muted)] transition hover:text-[color:var(--foreground)]"
        >
          created by Ganesh
        </a>
      </div>
    </footer>
  );
}
