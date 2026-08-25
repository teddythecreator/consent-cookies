import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import JSZip from "jszip";
import { PLUGIN_FILES, PLUGIN_VERSION } from "../plugin-files";

/* ------------------------------------------------- motion utils ---- */

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "figure" | "li" | "article";
}

export function Reveal({ children, className = "", delay = 0, as = "div" }: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("is-revealed");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.classList.add("is-revealed");
            io.disconnect();
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const Tag = as as "div";
  return (
    <Tag ref={ref as never} className={`reveal ${className}`} style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}>
      {children}
    </Tag>
  );
}

/* ------------------------------------------------------ typewriter ---- */

export function useTypewriter(lines: string[], speed = 26, pauseBetween = 420) {
  const reduced = usePrefersReducedMotion();
  const [progress, setProgress] = useState({ line: 0, chars: 0, done: false });

  useEffect(() => {
    if (reduced) {
      setProgress({ line: lines.length, chars: 0, done: true });
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const step = (line: number, chars: number) => {
      if (cancelled) return;
      if (line >= lines.length) {
        setProgress({ line, chars: 0, done: true });
        return;
      }
      if (chars <= lines[line].length) {
        setProgress({ line, chars, done: false });
        timer = setTimeout(() => step(line, chars + 1), chars === 0 ? pauseBetween : speed);
      } else {
        timer = setTimeout(() => step(line + 1, 0), pauseBetween);
      }
    };

    timer = setTimeout(() => step(0, 0), 600);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [lines, speed, pauseBetween, reduced]);

  const displayed = lines.map((full, i) =>
    i < progress.line ? full : i === progress.line ? full.slice(0, progress.chars) : ""
  );
  return { displayed, activeLine: progress.line, done: progress.done };
}

/* ----------------------------------------------------------- icons ---- */

type IconProps = { className?: string };
const base = "w-5 h-5";

export const Icons = {
  shield: ({ className = base }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 3l7.5 2.8v5.4c0 4.6-3.2 8-7.5 9.8-4.3-1.8-7.5-5.2-7.5-9.8V5.8L12 3z" />
      <path d="M9 12l2.2 2.2L15.5 10" />
    </svg>
  ),
  bolt: ({ className = base }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M13 2L5 13h5.5L11 22l8-11h-5.5L13 2z" />
    </svg>
  ),
  palette: ({ className = base }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 3a9 9 0 100 18c1.4 0 2-.9 2-1.8 0-.8-.6-1.2-.6-2 0-1 .8-1.7 2-1.7h1.8A4 4 0 0021 11.5C20.7 6.7 16.8 3 12 3z" />
      <circle cx="7.8" cy="10.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="11" cy="7.2" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15.4" cy="8.4" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  ),
  a11y: ({ className = base }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="4.6" r="1.9" />
      <path d="M4.5 8.2c4.8 1.3 10.2 1.3 15 0M12 10v4.5M12 14.5l-3.2 6M12 14.5l3.2 6" />
    </svg>
  ),
  ledger: ({ className = base }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M6 3h9l4 4v14H6V3z" />
      <path d="M15 3v4h4M9.5 12h6M9.5 15.5h6" />
    </svg>
  ),
  geo: ({ className = base }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.6 2.6 3.9 5.6 3.9 9S14.6 18.4 12 21c-2.6-2.6-3.9-5.6-3.9-9S9.4 5.6 12 3z" />
    </svg>
  ),
  layers: ({ className = base }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 3l9 4.8-9 4.8-9-4.8L12 3z" />
      <path d="M3 12.6l9 4.8 9-4.8M3 16.8l9 4.8 9-4.8" />
    </svg>
  ),
  code: ({ className = base }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M8 6L3 12l5 6M16 6l5 6-5 6M13.5 4l-3 16" />
    </svg>
  ),
  download: ({ className = base }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 3v11M7.5 10.5L12 15l4.5-4.5M4 19h16" />
    </svg>
  ),
  check: ({ className = base }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M4.5 12.5l5 5L19.5 7" />
    </svg>
  ),
  copy: ({ className = base }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  ),
  star: ({ className = base }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.3L12 17.1l-5.7 3.1 1.2-6.3-4.7-4.4 6.4-.8L12 2.8z" />
    </svg>
  ),
  cookie: ({ className = base }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M21 12.5A9 9 0 1111.5 3a3.2 3.2 0 004 4 3.2 3.2 0 004 4 3.6 3.6 0 001.5 1.5z" />
      <circle cx="9.5" cy="10.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="13.5" cy="15" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="9" cy="15.5" r="0.7" fill="currentColor" stroke="none" />
    </svg>
  ),
  wordpress: ({ className = base }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M4.8 8.5h1.9M17 8.5h1.9M6.2 8.5l3.4 9.3 2.2-6.1 2.3 6.1 3.2-9.3" strokeLinejoin="round" />
    </svg>
  ),
  refresh: ({ className = base }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M20 12a8 8 0 11-2.3-5.6M20 3v4h-4" />
    </svg>
  ),
  chevron: ({ className = base }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  ),
  arrow: ({ className = base }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M4 12h15M13 5.5L19.5 12 13 18.5" />
    </svg>
  ),
  play: ({ className = base }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M7 4.5l13 7.5-13 7.5v-15z" />
    </svg>
  ),
  scan: ({ className = base }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
      <path d="M7 12h10" />
      <circle cx="12" cy="12" r="4" opacity="0.45" />
    </svg>
  ),
  google: ({ className = base }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 12h8.5" />
      <path d="M20.5 12a8.5 8.5 0 11-2.5-6" />
      <path d="M12 7.5A4.5 4.5 0 1016.5 12" opacity="0.5" />
    </svg>
  ),
  sync: ({ className = base }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M17 3l4 4-4 4" />
      <path d="M21 7H8a5 5 0 00-5 5v1" />
      <path d="M7 21l-4-4 4-4" />
      <path d="M3 17h13a5 5 0 005-5v-1" />
    </svg>
  ),
  x: ({ className = base }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  ),
  doc: ({ className = base }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 17h6M9 9h1" />
    </svg>
  ),
};

export function Stars({ count = 5, size = "w-4 h-4" }: { count?: number; size?: string }) {
  return (
    <span className="inline-flex gap-0.5 text-amber" aria-label={`${count} de 5 estrellas`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Icons.star key={i} className={`${size} ${i < count ? "" : "opacity-25"}`} />
      ))}
    </span>
  );
}

