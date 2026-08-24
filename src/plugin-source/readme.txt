=== Consentia – Cookie Consent & GDPR ===
Contributors: consentia
Tags: gdpr, cookies, cookie consent, cookie law, rgpd, ccpa, privacy, banner
Requires at least: 6.0
Tested up to: 6.7
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Lightweight cookie consent banner for GDPR & ePrivacy. Blocks non-essential scripts until the visitor decides. No jQuery, 12 KB, multisite ready.

== Description ==

Consentia adds a fast, accessible cookie consent banner to your WordPress site and gives visitors real control over their privacy.

Unlike banners that only *look* compliant, Consentia actually **blocks scripts by category** (analytics, marketing) until consent is given, and re-enables them the moment the visitor accepts — no reload needed.

= Highlights =

* **Real script blocking** — mark scripts with `type="text/plain" data-consentia="analytics"` and they only run after consent.
* **Three consent categories** — Necessary (locked), Analytics and Marketing, with a granular preferences panel.
* **Google Analytics 4 integration** — enter your Measurement ID and Consentia injects gtag.js only when analytics is accepted.
* **Fully customizable** — card or full-width bar, 4 positions, colors, corner radius, texts and show-delay. Live preview in the admin.
* **Tiny footprint** — ~12 KB min+gzip, zero jQuery, deferred loading, respects `prefers-reduced-motion`.
* **Accessible** — proper `role="dialog"`, focus management, keyboard support (Tab, Esc), screen-reader friendly.
* **Developer API** — `window.Consentia.open()`, `Consentia.status()`, events `consentia:granted` and `consentia:updated`.
* **Shortcodes** — `[consentia_manage]` reopens the preferences, `[consentia_status]` shows current consent.
* **Multisite compatible** and translation ready (WPML, Polylang, Loco Translate). Text domain: `consentia`.

Consent stores a first-party `consentia` cookie plus a localStorage fallback, and visitors are asked again after a configurable renewal period (default: 6 months), as recommended by EU regulators.

= Pro (coming soon) =

Consent log with CSV export (proof of compliance), EU/UK geolocation, TCF 2.2 support, automatic blocking of known third-party scripts and multi-brand themes.

== Installation ==

1. Upload the `consentia` folder to `/wp-content/plugins/`, or install it from *Plugins → Add New* in your dashboard.
2. Activate the plugin through the *Plugins* screen.
3. Go to *Settings → Consentia* and customize the banner. A live preview updates as you type.

= Blocking a script =

Change the script `type` to `text/plain` and add the category:

`<script type="text/plain" data-consentia="analytics" src="https://example.com/stats.js"></script>`

Valid categories: `necessary`, `analytics`, `marketing`.

== Frequently Asked Questions ==

= Is Consentia free? =
Yes. Consentia is free forever under GPLv2. A Pro edition with advanced compliance tools is in development.

= Does it really block Google Analytics / Meta Pixel? =
Yes, when the snippet is wrapped with `data-consentia="analytics"` (or `marketing`). For GA4 you can simply paste your Measurement ID in the settings page.

= Does it work with caching plugins? =
Yes. All settings are passed through `wp_localize_script`, so the banner works with page caching. Exclude `consentia` from JS optimization only if your optimizer rewrites inline JSON.

= How long is consent remembered? =
Six months by default. You can change the renewal period (1–24 months) in Settings → Consentia.

= Is consentia.com set as a domain? =
No. Consentia only writes a first-party cookie on your own domain. Nothing is sent to external servers.

== Screenshots ==

1. The consent card, bottom-left, dark theme.
2. Full-width bar variant with custom accent color.
3. Granular preferences panel with per-category switches.
4. Settings page with live preview.

== Changelog ==

= 1.0.0 =
* Initial public release.
* Card and bar banner types, 4 positions, full color control.
* Category-based script blocking and GA4 auto-injection.
* Preferences panel, consent renewal period, shortcodes and JS API.

== Upgrade Notice ==

= 1.0.0 =
First stable release. Please review your privacy policy URL in Settings → Consentia.
