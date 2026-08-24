import { useState, type ReactNode } from "react";
import { Icons, Reveal, SectionHeading, useToast } from "./shared";
import { PLUGIN_TREE } from "../plugin-files";

interface Snippet {
  id: string;
  tab: string;
  file: string;
  code: ReactNode;
  raw: string;
}

const SNIPPETS: Snippet[] = [
  {
    id: "install",
    tab: "Instalación",
    file: "terminal",
    raw: "wp plugin install consentia --activate\n\n# o desde el panel:\n# Plugins → Añadir nuevo → Subir plugin → consentia-1.0.0.zip\n# Después: Ajustes → Consentia",
    code: (
      <>
        <span className="text-azure">$</span> wp plugin install <span className="text-teal">consentia</span>{" "}
        <span className="text-amber">--activate</span>
        {"\n\n"}
        <span className="text-faint"># o desde el panel:</span>
        {"\n"}
        <span className="text-faint"># Plugins → Añadir nuevo → Subir plugin → consentia-1.0.0.zip</span>
        {"\n"}
        <span className="text-faint"># Después: Ajustes → Consentia</span>
      </>
    ),
  },
  {
    id: "block",
    tab: "Bloquear un script",
    file: "header.php / plugin de snippets",
    raw: '<!-- Google Analytics: solo corre si aceptan "Analíticas" -->\n<script type="text/plain" data-consentia="analytics"\n        src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX"\n        async></script>\n\n<!-- Meta Pixel: solo si aceptan "Marketing" -->\n<script type="text/plain" data-consentia="marketing">\n  !function(f,b,e,v,n,t,s){ /* píxel */ }(window,document,"script");\n</script>',
    code: (
      <>
        <span className="text-faint">{'<!-- Google Analytics: solo corre si aceptan "Analíticas" -->'}</span>
        {"\n"}
        <span className="text-coral">&lt;script</span> <span className="text-amber">type</span>=
        <span className="text-teal">"text/plain"</span> <span className="text-amber">data-consentia</span>=
        <span className="text-teal">"analytics"</span>
        {"\n        "}
        <span className="text-amber">src</span>=<span className="text-teal">"https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX"</span>
        {"\n        "}
        <span className="text-amber">async</span>
        <span className="text-coral">&gt;&lt;/script&gt;</span>
        {"\n\n"}
        <span className="text-faint">{'<!-- Meta Pixel: solo si aceptan "Marketing" -->'}</span>
        {"\n"}
        <span className="text-coral">&lt;script</span> <span className="text-amber">type</span>=
        <span className="text-teal">"text/plain"</span> <span className="text-amber">data-consentia</span>=
        <span className="text-teal">"marketing"</span>
        <span className="text-coral">&gt;</span>
        {"\n  "}!function(f,b,e,v,n,t,s){"{ /* píxel */ }"}(window,document,<span className="text-teal">"script"</span>);{"\n"}
        <span className="text-coral">&lt;/script&gt;</span>
      </>
    ),
  },
  {
    id: "api",
    tab: "API de JavaScript",
    file: "theme.js",
    raw: "// Reacciona a la primera decisión, sin recargar la página\ndocument.addEventListener('consentia:granted', (e) => {\n  if (e.detail.analytics) iniciarMetricas();\n  if (e.detail.marketing) iniciarPixel();\n});\n\n// Útil para tu propio UI\nwindow.Consentia.open();    // abre las preferencias\nwindow.Consentia.status();  // { necessary: true, analytics: false, … }",
    code: (
      <>
        <span className="text-faint">{'// Reacciona a la primera decisión, sin recargar la página'}</span>
        {"\n"}
        document.addEventListener(<span className="text-teal">'consentia:granted'</span>, (e) =&gt; {"{"}
        {"\n  "}
        <span className="text-azure">if</span> (e.detail.analytics) iniciarMetricas();{"\n  "}
        <span className="text-azure">if</span> (e.detail.marketing) iniciarPixel();{"\n"}
        {"}"});{"\n\n"}
        <span className="text-faint">{'// Útil para tu propio UI'}</span>
        {"\n"}
        window.<span className="text-azure">Consentia</span>.<span className="text-teal">open</span>();{"    "}
        <span className="text-faint">{'// abre las preferencias'}</span>
        {"\n"}
        window.<span className="text-azure">Consentia</span>.<span className="text-teal">status</span>();{"  "}
        <span className="text-faint">{'// { necessary: true, analytics: false, … }'}</span>
      </>
    ),
  },
];

export default function CodeShowcase() {
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);
  const toast = useToast();
  const snippet = SNIPPETS[active];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet.raw);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = snippet.raw;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    toast("Snippet copiado al portapapeles.");
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <section id="codigo" className="relative scroll-mt-24 py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="grid items-start gap-12 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="lg:sticky lg:top-24">
            <SectionHeading
              eyebrow="Para desarrolladores"
              title={
                <>
                  Tres minutos de setup. <span className="text-azure">Cero</span> magia negra.
                </>
              }
              sub="Instala, marca tus scripts con un atributo y olvídate. Si necesitas más control, hay eventos del DOM y una API pública documentada en el readme.txt."
            />

            <Reveal delay={200} className="mt-8 overflow-hidden rounded-xl border border-line bg-[#070f1d]">
              <div className="border-b border-line-soft px-4 py-2.5 font-mono text-[10.5px] uppercase tracking-widest text-faint">
                Estructura del plugin
              </div>
              <pre className="overflow-x-auto p-4 font-mono text-[12px] leading-[1.7] text-mist">{PLUGIN_TREE}</pre>
            </Reveal>
          </div>

          <Reveal delay={120}>
            <div className="overflow-hidden rounded-xl border border-line bg-[#070f1d] shadow-2xl shadow-black/40">
              <div className="flex flex-wrap items-center gap-1 border-b border-line-soft bg-ink-2/60 px-3 py-2.5">
                {SNIPPETS.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setActive(i);
                      setCopied(false);
                    }}
                    className={`rounded-md px-3.5 py-1.5 font-mono text-[12px] transition-all duration-200 ${
                      i === active ? "bg-deep/20 text-azure ring-1 ring-deep/50" : "text-faint hover:text-mist"
                    }`}
                    aria-pressed={i === active}
                  >
                    {s.tab}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={copy}
                  className={`ml-auto inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-[12px] transition-all duration-200 ${
                    copied ? "text-teal" : "text-mist hover:text-snow"
                  }`}
                >
                  {copied ? <Icons.check className="h-3.5 w-3.5" /> : <Icons.copy className="h-3.5 w-3.5" />}
                  {copied ? "copiado" : "copiar"}
                </button>
              </div>
              <p className="border-b border-line-soft px-4 py-2 font-mono text-[10.5px] text-faint">↳ {snippet.file}</p>
              <pre
                key={snippet.id}
                className="min-h-[300px] overflow-x-auto p-5 font-mono text-[13px] leading-[1.75] text-snow"
              >
                <code>{snippet.code}</code>
              </pre>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                { k: "consentia:granted", v: "primera decisión" },
                { k: "consentia:updated", v: "cualquier cambio" },
                { k: "Consentia.status()", v: "estado actual" },
              ].map((item) => (
                <div
                  key={item.k}
                  className="rounded-lg border border-line bg-card/60 px-4 py-3 transition-colors duration-200 hover:border-azure/50"
                >
                  <code className="font-mono text-[12px] text-azure">{item.k}</code>
                  <p className="mt-1 font-mono text-[10.5px] uppercase tracking-wider text-faint">{item.v}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
