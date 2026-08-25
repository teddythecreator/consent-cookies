import { useState, type FormEvent } from "react";
import { DownloadButton, Icons, Reveal, useToast } from "./shared";
import { PLUGIN_FILES, PLUGIN_VERSION } from "../plugin-files";

const FACTS = [
  { k: "Stable tag", v: PLUGIN_VERSION },
  { k: "Requires at least", v: "WordPress 5.9" },
  { k: "Tested up to", v: "6.7" },
  { k: "Requires PHP", v: "7.0" },
  { k: "License", v: "GPLv2 or later" },
  { k: "Text Domain", v: "consentia" },
];

export default function Footer() {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setError("Escribe un correo válido, por favor.");
      return;
    }
    setError("");
    setSent(true);
    toast("¡Anotado! Te escribiremos el día que Consentia Pro vea la luz.");
  };

  return (
    <footer className="relative border-t border-line-soft">
      {/* final CTA */}
      <div className="mx-auto max-w-6xl px-5 pt-24 pb-16">
        <div className="relative overflow-hidden rounded-2xl border border-line bg-card/80 px-7 py-14 sm:px-14">
          <div className="absolute -left-20 -top-24 h-64 w-64 rounded-full bg-deep/20 blur-3xl" aria-hidden="true" />
          <div className="absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-teal/10 blur-3xl" aria-hidden="true" />
          <div className="relative grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <Reveal>
                <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-azure">
                  <span className="mr-2 text-teal">$</span>wp plugin install consentia
                </p>
              </Reveal>
              <Reveal delay={90}>
                <h2 className="mt-4 font-display text-[clamp(1.8rem,3.6vw,2.7rem)] font-extrabold leading-[1.06] tracking-tight text-snow">
                  Tu WordPress puede ser <span className="text-teal">legal hoy</span>, no el trimestre que viene.
                </h2>
              </Reveal>
              <Reveal delay={170}>
                <p className="mt-4 max-w-lg text-[15.5px] leading-relaxed text-mist">
                  Descarga el ZIP, súbelo en <em className="not-italic text-snow">Plugins → Añadir nuevo</em> y en cinco minutos tendrás un
                  banner que cumple, no solo uno que decora.
                </p>
              </Reveal>
              <Reveal delay={250}>
                <div className="mt-7 flex flex-wrap items-center gap-4">
                  <DownloadButton />
                  <a
                    href="#demo"
                    className="inline-flex items-center gap-2 font-mono text-[13px] text-mist transition-colors hover:text-azure"
                  >
                    volver a la demo <Icons.arrow className="h-3.5 w-3.5" />
                  </a>
                </div>
              </Reveal>
            </div>

            {/* Pro waitlist */}
            <Reveal delay={200}>
              <div id="aviso" className="scroll-mt-28 rounded-xl border border-amber/30 bg-ink-2/80 p-6">
                <p className="font-display text-[16px] font-bold text-snow">Lista de espera de Pro</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-mist">
                  GVL completa por vendor, white-label e informes multi-sitio para agencias. Un correo el día del lanzamiento.
                </p>
                {sent ? (
                  <p className="mt-4 flex items-center gap-2 rounded-lg bg-teal/10 px-4 py-3 text-[13.5px] font-semibold text-teal ring-1 ring-teal/30">
                    <Icons.check className="h-4 w-4" />
                    Estás en la lista. ¡Gracias!
                  </p>
                ) : (
                  <form onSubmit={submit} className="mt-4">
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu@correo.com"
                        aria-label="Correo electrónico para la lista de espera"
                        className="min-w-0 flex-1 rounded-lg border border-line bg-ink px-3.5 py-2.5 text-[14px] text-snow placeholder:text-faint outline-none transition-all focus:border-amber focus:ring-2 focus:ring-amber/25"
                      />
                      <button
                        type="submit"
                        className="btn-shine shrink-0 rounded-lg bg-amber px-4 py-2.5 text-[13.5px] font-bold text-ink transition-all duration-200 hover:bg-snow active:scale-[0.96]"
                      >
                        Avisadme
                      </button>
                    </div>
                    {error && <p className="mt-2 text-[12px] font-medium text-coral">{error}</p>}
                  </form>
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </div>

      {/* readme facts + files */}
      <div className="mx-auto grid max-w-6xl gap-10 px-5 pb-16 lg:grid-cols-[0.9fr_1.1fr]">
        <Reveal>
          <h3 className="font-mono text-[11px] uppercase tracking-[0.22em] text-faint">readme.txt · ficha técnica</h3>
          <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            {FACTS.map((f) => (
              <div key={f.k} className="rounded-lg border border-line-soft bg-ink-2/50 px-4 py-3">
                <dt className="font-mono text-[10px] uppercase tracking-wider text-faint">{f.k}</dt>
                <dd className="mt-1 font-mono text-[13px] font-medium text-snow">{f.v}</dd>
              </div>
            ))}
          </dl>
        </Reveal>

        <Reveal delay={120}>
          <h3 className="font-mono text-[11px] uppercase tracking-[0.22em] text-faint">
            Dentro del ZIP · {PLUGIN_FILES.length} archivos
          </h3>
          <ul className="mt-5 grid gap-2 sm:grid-cols-2">
            {PLUGIN_FILES.map((f) => (
              <li
                key={f.path}
                className="group flex items-start gap-3 rounded-lg border border-line-soft bg-ink-2/50 px-4 py-3 transition-colors duration-200 hover:border-azure/40"
              >
                <Icons.code className="mt-0.5 h-4 w-4 shrink-0 text-azure" />
                <div className="min-w-0">
                  <code className="block truncate font-mono text-[12px] text-snow">{f.path}</code>
                  <span className="block text-[11.5px] leading-snug text-faint">{f.note}</span>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>

      {/* bottom bar */}
      <div className="border-t border-line-soft bg-ink-2/40">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-7 sm:flex-row">
          <p className="flex items-center gap-2 font-mono text-[11.5px] text-faint">
            <Icons.wordpress className="h-4 w-4 text-azure" />
            Hecho con café y <span className="text-coral">♥</span> para la comunidad WordPress
          </p>
          <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2 font-mono text-[11.5px]" aria-label="Pie de página">
            {[
              ["#demo", "Demo"],
              ["#caracteristicas", "Características"],
              ["#codigo", "Código"],
              ["#precios", "Precios"],
              ["#faq", "FAQ"],
            ].map(([href, label]) => (
              <a key={href} href={href} className="text-mist transition-colors hover:text-azure">
                {label}
              </a>
            ))}
          </nav>
          <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 font-mono text-[11.5px] text-faint">
            <span>© 2026 Consentia · GPLv2+</span>
            <a
              href="https://thecreator.business/"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-1.5 rounded-full border border-line bg-card/70 px-3 py-1 text-mist transition-all duration-200 hover:border-azure/60 hover:text-snow hover:shadow-[0_0_18px_rgba(76,154,255,0.25)]"
              title="Visitar Thecreator.business"
            >
              <span className="text-faint transition-colors group-hover:text-azure">By</span>
              <span className="font-semibold text-snow">Thecreator.business</span>
              <Icons.arrow className="h-3 w-3 -rotate-45 text-azure transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
