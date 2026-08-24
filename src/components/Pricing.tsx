import { DownloadButton, Icons, Reveal, SectionHeading, useToast } from "./shared";

const FREE_FEATURES = [
  "Banner tarjeta o barra, 4 posiciones",
  "Bloqueo de scripts por categoría",
  "Panel de preferencias granular",
  "Inyección automática de GA4",
  "Personalización completa con vista previa",
  "Shortcodes y API de JavaScript",
  "Multisitio, WPML y traducción ES",
  "Actualizaciones y soporte en el foro",
];

const PRO_FEATURES = [
  "Registro de consentimiento exportable (CSV)",
  "Geolocalización: banner solo en UE/UK",
  "Bloqueo automático de scripts conocidos",
  "Compatibilidad TCF 2.2",
  "Temas multi-marca por sitio",
  "Soporte prioritario por correo",
];

export default function Pricing() {
  const toast = useToast();

  const notifyPro = () => {
    const form = document.getElementById("aviso");
    if (form) {
      form.scrollIntoView({ behavior: "smooth", block: "center" });
      const input = form.querySelector("input");
      if (input) setTimeout(() => input.focus({ preventScroll: true }), 450);
    } else {
      toast("Déjanos tu correo en el pie de página y te avisamos.");
    }
  };

  return (
    <section id="precios" className="relative scroll-mt-24 py-24">
      <div className="mx-auto max-w-6xl px-5">
        <SectionHeading
          eyebrow="Precios"
          title={
            <>
              Gratis en el repositorio. <span className="text-amber">Pro</span> para quien necesita más.
            </>
          }
          sub="El modelo clásico de WordPress.org: el plugin completo es libre (GPLv2) y la edición Pro añade herramientas de cumplimiento avanzado para equipos."
          align="center"
        />

        <div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-[1fr_1.08fr]">
          {/* Free */}
          <Reveal className="flex flex-col rounded-xl border border-line bg-card/70 p-8 transition-all duration-300 hover:-translate-y-1 hover:border-azure/40">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-[21px] font-bold text-snow">Consentia</h3>
              <span className="rounded-full bg-teal/12 px-3 py-1 font-mono text-[10.5px] font-bold uppercase tracking-widest text-teal ring-1 ring-teal/35">
                wordpress.org
              </span>
            </div>
            <p className="mt-2 text-[14px] text-mist">El plugin completo, para siempre.</p>
            <p className="mt-5 font-display text-[44px] font-extrabold tracking-tight text-snow">
              0 €
              <span className="ml-2 align-middle font-mono text-[11px] font-normal uppercase tracking-widest text-faint">GPLv2</span>
            </p>
            <ul className="mt-6 flex-1 space-y-3">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-[14px] text-mist">
                  <span className="mt-0.5 text-teal">
                    <Icons.check className="h-4 w-4" />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <DownloadButton label="Descargar gratis (.zip)" className="w-full" />
              <p className="mt-3 text-center font-mono text-[10.5px] text-faint">o búscanos como «consentia» en Añadir nuevo</p>
            </div>
          </Reveal>

          {/* Pro */}
          <Reveal
            delay={130}
            className="relative flex flex-col overflow-hidden rounded-xl border border-amber/40 bg-card p-8 shadow-2xl shadow-amber/5 transition-all duration-300 hover:-translate-y-1 hover:border-amber/70"
          >
            <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-amber/10 blur-2xl" aria-hidden="true" />
            <div className="flex items-center justify-between">
              <h3 className="font-display text-[21px] font-bold text-snow">Consentia Pro</h3>
              <span className="rounded-full bg-amber/15 px-3 py-1 font-mono text-[10.5px] font-bold uppercase tracking-widest text-amber ring-1 ring-amber/40">
                En desarrollo
              </span>
            </div>
            <p className="mt-2 text-[14px] text-mist">Cumplimiento con pruebas, no con promesas.</p>
            <p className="mt-5 font-display text-[44px] font-extrabold tracking-tight text-snow">
              39 €<span className="ml-1 text-[18px] font-semibold text-mist">/año</span>
              <span className="ml-2 align-middle font-mono text-[11px] font-normal uppercase tracking-widest text-faint">1 sitio</span>
            </p>
            <ul className="mt-6 flex-1 space-y-3">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-[14px] text-mist">
                  <span className="mt-0.5 text-amber">
                    <Icons.check className="h-4 w-4" />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <button
                type="button"
                onClick={notifyPro}
                className="btn-shine inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber px-6 py-3.5 text-[15px] font-bold text-ink shadow-lg shadow-amber/25 transition-all duration-200 hover:bg-snow active:scale-[0.97]"
              >
                Avisadme cuando salga
                <Icons.arrow className="h-4 w-4" />
              </button>
              <p className="mt-3 text-center font-mono text-[10.5px] text-faint">sin spam: un solo correo el día del lanzamiento</p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
