import { useEffect, useState } from "react";
import { DownloadButton, Icons } from "./shared";

const LINKS = [
  { href: "#demo", label: "Demo" },
  { href: "#configurador", label: "Configurador" },
  { href: "#caracteristicas", label: "Características" },
  { href: "#comparativa", label: "vs CookieYes" },
  { href: "#codigo", label: "Código" },
  { href: "#precios", label: "Precios" },
  { href: "#faq", label: "FAQ" },
];

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <a href="#top" className="group flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-azure/12 text-azure ring-1 ring-azure/35 transition-all duration-300 group-hover:bg-azure group-hover:text-ink">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M12 3l7.5 2.8v5.4c0 4.6-3.2 8-7.5 9.8-4.3-1.8-7.5-5.2-7.5-9.8V5.8L12 3z" />
          <circle cx="10" cy="10.5" r="1" fill="currentColor" stroke="none" />
          <circle cx="14" cy="13" r="1" fill="currentColor" stroke="none" />
          <circle cx="10.8" cy="15" r="0.8" fill="currentColor" stroke="none" />
        </svg>
      </span>
      {!compact && (
        <span className="font-display text-[19px] font-bold tracking-tight text-snow">
          Consentia
          <span className="ml-2 rounded bg-ink-3 px-1.5 py-0.5 font-mono text-[10px] font-medium text-azure ring-1 ring-line">
            v1.0.0
          </span>
        </span>
      )}
    </a>
  );
}

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-[900] transition-all duration-300 ${
        scrolled || open ? "border-b border-line-soft bg-ink/90 backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Principal">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-2 text-[13.5px] font-medium text-mist transition-colors duration-200 hover:bg-ink-3 hover:text-snow"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <a
            href="#opiniones"
            className="hidden items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 font-mono text-[12px] text-amber transition-colors hover:border-amber/50 md:flex"
            title="Valoración media en el repositorio"
          >
            <Icons.star className="h-3.5 w-3.5" />
            4,9
          </a>
          <DownloadButton compact label="Descargar" />
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            className="grid h-9 w-9 place-items-center rounded-md border border-line text-mist transition-colors hover:border-azure hover:text-azure lg:hidden"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4.5 w-4.5">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h10" />}
            </svg>
          </button>
        </div>
      </div>

      {/* mobile menu */}
      <div
        className={`overflow-hidden border-line-soft transition-all duration-300 lg:hidden ${
          open ? "max-h-80 border-b" : "max-h-0"
        }`}
      >
        <nav className="mx-auto max-w-6xl px-5 py-3" aria-label="Móvil">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block rounded-md px-3 py-2.5 text-[14.5px] font-medium text-mist transition-colors hover:bg-ink-3 hover:text-snow"
            >
              {l.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
