import type { ReactNode } from "react";
import { Icons, Reveal, SectionHeading } from "./shared";

function Cell({
  span,
  icon,
  title,
  children,
  tag,
  delay = 0,
}: {
  span: string;
  icon: ReactNode;
  title: string;
  children: ReactNode;
  tag?: string;
  delay?: number;
}) {
  return (
    <Reveal
      delay={delay}
      className={`${span} group relative overflow-hidden rounded-xl border border-line bg-card/70 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-azure/50 hover:bg-card hover:shadow-2xl hover:shadow-deep/10`}
    >
      <div className="flex items-center justify-between">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-deep/12 text-azure ring-1 ring-deep/30 transition-all duration-300 group-hover:bg-deep group-hover:text-white">
          {icon}
        </span>
        {tag && (
          <span className="rounded-full bg-teal/12 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-teal ring-1 ring-teal/35">
            {tag}
          </span>
        )}
      </div>
      <h3 className="mt-4 font-display text-[17.5px] font-bold text-snow">{title}</h3>
      <div className="mt-2 text-[14px] leading-relaxed text-mist">{children}</div>
    </Reveal>
  );
}

const COMPATIBLE = [
  "WooCommerce",
  "Elementor",
  "Yoast SEO",
  "Rank Math",
  "WP Rocket",
  "WPML",
  "Polylang",
  "Divi",
  "Gutenberg",
  "Contact Form 7",
  "LiteSpeed Cache",
  "WPForms",
];

const POLICY_SECTIONS = [
  "Qué son las cookies",
  "Categorías: necesarias, preferencias, estadísticas, marketing",
  "Cookies concretas: consentia_consent, _ga, _fbp…",
  "Transferencias internacionales (Google, Meta → EE. UU.)",
  "Gestión por navegador: Chrome, Firefox, Safari, Edge",
  "Derechos del usuario y reclamación ante la AEPD",
];

