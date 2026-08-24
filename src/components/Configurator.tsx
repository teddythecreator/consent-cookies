import { useEffect, useRef, useState } from "react";
import { Icons, Reveal, SectionHeading, useToast } from "./shared";
import {
  ConsentChips,
  CookieDemo,
  DEFAULT_CONFIG,
  type BannerConfig,
  type ConsentState,
} from "./CookieDemo";

const STORAGE_KEY = "consentia-demo-config-v2";

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

function Switch({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="group flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-line bg-ink px-3.5 py-3 transition-colors duration-200 hover:border-azure/40">
      <span className="min-w-0">
        <span className="block text-[13.5px] font-semibold text-snow">{label}</span>
        <span className="block text-[11.5px] leading-snug text-faint">{desc}</span>
      </span>
      <span className="relative shrink-0">
        <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span
          className={`block h-[22px] w-[40px] rounded-full transition-colors duration-200 ${checked ? "bg-deep" : "bg-line"}`}
        />
        <span
          className={`absolute top-[3px] left-[3px] h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
            checked ? "translate-x-[18px]" : ""
          }`}
        />
      </span>
    </label>
  );
}

/* ---------------------------------------------------- configurator ---- */

export default function Configurator() {
  const [config, setConfig] = useState<BannerConfig>(loadConfig);
  const [replayKey, setReplayKey] = useState(0);
  const [consent, setConsent] = useState<ConsentState | null>(null);
  const [variant, setVariant] = useState<"cafe" | "shop">("cafe");
  const toast = useToast();
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

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(config, null, 2));
      toast("Configuración copiada como JSON.");
    } catch {
      toast("No se pudo copiar en este navegador.");
    }
  };

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
          sub="Los mismos controles de Ajustes → Consentia, ahora también con las opciones de cumplimiento: Consent Mode v2, TCF, CCPA, GPC y botón revisit. Tu configuración se guarda en el navegador."
        />

        <div className="mt-12 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          {/* controls */}
          <Reveal className="h-fit rounded-xl border border-line bg-card/60 p-6 lg:sticky lg:top-24">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-[17px] font-bold text-snow">Ajustes del banner</h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={copyJson}
                  className="inline-flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 font-mono text-[11px] text-mist transition-colors hover:border-azure hover:text-azure"
                >
                  <Icons.copy className="h-3 w-3" />
                  JSON
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfig(DEFAULT_CONFIG);
                    setReplayKey((k) => k + 1);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 font-mono text-[11px] text-mist transition-colors hover:border-coral hover:text-coral"
                >
                  <Icons.refresh className="h-3 w-3" />
                  Restaurar
                </button>
              </div>
            </div>

            <div className="mt-5 space-y-5">
              <div>
                <ControlLabel>Formato</ControlLabel>
                <div className="mt-2">
                  <Segmented
                    value={config.type}
                    options={[
                      { value: "card", label: "Tarjeta" },
                      { value: "bar", label: "Barra" },
                      { value: "floating", label: "Píldora" },
                    ]}
                    onChange={(v) => set("type", v)}
                  />
                </div>
              </div>

              <div>
                <ControlLabel>Posición</ControlLabel>
                <div className="mt-2">
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
              </div>

              <div className="grid grid-cols-3 gap-3">
                {(
                  [
                    ["bg", "Fondo"],
                    ["text", "Texto"],
                    ["accent", "Acento"],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key}>
                    <ControlLabel>{label}</ControlLabel>
                    <div className="mt-2 flex items-center gap-2">
                      <input type="color" value={config[key]} onChange={(e) => set(key, e.target.value)} aria-label={`Color de ${label.toLowerCase()}`} />
                      <code className="font-mono text-[11px] text-faint">{config[key]}</code>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <ControlLabel hint={`${config.radius}px`}>Radio</ControlLabel>
                  <input
                    type="range"
                    min={0}
                    max={40}
                    value={config.radius}
                    onChange={(e) => set("radius", Number(e.target.value))}
                    className="mt-3"
                    style={rangeFill(config.radius, 0, 40)}
                    aria-label="Radio de esquina"
                  />
                </div>
                <div>
                  <ControlLabel hint={`${config.delayMs}ms`}>Retraso</ControlLabel>
                  <input
                    type="range"
                    min={0}
                    max={3000}
                    step={100}
                    value={config.delayMs}
                    onChange={(e) => set("delayMs", Number(e.target.value))}
                    className="mt-3"
                    style={rangeFill(config.delayMs, 0, 3000)}
                    aria-label="Retraso de aparición"
                  />
                </div>
              </div>

              <div>
                <ControlLabel>Título</ControlLabel>
                <input className={`mt-2 ${inputCls}`} value={config.title} onChange={(e) => set("title", e.target.value)} />
              </div>
              <div>
                <ControlLabel>Mensaje</ControlLabel>
                <textarea
                  className={`mt-2 ${inputCls} resize-none`}
                  rows={3}
                  value={config.message}
                  onChange={(e) => set("message", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <ControlLabel>Aceptar</ControlLabel>
                  <input className={`mt-2 ${inputCls}`} value={config.acceptLabel} onChange={(e) => set("acceptLabel", e.target.value)} />
                </div>
                <div>
                  <ControlLabel>Rechazar</ControlLabel>
                  <input className={`mt-2 ${inputCls}`} value={config.rejectLabel} onChange={(e) => set("rejectLabel", e.target.value)} />
                </div>
                <div>
                  <ControlLabel>Configurar</ControlLabel>
                  <input className={`mt-2 ${inputCls}`} value={config.prefsLabel} onChange={(e) => set("prefsLabel", e.target.value)} />
                </div>
              </div>

              <div className="border-t border-line-soft pt-5">
                <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-azure">Cumplimiento</p>
                <div className="mt-3 space-y-2">
                  <Switch
                    label="Google Consent Mode v2"
                    desc="Señales ad_storage, analytics_storage, ad_user_data…"
                    checked={config.consentMode}
                    onChange={(v) => set("consentMode", v)}
                  />
                  <Switch
                    label="IAB TCF v2.2"
                    desc="API __tcfapi + TC string con el consentimiento"
                    checked={config.tcf}
                    onChange={(v) => set("tcf", v)}
                  />
                  <Switch
                    label="CCPA / CPRA (California)"
                    desc="Enlace «No vender ni compartir» + modo opt-out"
                    checked={config.ccpa}
                    onChange={(v) => set("ccpa", v)}
                  />
                  <Switch
                    label="Botón revisit"
                    desc="Reabre las preferencias desde cualquier página"
                    checked={config.revisit}
                    onChange={(v) => set("revisit", v)}
                  />
                </div>
                <p className="mt-3 rounded-lg bg-ink px-3 py-2.5 text-[11.5px] leading-relaxed text-faint">
                  También incluidos en el plugin (sin demo aquí): respeto a <strong className="text-mist">Global Privacy Control</strong>,
                  geolocalización UE/EEA/UK, sincronización entre dominios y renovación del consentimiento.
                </p>
              </div>
            </div>
          </Reveal>

          {/* live preview */}
          <div className="space-y-4">
            <Reveal delay={140}>
              <CookieDemo
                config={config}
                replayKey={replayKey}
                variant={variant}
                height="h-[380px]"
                onConsent={setConsent}
              />
            </Reveal>

            <Reveal delay={220}>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-card/60 px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setReplayKey((k) => k + 1)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-2 font-mono text-[11.5px] text-mist transition-colors hover:border-azure hover:text-azure"
                  >
                    <Icons.refresh className="h-3.5 w-3.5" />
                    Reproducir banner
                  </button>
                  <div className="flex rounded-lg border border-line bg-ink p-1">
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
                        className={`rounded-md px-3 py-1.5 font-mono text-[11px] transition-all duration-200 ${
                          variant === v ? "bg-ink-3 text-snow" : "text-faint hover:text-mist"
                        }`}
                        aria-pressed={variant === v}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="font-mono text-[10.5px] uppercase tracking-wider text-faint">Estado en tiempo real</p>
              </div>
            </Reveal>

            <Reveal delay={290}>
              <div className="rounded-xl border border-line bg-card/60 px-4 py-4">
                <ConsentChips consent={consent} />
                <p className="mt-3 font-mono text-[11px] leading-relaxed text-faint">
                  {consent
                    ? "// decisión enviada a POST /wp-json/consentia/v1/log con UUID, fecha y origen"
                    : "// sin decisión: los scripts data-consentia siguen bloqueados"}
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
