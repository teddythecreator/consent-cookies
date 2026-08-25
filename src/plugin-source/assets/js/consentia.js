/**
 * Consentia — consent engine (v1.2, strict RGPD / LSSI-CE / ePrivacy).
 *
 * Legal guarantees implemented here:
 *  – Consent is ONLY given by an explicit click. Scrolling, mouse moves
 *    or navigation NEVER count (GDPR recital 32).
 *  – Non-essential checkboxes start unchecked; "necessary" is locked.
 *  – Prior blocking: scripts marked type="text/consentia" are activated
 *    only after a decision (ePrivacy art. 5.3).
 *  – Technical cookies expire at 365 days maximum.
 *  – Every decision is sent to WordPress (proof of consent, art. 7.1).
 *  – Withdrawal is one click + automatic reload (art. 7.3).
 *  – WCAG 2.1 AA: focus trap, Escape to close, aria-live announcements.
 *
 * @package Consentia
 */
(function () {
	'use strict';

	var data = window.consentiaData || {};
	var settings = data.settings || {};
	var strings = data.strings || {};
	var ajax = data.ajax || {};

	/** Technical cookies written by the plugin (365 days max). */
	var COOKIE_CONSENT = 'consentia_consent'; // 'granted' | 'rejected'
	var COOKIE_DATE = 'consentia_consent_date'; // timestamp ms
	var COOKIE_CATS = 'consentia_categories'; // JSON
	var MAX_DAYS = 365; // ePrivacy: no consent cookies beyond one year

	var banner = document.getElementById('consentia-banner');
	var panel = document.getElementById('consentia-panel');
	var overlay = document.getElementById('consentia-panel-overlay');
	var live = document.getElementById('consentia-live');
	var widget = null;
	var lastFocused = null;

	/* ================================================== cookies API == */

	/**
	 * Sets a cookie with day-based expiry (technical cookie helper).
	 * SameSite=Lax + Secure when HTTPS.
	 *
	 * @param {string} name  Cookie name.
	 * @param {string} value Cookie value.
	 * @param {number} days  Lifetime in days (capped at 365).
	 */
	function setCookie(name, value, days) {
		var capped = Math.min(Math.max(days, 1), MAX_DAYS);
		var expires = new Date(Date.now() + capped * 864e5).toUTCString();
		var secure = window.location.protocol === 'https:' ? '; Secure' : '';
		document.cookie =
			name + '=' + encodeURIComponent(value) + '; expires=' + expires + '; path=/; SameSite=Lax' + secure;
	}

	/**
	 * Reads a cookie value.
	 *
	 * @param {string} name Cookie name.
	 * @returns {string|null}
	 */
	function getCookie(name) {
		var match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
		return match ? decodeURIComponent(match[1]) : null;
	}

	/**
	 * Deletes a cookie by expiring it in the past.
	 *
	 * @param {string} name Cookie name.
	 */
	function deleteCookie(name) {
		document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax';
	}

	/* ================================================ screen reader == */

	/**
	 * Announces a message to assistive technology (WCAG 4.1.3).
	 *
	 * @param {string} message Text to announce.
	 */
	function announceToScreenReader(message) {
		if (!live) return;
		live.textContent = '';
		window.setTimeout(function () {
			live.textContent = message;
		}, 60);
	}

	/* ================================================== backend log == */

	/**
	 * Sends the decision to WordPress so it is stored as legal proof
	 * (table wp_consentia_consents). Uses fetch with sendBeacon fallback.
	 *
	 * @param {Object} categories Category map, e.g. {necessary:true,…}.
	 * @param {string} type       granted|rejected|updated|revoked|gpc|reset.
	 */
	function saveToBackend(categories, type) {
		if (!ajax.url) return;

		var body = new URLSearchParams();
		body.append('action', 'consentia_save_consent');
		body.append('nonce', ajax.nonce || '');
		body.append('categories', JSON.stringify(categories));
		body.append('consent_type', type);
		body.append('url', window.location.href);

		if (window.fetch) {
			window
				.fetch(ajax.url, { method: 'POST', body: body, keepalive: true })
				.catch(function () {
					if (navigator.sendBeacon) {
						navigator.sendBeacon(ajax.url, body);
					}
				});
		} else if (navigator.sendBeacon) {
			navigator.sendBeacon(ajax.url, body);
		}
	}

	/* ============================================ script activation == */

	/**
	 * Activates blocked scripts whose category was accepted.
	 *
	 * Mark-up contract (prior blocking, ePrivacy art. 5.3):
	 *   <script type="text/consentia" data-consentia-category="statistics" src="…">
	 * Legacy contract also supported:
	 *   <script type="text/plain" data-consentia="statistics" src="…">
	 *
	 * Scripts are cloned as real <script> elements in place; inline code
	 * runs exactly once. No page reload needed.
	 *
	 * @param {Object} categories Accepted category map.
	 */
	function enableScriptsByCategory(categories) {
		var selectors = ['script[type="text/consentia"]', 'script[type="text/plain"][data-consentia]'];
		var blocked = document.querySelectorAll(selectors.join(','));

		Array.prototype.forEach.call(blocked, function (el) {
			var category = el.getAttribute('data-consentia-category') || el.getAttribute('data-consentia') || 'necessary';

			if (!categories[category]) {
				return; // Not accepted: stays blocked.
			}

			var real = document.createElement('script');
			Array.prototype.forEach.call(el.attributes, function (attr) {
				if (attr.name === 'type' || attr.name.indexOf('data-consentia') === 0) return;
				real.setAttribute(attr.name, attr.value);
			});
			real.type = 'text/javascript';
			if (el.src) real.src = el.src;
			real.textContent = el.textContent;

			el.parentNode.replaceChild(real, el);
		});

		// GA4: only injected when "statistics" was explicitly accepted.
		if (categories.statistics && settings.ga_id) {
			injectGA4(settings.ga_id);
		}
	}

	/**
	 * Loads gtag.js and configures GA4 (statistics category only).
	 *
	 * @param {string} gaId Measurement ID, e.g. G-XXXXXXX.
	 */
	function injectGA4(gaId) {
		if (window.__consentiaGaLoaded) return;
		window.__consentiaGaLoaded = true;
		window.dataLayer = window.dataLayer || [];
		window.gtag = function () {
			window.dataLayer.push(arguments);
		};
		window.gtag('js', new Date());
		window.gtag('config', gaId, { anonymize_ip: true });

		var s = document.createElement('script');
		s.async = true;
		s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(gaId);
		document.head.appendChild(s);
	}

	/* ================================================== decisions == */

	/**
	 * Reads the current panel checkboxes into a category map.
	 * Necessary is always true; everything else exactly what the user
	 * ticked (unchecked by default, as GDPR demands).
	 *
	 * @returns {Object}
	 */
	function readPanelCategories() {
		var out = { necessary: true, preferences: false, statistics: false, marketing: false };
		var inputs = document.querySelectorAll('.consentia-cat__input');
		Array.prototype.forEach.call(inputs, function (input) {
			var key = input.getAttribute('data-category');
			if (key && out.hasOwnProperty(key)) {
				out[key] = !!input.checked;
			}
		});
		return out;
	}

	/**
	 * Stores the full consent state in technical cookies.
	 *
	 * @param {string} decision   'granted' | 'rejected'.
	 * @param {Object} categories Accepted category map.
	 */
	function writeConsentCookies(decision, categories) {
		setCookie(COOKIE_CONSENT, decision, MAX_DAYS);
		setCookie(COOKIE_DATE, String(Date.now()), MAX_DAYS);
		setCookie(COOKIE_CATS, JSON.stringify(categories), MAX_DAYS);
	}

	/**
	 * Accepts the given categories after an EXPLICIT click only.
	 * Writes cookies (≤365 days), logs to the database, enables the
	 * accepted scripts, hides the banner and shows the widget.
	 *
	 * @param {Object} categories Category map.
	 * @param {string} [type]     granted | updated.
	 */
	function grantConsent(categories, type) {
		writeConsentCookies('granted', categories);
		saveToBackend(categories, type || 'granted');
		enableScriptsByCategory(categories);
		hideBanner();
		closePanel();
		renderWidget();
		announceToScreenReader(strings.accepted || 'Has aceptado todas las cookies');
		document.dispatchEvent(new CustomEvent('consentia:granted', { detail: categories }));
	}

	/**
	 * Rejects all non-essential cookies after an EXPLICIT click.
	 * No non-essential script is executed. Cookies are still written so
	 * the banner does not reappear, and the decision is logged.
	 */
	function rejectConsent() {
		var categories = { necessary: true, preferences: false, statistics: false, marketing: false };
		writeConsentCookies('rejected', categories);
		saveToBackend(categories, 'rejected');
		hideBanner();
		closePanel();
		renderWidget(); // Revocation must stay one click away (GDPR art. 7.3).
		announceToScreenReader(strings.rejected || 'Has rechazado las cookies no esenciales');
		document.dispatchEvent(new CustomEvent('consentia:granted', { detail: categories }));
	}

	/**
	 * Withdraws consent completely (GDPR art. 7.3): removes every
	 * consent cookie, logs the withdrawal and reloads the page so all
	 * non-essential scripts stop immediately.
	 */
	function revokeConsent() {
		deleteCookie(COOKIE_CONSENT);
		deleteCookie(COOKIE_DATE);
		deleteCookie(COOKIE_CATS);
		saveToBackend({ necessary: true }, 'revoked');
		announceToScreenReader(strings.revoked || 'Consentimiento retirado. Recargando…');
		window.setTimeout(function () {
			window.location.reload();
		}, 350);
	}

	/* ==================================================== UI show == */

	function hideBanner() {
		if (!banner) return;
		banner.classList.add('consentia-banner--hidden');
		banner.classList.remove('consentia-banner--visible');
		banner.setAttribute('aria-hidden', 'true');
	}

	/**
	 * Builds the "accept everything" map from the categories the site
	 * actually has enabled (Settings → Categories), so accepting never
	 * grants a category the owner turned off.
	 *
	 * @returns {Object}
	 */
	function allEnabledCategories() {
		var out = { necessary: true };
		var cats = data.categories || {};
		Object.keys(cats).forEach(function (key) {
			if (key !== 'necessary') out[key] = true;
		});
		return out;
	}

	function showBanner() {
		if (!banner) return;
		banner.removeAttribute('aria-hidden');
		var delay = parseInt(settings.show_delay_ms || 0, 10);
		window.setTimeout(function () {
			banner.classList.remove('consentia-banner--hidden');
			banner.classList.add('consentia-banner--visible');
			var first = banner.querySelector('button');
			if (first && !panelIsOpen()) first.focus({ preventScroll: true });
		}, isNaN(delay) ? 0 : delay);
	}

	/**
	 * Floating widget (bottom-right) to reopen preferences or withdraw
	 * consent at any time. Shown once a decision exists.
	 */
	function renderWidget() {
		if (widget) return;
		widget = document.createElement('button');
		widget.type = 'button';
		widget.id = 'consentia-widget';
		widget.className = 'consentia-widget';
		widget.setAttribute('aria-haspopup', 'dialog');
		widget.innerHTML =
			'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
			'<circle cx="12" cy="12" r="9"/><circle cx="9" cy="10" r="1.1" fill="currentColor"/>' +
			'<circle cx="14.5" cy="13" r="1.1" fill="currentColor"/><circle cx="10.5" cy="15" r="1" fill="currentColor"/>' +
			'<path d="M12 3a9 9 0 019 9h-6a3 3 0 01-3-3V3z" fill="currentColor" opacity=".35"/></svg>' +
			'<span></span>';
		widget.querySelector('span').textContent = strings.widget || 'Configuración de Cookies';
		widget.addEventListener('click', openSettings);
		document.body.appendChild(widget);
	}

	/* ============================================ second layer panel == */

	function panelIsOpen() {
		return panel && !panel.hidden;
	}

	/** Opens the settings panel with focus management (WCAG 2.4.3). */
	function openSettings() {
		if (!panel) return;
		lastFocused = document.activeElement;

		// Sync checkboxes with the stored decision (if any).
		var stored = getStoredCategories();
		var inputs = panel.querySelectorAll('.consentia-cat__input');
		Array.prototype.forEach.call(inputs, function (input) {
			if (input.disabled) return; // necessary stays checked
			var key = input.getAttribute('data-category');
			input.checked = !!(stored && stored[key]);
		});

		if (overlay) overlay.hidden = false;
		panel.hidden = false;
		panel.classList.add('consentia-panel--visible');
		document.addEventListener('keydown', onPanelKeydown);

		var first = panel.querySelector('input, button');
		if (first) first.focus({ preventScroll: true });
	}

	function closePanel() {
		if (!panel) return;
		panel.hidden = true;
		panel.classList.remove('consentia-panel--visible');
		if (overlay) overlay.hidden = true;
		document.removeEventListener('keydown', onPanelKeydown);
		if (lastFocused && lastFocused.focus) lastFocused.focus({ preventScroll: true });
	}

	/**
	 * Keyboard support inside the panel: Escape closes it and Tab is
	 * trapped cycling through focusable elements (WCAG 2.1.2).
	 *
	 * @param {KeyboardEvent} e
	 */
	function onPanelKeydown(e) {
		if (e.key === 'Escape') {
			e.preventDefault();
			closePanel();
			return;
		}
		if (e.key !== 'Tab' || !panel) return;

		var focusables = panel.querySelectorAll('button, [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])');
		if (!focusables.length) return;

		var first = focusables[0];
		var last = focusables[focusables.length - 1];

		if (e.shiftKey && document.activeElement === first) {
			e.preventDefault();
			last.focus();
		} else if (!e.shiftKey && document.activeElement === last) {
			e.preventDefault();
			first.focus();
		}
	}

	/* ============================================== stored consent == */

	/**
	 * @returns {Object|null} Category map from the technical cookie.
	 */
	function getStoredCategories() {
		try {
			return JSON.parse(getCookie(COOKIE_CATS) || 'null');
		} catch (e) {
			return null;
		}
	}

	/**
	 * Expiry check (ePrivacy + CNIL/AEPD guidance): if more than 365
	 * days passed since the decision, consent is reset and the banner
	 * is shown again.
	 */
	function checkConsentExpiry() {
		var stamp = parseInt(getCookie(COOKIE_DATE) || '0', 10);
		if (!stamp) return;
		if (Date.now() - stamp > MAX_DAYS * 864e5) {
			resetConsent();
		}
	}

	/**
	 * Clears consent and notifies the backend so the withdrawal is part
	 * of the proof log; the banner will be re-shown.
	 */
	function resetConsent() {
		deleteCookie(COOKIE_CONSENT);
		deleteCookie(COOKIE_DATE);
		deleteCookie(COOKIE_CATS);
		saveToBackend({ necessary: true }, 'reset');
		showBanner();
		announceToScreenReader(strings.expired || 'Tu consentimiento ha caducado, vuelve a elegir');
	}

	/* ===================================================== booting == */

	function bindEvents() {
		var accept = document.getElementById('consentia-accept');
		var reject = document.getElementById('consentia-reject');
		var prefs = document.getElementById('consentia-prefs');
		var save = document.getElementById('consentia-panel-save');
		var cancel = document.getElementById('consentia-panel-cancel');
		var revoke = document.getElementById('consentia-revoke');

		// Explicit consent ONLY: these three handlers are the sole entry
		// points. No scroll, mousemove or navigation listeners exist.
		if (accept) accept.addEventListener('click', function () {
			grantConsent(allEnabledCategories(), 'granted');
		});
		if (reject) reject.addEventListener('click', rejectConsent);
		if (prefs) prefs.addEventListener('click', openSettings);

		if (save) save.addEventListener('click', function () {
			grantConsent(readPanelCategories(), 'updated');
			announceToScreenReader(strings.saved || 'Preferencias guardadas');
		});
		if (cancel) cancel.addEventListener('click', closePanel);
		if (revoke) revoke.addEventListener('click', revokeConsent);
		if (overlay) overlay.addEventListener('click', closePanel);

		// Shortcode / theme reopeners.
		document.addEventListener('click', function (e) {
			var target = e.target.closest ? e.target.closest('[data-consentia-open]') : null;
			if (target) openSettings();
		});
	}

	function init() {
		if (!banner) return;

		bindEvents();

		var decision = getCookie(COOKIE_CONSENT);

		if (!decision) {
			// Global Privacy Control: honour the browser's global opt-out
			// signal without showing the banner (CCPA §1798.120 / GDPR).
			if (data.gpc && navigator.globalPrivacyControl) {
				rejectConsent();
				return;
			}
			showBanner();
			return;
		}

		// A decision already exists: the banner must disappear completely
		// (display:none), not just fade — an invisible alertdialog would
		// still trap clicks and be announced by screen readers.
		if (getCookie(COOKIE_CONSENT)) {
			hideBanner();
		}

		checkConsentExpiry();

		var categories = getStoredCategories() || { necessary: true };
		categories.necessary = true;

		// Re-enable what was previously accepted (page reloads included).
		enableScriptsByCategory(categories);
		renderWidget();

		// Fill [consentia_status] placeholders.
		var status = document.querySelectorAll('[data-consentia-status]');
		var text = decision === 'granted'
			? (strings.accepted || 'Cookies aceptadas')
			: (strings.rejected || 'Cookies no esenciales rechazadas');
		Array.prototype.forEach.call(status, function (el) {
			el.textContent = text;
		});
	}

	// Public API for themes/plugins.
	window.Consentia = {
		open: openSettings,
		status: function () {
			return getStoredCategories() || { necessary: true, preferences: false, statistics: false, marketing: false, decided: false };
		},
		revoke: revokeConsent
	};

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();
