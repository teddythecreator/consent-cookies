# PROMPT — Consentia: plugin de WordPress (RGPD) + web de producto

Crea un proyecto completo con dos entregables inseparables:

1. Un **plugin de WordPress listo para producción**, "Consentia – Cookie Consent & GDPR" v1.0.0, en condiciones de enviarse al repositorio de wordpress.org.
2. Una **web de producto en español** que lo presenta, con demo interactiva del banner, configurador en vivo con persistencia, y descarga REAL del ZIP del plugin (generado en cliente desde los propios archivos fuente).

---

## 1. El plugin de WordPress

PHP 7.4+, WordPress 6.0+, sin frameworks ni jQuery. Estructura de carpetas `consentia/`:

- **`consentia.php`** — Cabecera oficial completa (Plugin Name, Description, Version 1.0.0, Author, License GPLv2 or later, Text Domain `consentia`, Requires at least 6.0, Requires PHP 7.4). Constantes `CONSENTIA_VERSION/FILE/URL`. Clase singleton `Consentia` con los hooks. Opciones por defecto al activar (`consentia_settings`, `consentia_first_run`). Aviso de admin en la primera ejecución con enlace a Ajustes.
- **`uninstall.php`** — Borra todas las opciones, con soporte multisitio (`switch_to_blog` por cada sitio).
- **`includes/class-consentia-settings.php`** — Singleton. `get()` que fusiona guardado con defaults. Settings API con `sanitize_callback` que valida cada clave por lista blanca: `enabled`, `banner_type` (card|bar), `position` (bottom-left|bottom-right|bottom-center|top), `bg_color`/`text_color`/`accent_color` (hex), `corner_radius` 0–40, `show_delay_ms` 0–5000, `renew_months` 1–24, `title`, `message`, `accept_label`, `reject_label`, `prefs_label`, `privacy_url`, `ga_id` (G-XXXXXXX). Página de ajustes bajo "Ajustes → Consentia" con secciones (Banner, Apariencia, Scripts y analítica) y panel de **vista previa en vivo**. Enlace rápido "Ajustes" en la fila del plugin.
- **`includes/class-consentia-frontend.php`** — Encola CSS + JS con `defer` solo cuando está activo; `wp_localize_script` exponiendo `consentiaData` (settings + categorías necessary/analytics/marketing con etiquetas y flag locked); `<div id="consentia-root">` en el pie; shortcodes `[consentia_manage]` (botón `data-consentia-open`) y `[consentia_status]`.
- **`assets/js/consentia.js`** — Vanilla JS (~12 KB min+gzip): banner tarjeta o barra en 4 posiciones; panel de preferencias con switches; consentimiento en cookie `consentia` (`SameSite=Lax`, caducidad = `renew_months`) + respaldo en localStorage; **bloqueo real de scripts**: localiza `script[type="text/plain"][data-consentia]` y los clona como scripts reales al aceptar la categoría, sin recargar; inyecta gtag.js de GA4 solo si se aceptan analíticas y hay `ga_id`; eventos `consentia:granted` (primera vez) y `consentia:updated`; API pública `window.Consentia = { open(), close(), status() }`; accesibilidad completa (role="dialog", aria-modal, gestión de foco, Esc, `prefers-reduced-motion`); renovación: si la decisión supera los meses configurados, el banner reaparece.
- **`assets/css/consentia.css`** — Todo vía variables CSS (`--consentia-bg/text/accent/radius`) fijadas inline desde las settings; responsive < 640px; `prefers-reduced-motion`.
- **`assets/js/consentia-admin.js`** + **`assets/css/consentia-admin.css`** — Vista previa en vivo en la página de ajustes: un sitio en miniatura cuyo banner cambia de tipo, posición, colores, radio y textos mientras el usuario escribe; aviso si el banner está desactivado.
- **`languages/consentia-es_ES.po`** — Traducción española de todas las cadenas.
- **`readme.txt`** — Formato oficial wordpress.org: `=== Consentia – Cookie Consent & GDPR ===`, Contributors, Tags (gdpr, cookies, cookie consent, rgpd, ccpa, privacy, banner), Requires at least 6.0, Tested up to 6.7, Requires PHP 7.4, Stable tag 1.0.0, License GPLv2. Secciones: Description (con `= Highlights =`), Installation (explicando `data-consentia`), FAQ (6 preguntas), Screenshots, Changelog 1.0.0, Upgrade Notice.

Calidad de código: docblocks WPCS en cada clase/método, `defined('ABSPATH') || exit`, escapado en toda salida (`esc_html`, `esc_attr`, `esc_url`), identificadores en inglés, cadenas traducibles en español.

