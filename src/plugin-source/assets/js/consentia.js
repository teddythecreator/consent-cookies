/**
 * Consentia — banner, granular consent, real script blocking,
 * Google Consent Mode v2, GPC support, consent log, cross-domain
 * sync and public JS API.
 *
 * Zero dependencies. ~12 KB minified.
 *
 * @package Consentia
 */
(function () {
	'use strict';

	if (window.Consentia) {
		return; // One instance per page.
	}

	var data = window.consentiaData || {};
	var settings = data.settings || {};
	var categories = data.categories || {};
	var consentVersion = String(data.consent_version || '');

	var COOKIE = 'consentia';
	var ALL = ['necessary', 'functional', 'analytics', 'performance', 'advertising'];
	var root = document.getElementById('consentia-root');
	var decided = false;
	var state = buildConsent({});

	if (!root) {
		return;
	}

	/* ---------------------------------------------------- consent ---- */

	function buildConsent(partial) {
		var c = { necessary: true, functional: false, analytics: false, performance: false, advertising: false };
		for (var k in partial) {
			if (Object.prototype.hasOwnProperty.call(c, k)) {
				c[k] = !!partial[k];
			}
		}
		c.necessary = true; // Can never be off.
		return c;
	}

	function allGranted() {
		return buildConsent({ functional: true, analytics: true, performance: true, advertising: true });
	}

	/* ---------------------------------------------------- storage ---- */

	function renewMs() {
		var months = parseInt(settings.renew_months || 6, 10);
		return Math.max(1, months) * 30 * 24 * 3600 * 1000;
	}

	function readStored() {
		try {
			var raw = null;
			var m = document.cookie.match(new RegExp('(?:^|; )' + COOKIE + '=([^;]*)'));
			if (m) {
				raw = decodeURIComponent(m[1]);
			} else {
				raw = localStorage.getItem(COOKIE);
			}
			if (!raw) {
				return null;
			}
			var stored = JSON.parse(raw);
			if (!stored || typeof stored !== 'object' || !stored.c) {
				return null;
			}
			if (settings.renew_on_update && stored.v !== consentVersion) {
				return null; // Banner text changed: ask again.
			}
			if (stored.t && Date.now() - stored.t > renewMs()) {
				return null; // Renewal period expired.
			}
			return buildConsent(stored.c);
		} catch (e) {
			return null;
		}
	}

	function writeStored(consent) {
		var payload = JSON.stringify({ v: consentVersion, t: Date.now(), c: consent });
		var maxAge = Math.round(renewMs() / 1000);
		document.cookie = COOKIE + '=' + encodeURIComponent(payload) + '; path=/; max-age=' + maxAge + '; SameSite=Lax';
		try {
			localStorage.setItem(COOKIE, payload);
		} catch (e) {
			/* private mode: cookie only */
		}
	}

	function visitorId() {
		var vid;
		try {
			vid = localStorage.getItem('consentia_vid');
			if (!vid) {
				vid = Math.random().toString(36).slice(2) + Date.now().toString(36);
				localStorage.setItem('consentia_vid', vid);
			}
		} catch (e) {
			vid = 'anon-' + Date.now().toString(36);
		}
		return vid;
	}

	/* --------------------------------------------- script blocking ---- */

	function activateScripts(consent) {
		var nodes = document.querySelectorAll('script[data-consentia]');
		Array.prototype.forEach.call(nodes, function (el) {
			if (el.getAttribute('data-consentia-run')) {
				return;
			}
			var required = (el.getAttribute('data-consentia') || '').split(/[\s,]+/).filter(Boolean);
			if (!required.length) {
				required = ['necessary'];
			}
			var ok = required.every(function (cat) {
				return !!consent[cat];
			});
			if (!ok) {
				return;
			}
			el.setAttribute('data-consentia-run', '1');
			var clone = document.createElement('script');
			for (var i = 0; i < el.attributes.length; i++) {
				var attr = el.attributes[i];
				if (attr.name !== 'type') {
					clone.setAttribute(attr.name, attr.value);
				}
			}
			clone.textContent = el.textContent;
			if (el.src) {
				clone.src = el.src;
				clone.async = true;
			}
			el.parentNode.replaceChild(clone, el);
		});
	}

	/* ------------------------------------------ Google Consent Mode ---- */

	function consentSignals(consent) {
		return {
			ad_storage: consent.advertising ? 'granted' : 'denied',
			ad_user_data: consent.advertising ? 'granted' : 'denied',
			ad_personalization: consent.advertising ? 'granted' : 'denied',
			analytics_storage: consent.analytics ? 'granted' : 'denied',
			functionality_storage: consent.functional ? 'granted' : 'denied',
			personalization_storage: consent.functional ? 'granted' : 'denied',
			security_storage: 'granted'
		};
	}

	function gtagReady() {
		window.dataLayer = window.dataLayer || [];
		window.gtag =
			window.gtag ||
			function () {
				window.dataLayer.push(arguments);
			};
		return window.gtag;
	}

	function consentModeDefault() {
		if (!settings.consent_mode) {
			return;
		}
		var gtag = gtagReady();
		var signals = consentSignals(buildConsent({}));
		signals.wait_for_update = 500;
		gtag('consent', 'default', signals);
	}

	function consentModeUpdate(consent) {
		if (!settings.consent_mode) {
			return;
		}
		gtagReady()('consent', 'update', consentSignals(consent));
	}

	/* ------------------------------------------------------- GA4 ---- */

	function injectGA(consent) {
		if (!settings.ga_id || !consent.analytics || root.getAttribute('data-ga-done')) {
			return;
		}
		root.setAttribute('data-ga-done', '1');
		var gtag = gtagReady();
		gtag('js', new Date());
		gtag('config', settings.ga_id);
		var s = document.createElement('script');
		s.async = true;
		s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(settings.ga_id);
		document.head.appendChild(s);
	}

	/* ------------------------------------------------------- log ---- */

	function sendLog(consent, source) {
		if (!data.log_url || !window.fetch) {
			return;
		}
		try {
			fetch(data.log_url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					consent: consent,
					source: source,
					visitor_id: visitorId(),
					consent_version: consentVersion
				})
			}).catch(function () {});
		} catch (e) {
			/* logging must never break the page */
		}
	}

	/* ------------------------------------------- cross-domain sync ---- */

	function broadcastSync(consent) {
		var domains = data.sync_domains || [];
		domains.forEach(function (origin) {
			try {
				var f = document.createElement('iframe');
				f.style.display = 'none';
				f.src = origin + '/?consentia-sync=1';
				f.onload = function () {
					try {
						f.contentWindow.postMessage({ type: 'consentia-consent', consent: consent, v: consentVersion }, '*');
					} catch (e) {}
				};
				document.body.appendChild(f);
				setTimeout(function () {
					if (f.parentNode) {
						f.parentNode.removeChild(f);
					}
				}, 5000);
			} catch (e) {}
		});
	}

	window.addEventListener('message', function (e) {
		var msg = e && e.data;
		if (msg && msg.type === 'consentia-consent' && msg.consent && !decided) {
			decide(buildConsent(msg.consent), 'sync');
		}
	});

	/* ---------------------------------------------------- events ---- */

	function emit(name, detail) {
		document.dispatchEvent(new CustomEvent(name, { detail: detail }));
	}

	/* ------------------------------------------------------ DOM ---- */

	function el(tag, className, text) {
		var node = document.createElement(tag);
		if (className) {
			node.className = className;
		}
		if (text) {
			node.textContent = text;
		}
		return node;
	}

	function button(className, label, onClick) {
		var b = el('button', 'consentia-btn ' + className, label);
		b.type = 'button';
		b.addEventListener('click', onClick);
		return b;
	}

	root.style.setProperty('--consentia-bg', settings.bg_color || '#111827');
	root.style.setProperty('--consentia-text', settings.text_color || '#f3f4f6');
	root.style.setProperty('--consentia-accent', settings.accent_color || '#2f6fed');
	root.style.setProperty('--consentia-radius', (settings.corner_radius || 0) + 'px');

	var banner = el('div', 'consentia-banner consentia-' + (settings.banner_type || 'card') + ' consentia-' + (settings.position || 'bottom-left') + ' consentia-anim-' + (settings.animation || 'slide'));
	banner.setAttribute('role', 'dialog');
	banner.setAttribute('aria-label', settings.title || 'Cookies');

	var inner = el('div', 'consentia-inner');

	if (data.ccpa_scope) {
		var p = el('p', 'consentia-message', settings.message);
		inner.appendChild(p);
		var actions = el('div', 'consentia-actions');
		actions.appendChild(
			button('consentia-btn-ccpa', settings.ccpa_do_not_sell || 'Do Not Sell or Share My Personal Information', function () {
				openPrefs(true);
			})
		);
		actions.appendChild(
			button('consentia-btn-accept', settings.accept_label || 'OK', function () {
				decide(allGranted(), 'accepted');
			})
		);
		inner.appendChild(actions);
	} else {
		inner.appendChild(el('p', 'consentia-title', settings.title));
		var msg = el('p', 'consentia-message');
		msg.appendChild(document.createTextNode(settings.message + ' '));
		if (settings.privacy_url) {
			var a = el('a', 'consentia-link', settings.prefs_label ? 'Política de privacidad' : '');
			a.href = settings.privacy_url;
			msg.appendChild(a);
			msg.appendChild(document.createTextNode(' '));
		}
		if (settings.cookies_url) {
			var ac = el('a', 'consentia-link', 'Política de cookies');
			ac.href = settings.cookies_url;
			msg.appendChild(ac);
		}
		inner.appendChild(msg);
		var acts = el('div', 'consentia-actions');
		acts.appendChild(
			button('consentia-btn-accept', settings.accept_label || 'Aceptar todas', function () {
				decide(allGranted(), 'accepted');
			})
		);
		acts.appendChild(
			button('consentia-btn-reject', settings.reject_label || 'Rechazar', function () {
				decide(buildConsent({}), 'rejected');
			})
		);
		acts.appendChild(
			button('consentia-btn-prefs', settings.prefs_label || 'Configurar', function () {
				openPrefs(false);
			})
		);
		inner.appendChild(acts);
	}

	banner.appendChild(inner);
	root.appendChild(banner);

	/* ---------------------------------------------- revisit button ---- */

	var revisit = el('button', 'consentia-revisit', '');
	revisit.type = 'button';
	revisit.setAttribute('aria-label', settings.prefs_label || 'Configurar cookies');
	revisit.innerHTML =
		'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
		'<circle cx="12" cy="12" r="9"/><circle cx="9" cy="10" r="1.1" fill="currentColor" stroke="none"/>' +
		'<circle cx="14.5" cy="9" r="1.1" fill="currentColor" stroke="none"/><circle cx="13.5" cy="14.5" r="1.1" fill="currentColor" stroke="none"/></svg>';
	revisit.addEventListener('click', function () {
		openPrefs(false);
	});
	revisit.hidden = true;
	root.appendChild(revisit);

	/* ----------------------------------------------- prefs panel ---- */

	var prefs = null;
	var lastFocus = null;
	var toggles = buildConsent(state);

	function openPrefs(optOutDefault) {
		if (prefs) {
			return;
		}
		lastFocus = document.activeElement;
		toggles = buildConsent(optOutDefault ? {} : state);

		prefs = el('div', 'consentia-prefs');
		prefs.setAttribute('role', 'dialog');
		prefs.setAttribute('aria-modal', 'true');

		var panel = el('div', 'consentia-prefs-panel');
		var head = el('div', 'consentia-prefs-head');
		head.appendChild(el('p', 'consentia-title', 'Preferencias de cookies'));
		var close = button('consentia-btn-prefs consentia-close', '✕', closePrefs);
		close.setAttribute('aria-label', 'Cerrar');
		head.appendChild(close);
		panel.appendChild(head);

		Object.keys(categories).forEach(function (key) {
			var cat = categories[key];
			var row = el('label', 'consentia-pref-row' + (cat.locked ? ' consentia-locked' : ''));

			var info = el('span', 'consentia-pref-info');
			info.appendChild(el('strong', '', cat.label));
			info.appendChild(el('small', '', cat.description));
			row.appendChild(info);

			var sw = el('span', 'consentia-switch');
			var input = document.createElement('input');
			input.type = 'checkbox';
			input.checked = cat.locked ? true : !!toggles[key];
			input.disabled = !!cat.locked;
			input.setAttribute('aria-label', cat.label);
			if (!cat.locked) {
				input.addEventListener('change', function () {
					toggles = buildConsent(toggles);
					toggles[key] = input.checked;
				});
			}
			sw.appendChild(input);
			sw.appendChild(el('span', 'consentia-switch-track'));
			row.appendChild(sw);

			panel.appendChild(row);
		});

		var save = button('consentia-btn-accept consentia-save', 'Guardar preferencias', function () {
			var custom =
				toggles.functional || toggles.analytics || toggles.performance || toggles.advertising
					? 'custom'
					: 'rejected';
			decide(buildConsent(toggles), custom);
		});
		panel.appendChild(save);

		prefs.appendChild(panel);
		prefs.addEventListener('click', function (e) {
			if (e.target === prefs) {
				closePrefs();
			}
		});
		root.appendChild(prefs);

		requestAnimationFrame(function () {
			prefs.classList.add('consentia-visible');
		});

		var first = panel.querySelector('input, button');
		if (first) {
			first.focus();
		}
	}

	function closePrefs() {
		if (!prefs) {
			return;
		}
		prefs.classList.remove('consentia-visible');
		var node = prefs;
		prefs = null;
		setTimeout(function () {
			if (node.parentNode) {
				node.parentNode.removeChild(node);
			}
		}, 250);
		if (lastFocus && lastFocus.focus) {
			lastFocus.focus();
		}
	}

	document.addEventListener('keydown', function (e) {
		if (e.key === 'Escape' && prefs) {
			closePrefs();
		}
	});

	// [consentia_manage] shortcode buttons.
	document.addEventListener('click', function (e) {
		var t = e.target;
		if (t && t.closest && t.closest('[data-consentia-open]')) {
			openPrefs(false);
		}
	});

	/* -------------------------------------------------- decide ---- */

	function decide(consent, source) {
		var firstDecision = !decided && source !== 'sync';
		decided = true;
		state = buildConsent(consent);

		writeStored(state);
		consentModeUpdate(state);
		activateScripts(state);
		injectGA(state);
		sendLog(state, source);
		broadcastSync(state);

		banner.classList.remove('consentia-visible');
		setTimeout(function () {
			banner.hidden = true;
		}, 320);

		if (settings.revisit_button) {
			revisit.hidden = false;
			revisit.classList.add('consentia-revisit-in');
		}

		closePrefs();
		updateStatusShortcode();

		if (firstDecision) {
			emit('consentia:granted', state);
		}
		emit('consentia:updated', state);
	}

	function updateStatusShortcode() {
		var nodes = document.querySelectorAll('[data-consentia-status]');
		Array.prototype.forEach.call(nodes, function (n) {
			var parts = ['Necesarias: sí'];
			['functional', 'analytics', 'performance', 'advertising'].forEach(function (k) {
				if (categories[k]) {
					parts.push(categories[k].label + ': ' + (state[k] ? 'sí' : 'no'));
				}
			});
			n.textContent = parts.join(' · ');
		});
	}

	/* --------------------------------------------------- init ---- */

	consentModeDefault();

	var stored = readStored();

	if (stored) {
		decided = true;
		state = stored;
		consentModeUpdate(state);
		activateScripts(state);
		injectGA(state);
		updateStatusShortcode();
		if (settings.revisit_button) {
			revisit.hidden = false;
			revisit.classList.add('consentia-revisit-in');
		}
		emit('consentia:ready', state);
	} else if (data.gpc && (navigator.globalPrivacyControl === true || navigator.globalPrivacyControl === '1')) {
		// Global Privacy Control: register an opt-out, no banner.
		decide(buildConsent({}), 'gpc');
	} else {
		var delay = parseInt(settings.show_delay_ms || 0, 10);
		setTimeout(function () {
			banner.classList.add('consentia-visible');
		}, Math.max(0, delay));
	}

	/* ------------------------------------------------------ API ---- */

	window.Consentia = {
		version: '1.1.0',
		open: function () {
			openPrefs(false);
		},
		close: closePrefs,
		status: function () {
			return Object.assign({ decided: decided }, state);
		},
		reset: function () {
			document.cookie = COOKIE + '=; path=/; max-age=0';
			try {
				localStorage.removeItem(COOKIE);
			} catch (e) {}
			window.location.reload();
		}
	};
})();
