import consentiaPhp from "./plugin-source/consentia.php?raw";
import uninstallPhp from "./plugin-source/uninstall.php?raw";
import readmeTxt from "./plugin-source/readme.txt?raw";
import settingsPhp from "./plugin-source/includes/class-consentia-settings.php?raw";
import frontendPhp from "./plugin-source/includes/class-consentia-frontend.php?raw";
import loggerPhp from "./plugin-source/includes/class-consentia-logger.php?raw";
import geoPhp from "./plugin-source/includes/class-consentia-geo.php?raw";
import bannerJs from "./plugin-source/assets/js/consentia.js?raw";
import tcfJs from "./plugin-source/assets/js/consentia-tcf.js?raw";
import adminJs from "./plugin-source/assets/js/consentia-admin.js?raw";
import bannerCss from "./plugin-source/assets/css/consentia.css?raw";
import adminCss from "./plugin-source/assets/css/consentia-admin.css?raw";
import policyTpl from "./plugin-source/templates/cookie-policy.php?raw";
import consentsView from "./plugin-source/admin/views/consents-list.php?raw";
import esPo from "./plugin-source/languages/consentia-es_ES.po?raw";

export interface PluginFile {
  /** Path inside the plugin folder */
  path: string;
  content: string;
  lang: "php" | "js" | "css" | "txt" | "po";
  note: string;
}

export const PLUGIN_VERSION = "1.2.0";
export const PLUGIN_SLUG = "consentia";

export const PLUGIN_FILES: PluginFile[] = [
  { path: "consentia.php", content: consentiaPhp, lang: "php", note: "Principal: activación, AJAX de consentimiento, [consentia_policy]" },
  { path: "readme.txt", content: readmeTxt, lang: "txt", note: "Ficha oficial para wordpress.org" },
  { path: "uninstall.php", content: uninstallPhp, lang: "php", note: "Limpieza total de opciones al desinstalar" },
  { path: "includes/class-consentia-settings.php", content: settingsPhp, lang: "php", note: "Settings API, 4 categorías, sanitización y vista previa" },
  { path: "includes/class-consentia-frontend.php", content: frontendPhp, lang: "php", note: "render_banner(), render_settings_panel(), bloqueo previo" },
  { path: "includes/class-consentia-logger.php", content: loggerPhp, lang: "php", note: "Tabla probatoria, IP real, exportación CSV" },
  { path: "includes/class-consentia-geo.php", content: geoPhp, lang: "php", note: "UE/EEE/UK + California, fail-closed" },
  { path: "assets/js/consentia.js", content: bannerJs, lang: "js", note: "grantConsent, cookies 365d, bloqueo, widget, WCAG" },
  { path: "assets/js/consentia-tcf.js", content: tcfJs, lang: "js", note: "IAB TCF v2.2 (TC string + __tcfapi)" },
  { path: "assets/js/consentia-admin.js", content: adminJs, lang: "js", note: "Vista previa en vivo y escáner del admin" },
  { path: "assets/css/consentia.css", content: bannerCss, lang: "css", note: "Botones de igual visibilidad, foco 3px, sr-only" },
  { path: "assets/css/consentia-admin.css", content: adminCss, lang: "css", note: "Estilos de la página de ajustes" },
  { path: "templates/cookie-policy.php", content: policyTpl, lang: "php", note: "Política de cookies detallada ([consentia_policy])" },
  { path: "admin/views/consents-list.php", content: consentsView, lang: "php", note: "Vista del registro probatorio + exportación CSV" },
  { path: "languages/consentia-es_ES.po", content: esPo, lang: "po", note: "Traducción al español (compilar .mo con Loco)" },
];

export const PLUGIN_TREE = `consentia/
├── consentia.php
├── readme.txt
├── uninstall.php
├── includes/
│   ├── class-consentia-settings.php
│   ├── class-consentia-frontend.php
│   ├── class-consentia-logger.php
│   └── class-consentia-geo.php
├── assets/
│   ├── css/
│   │   ├── consentia.css
│   │   └── consentia-admin.css
│   └── js/
│       ├── consentia.js
│       ├── consentia-tcf.js
│       └── consentia-admin.js
├── templates/
│   └── cookie-policy.php
├── admin/views/
│   └── consents-list.php
└── languages/
    └── consentia-es_ES.po`;