## 2. La web de producto (React + Vite + Tailwind v4 + TypeScript)

Los archivos fuente del plugin se importan en la web con imports `?raw` de Vite desde un módulo `plugin-files.ts` (exporta array `{ path, content, note }`, versión y árbol de la estructura en texto). Instala `jszip`: cada botón "Descargar consentia.zip" genera en cliente el ZIP con la estructura exacta `consentia/...` y dispara la descarga.

Secciones (todo en español, contenido real, cero lorem):

1. **Nav fija** con logo SVG propio (escudo/galleta), enlaces ancla y botón de descarga.
2. **Hero en dos columnas** (no un trío centrado): pill de estado (v1.0.0 · GPLv2), titular grande en display, subtítulo, botón de descarga + "Probar el configurador", terminal con animación de tecleo (`wp plugin install consentia --activate`…), 4 métricas (12 KB, 0 jQuery, 3 categorías, GPL). A la derecha: **demo viva** del banner dentro de un navegador simulado (mini-sitio "Cafetería Luna") con Aceptar/Rechazar/Configurar y panel de preferencias funcionales; chips flotantes.
3. **Configurador en vivo**: controles (tarjeta/barra, 4 posiciones, selectores de color fondo/texto/acento, sliders de radio y retraso, textos editables) y preview que **reproduce la animación del banner en cada cambio**; persistencia en localStorage; botones "Copiar JSON" (con toast) y "Restaurar"; indicador de estado del banner.
4. **Características en rejilla tipo bento** (no fila de tarjetas iguales): bloqueo real (con código), 12 KB (barras comparativas animadas), personalización, accesibilidad, multisitio e i18n, registro de consentimiento [Pro], geolocalización [Pro], shortcodes/API. Marquee de plugins compatibles (WooCommerce, Elementor, WP Rocket, WPML…) que pausa al hover.
5. **Desarrolladores**: 3 pestañas de snippets (Instalación, Bloquear un script, API JS) con copiado + toast; columna sticky con la estructura de archivos.
6. **Precios**: Gratis (wordpress.org, lista de funciones, descarga) y Pro 49 €/año (registro CSV, geolocalización UE/UK, TCF 2.2, multi-marca) con botón que baja al formulario.
7. **Reseñas**: 4 tarjetas con estrellas, media 4,9.
8. **FAQ**: acordeón de 6 preguntas (gratis de verdad, bloqueo de GA/Pixel, caché, renovación, sin servidores externos, traducción).
9. **Footer**: CTA final con formulario de lista de espera Pro (validación de email con feedback inline), ficha técnica del readme.txt, lista de archivos del ZIP, y barra inferior con insignia **"By Thecreator.business"** enlazando a `https://thecreator.business/` (`target="_blank"`, `rel="noopener"`).

### Diseño

- **Tipografías**: Bricolage Grotesque (display) + Instrument Sans (cuerpo) + JetBrains Mono (código/etiquetas), vía Google Fonts. Prohibido Inter/Roboto a secas.
- **Paleta**: fondo azul marino profundo `#0A1424`, tarjetas `#101F36`, líneas `#1E3350`, textos `#E8EEF7`/`#9DB1CC`/`#64789A`, acentos azure `#4C9AFF`, azul `#2F6FED`, verde azulado `#35D0A5`, ámbar `#FFB224`, coral `#FF6B6B`. Nada de degradados índigo/violeta/rosa, ni titulares pintados con gradiente, ni glassmorphism general, ni crema/beige.
- **Ambiente**: fondo fijo con glows radiales por capas, rejilla de 46 px con máscara radial, grano SVG sutil, partículas flotantes, reveals al hacer scroll con IntersectionObserver y delays escalonados.
- **Iconos SVG propios** inline (nada de emojis ni librerías genéricas).
- **Micro-interacciones** en todo: botones con brillo al hover, toggles animados, acordeón animado con grid-template-rows, copiar con estado "copiado" + toast.
- **Contraste tipográfico fuerte**: titulares con `clamp()`, etiquetas en monospace uppercase con tracking amplio.

### Requisitos técnicos

- El punto de entrada es `src/App.tsx`; actualiza el título de `index.html`.
- Debe compilar con `npm run build` sin errores.
- Todos los botones, enlaces y formularios funcionan (nada de enlaces muertos).
- `prefers-reduced-motion` desactiva animaciones y muestra el contenido directamente.

Empieza por el plugin (es el producto); la web lo envuelve.
