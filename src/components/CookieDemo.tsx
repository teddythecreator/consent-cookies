import { useEffect, useState, type ReactNode } from "react";
import { Icons, usePrefersReducedMotion } from "./shared";

export interface BannerConfig {
  type: "card" | "bar";
  position: "bottom-left" | "bottom-right" | "bottom-center" | "top";
  bg: string;
  text: string;
  accent: string;
  radius: number;
  title: string;
  message: string;
  acceptLabel: string;
  rejectLabel: string;
  prefsLabel: string;
  delayMs: number;
}

export const DEFAULT_CONFIG: BannerConfig = {
  type: "card",
  position: "bottom-left",
  bg: "#111827",
  text: "#f3f4f6",
  accent: "#2f6fed",
  radius: 14,
  title: "Tu privacidad nos importa",
  message:
    "Utilizamos cookies propias y de terceros para mejorar tu experiencia y analizar el tráfico. Puedes aceptarlas, rechazarlas o configurarlas.",
  acceptLabel: "Aceptar todas",
  rejectLabel: "Rechazar",
  prefsLabel: "Configurar",
  delayMs: 600,
};

export interface ConsentState {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

export const CATEGORIES: { key: keyof ConsentState; label: string; desc: string; locked?: boolean }[] = [
  {
    key: "necessary",
    label: "Necesarias",
    desc: "Sesión, seguridad y carrito. No se pueden desactivar.",
    locked: true,
  },
  { key: "analytics", label: "Analíticas", desc: "Métricas agregadas y anónimas de uso." },
  { key: "marketing", label: "Marketing", desc: "Anuncios relevantes y limitación de frecuencia." },
];

/* ------------------------------------------------------- positions ---- */

const positionClass: Record<BannerConfig["position"], string> = {
  "bottom-left": "left-3 bottom-3 items-end",
  "bottom-right": "right-3 bottom-3 items-end",
  "bottom-center": "left-1/2 -translate-x-1/2 bottom-3 items-center",
  top: "top-0 left-0 right-0 items-stretch",
};

/* ------------------------------------------------------- fake site ---- */

export function FakeSite({ variant = "cafe" }: { variant?: "cafe" | "shop" }) {
  if (variant === "shop") {
    return (
      <div className="flex h-full flex-col bg-[#faf7f2] text-[#2a2420]">
        <div className="flex items-center justify-between px-4 py-2.5">
          <span className="font-display text-[13px] font-bold">Nórdica Studio</span>
          <div className="flex gap-2.5">
            <span className="h-1.5 w-8 rounded bg-[#d8cfc2]" />
            <span className="h-1.5 w-8 rounded bg-[#d8cfc2]" />
            <span className="h-1.5 w-8 rounded bg-[#c9855e]" />
          </div>
        </div>
        <div className="mx-4 grid flex-1 grid-cols-3 gap-2 pb-3">
          <div className="rounded-md bg-gradient-to-br from-[#e9dfd2] to-[#d8cfc2]" />
          <div className="rounded-md bg-gradient-to-br from-[#ddd2c4] to-[#cbbfae]" />
          <div className="rounded-md bg-gradient-to-br from-[#e4d9cb] to-[#d0c4b3]" />
        </div>
        <div className="space-y-1.5 px-4 pb-4">
          <div className="h-1.5 w-2/3 rounded bg-[#ddd3c6]" />
          <div className="h-1.5 w-1/2 rounded bg-[#e4dbcf]" />
        </div>
      </div>
    );
  }
  return (
    <div className="flex h-full flex-col bg-[#f7f9fc] text-[#25324a]">
      <div className="flex items-center justify-between px-4 py-2.5">
        <span className="font-display text-[13px] font-bold">Cafetería Luna</span>
        <div className="flex gap-2.5">
          <span className="h-1.5 w-8 rounded bg-[#d6dee9]" />
          <span className="h-1.5 w-8 rounded bg-[#d6dee9]" />
          <span className="h-1.5 w-8 rounded bg-[#b98a4c]" />
        </div>
      </div>
      <div className="mx-4 h-[46%] rounded-md bg-gradient-to-br from-[#e8c9a0] via-[#d9a86b] to-[#b98a4c]" />
      <div className="space-y-1.5 px-4 py-3">
        <div className="h-2 w-3/4 rounded bg-[#dbe2ec]" />
        <div className="h-1.5 w-full rounded bg-[#e6ebf2]" />
        <div className="h-1.5 w-5/6 rounded bg-[#e6ebf2]" />
        <div className="h-1.5 w-2/3 rounded bg-[#e6ebf2]" />
      </div>
    </div>
  );
}

/* -------------------------------------------------- browser frame ---- */

export function BrowserFrame({
  url = "https://tusitio.com",
  className = "",
  children,
}: {
  url?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`overflow-hidden rounded-xl border border-line bg-ink-2 shadow-2xl shadow-black/50 ${className}`}>
      <div className="flex items-center gap-3 border-b border-line-soft bg-ink-3 px-3.5 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-coral/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-teal/80" />
        </div>
        <div className="flex flex-1 items-center gap-2 rounded-md bg-ink px-3 py-1.5 font-mono text-[11px] text-faint">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3 text-teal" aria-hidden="true">
            <rect x="5" y="10" width="14" height="10" rx="2" />
            <path d="M8 10V7a4 4 0 018 0v3" />
          </svg>
          {url}
        </div>
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}

/* --------------------------------------------------- banner + demo ---- */

interface CookieDemoProps {
  config: BannerConfig;
  replayKey: number;
  variant?: "cafe" | "shop";
  height?: string;
  onConsent?: (state: ConsentState | null) => void;
  showReplay?: boolean;
}

export function CookieDemo({
  config,
  replayKey,
  variant = "cafe",
  height = "h-[340px]",
  onConsent,
  showReplay = true,
}: CookieDemoProps) {
  const reduced = usePrefersReducedMotion();
  const [visible, setVisible] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [consent, setConsent] = useState<ConsentState | null>(null);
  const [toggles, setToggles] = useState<ConsentState>({ necessary: true, analytics: false, marketing: false });

  // (re)show the banner after the configured delay whenever config/replay changes
  useEffect(() => {
    setVisible(false);
    setPrefsOpen(false);
    setConsent(null);
    onConsent?.(null);
    const t = setTimeout(() => setVisible(true), reduced ? 0 : config.delayMs);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replayKey, config.delayMs, reduced]);

  const decide = (state: ConsentState) => {
    setConsent(state);
    setVisible(false);
    setPrefsOpen(false);
    onConsent?.(state);
  };

  const isBar = config.type === "bar";
  const bannerStyle = {
    backgroundColor: config.bg,
    color: config.text,
    borderRadius: isBar ? 0 : `${config.radius}px`,
  };
  const wrapperPos = isBar
    ? config.position === "top"
      ? "top-0 left-0 right-0 items-stretch"
      : "bottom-0 left-0 right-0 items-stretch"
    : positionClass[config.position];

  return (
    <div>
      <BrowserFrame>
        <div className={`relative overflow-hidden ${height}`}>
          <FakeSite variant={variant} />

          {/* cookie banner */}
          <div className={`pointer-events-none absolute inset-0 flex ${wrapperPos}`}>
            <div
              role="dialog"
              aria-label={config.title}
              className={`pointer-events-auto w-full max-w-[290px] p-3.5 shadow-2xl shadow-black/40 transition-all duration-500 ${
                isBar ? "max-w-none" : ""
              } ${visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
              style={bannerStyle}
            >
              <p className="text-[12.5px] font-bold leading-tight">{config.title}</p>
              <p className="mt-1.5 text-[10.5px] leading-snug" style={{ color: config.text, opacity: 0.82 }}>
                {config.message}{" "}
                <span className="underline" style={{ color: config.accent }}>
                  Política de cookies
                </span>
              </p>
              <div className={`mt-2.5 flex flex-wrap items-center gap-1.5 ${isBar ? "justify-end" : ""}`}>
                <button
                  type="button"
                  onClick={() => decide({ necessary: true, analytics: true, marketing: true })}
                  className="rounded-md px-2.5 py-1.5 text-[10.5px] font-bold text-white transition-transform duration-150 hover:scale-105 active:scale-95"
                  style={{ backgroundColor: config.accent }}
                >
                  {config.acceptLabel}
                </button>
                <button
                  type="button"
                  onClick={() => decide({ necessary: true, analytics: false, marketing: false })}
                  className="rounded-md border px-2.5 py-1.5 text-[10.5px] font-semibold transition-colors duration-150 hover:bg-white/10"
                  style={{ borderColor: `${config.text}44`, color: config.text }}
                >
                  {config.rejectLabel}
                </button>
                <button
                  type="button"
                  onClick={() => setPrefsOpen(true)}
                  className="px-1 py-1.5 text-[10.5px] font-semibold underline underline-offset-2 transition-opacity hover:opacity-75"
                  style={{ color: config.text }}
                >
                  {config.prefsLabel}
                </button>
              </div>
            </div>
          </div>

          {/* preferences panel */}
          {prefsOpen && (
            <div className="absolute inset-0 z-10 grid place-items-center bg-[#040812]/60 p-4 backdrop-blur-[2px]">
              <div
                role="dialog"
                aria-modal="true"
                className="w-full max-w-[300px] p-4 shadow-2xl shadow-black/50"
                style={{ backgroundColor: config.bg, color: config.text, borderRadius: `${config.radius}px` }}
              >
                <div className="flex items-center justify-between">
                  <p className="text-[12.5px] font-bold">Preferencias de cookies</p>
                  <button
                    type="button"
                    onClick={() => setPrefsOpen(false)}
                    aria-label="Cerrar"
                    className="rounded p-0.5 transition-transform hover:rotate-90"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>
                </div>
                <div className="mt-3 space-y-2">
                  {CATEGORIES.map((cat) => (
                    <label
                      key={cat.key}
                      className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg p-2 ${
                        cat.locked ? "opacity-70" : ""
                      }`}
                      style={{ backgroundColor: `${config.text}0f` }}
                    >
                      <span className="min-w-0">
                        <span className="block text-[11px] font-bold">{cat.label}</span>
                        <span className="block text-[9.5px] leading-snug opacity-70">{cat.desc}</span>
                      </span>
                      <span className="relative shrink-0">
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={cat.locked ? true : toggles[cat.key]}
                          disabled={cat.locked}
                          onChange={(e) => setToggles((t) => ({ ...t, [cat.key]: e.target.checked }))}
                        />
                        <span
                          className="block h-[18px] w-[34px] rounded-full transition-colors duration-200 peer-checked:opacity-100"
                          style={{ backgroundColor: toggles[cat.key] || cat.locked ? config.accent : `${config.text}33` }}
                        />
                        <span
                          className="absolute top-[2px] left-[2px] h-[14px] w-[14px] rounded-full bg-white shadow transition-transform duration-200"
                          style={{ transform: toggles[cat.key] || cat.locked ? "translateX(16px)" : "none" }}
                        />
                      </span>
                    </label>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => decide({ necessary: true, analytics: toggles.analytics, marketing: toggles.marketing })}
                  className="mt-3 w-full rounded-md py-2 text-[11px] font-bold text-white transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98]"
                  style={{ backgroundColor: config.accent }}
                >
                  Guardar preferencias
                </button>
              </div>
            </div>
          )}

          {/* consent decided feedback */}
          {!visible && consent && (
            <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-teal/15 px-2.5 py-1 text-[10px] font-semibold text-teal ring-1 ring-teal/40 backdrop-blur-sm">
              <Icons.check className="h-3 w-3" />
              Decisión registrada
            </div>
          )}
        </div>
      </BrowserFrame>

      {showReplay && (
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="font-mono text-[11px] text-faint">
            {visible ? "▸ banner visible — pruébalo" : consent ? "consentimiento guardado en cookie" : "esperando retraso…"}
          </p>
          <p className="hidden font-mono text-[11px] text-faint sm:block">cookie: consentia · SameSite=Lax</p>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------- consent chips ---- */

export function ConsentChips({ consent }: { consent: ConsentState | null }) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((cat) => {
        const on = consent ? consent[cat.key] : cat.key === "necessary";
        const pending = consent === null && cat.key !== "necessary";
        return (
          <span
            key={cat.key}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-[11px] font-medium transition-all duration-300 ${
              on
                ? "bg-teal/12 text-teal ring-1 ring-teal/35"
                : pending
                  ? "bg-amber/10 text-amber ring-1 ring-amber/30"
                  : "bg-coral/10 text-coral ring-1 ring-coral/30"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${on ? "bg-teal" : pending ? "bg-amber animate-pulse" : "bg-coral"}`} />
            {cat.label}: {on ? "ON" : pending ? "pendiente" : "OFF"}
          </span>
        );
      })}
    </div>
  );
}