export default function Features() {
  return (
    <section id="caracteristicas" className="relative scroll-mt-24 py-24">
      <div className="mx-auto max-w-6xl px-5">
        <SectionHeading
          eyebrow="Qué incluye"
          title={
            <>
              Todo lo que cobra CookieYes. <span className="text-teal">Gratis</span> y en tu servidor.
            </>
          }
          sub="Banner, bloqueo previo, registro probatorio, política de cookies automática, Consent Mode v2, TCF v2.2, CCPA y geolocalización. Sin cuentas, sin SDK externos, sin límite de visitas."
        />

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12">
          <Cell span="lg:col-span-7" icon={<Icons.shield />} title="Bloqueo real de scripts" delay={0}>
            <p>
              Los scripts marcados con <code className="rounded bg-ink px-1.5 py-0.5 font-mono text-[12px] text-azure">type="text/consentia"</code>{" "}
              no se ejecutan hasta que hay consentimiento — y se activan al instante, sin recargar. GA4 se inyecta solo con tu ID.
            </p>
            <pre className="mt-4 overflow-x-auto rounded-lg border border-line-soft bg-[#070f1d] p-4 font-mono text-[12px] leading-relaxed">
              <code>
                <span className="text-coral">&lt;script</span> <span className="text-amber">type</span>=
                <span className="text-teal">"text/consentia"</span> <span className="text-amber">data-consentia-category</span>=
                <span className="text-teal">"statistics"</span>
                {"\n        "}
                <span className="text-amber">src</span>=<span className="text-teal">"…/stats.js"</span>
                <span className="text-coral">&gt;&lt;/script&gt;</span>
              </code>
            </pre>
          </Cell>

          <Cell span="lg:col-span-5" icon={<Icons.doc />} title="Política de cookies automática" tag="Nuevo" delay={90}>
            <p>
              El shortcode <code className="font-mono text-[12px] text-azure">[consentia_policy]</code> genera una política completa:
              categorías, cookies concretas, transferencias internacionales, gestión por navegador y derechos ante la AEPD.
            </p>
            <div className="mt-4 overflow-hidden rounded-lg border border-line-soft">
              {POLICY_SECTIONS.map((s, i) => (
                <div
                  key={s}
                  className={`flex items-center gap-2.5 px-3 py-2 font-mono text-[11px] transition-colors hover:bg-ink-3/60 ${
                    i % 2 ? "bg-ink/60" : "bg-ink-2/60"
                  }`}
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-teal/70" />
                  <span className="truncate text-mist">{s}</span>
                </div>
              ))}
            </div>
          </Cell>

          <Cell span="lg:col-span-4" icon={<Icons.ledger />} title="Registro de consentimiento" tag="Nuevo" delay={0}>
            <p>Cada decisión en tu propia tabla con UUID, fecha, categorías, origen (banner, GPC, sync) y país. Exportación CSV y retención automática.</p>
            <div className="mt-4 flex items-end gap-1.5" aria-hidden="true">
              {[28, 45, 34, 58, 40, 66, 52].map((h, i) => (
                <div key={i} className="flex w-full flex-col-reverse gap-0.5">
                  <span className="rounded-sm bg-teal/80 transition-all duration-500" style={{ height: `${h * 0.6}px` }} />
                  <span className="rounded-sm bg-coral/70" style={{ height: `${(100 - h) * 0.22}px` }} />
                </div>
              ))}
            </div>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-faint">aceptadas / rechazadas · 30 días</p>
          </Cell>

          <Cell span="lg:col-span-4" icon={<Icons.google />} title="Google Consent Mode v2" tag="Nuevo" delay={90}>
            <p>
              Envía <code className="font-mono text-[12px] text-azure">ad_storage</code>,{" "}
              <code className="font-mono text-[12px] text-azure">analytics_storage</code>,{" "}
              <code className="font-mono text-[12px] text-azure">ad_user_data</code> y{" "}
              <code className="font-mono text-[12px] text-azure">ad_personalization</code>. Modo básico y avanzado.
            </p>
          </Cell>

          <Cell span="lg:col-span-4" icon={<Icons.code />} title="IAB TCF v2.2" tag="Nuevo" delay={180}>
            <p>
              Registra <code className="font-mono text-[12px] text-azure">__tcfapi</code> y genera una TC string válida
              (policy v2.2) a partir de las decisiones del visitante. Mapping de propósitos por categoría.
            </p>
            <pre className="mt-3 overflow-x-auto rounded-lg border border-line-soft bg-[#070f1d] p-3 font-mono text-[10.5px] text-mist">
              <code>
                __tcfapi(<span className="text-teal">'getTCData'</span>, 2, cb){"\n"}
                <span className="text-faint">→ TC string: CQxf…AABA</span>
              </code>
            </pre>
          </Cell>

          <Cell span="lg:col-span-4" icon={<Icons.geo />} title="Geolocalización inteligente" tag="Nuevo" delay={0}>
            <p>
              Banner solo para la UE/EEA/UK: cabecera Cloudflare, MaxMind GeoIP2 o extensión geoip. Visitante desconocido =
              reglas europeas, el valor seguro. Para California, modo CCPA con «Do Not Sell or Share».
            </p>
          </Cell>

          <Cell span="lg:col-span-4" icon={<Icons.bolt />} title="12 KB y cero jQuery" delay={90}>
            <p>Vanilla JS diferido, CSS con variables y ni una petición a terceros. Tu LCP no se entera.</p>
            <div className="mt-4 space-y-3">
              {[
                { label: "Consentia", size: "12 KB", pct: 14, color: "bg-teal" },
                { label: "CMP típica (SaaS)", size: "85 KB+", pct: 100, color: "bg-coral" },
              ].map((row) => (
                <div key={row.label}>
                  <div className="mb-1 flex justify-between font-mono text-[10.5px] text-faint">
                    <span>{row.label}</span>
                    <span>{row.size}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-ink">
                    <div className={`h-full rounded-full ${row.color} transition-all duration-1000`} style={{ width: `${row.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Cell>

          <Cell span="lg:col-span-4" icon={<Icons.sync />} title="Sincronización entre dominios" tag="Nuevo" delay={180}>
            <p>
              Una decisión se propaga a tus dominios hermanos por <code className="font-mono text-[12px] text-azure">postMessage</code>:
              el visitante consiente una sola vez en todo tu ecosistema.
            </p>
          </Cell>

          <Cell span="lg:col-span-4" icon={<Icons.palette />} title="Tres formatos y personalización total" delay={0}>
            <p>Tarjeta, barra o píldora flotante; 4 posiciones, colores, radio, animación, retraso, textos y CSS propio. Con vista previa en vivo en el admin.</p>
            <div className="mt-4 flex gap-2">
              {["#2f6fed", "#35d0a5", "#ffb224", "#ff6b6b", "#111827"].map((c) => (
                <span
                  key={c}
                  className="h-6 w-6 rounded-md ring-1 ring-white/15 transition-transform duration-200 hover:scale-110"
                  style={{ backgroundColor: c }}
                />
              ))}
              <span className="ml-auto self-center font-mono text-[10.5px] text-faint">+ las tuyas</span>
            </div>
          </Cell>

          <Cell span="lg:col-span-4" icon={<Icons.a11y />} title="Accesible + GPC" delay={90}>
            <p>
              <code className="font-mono text-[12.5px] text-azure">role="dialog"</code>, gestión de foco, cierre con{" "}
              <kbd className="rounded border border-line bg-ink px-1.5 py-0.5 font-mono text-[10.5px]">Esc</kbd>, contraste AA,
              reduced-motion y respeto automático a <strong className="text-snow">Global Privacy Control</strong>.
            </p>
          </Cell>

          <Cell span="lg:col-span-4" icon={<Icons.code />} title="Shortcodes, API y eventos" delay={180}>
            <p>Reabre preferencias desde el pie y reacciona a cada decisión.</p>
            <pre className="mt-3 overflow-x-auto rounded-lg border border-line-soft bg-[#070f1d] p-3.5 font-mono text-[11.5px] leading-relaxed">
              <code>
                <span className="text-coral">[consentia_manage]</span>
                {"\n"}
                <span className="text-azure">Consentia</span>.<span className="text-teal">open</span>() ·{" "}
                <span className="text-azure">Consentia</span>.<span className="text-teal">status</span>()
                {"\n"}
                <span className="text-teal">'consentia:granted'</span> · <span className="text-teal">'consentia:updated'</span>
              </code>
            </pre>
          </Cell>

          <Cell span="lg:col-span-4" icon={<Icons.wordpress />} title="Multisitio e i18n" delay={0}>
            <p>
              Funciona en redes multisitio, compatible con WPML y Polylang, traducción española incluida. Text domain{" "}
              <code className="font-mono text-[12.5px] text-azure">consentia</code>.
            </p>
          </Cell>
        </div>

        {/* compatibility marquee */}
        <Reveal delay={120} className="marquee relative mt-14 overflow-hidden rounded-xl border border-line bg-ink-2/60 py-4 [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
          <div className="marquee-track flex w-max items-center gap-10 pr-10">
            {[...COMPATIBLE, ...COMPATIBLE].map((name, i) => (
              <span key={i} className="flex items-center gap-2.5 font-mono text-[12.5px] whitespace-nowrap text-faint">
                <span className="h-1.5 w-1.5 rounded-full bg-teal/70" />
                <span className="transition-colors duration-200 hover:text-snow">{name}</span>
              </span>
            ))}
          </div>
        </Reveal>
        <p className="mt-3 text-center font-mono text-[10.5px] uppercase tracking-[0.2em] text-faint">
          Probado con los plugins y themes más comunes
        </p>
      </div>
    </section>
  );
}
