=== Consentia – Cookie Consent & GDPR (RGPD / LSSI-CE) ===
Contributors: consentia
Tags: gdpr, rgpd, cookies, cookie consent, cookie law, ccpa, eprivacy, lssi, privacy, banner
Requires at least: 6.0
Tested up to: 6.7
Requires PHP: 7.4
Stable tag: 1.2.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Cumplimiento RGPD, LSSI-CE y ePrivacy autoalojado: banner con tres botones de igual visibilidad, bloqueo previo real de scripts, registro probatorio en tu base de datos, widget de revocación y política de cookies con [consentia_policy].

== Description ==

Consentia convierte el cumplimiento de cookies en algo que puedes demostrar, no solo mostrar. Todo vive en tu propio WordPress: sin SaaS, sin cuentas y sin enviar las decisiones de tus visitantes a servidores de terceros.

= Cumplimiento legal verificable =

* **Consentimiento explícito**: solo un clic lo otorga. El scroll, el movimiento del ratón o la navegación NUNCA cuentan (considerando 32 RGPD).
* **Tres botones al mismo nivel** — «Aceptar todas», «Rechazar» y «Configurar» con idéntico tamaño y visibilidad, como exige la directriz EDPB 05/2020. Rechazar es tan fácil como aceptar.
* **Bloqueo previo real**: los scripts marcados `type="text/consentia"` no se ejecutan hasta que hay consentimiento (art. 5.3 ePrivacy), y se activan al instante sin recargar.
* **Casillas desmarcadas por defecto**: solo «Necesarias» está activa (y bloqueada), el resto empieza en OFF.
* **Registro probatorio** (art. 7.1 RGPD): cada decisión se guarda en `wp_consentia_consents` con fecha, categorías, origen, IP anonimizada, user agent y versión. Exportable a CSV.
* **Revocación en un clic**: widget flotante «Configuración de Cookies» que retira el consentimiento y recarga para bloquear todo al momento (art. 7.3 RGPD).
* **Caducidad a 365 días** como máximo legal; por defecto se vuelve a pedir a los 6 meses (recomendación CNIL/AEPD).
* **Política de cookies completa** con el shortcode `[consentia_policy]`: categorías, cookies concretas, transferencias internacionales, gestión por navegador y derechos ante la AEPD.

= Accesibilidad WCAG 2.1 AA =

`role="alertdialog"`, gestión de foco, Tab atrapado en el panel, cierre con Escape, anuncios `aria-live` («Has aceptado todas las cookies»), foco visible de 3px y soporte de `prefers-reduced-motion`.

= Además =

* 4 categorías legales: Necesarias, Preferencias, Estadísticas y Marketing.
* Cookies técnicas `consentia_consent`, `consentia_consent_date` y `consentia_categories` (expiran a 365 días).
* Global Privacy Control respetado automáticamente.
* Geolocalización UE/EEE/Reino Unido + California (Cloudflare, MaxMind, geoip o ipapi.co), fail-closed.
* Google Consent Mode v2 e IAB TCF v2.2 opcionales.
* Inyección de GA4 solo si se aceptan las Estadísticas.
* Escáner de cookies y scripts de terceros.
* ~12 KB, cero jQuery, sin peticiones externas obligatorias.
* Multisitio, WPML/Polylang y traducción española incluida. Text domain `consentia`.

== Installation ==

1. Sube la carpeta `consentia` a `/wp-content/plugins/` o instala desde *Plugins → Añadir nuevo*.
2. Actívalo: se crea la tabla de registro y las opciones por defecto.
3. Ve a *Ajustes → Consentia* y personaliza el banner (vista previa en vivo).
4. Crea una página con el shortcode `[consentia_policy]` y enlázala en «URL política de cookies».

= Bloquear un script =

Cambia el `type` a `text/consentia` e indica la categoría:

`<script type="text/consentia" data-consentia-category="statistics" src="https://example.com/stats.js"></script>`

Categorías válidas: `necessary`, `preferences`, `statistics`, `marketing`.

== Frequently Asked Questions ==

= ¿Cumple realmente el RGPD y la LSSI? =
Sí, por diseño: consentimiento explícito por clic, bloqueo previo de scripts, casillas desmarcadas, registro probatorio con IP y fecha, revocación accesible y caducidad máxima de 365 días. No es un banner decorativo.

= ¿El botón «Rechazar» es menos visible que «Aceptar»? =
Nunca. Ambos botones comparten exactamente el mismo tamaño, padding y presencia de borde. Es un requisito legal y está forzado en el CSS.

= ¿Qué guarda en la base de datos? =
La decisión (aceptada/rechazada/actualizada/revocada), las categorías, fecha y hora, versión del plugin, URL y user agent. La IP solo se guarda si la activas, y siempre como hash irreversible.

= ¿Cómo demuestro el consentimiento ante una inspección? =
Exporta el registro a CSV desde Ajustes → Consentia → Registro. Cada fila incluye cuándo y qué aceptó el visitante.

= ¿Puedo revocar el consentimiento? =
Sí, con el widget flotante «Configuración de Cookies» o el shortcode `[consentia_manage]`. Al retirar, la página se recarga y todo lo no esencial se bloquea.

= ¿Funciona con plugins de caché? =
Sí. El banner se renderiza en PHP y la configuración viaja por `wp_localize_script`, así que es compatible con la página cacheada. Excluye el handle `consentia` de la combinación de JS si tu optimizador reescribe JSON inline.

== Screenshots ==

1. Banner con los tres botones al mismo nivel.
2. Segunda capa: categorías desmarcadas por defecto.
3. Widget flotante de revocación.
4. Registro de consentimiento en el admin con exportación CSV.
5. Política de cookies generada por [consentia_policy].

== Changelog ==

= 1.2.0 =
* Cumplimiento estricto RGPD / LSSI-CE / ePrivacy.
* Banner renderizado en PHP con tres botones de idéntica visibilidad (role="alertdialog").
* Cookies técnicas consentia_consent, consentia_consent_date y consentia_categories (365 días).
* Bloqueo previo con type="text/consentia" (compatible con el legado text/plain).
* Registro probatorio en wp_consentia_consents con AJAX, IP anonimizada, user agent, URL y versión.
* Widget flotante de revocación y shortcode [consentia_manage].
* Caducidad y renovación del consentimiento (máx. 365 días).
* Política de cookies con [consentia_policy]: categorías, cookies, transferencias, navegadores y derechos AEPD.
* Accesibilidad WCAG 2.1 AA: focus trap, Escape, aria-live, foco visible.
* Geolocalización UE/EEE/UK + California con fallback seguro.
* Global Privacy Control.

= 1.0.0 =
* Versión inicial.

== Upgrade Notice ==

= 1.2.0 =
Actualización mayor orientada al cumplimiento legal estricto. Revisa Ajustes → Consentia tras actualizar.
