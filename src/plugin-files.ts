import consentiaPhp from "./plugin-source/consentia.php?raw";
import uninstallPhp from "./plugin-source/uninstall.php?raw";
import readmeTxt from "./plugin-source/readme.txt?raw";
import settingsPhp from "./plugin-source/includes/class-consentia-settings.php?raw";
import frontendPhp from "./plugin-source/includes/class-consentia-frontend.php?raw";
import bannerJs from "./plugin-source/assets/js/consentia.js?raw";
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

export const PLUGIN_VERSION = "1.0.0";
export const PLUGIN_SLUG = "consentia";

export const PLUGIN_FILES: PluginFile[] = [
  { path: "consentia.php", content: consentiaPhp, lang: "php", note: "Archivo principal: cabeceras, activación y arranque" },
  { path: "readme.txt", content: readmeTxt, lang: "txt", note: "Ficha oficial para wordpress.org" },
  { path: "uninstall.php", content: uninstallPhp, lang: "php", note: "Limpieza total de opciones al desinstalar" },
  { path: "includes/class-consentia-settings.php", content: settingsPhp, lang: "php", note: "Settings API, sanitización y vista previa admin" },
  { path: "includes/class-consentia-frontend.php", content: frontendPhp, lang: "php", note: "Encolado de assets y shortcodes" },
  { path: "assets/js/consentia.js", content: bannerJs, lang: "js", note: "Banner, bloqueo de scripts y API pública" },
  { path: "assets/js/consentia-admin.js", content: adminJs, lang: "js", note: "Vista previa en vivo del admin" },
  { path: "assets/css/consentia.css", content: bannerCss, lang: "css", note: "Estilos del banner con variables CSS" },
  { path: "assets/css/consentia-admin.css", content: adminCss, lang: "css", note: "Estilos de la página de ajustes" },
  { path: "languages/consentia-es_ES.po", content: esPo, lang: "po", note: "Traducción al español (compilar .mo con Loco)" },
];

export const PLUGIN_TREE = `consentia/
├── consentia.php
├── readme.txt
├── uninstall.php
├── includes/
│   ├── class-consentia-settings.php
│   └── class-consentia-frontend.php
├── assets/
│   ├── css/
│   │   ├── consentia.css
│   │   └── consentia-admin.css
│   └── js/
│       ├── consentia.js
│       └── consentia-admin.js
└── languages/
    └── consentia-es_ES.po`;
