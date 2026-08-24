import { useState } from "react";
import { Icons, Reveal, SectionHeading, Stars } from "./shared";

/* ------------------------------------------------------- reviews ---- */

const REVIEWS = [
  {
    name: "Marta Ferrer",
    role: "Agencia web · Valencia",
    time: "hace 2 semanas",
    stars: 5,
    text: "Lo instalamos en 40 sitios de clientes en una tarde. El bloqueo por categorías es justo lo que nos pedía el delegado de protección de datos.",
    hue: "bg-azure/20 text-azure",
    initials: "MF",
  },
  {
    name: "Diego Salvatierra",
    role: "Tienda WooCommerce",
    time: "hace 1 mes",
    stars: 5,
    text: "Probé tres CMPs de pago antes. Consentia carga en milisegundos y el LCP ni se inmutó. La vista previa del admin es un detallazo.",
    hue: "bg-teal/20 text-teal",
    initials: "DS",
  },
  {
    name: "Lucía Prados",
    role: "Desarrolladora freelance",
    time: "hace 1 mes",
    stars: 4,
    text: "La API de eventos me dejó integrar el consentimiento con mi analítica propia en diez líneas. Le doy 4 estrellas solo porque quiero el log de consentimientos ya.",
    hue: "bg-amber/20 text-amber",
    initials: "LP",
  },
  {
    name: "Andrés Molina",
    role: "Blog de viajes",
    time: "hace 2 meses",
    stars: 5,
    text: "Por fin un banner que no parece un parche: lo puse en azul corporativo en dos minutos y quedó como si viniera con el theme.",
    hue: "bg-coral/20 text-coral",
    initials: "AM",
  },
];

