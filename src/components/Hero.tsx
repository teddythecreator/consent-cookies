import { useMemo, useState } from "react";
import { DownloadButton, Icons, Reveal, useTypewriter } from "./shared";
import { CookieDemo, DEFAULT_CONFIG } from "./CookieDemo";

const TERMINAL_LINES = [
  "$ wp plugin install consentia --activate",
  "Plugin installed successfully.",
  "$ wp plugin list --field=size --name=consentia",
  "12 KB · 0 dependencias",
];

function Terminal() {
  const lines = useMemo(() => TERMINAL_LINES, []);
  const { displayed, activeLine, done } = useTypewriter(lines, 24, 500);

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-[#070f1d] shadow-2xl shadow-black/50">
      <div className="flex items-center justify-between border-b border-line-soft px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-coral/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-teal/70" />
        </div>
        <span className="font-mono text-[10.5px] uppercase tracking-widest text-faint">wp-cli · zsh</span>
      </div>
      <div className="min-h-[118px] px-4 py-3.5 font-mono text-[12.5px] leading-[1.75]">
        {displayed.map((text, i) => {
          if (!text && !(i === activeLine && !done)) return null;
          const isCmd = text.startsWith("$") || TERMINAL_LINES[i].startsWith("$");
          return (
            <p key={i} className={isCmd ? "text-snow" : i === 1 ? "text-teal" : "text-mist"}>
              {isCmd ? (
                <>
                  <span className="mr-2 text-azure">➜</span>
                  {text.slice(1).trimStart()}
                </>
              ) : (
                text
              )}
              {i === activeLine && !done && <span className="ml-0.5 inline-block h-3.5 w-[7px] translate-y-0.5 animate-blink bg-azure" />}
            </p>
          );
        })}
        {done && (
          <p className="text-snow">
            <span className="mr-2 text-azure">➜</span>
            <span className="ml-0.5 inline-block h-3.5 w-[7px] translate-y-0.5 animate-blink bg-azure" />
          </p>
        )}
      </div>
    </div>
  );
}

export default function Hero() {
  const [replayKey] = useState(0);

  return (
    <section id="top" className="relative overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-20">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
        {/* left column */}
        <div>
          <Reveal>
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-ink-2/80 px-3.5 py-1.5 font-mono text-[11.5px] text-mist">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-teal" />
              </span>
              v1.1.0 · GPLv2 · Consent Mode v2 + TCF v2.2
            </p>
          </Reveal>

          <Reveal delay={100}>
            <h1 className="mt-6 font-display text-[clamp(2.5rem,5.6vw,4.3rem)] font-extrabold leading-[1.02] tracking-tight text-snow">
              Cumple el <span className="text-azure">RGPD</span> sin tocar una línea de código.
            </h1>
          </Reveal>

          <Reveal delay={190}>
            <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-mist">
              Banner con <strong className="font-semibold text-snow">bloqueo real</strong>, escáner de cookies, registro de consentimiento,
              Google <strong className="font-semibold text-snow">Consent Mode v2</strong>, <strong className="font-semibold text-snow">IAB TCF v2.2</strong>,
              CCPA y geolocalización. Todo autoalojado: sin SaaS, sin cuentas, sin pagar por visita.
            </p>
          </Reveal>

          <Reveal delay={270}>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <DownloadButton label="Descargar consentia.zip" />
              <a
                href="#configurador"
                className="group inline-flex items-center gap-2 rounded-lg border border-line px-5 py-3.5 text-[15px] font-semibold text-snow transition-all duration-200 hover:border-azure hover:bg-azure/10"
              >
                Probar el configurador
                <Icons.arrow className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </a>
            </div>
          </Reveal>

          <Reveal delay={340}>
            <div className="mt-9 max-w-xl">
              <Terminal />
            </div>
          </Reveal>

          <Reveal delay={420}>
            <dl className="mt-9 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
              {[
                { value: "12 KB", label: "min + gzip" },
                { value: "0", label: "SaaS / jQuery" },
                { value: "5", label: "categorías de cookies" },
                { value: "2.2", label: "IAB TCF + CM v2" },
              ].map((s) => (
                <div key={s.label} className="border-l-2 border-line pl-3 transition-colors duration-300 hover:border-azure">
                  <dt className="sr-only">{s.label}</dt>
                  <dd className="font-display text-[22px] font-bold text-snow">{s.value}</dd>
                  <dd className="mt-0.5 font-mono text-[10.5px] uppercase tracking-wider text-faint">{s.label}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>

        {/* right column: live banner demo */}
        <Reveal delay={250} className="relative scroll-mt-24" as="div">
          <div id="demo" className="relative scroll-mt-28">
            <div className="absolute -inset-6 -z-10 rounded-3xl bg-deep/12 blur-3xl" aria-hidden="true" />
            <CookieDemo config={DEFAULT_CONFIG} replayKey={replayKey} />

            <div className="absolute -left-4 -top-5 hidden animate-float items-center gap-2 rounded-lg border border-line bg-ink-2/95 px-3 py-2 shadow-xl shadow-black/40 backdrop-blur sm:flex">
              <Icons.bolt className="h-4 w-4 text-amber" />
              <span className="font-mono text-[11px] text-snow">
                scripts bloqueados <span className="text-amber">hasta consentir</span>
              </span>
            </div>
            <div className="absolute -bottom-5 -right-3 hidden animate-float items-center gap-2 rounded-lg border border-line bg-ink-2/95 px-3 py-2 shadow-xl shadow-black/40 backdrop-blur [animation-delay:1.4s] sm:flex">
              <Icons.scan className="h-4 w-4 text-teal" />
              <span className="font-mono text-[11px] text-snow">
                escáner + registro <span className="text-teal">incluidos gratis</span>
              </span>
            </div>
          </div>
          <p className="mt-8 text-center font-mono text-[11px] text-faint">
            ↑ esto es exactamente lo que verán tus visitas — haz clic en los botones
          </p>
        </Reveal>
      </div>
    </section>
  );
}
