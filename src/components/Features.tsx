import type { ReactNode } from "react";
import { Icons, Reveal, SectionHeading } from "./shared";

function Cell({
  span,
  icon,
  title,
  children,
  pro = false,
  delay = 0,
}: {
  span: string;
  icon: ReactNode;
  title: string;
  children: ReactNode;
  pro?: boolean;
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
        {pro && (
          <span className="rounded-full bg-amber/12 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-amber ring-1 ring-amber/35">
            Pro
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

export default function Features() {
  return (
    <section id="caracteristicas" className="relative scroll-mt-24 py-24">
      <div className="mx-auto max-w-6xl px-5">
        <SectionHeading
          eyebrow="Qué incluye"
          title={
            <>
              Todo lo que pide tu abogado. <span className="text-teal">Nada</span> que retrase tu web.
            </>
          }
          sub="Un plugin de consentimiento se juzga por dos cosas: que cumpla de verdad y que no se note. Consentia aspira a ambas."
        />

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12">
          <Cell span="lg:col-span-7" icon={<Icons.shield />} title="Bloqueo real de scripts" delay={0}>
            <p>
              Los scripts marcados con <code className="rounded bg-ink px-1.5 py-0.5 font-mono text-[12px] text-azure">data-consentia</code>{" "}
              no se ejecutan hasta que hay consentimiento — y se activan al instante, sin recargar la página. GA4 se inyecta solo si pones
              tu ID en los ajustes.
            </p>
            <pre className="mt-4 overflow-x-auto rounded-lg border border-line-soft bg-[#070f1d] p-4 font-mono text-[12px] leading-relaxed">
              <code>
                <span className="text-faint">&lt;!-- no corre hasta que el visitante acepte --&gt;</span>
                {"\n"}
                <span className="text-coral">&lt;script</span> <span className="text-amber">type</span>=
                <span className="text-teal">"text/plain"</span> <span className="text-amber">data-consentia</span>=
                <span className="text-teal">"analytics"</span> <span className="text-amber">src</span>=
                <span className="text-teal">"…/stats.js"</span>
                <span className="text-coral">&gt;&lt;/script&gt;</span>
              </code>
            </pre>
          </Cell>

          <Cell span="lg:col-span-5" icon={<Icons.bolt />} title="12 KB y cero jQuery" delay={90}>
            <p>Vanilla JS diferido, una hoja de estilos con variables CSS y ni una petición externa. Tu Core Web Vitals no se entera.</p>
            <div className="mt-5 space-y-3">
              {[
                { label: "Consentia", size: "12 KB", pct: 14, color: "bg-teal" },
                { label: "Gestor típico", size: "48 KB", pct: 55, color: "bg-amber" },
                { label: "Plataforma CMP", size: "85 KB+", pct: 100, color: "bg-coral" },
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

          <Cell span="lg:col-span-4" icon={<Icons.palette />} title="Personalización total" delay={0}>
            <p>Tarjeta o barra, 4 posiciones, colores, radio, textos y retraso. Con vista previa en vivo en el propio admin de WordPress.</p>
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

          <Cell span="lg:col-span-4" icon={<Icons.a11y />} title="Accesible por defecto" delay={90}>
            <p>
              <code className="font-mono text-[12.5px] text-azure">role="dialog"</code>, gestión de foco, cierre con{" "}
              <kbd className="rounded border border-line bg-ink px-1.5 py-0.5 font-mono text-[10.5px]">Esc</kbd>, contraste AA y respeto a{" "}
              <code className="font-mono text-[12.5px] text-azure">prefers-reduced-motion</code>.
            </p>
          </Cell>

          <Cell span="lg:col-span-4" icon={<Icons.wordpress />} title="Multisitio e i18n" delay={180}>
            <p>
              Funciona en redes multisitio, es compatible con WPML y Polylang y trae traducción española incluida. Text domain{" "}
              <code className="font-mono text-[12.5px] text-azure">consentia</code>.
            </p>
          </Cell>

          <Cell span="lg:col-span-4" icon={<Icons.ledger />} title="Registro de consentimiento" pro delay={0}>
            <p>Cada decisión queda anotada con fecha, categorías y versión del texto: tu prueba de cumplimiento exportable en CSV.</p>
          </Cell>

          <Cell span="lg:col-span-4" icon={<Icons.geo />} title="Geolocalización UE/UK" pro delay={90}>
            <p>Muestra el banner solo a visitantes del Espacio Económico Europeo y Reino Unido. El resto navega sin fricción.</p>
          </Cell>

          <Cell span="lg:col-span-4" icon={<Icons.code />} title="Shortcodes y API JS" delay={180}>
            <p>Reabre las preferencias desde el pie de página y reacciona a la decisión con eventos del DOM.</p>
            <pre className="mt-4 overflow-x-auto rounded-lg border border-line-soft bg-[#070f1d] p-3.5 font-mono text-[11.5px] leading-relaxed">
              <code>
                <span className="text-coral">[consentia_manage]</span>
                {"\n"}
                <span className="text-azure">Consentia</span>.<span className="text-teal">open</span>() ·{" "}
                <span className="text-azure">Consentia</span>.<span className="text-teal">status</span>()
              </code>
            </pre>
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