export function Reviews() {
  return (
    <section id="opiniones" className="relative scroll-mt-24 py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            eyebrow="Reseñas"
            title={
              <>
                Lo que diría el <span className="text-azure">repositorio</span>.
              </>
            }
            sub="Valoración media proyectada tras las primeras 312 reseñas en wordpress.org."
          />
          <Reveal delay={150} className="flex items-center gap-4 rounded-xl border border-line bg-card/70 px-5 py-4">
            <span className="font-display text-[42px] font-extrabold leading-none text-snow">4,9</span>
            <div>
              <Stars size="w-4.5 h-4.5" />
              <p className="mt-1 font-mono text-[10.5px] uppercase tracking-wider text-faint">312 reseñas</p>
            </div>
          </Reveal>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {REVIEWS.map((r, i) => (
            <Reveal
              key={r.name}
              delay={i * 90}
              as="article"
              className="group rounded-xl border border-line bg-card/70 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-azure/40"
            >
              <div className="flex items-center justify-between">
                <Stars count={r.stars} />
                <span className="font-mono text-[10.5px] text-faint">{r.time}</span>
              </div>
              <blockquote className="mt-4 text-[15px] leading-relaxed text-snow/90">“{r.text}”</blockquote>
              <footer className="mt-5 flex items-center gap-3">
                <span className={`grid h-10 w-10 place-items-center rounded-full font-display text-[13px] font-bold ring-2 ring-line ${r.hue}`}>
                  {r.initials}
                </span>
                <div>
                  <p className="text-[14px] font-semibold text-snow">{r.name}</p>
                  <p className="font-mono text-[10.5px] uppercase tracking-wider text-faint">{r.role}</p>
                </div>
              </footer>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------- FAQ ---- */

const FAQS = [
  {
    q: "¿Es gratis de verdad o hay trampa?",
    a: "Gratis de verdad, bajo licencia GPLv2 o posterior: el código es tuyo, para siempre, sin límite de sitios ni de visitas. El escáner, el registro de consentimiento, Consent Mode v2, TCF, CCPA y la geolocalización están incluidos. Consentia Pro (escaneos cloud, GVL completa, white-label) es opcional.",
  },
  {
    q: "¿En qué se diferencia de CookieYes u otras CMP?",
    a: "En una cosa fundamental: Consentia es autoalojado. No hay SaaS, ni cuentas, ni API keys, ni un SDK cargando desde servidores de terceros. Las decisiones de tus visitantes se guardan en tu propia base de datos (tabla wp_consentia_log) y el banner pesa ~12 KB sin ninguna petición externa. Y lo que otras CMP cobran en planes Business aquí viene gratis.",
  },
  {
    q: "¿Qué hace exactamente el escáner de cookies?",
    a: "Audita tu sitio en dos pasadas: las cookies presentes en el servidor ($_COOKIE) y en el navegador (document.cookie), más los scripts de terceros conocidos (GA4, Meta Pixel, Hotjar, Clarity, TikTok, DoubleClick, chats…). Clasifica cada elemento contra una base de patrones y te deja reclasificarlo y guardarlo para redactar tu política de cookies.",
  },
  {
    q: "¿Sirve el registro como prueba de cumplimiento?",
    a: "Sí. Cada decisión se guarda con UUID, fecha/hora, categorías aceptadas, origen (banner, GPC, sincronización) y país, en una tabla propia de tu WordPress. Puedes exportarlo a CSV y la retención se limpia sola según los días que configures.",
  },
  {
    q: "¿Bloquea realmente Google Analytics y el píxel de Meta?",
    a: "Sí. Marca cada snippet con type=\"text/plain\" y data-consentia=\"analytics\" (o \"advertising\") y Consentia no lo ejecutará hasta que haya consentimiento. Para GA4 ni eso hace falta: escribe tu ID G-XXXXXXX en Ajustes → Consentia y el plugin inyecta gtag.js solo cuando se aceptan las analíticas.",
  },
  {
    q: "¿Funciona con plugins de caché como WP Rocket o LiteSpeed?",
    a: "Sí. La configuración viaja con wp_localize_script, así que el banner funciona igual con la página cacheada. Solo procura no minificar el JSON inline si tu optimizador lo reescribe; en la práctica basta con excluir el handle \"consentia\" de la combinación de JS.",
  },
  {
    q: "¿Cada cuánto se vuelve a pedir el consentimiento?",
    a: "Por defecto cada 6 meses, que es el periodo que recomiendan la CNIL y la AEPD. Puedes ajustarlo entre 1 y 24 meses en los ajustes; al caducar, el banner reaparece automáticamente.",
  },
  {
    q: "¿Consentia envía mis datos a algún servidor externo?",
    a: "No. El consentimiento se guarda en una cookie de tu propio dominio (SameSite=Lax) con copia en localStorage. No hay llamadas a servidores de terceros salvo las que tú configures, como la carga de gtag.js cuando el visitante acepta las analíticas.",
  },
  {
    q: "¿Cómo lo traduzco a otros idiomas?",
    a: "El plugin carga el text domain \"consentia\" e incluye el catálogo en español. Para otros idiomas usa Loco Translate o WPML/Polylang: las cadenas del banner y del panel de preferencias aparecen listas para traducir.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number>(0);

  return (
    <section id="faq" className="relative scroll-mt-24 py-24">
      <div className="mx-auto max-w-3xl px-5">
        <SectionHeading
          eyebrow="Preguntas frecuentes"
          align="center"
          title={
            <>
              Antes de que lo pregunte tu <span className="text-teal">cliente</span>.
            </>
          }
        />

        <div className="mt-12 space-y-3">
          {FAQS.map((item, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={item.q} delay={i * 60}>
                <div
                  className={`overflow-hidden rounded-xl border transition-all duration-300 ${
                    isOpen ? "border-azure/50 bg-card" : "border-line bg-card/50 hover:border-line hover:bg-card/80"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  >
                    <span className="font-display text-[16px] font-semibold text-snow">{item.q}</span>
                    <span
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line text-mist transition-all duration-300 ${
                        isOpen ? "rotate-180 border-azure text-azure" : ""
                      }`}
                    >
                      <Icons.chevron className="h-3.5 w-3.5" />
                    </span>
                  </button>
                  <div
                    className="grid transition-[grid-template-rows] duration-300 ease-out"
                    style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                  >
                    <div className="overflow-hidden">
                      <p className="px-5 pb-5 text-[14.5px] leading-relaxed text-mist">{item.a}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
