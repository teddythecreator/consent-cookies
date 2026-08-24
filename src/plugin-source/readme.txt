=== Consentia – Cookie Consent & GDPR ===
Contributors: consentia, thecreatorbusiness
Donate link: https://consentia.dev/
Tags: gdpr, cookies, cookie consent, cookie law, rgpd, ccpa, privacy, banner, consent mode, tcf
Requires at least: 6.0
Tested up to: 6.7
Requires PHP: 7.4
Stable tag: 1.1.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Self-hosted cookie consent platform: banner with real script blocking, cookie scanner, consent log with CSV export, Google Consent Mode v2, IAB TCF v2.2, CCPA/CPRA and geolocation. No SaaS, no visit limits.

== Description ==

Consentia is a **self-hosted** consent management platform for WordPress. Everything runs on your server: no third-party scripts, no accounts, no per-visit billing, and visitor decisions never leave your database.

= What you get, free =

* **Real script blocking** — scripts marked with `type="text/plain" data-consentia="analytics"` only execute after consent, and activate instantly (no reload).
* **5 granular categories** — Necessary (locked), Functional, Analytics, Performance and Advertising. Switch any of them off in the admin.
* **Cookie scanner** — audits server cookies, browser cookies and known third-party scripts (GA4, Meta Pixel, Hotjar, Clarity, TikTok, DoubleClick, chats…). Re-classify and save the results for your cookie policy.
* **Consent log** — every decision stored with UUID, timestamp, categories, source (banner, GPC, sync) and country, in its own table. CSV export, automatic retention and purge tool. Your proof of compliance.
* **Google Consent Mode v2** — sends `ad_storage`, `analytics_storage`, `ad_user_data`, `ad_personalization`, `functionality_storage` and `security_storage` signals. Basic and advanced modes.
* **IAB TCF v2.2** — registers `__tcfapi` and generates a valid TC string from the visitor's choices (purpose-level).
* **CCPA / CPRA** — "Do Not Sell or Share My Personal Information" link and opt-out mode for US visitors.
* **Global Privacy Control** — if the browser sends GPC, Consentia registers an opt-out without showing the banner.
* **Geolocation** — show the banner only to EU/EEA/UK visitors (Cloudflare header, MaxMind GeoIP2 or the geoip extension; unknown country = EU rules).
* **Cross-domain consent sync** — one decision propagates to your sibling domains via postMessage.
* **Consent statistics** — 30-day stacked chart of accepted / rejected / custom decisions, right in the admin.
* **Revisit button** — a floating button lets visitors reopen their preferences from any page, as regulators require.
* **Renewal rules** — ask again after N months (default 6) or when the banner text changes.
* **GA4 integration** — paste your Measurement ID and gtag.js is injected only when analytics is accepted.
* **Customizable** — card, full-width bar or floating pill; 4 positions; colors, radius, texts, delay, custom CSS. Live preview in the admin.
* **Tiny** — ~12 KB min+gzip, zero jQuery, deferred, respects `prefers-reduced-motion`.
* **Accessible** — `role="dialog"`, focus management, keyboard support (Tab, Esc), screen-reader friendly.
* **Multisite + i18n** — works on networks; Spanish translation included. Text domain: `consentia`.
* **Shortcodes & JS API** — `[consentia_manage]`, `[consentia_status]`, `Consentia.open()`, `Consentia.status()`, events `consentia:granted` / `consentia:updated`.

= Pro (coming soon) =

Cloud weekly scans, full Global Vendor List (GVL) integration with per-vendor consent, white-label, unlimited sync domains and priority support.

== Installation ==

1. Upload the `consentia` folder to `/wp-content/plugins/`, or install it from *Plugins → Add New*.
2. Activate the plugin through the *Plugins* screen.
3. Go to *Settings → Consentia*, customize the banner and run the **Scanner** tab to audit your cookies.

= Blocking a script =

Change the script `type` to `text/plain` and add the category:

`<script type="text/plain" data-consentia="analytics" src="https://example.com/stats.js"></script>`

Valid categories: `necessary`, `functional`, `analytics`, `performance`, `advertising`. You can list several: `data-consentia="analytics performance"`.

== Frequently Asked Questions ==

= Is Consentia free? =
Yes. Consentia is free forever under GPLv2, with no visit limits. Consentia Pro (cloud scans, full GVL, white-label) is optional.

= Do I need an account or an API key? =
No. That's the point: Consentia is self-hosted. Decisions are stored in your own database table `wp_consentia_log` and never sent to third parties.

= Does it really block Google Analytics / Meta Pixel? =
Yes. Wrap snippets with `data-consentia="analytics"` (or the matching category) and they won't run until consent. For GA4 you can simply paste your Measurement ID in the settings.

= Does it support Google Consent Mode v2? =
Yes. Enable it in Settings → Consentia → Cumplimiento. Default signals are sent before consent and updated after, in basic or advanced mode.

= What about IAB TCF? =
Consentia registers the standard `__tcfapi` and produces a valid TC string (purpose-level, policy v2.2). For vendor-level consent you'll want Consentia Pro.

= How long is consent remembered? =
Six months by default (1–24 configurable). You can also force re-consent whenever the banner text changes.

= How does geolocation work? =
It reads the Cloudflare `CF-IPCountry` header, a MaxMind `.mmdb` database (geoip2/geoip2 via Composer) or the PHP geoip extension — your choice. Unknown visitors get EU rules, the safe default.

= Does it work with caching plugins? =
Yes. Settings travel via `wp_localize_script`, so the banner works with page caching. Exclude the `consentia` handle from JS combination only if your optimizer rewrites inline JSON.

== Screenshots ==

1. The consent card with the 5-category preferences panel.
2. Cookie scanner: every cookie and third-party script classified.
3. Consent log with 30-day chart and CSV export.
4. Compliance tab: Consent Mode v2, TCF v2.2, CCPA and GPC.
5. Settings page with live preview.

== Changelog ==

= 1.1.0 =
* New: cookie scanner (server + browser cookies, known tracker scripts).
* New: consent log with dedicated table, CSV export, retention and purge.
* New: Google Consent Mode v2 (basic and advanced).
* New: IAB TCF v2.2 with `__tcfapi` and TC string generation.
* New: CCPA/CPRA "Do Not Sell or Share" mode for US visitors.
* New: Global Privacy Control support.
* New: geolocation (Cloudflare, MaxMind, geoip) with EU/EEA/UK rules.
* New: cross-domain consent sync via postMessage.
* New: 5 categories (added Functional and Performance).
* New: floating pill banner type, animations and custom CSS.
* New: revisit floating button and consent statistics chart.

= 1.0.0 =
* Initial public release.

== Upgrade Notice ==

= 1.1.0 =
Major update: scanner, consent log, Consent Mode v2, TCF v2.2, CCPA and geolocation. Existing banner settings are preserved.