/* ----------------------------------------------------------- toast ---- */

interface Toast {
  id: number;
  message: string;
}

const ToastContext = createContext<(message: string) => void>(() => undefined);
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const push = useCallback((message: string) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev.slice(-2), { id, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4200);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="fixed bottom-5 right-5 z-[1000] flex flex-col gap-2" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-3 rounded-lg border border-line bg-ink-2/95 px-4 py-3 text-sm text-snow shadow-2xl shadow-black/40 backdrop-blur-sm"
          >
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-teal/15 text-teal">
              <Icons.check className="h-3.5 w-3.5" />
            </span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/* --------------------------------------------------- ZIP download ---- */

export async function buildPluginZip(): Promise<Blob> {
  const zip = new JSZip();
  const root = zip.folder("consentia");
  if (!root) throw new Error("zip");
  for (const file of PLUGIN_FILES) {
    root.file(file.path, file.content);
  }
  return zip.generateAsync({ type: "blob", compression: "DEFLATE" });
}

export function DownloadButton({
  label = "Descargar consentia.zip",
  compact = false,
  className = "",
}: {
  label?: string;
  compact?: boolean;
  className?: string;
}) {
  const toast = useToast();
  const [state, setState] = useState<"idle" | "working" | "done">("idle");

  const handle = async () => {
    if (state === "working") return;
    setState("working");
    try {
      const blob = await buildPluginZip();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `consentia-${PLUGIN_VERSION}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      setState("done");
      toast(`consentia-${PLUGIN_VERSION}.zip descargado. Súbelo en Plugins → Añadir nuevo → Subir plugin.`);
      setTimeout(() => setState("idle"), 2600);
    } catch {
      setState("idle");
      toast("No se pudo generar el ZIP. Recarga la página e inténtalo de nuevo.");
    }
  };

  return (
    <button
      type="button"
      onClick={handle}
      className={`btn-shine group inline-flex items-center justify-center gap-2.5 rounded-lg font-semibold transition-all duration-200 ${
        compact ? "px-4 py-2 text-sm" : "px-6 py-3.5 text-[15px]"
      } ${
        state === "done"
          ? "bg-teal text-ink"
          : "bg-azure text-ink shadow-lg shadow-azure/25 hover:bg-snow hover:shadow-snow/20 active:scale-[0.97]"
      } ${className}`}
    >
      {state === "working" ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink/30 border-t-ink" aria-hidden="true" />
      ) : state === "done" ? (
        <Icons.check className="h-4.5 w-4.5" />
      ) : (
        <Icons.download className="h-4.5 w-4.5 transition-transform duration-200 group-hover:translate-y-0.5" />
      )}
      {state === "working" ? "Generando…" : state === "done" ? "¡Descargado!" : label}
    </button>
  );
}

/* ------------------------------------------------- section heading ---- */

export function SectionHeading({
  eyebrow,
  title,
  sub,
  align = "left",
}: {
  eyebrow: string;
  title: ReactNode;
  sub?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={`max-w-2xl ${align === "center" ? "mx-auto text-center" : ""}`}>
      <Reveal>
        <p className="font-mono text-[12px] font-medium uppercase tracking-[0.22em] text-azure">
          <span className="mr-2 text-teal">//</span>
          {eyebrow}
        </p>
      </Reveal>
      <Reveal delay={90}>
        <h2 className="mt-4 font-display text-[clamp(1.9rem,4vw,2.9rem)] font-bold leading-[1.08] tracking-tight text-snow">
          {title}
        </h2>
      </Reveal>
      {sub && (
        <Reveal delay={170}>
          <p className="mt-4 text-[16.5px] leading-relaxed text-mist">{sub}</p>
        </Reveal>
      )}
    </div>
  );
}
