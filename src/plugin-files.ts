import consentiaPhp from "./plugin-source/consentia.php?raw";
import uninstallPhp from "./plugin-source/uninstall.php?raw";
import readmeTxt from "./plugin-source/readme.txt?raw";
import settingsPhp from "./plugin-source/includes/class-consentia-settings.php?raw";
import frontendPhp from "./plugin-source/includes/class-consentia-frontend.php?raw";
import loggerPhp from "./plugin-source/includes/class-consentia-logger.php?raw";
import scannerPhp from "./plugin-source/includes/class-consentia-scanner.php?raw";
import geoPhp from "./plugin-source/includes/class-consentia-geo.php?raw";
import bannerJs from "./plugin-source/assets/js/consentia.js?raw";
import tcfJs from "./plugin-source/assets/js/consentia-tcf.js?raw";
import adminJs from "./plugin-source/assets/js/consentia-admin.js?raw";
import bannerCss from "./plugin-source/assets/css/consentia.css?raw";
import adminCss from "./plugin-source/assets/css/consentia-admin.css?raw";
import esPo from "./plugin-source/languages/consentia-es_ES.po?raw";

export interface PluginFile {
  /** Path inside the plugin folder */
  path: string;
  content: string;
  lang: "php" | "js" | "css" | "txt" | "po";
  note: string;
}

export const PLUGIN_VERSION = "1.1.0";
export const PLUGIN_SLUG = "consentia";

export const PLUGIN_FILES: PluginFile[] = [
  { path: "consentia.php", content: consentiaPhp, lang: "php", note: "Principal: cabeceras, activación y módulos" },
  { path: "readme.txt", content: readmeTxt, lang: "txt", note: "Ficha oficial para wordpress.org" },
  { path: "uninstall.php", content: uninstallPhp, lang: "php", note: "Limpieza total al desinstalar" },
  { path: "includes/class-consentia-settings.php", content: settingsPhp, lang: "php", note: "Settings API por pestañas + vista previa" },
  { path: "includes/class-consentia-frontend.php", content: frontendPhp, lang: "php", note: "Encolado, geo y shortcodes" },
  { path: "includes/class-consentia-logger.php", content: loggerPhp, lang: "php", note: "Registro de consentimiento + CSV + stats" },
  { path: "includes/class-consentia-scanner.php", content: scannerPhp, lang: "php", note: "Escáner de cookies y trackers" },
  { path: "includes/class-consentia-geo.php", content: geoPhp, lang: "php", note: "Geolocalización UE/EEA/UK/US" },
  { path: "assets/js/consentia.js", content: bannerJs, lang: "js", note: "Banner, bloqueo, Consent Mode, GPC, sync" },
  { path: "assets/js/consentia-tcf.js", content: tcfJs, lang: "js", note: "IAB TCF v2.2: __tcfapi + TC string" },
  { path: "assets/js/consentia-admin.js", content: adminJs, lang: "js", note: "Pestañas, gráfica de stats y escáner" },
  { path: "assets/css/consentia.css", content: bannerCss, lang: "css", note: "Banner: card, bar, píldora, CCPA, revisit" },
  { path: "assets/css/consentia-admin.css", content: adminCss, lang: "css", note: "Admin: pestañas, chips, gráfica, tablas" },
  { path: "languages/consentia-es_ES.po", content: esPo, lang: "po", note: "Traducción al español (compilar .mo con Loco)" },
];

export const PLUGIN_TREE = `consentia/
├── consentia.php
├── readme.txt
├── uninstall.php
├── includes/
│   ├── class-consentia-settings.php
│   ├── class-consentia-frontend.php
│   ├── class-consentia-logger.php      ← registro + CSV + stats
│   ├── class-consentia-scanner.php     ← escáner de cookies
│   └── class-consentia-geo.php         ← geolocalización
├── assets/
│   ├── css/
│   │   ├── consentia.css
│   │   └── consentia-admin.css
│   └── js/
│       ├── consentia.js
│       ├── consentia-tcf.js            ← IAB TCF v2.2
│       └── consentia-admin.js
└── languages/
    └── consentia-es_ES.po`;
