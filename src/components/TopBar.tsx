export default function TopBar() {
  return (
    <header className="fm-topbar flex h-14 shrink-0 items-center justify-between gap-4 px-4 text-white md:px-6">
      <div className="flex items-center gap-3 text-lg font-bold tracking-tight">
        <span className="fm-brand-mark" aria-hidden="true" />
        Future Molding
      </div>
      <span className="hidden text-sm font-medium text-blue-100 sm:block">Assistente di stampaggio</span>
    </header>
  );
}
