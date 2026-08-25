import { Icons, Reveal, SectionHeading } from "./shared";

type Row = {
  label: string;
  consentia: { good: boolean; text: string };
  cookieyes: { good: boolean; text: string };
};

const ROWS: Row[] = [
  {
    label: "Precio",
    consentia: { good: true, text: "Gratis (GPLv2) · Pro 49 €/año" },
    cookieyes: { good: false, text: "10–26 $/mes (120–312 $/año)" },
  },
  {
    label: "Dónde viven los datos",
    consentia: { good: true, text: "En tu servidor. Nada sale fuera" },
    cookieyes: { good: false, text: "SaaS: consentimientos en sus servidores" },
  },
  {
    label: "Límite de visitas",
    consentia: { good: true, text: "Sin límites, nunca" },
    cookieyes: { good: false, text: "10k–1M según plan; pagas al superar" },
  },
  {
    label: "Peso en tu web",
    consentia: { good: true, text: "≈12 KB, 0 peticiones externas" },
    cookieyes: { good: false, text: "SDK externo +100 KB desde su CDN" },
  },
  {
    label: "Bloqueo real de scripts",
    consentia: { good: true, text: "Sí, por 4 categorías legales" },
    cookieyes: { good: true, text: "Sí" },
  },
  {
    label: "Política de cookies",
    consentia: { good: true, text: "Auto-generada con [consentia_policy], gratis" },
    cookieyes: { good: false, text: "Generador manual básico" },
  },
  {
    label: "Registro de consentimiento + CSV",
    consentia: { good: true, text: "Incluido gratis, en tu base de datos" },
    cookieyes: { good: false, text: "Limitado según plan (50–20k registros)" },
  },
  {
    label: "Google Consent Mode v2",
    consentia: { good: true, text: "Básico y avanzado" },
    cookieyes: { good: true, text: "Sí" },
  },
  {
    label: "IAB TCF",
    consentia: { good: true, text: "v2.2 (propósitos)" },
    cookieyes: { good: true, text: "v2.2 + v2.3 (CMP certificado)" },
  },
  {
    label: "CCPA / «Do Not Sell»",
    consentia: { good: true, text: "Incluido gratis" },
    cookieyes: { good: true, text: "Sí" },
  },
  {
    label: "Global Privacy Control",
    consentia: { good: true, text: "Respeto automático" },
    cookieyes: { good: true, text: "Sí" },
  },
  {
    label: "Geolocalización",
    consentia: { good: true, text: "Cloudflare / MaxMind / geoip, gratis" },
    cookieyes: { good: true, text: "Sí, en planes Business+" },
  },
  {
    label: "Dependencia de terceros",
    consentia: { good: true, text: "Funciona offline en tu hosting" },
    cookieyes: { good: false, text: "Si su servicio cae, tu banner cae" },
  },
];

export default function Comparison() {
  return (
    <section id="comparativa" className="relative scroll-mt-24 py-24">
      <div className="mx-auto max-w-5xl px-5">
        <SectionHeading
          align="center"
          eyebrow="Frente a frente"
          title={
            <>
              Consentia vs <span className="text-coral">CookieYes</span>
            </>
          }
          sub="Mismas funciones de cumplimiento. Diferencia: Consentia corre en tu WordPress, tus datos se quedan contigo y no pagas por visita."
        />

        <Reveal delay={150} className="mt-12 overflow-hidden rounded-xl border border-line bg-card/50">
          {/* header */}
          <div className="grid grid-cols-[1.2fr_1fr_1fr] items-stretch border-b border-line bg-ink-2/80">
            <div className="px-5 py-4 font-mono text-[11px] uppercase tracking-[0.18em] text-faint">Función</div>
            <div className="flex items-center gap-2.5 border-l border-line bg-deep/10 px-5 py-4">
              <Icons.shield className="h-4.5 w-4.5 shrink-0 text-azure" />
              <span className="font-display text-[15px] font-bold text-snow">Consentia</span>
            </div>
            <div className="flex items-center gap-2.5 border-l border-line px-5 py-4">
              <span className="grid h-4.5 w-4.5 shrink-0 place-items-center rounded-sm bg-coral/20 font-display text-[11px] font-bold text-coral">
                C!
              </span>
              <span className="font-display text-[15px] font-bold text-mist">CookieYes</span>
            </div>
          </div>

          {/* rows */}
          {ROWS.map((row, i) => (
            <div
              key={row.label}
              className={`group grid grid-cols-[1.2fr_1fr_1fr] items-stretch transition-colors duration-200 hover:bg-ink-2/60 ${
                i !== ROWS.length - 1 ? "border-b border-line-soft" : ""
              }`}
            >
              <div className="px-5 py-3.5 text-[13.5px] font-semibold text-snow">{row.label}</div>
              <div className="flex items-start gap-2 border-l border-line bg-deep/[0.06] px-5 py-3.5">
                <Icons.check
                  className={`mt-0.5 h-4 w-4 shrink-0 ${row.consentia.good ? "text-teal" : "text-amber"}`}
                />
                <span className={`text-[13px] leading-snug ${row.consentia.good ? "text-snow/90" : "text-mist"}`}>
                  {row.consentia.text}
                </span>
              </div>
              <div className="flex items-start gap-2 border-l border-line px-5 py-3.5">
                {row.cookieyes.good ? (
                  <Icons.check className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
                ) : (
                  <Icons.x className="mt-0.5 h-4 w-4 shrink-0 text-coral" />
                )}
                <span className={`text-[13px] leading-snug ${row.cookieyes.good ? "text-mist" : "text-faint"}`}>
                  {row.cookieyes.text}
                </span>
              </div>
            </div>
          ))}
        </Reveal>

        <Reveal delay={250} className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <p className="rounded-xl border border-teal/30 bg-teal/8 px-5 py-3.5 text-center text-[14px] text-snow/90">
            <strong className="font-display text-teal">Ahorro vs plan Business:</strong> ≈ <span className="font-display font-bold">260 €/año</span> y
            tus consentimientos en tu base de datos.
          </p>
        </Reveal>
        <p className="mt-4 text-center font-mono text-[10.5px] text-faint">
          * Comparativa basada en las características públicas de cookieyes.com (febrero 2026). TCF con GVL completa llega en Consentia Pro.
        </p>
      </div>
    </section>
  );
}
