import { useEffect, useRef, useState } from "react";
import { Icons, Reveal, SectionHeading } from "./shared";
import {
  ConsentChips,
  CookieDemo,
  DEFAULT_CONFIG,
  type BannerConfig,
  type ConsentState,
} from "./CookieDemo";

const STORAGE_KEY = "consentia-demo-config";

function loadConfig(): BannerConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_CONFIG, ...(JSON.parse(raw) as Partial<BannerConfig>) };
  } catch {
    /* corrupted storage: fall through to defaults */
  }
  return DEFAULT_CONFIG;
}

/* ------------------------------------------------------- controls ---- */

function ControlLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-mist">{children}</span>
      {hint && <span className="font-mono text-[10.5px] text-faint">{hint}</span>}
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-line bg-ink px-3 py-2.5 text-[14px] text-snow placeholder:text-faint outline-none transition-all duration-200 focus:border-azure focus:ring-2 focus:ring-azure/25";

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="grid grid-flow-col gap-1 rounded-lg border border-line bg-ink p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`rounded-md px-3 py-2 text-[13px] font-semibold transition-all duration-200 ${
            value === opt.value ? "bg-deep text-white shadow-lg shadow-deep/30" : "text-mist hover:bg-ink-3 hover:text-snow"
          }`}
          aria-pressed={value === opt.value}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/* ---------------------------------------------------- configurator ---- */

export default function Configurator() {
  const [config, setConfig] = useState<BannerConfig>(loadConfig);
  const [replayKey, setReplayKey] = useState(0);
  const [consent, setConsent] = useState<ConsentState | null>(null);
  const [variant, setVariant] = useState<"cafe" | "shop">("cafe");
  const firstRun = useRef(true);

  // persist + debounce replay so the preview animates in after each edit
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {
      /* private mode: ignore */
    }
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const t = setTimeout(() => setReplayKey((k) => k + 1), 380);
    return () => clearTimeout(t);
  }, [config]);

  const set = <K extends keyof BannerConfig>(key: K, value: BannerConfig[K]) =>
    setConfig((c) => ({ ...c, [key]: value }));

  const rangeFill = (value: number, min: number, max: number) =>
    ({ "--range-fill": `${((value - min) / (max - min)) * 100}%` } as React.CSSProperties);

  return (
    <section id="configurador" className="relative scroll-mt-24 py-24">
      <div className="mx-auto max-w-6xl px-5">
        <SectionHeading
          eyebrow="Configurador en vivo"
          title={
            <>
              Diseña tu banner aquí. <span className="text-azure">Tal cual</span> se verá en WordPress.
            </>
          }
          sub="Los mismos controles de Ajustes → Consentia, pero con vista previa instantánea. Tu configuración se guarda en el navegador y el banner se reproduce de nuevo con cada cambio."
        />

        <div className="mt-12 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          {/* controls */}
          <Reveal className="h-fit rounded-xl border border-line bg-card/60 p-6 lg:sticky lg:top-24">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-[17px] font-bold text-snow">Ajustes del banner</h3>
              <button
                type="button"
                onClick={() => {
                  setConfig(DEFAULT_CONFIG);
                  setReplayKey((k) => k + 1);
                }}
                className="inline-flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 font-mono text-[11px] text-mist transition-colors hover:border-coral hover:text-coral"
              >
                <Icons.refresh className="h-3.5 w-3.5" />
                restablecer
              </button>
            </div>

            <div className="mt-6 space-y-6">
              <div className="space-y-2">
                <ControlLabel>Formato</ControlLabel>
                <Segmented
                  value={config.type}
                  options={[
                    { value: "card", label: "Tarjeta" },
                    { value: "bar", label: "Barra" },
                  ]}
                  onChange={(v) => set("type", v)}
                />
              </div>

              <div className="space-y-2">
                <ControlLabel>Posición</ControlLabel>
                <Segmented
                  value={config.position}
                  options={[
                    { value: "bottom-left", label: "↙" },
                    { value: "bottom-right", label: "↘" },
                    { value: "bottom-center", label: "↓" },
                    { value: "top", label: "↑" },
                  ]}
                  onChange={(v) => set("position", v)}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                {(
                  [
                    ["bg", "Fondo"],
                    ["text", "Texto"],
                    ["accent", "Acento"],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key} className="space-y-2">
                    <ControlLabel>{label}</ControlLabel>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={config[key]}
                        onChange={(e) => set(key, e.target.value)}
                        aria-label={`Color de ${label.toLowerCase()}`}
                      />
                      <code className="font-mono text-[11px] text-faint">{config[key]}</code>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <ControlLabel hint={`${config.radius}px`}>Radio de esquina</ControlLabel>
                <input
                  type="range"
                  min={0}
                  max={28}
                  value={config.radius}
                  style={rangeFill(config.radius, 0, 28)}
                  onChange={(e) => set("radius", Number(e.target.value))}
                  aria-label="Radio de esquina en píxeles"
                />
              </div>

              <div className="space-y-2">
                <ControlLabel hint={`${config.delayMs} ms`}>Retraso de aparición</ControlLabel>
                <input
                  type="range"
                  min={0}
                  max={2000}
                  step={100}
                  value={config.delayMs}
                  style={rangeFill(config.delayMs, 0, 2000)}
                  onChange={(e) => set("delayMs", Number(e.target.value))}
                  aria-label="Retraso de aparición en milisegundos"
                />
              </div>

              <div className="space-y-2">
                <ControlLabel>Título</ControlLabel>
                <input className={inputCls} value={config.title} onChange={(e) => set("title", e.target.value)} maxLength={60} />
              </div>

              <div className="space-y-2">
                <ControlLabel>Mensaje</ControlLabel>
                <textarea
                  className={`${inputCls} resize-none`}
                  rows={3}
                  value={config.message}
                  onChange={(e) => set("message", e.target.value)}
                  maxLength={280}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                {(
                  [
                    ["acceptLabel", "Aceptar"],
                    ["rejectLabel", "Rechazar"],
                    ["prefsLabel", "Configurar"],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key} className="space-y-2">
                    <ControlLabel>{label}</ControlLabel>
                    <input className={inputCls} value={config[key]} onChange={(e) => set(key, e.target.value)} maxLength={20} />
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* preview */}
          <Reveal delay={140}>
            <div className="rounded-xl border border-line bg-card/60 p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">Sitio de prueba:</span>
                  <div className="grid grid-flow-col gap-1 rounded-lg border border-line bg-ink p-1">
                    {(
                      [
                        ["cafe", "Cafetería"],
                        ["shop", "Tienda"],
                      ] as const
                    ).map(([v, label]) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setVariant(v)}
                        className={`rounded-md px-2.5 py-1 text-[12px] font-semibold transition-colors duration-200 ${
                          variant === v ? "bg-ink-3 text-azure" : "text-faint hover:text-mist"
                        }`}
                        aria-pressed={variant === v}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setReplayKey((k) => k + 1)}
                  className="inline-flex items-center gap-1.5 rounded-md bg-deep/15 px-3 py-1.5 font-mono text-[11.5px] font-semibold text-azure ring-1 ring-deep/40 transition-all duration-200 hover:bg-deep hover:text-white"
                >
                  <Icons.play className="h-3 w-3" />
                  reproducir de nuevo
                </button>
              </div>

              <CookieDemo config={config} replayKey={replayKey} variant={variant} height="h-[400px]" onConsent={setConsent} showReplay={false} />

              <div className="mt-5 space-y-3 border-t border-line-soft pt-5">
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">Estado del consentimiento</p>
                <ConsentChips consent={consent} />
                <p className="text-[12.5px] leading-relaxed text-faint">
                  En producción, la decisión se guarda en la cookie <code className="rounded bg-ink px-1.5 py-0.5 font-mono text-[11px] text-azure">consentia</code>{" "}
                  durante 6 meses (renovación configurable de 1 a 24) y los scripts con{" "}
                  <code className="rounded bg-ink px-1.5 py-0.5 font-mono text-[11px] text-azure">data-consentia</code> se activan sin recargar la página.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
