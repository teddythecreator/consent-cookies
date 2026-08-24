/**
 * Consentia — settings screen behaviour.
 *
 * Tabs, live banner preview, consent-log stats chart (dependency-free
 * SVG) and the cookie scanner UI.
 *
 * @package Consentia
 */
(function () {
	'use strict';

	var cfg = window.consentiaAdmin || {};
	var settings = cfg.settings || {};
	var cats = cfg.categories || {};

	function $(sel, ctx) {
		return (ctx || document).querySelector(sel);
	}

	function on(el, evt, fn) {
		if (el) {
			el.addEventListener(evt, fn);
		}
	}

	function post(action, extra) {
		var body = new URLSearchParams({ action: action, nonce: cfg.nonce });
		if (extra) {
			Object.keys(extra).forEach(function (k) {
				body.append(k, extra[k]);
			});
		}
		return fetch(cfg.ajaxurl, { method: 'POST', credentials: 'same-origin', body: body }).then(function (r) {
			return r.json();
		});
	}

	/* ------------------------------------------------------- tabs ---- */

	var tabs = document.querySelectorAll('.consentia-admin-tab');
	var panes = document.querySelectorAll('.consentia-admin-pane');

	function selectTab(key) {
		tabs.forEach(function (t) {
			var active = t.getAttribute('data-tab') === key;
			t.classList.toggle('active', active);
			t.setAttribute('aria-selected', active ? 'true' : 'false');
		});
		panes.forEach(function (p) {
			p.hidden = p.getAttribute('data-pane') !== key;
		});
		if (key === 'log') {
			loadStats();
			loadLatest();
		}
		if (key === 'scanner') {
			runScan(true);
		}
	}

	tabs.forEach(function (t) {
		on(t, 'click', function () {
			selectTab(t.getAttribute('data-tab'));
		});
	});

	/* ---------------------------------------------------- preview ---- */

	var preview = $('#consentia-preview');
	var bannerEl = $('#consentia-preview-banner');
	var fields = document.querySelectorAll('.consentia-field');

	function field(id) {
		var el = document.querySelector('[data-field="' + id + '"]');
		if (!el) {
			return settings[id];
		}
		if (el.type === 'checkbox') {
			return el.checked;
		}
		return el.value;
	}

	function refreshPreview() {
		var s = {
			banner_type: field('banner_type'),
			position: field('position'),
			bg_color: field('bg_color'),
			text_color: field('text_color'),
			accent_color: field('accent_color'),
			corner_radius: field('corner_radius'),
			title: field('title'),
			message: field('message'),
			accept_label: field('accept_label'),
			reject_label: field('reject_label'),
			prefs_label: field('prefs_label'),
			ccpa_enabled: field('ccpa_enabled'),
			ccpa_do_not_sell: field('ccpa_do_not_sell')
		};

		if (!bannerEl || !preview) {
			return;
		}

		bannerEl.style.background = s.bg_color;
		bannerEl.style.color = s.text_color;
		bannerEl.style.borderRadius = s.banner_type === 'bar' ? '0' : s.corner_radius + 'px';
		bannerEl.classList.toggle('is-bar', s.banner_type === 'bar');
		bannerEl.classList.toggle('is-top', s.position === 'top' && s.banner_type === 'bar');
		bannerEl.classList.toggle('is-floating', s.banner_type === 'floating');
		preview.style.justifyContent = s.position === 'top' ? 'flex-start' : 'flex-end';

		$('#consentia-preview-title').textContent = s.title;
		var msgEl = $('#consentia-preview-message');
		msgEl.textContent = (s.message || '').length > 96 ? s.message.slice(0, 96) + '…' : s.message;
		$('#consentia-preview-accept').textContent = s.accept_label;
		$('#consentia-preview-accept').style.background = s.accent_color;
		$('#consentia-preview-reject').textContent = s.reject_label;
		$('#consentia-preview-prefs').textContent = s.prefs_label;

		var ccpa = $('#consentia-preview-ccpa');
		ccpa.hidden = !s.ccpa_enabled;
		ccpa.textContent = '🔗 ' + (s.ccpa_do_not_sell || 'Do Not Sell or Share');
	}

	fields.forEach(function (f) {
		on(f, 'input', refreshPreview);
		on(f, 'change', refreshPreview);
	});

	refreshPreview();

	/* -------------------------------------------------- log stats ---- */

	var statsLoaded = false;

	function loadStats() {
		if (statsLoaded) {
			return;
		}
		statsLoaded = true;

		post('consentia_log_stats').then(function (res) {
			if (!res || !res.success) {
				return;
			}
			var totals = res.data.totals || {};
			var daily = res.data.daily || [];

			var totalsEl = $('#consentia-log-totals');
			var chips = [
				['Aceptadas', totals.accepted || 0, '#2f9e63'],
				['Rechazadas', totals.rejected || 0, '#d63638'],
				['Personalizadas', totals.custom || 0, '#2271b1'],
				['GPC', totals.gpc || 0, '#996800'],
				['Sincronizadas', totals.sync || 0, '#646970']
			];
			totalsEl.innerHTML = chips
				.map(function (c) {
					return (
						'<div class="consentia-chip" style="border-color:' + c[2] + '">' +
						'<strong>' + c[1] + '</strong><span>' + c[0] + '</span></div>'
					);
				})
				.join('');

			var chart = $('#consentia-log-chart');
			if (!daily.length) {
				chart.innerHTML = '<p class="description">Aún no hay decisiones registradas.</p>';
				return;
			}

			var max = Math.max.apply(
				null,
				daily.map(function (d) {
					return d.accepted + d.rejected + d.custom;
				})
			);
			var h = 120;
			var w = 100 / daily.length;

			var bars = daily
				.map(function (d, i) {
					var total = d.accepted + d.rejected + d.custom;
					var scale = max ? h / max : 0;
					var a = d.accepted * scale,
						r = d.rejected * scale,
						c = d.custom * scale;
					var x = i * w + w * 0.18;
					var bw = w * 0.64;
					var y = h - (a + r + c);
					return (
						'<g><title>' + d.date + ' — ' + total + '</title>' +
						'<rect x="' + x + '%" y="' + (y) + '" width="' + bw + '%" height="' + a + '" fill="#2f9e63"></rect>' +
						'<rect x="' + x + '%" y="' + (y + a) + '" width="' + bw + '%" height="' + r + '" fill="#d63638"></rect>' +
						'<rect x="' + x + '%" y="' + (y + a + r) + '" width="' + bw + '%" height="' + c + '" fill="#2271b1"></rect></g>'
					);
				})
				.join('');

			chart.innerHTML =
				'<svg viewBox="0 0 100 ' + h + '" preserveAspectRatio="none" class="consentia-chart-svg" role="img" aria-label="Decisiones de los últimos 30 días">' +
				bars +
				'</svg>' +
				'<p class="consentia-chart-legend"><span style="color:#2f9e63">■</span> Aceptadas ' +
				'<span style="color:#d63638">■</span> Rechazadas ' +
				'<span style="color:#2271b1">■</span> Personalizadas</p>';
		});
	}

	function loadLatest() {
		post('consentia_log_latest').then(function (res) {
			if (!res || !res.success) {
				return;
			}
			var tbody = $('#consentia-log-table tbody');
			var rows = (res.data.rows || [])
				.map(function (r) {
					var c = {};
					try {
						c = JSON.parse(r.consent);
					} catch (e) {}
					var source = { accepted: 'Aceptó todo', rejected: 'Rechazó', custom: 'Personalizado', gpc: 'GPC', sync: 'Sincronizado' }[r.consent_source] || r.consent_source;
					var detail = ['functional', 'analytics', 'performance', 'advertising']
						.filter(function (k) {
							return cats[k];
						})
						.map(function (k) {
							return cats[k] + ': ' + (c[k] ? 'sí' : 'no');
						})
						.join(' · ');
					return (
						'<tr><td>' + r.consent_date + '</td><td>' + source + '</td><td>' + detail +
						'</td><td>' + (r.country || '—') + '</td></tr>'
					);
				})
				.join('');
			tbody.innerHTML = rows || '<tr><td colspan="4">Sin decisiones todavía.</td></tr>';
		});
	}

	on($('#consentia-purge'), 'click', function () {
		if (!window.confirm(cfg.purge_text || '¿Vaciar el registro?')) {
			return;
		}
		post('consentia_log_purge').then(function () {
			statsLoaded = false;
			loadStats();
			loadLatest();
		});
	});

	/* ---------------------------------------------------- scanner ---- */

	var scanItems = [];

	function renderScan(rows) {
		scanItems = rows;
		var tbody = $('#consentia-scan-table tbody');
		var catOptions = Object.keys(cats)
			.map(function (k) {
				return '<option value="' + k + '">' + cats[k] + '</option>';
			})
			.join('');

		tbody.innerHTML =
			rows
				.map(function (item, i) {
					var options = catOptions.replace('value="' + item.category + '"', 'value="' + item.category + '" selected');
					return (
						'<tr data-i="' + i + '"><td>' + (item.type === 'cookie' ? 'Cookie' : 'Script') + '</td>' +
						'<td><code>' + item.value + '</code></td><td>' + item.provider + '</td>' +
						'<td><select class="consentia-scan-cat" data-i="' + i + '">' + options + '</select></td></tr>'
					);
				})
				.join('') || '<tr><td colspan="4">Nada detectado. El escaneo lee las cookies del servidor y del navegador, y los scripts encolados conocidos.</td></tr>';

		document.querySelectorAll('.consentia-scan-cat').forEach(function (sel) {
			on(sel, 'change', function () {
				scanItems[parseInt(sel.getAttribute('data-i'), 10)].category = sel.value;
			});
		});
	}

	function mergeBrowserCookies(serverRows) {
		var seen = {};
		serverRows.forEach(function (r) {
			seen[r.value] = true;
		});
		var extra = document.cookie
			.split(';')
			.map(function (c) {
				return c.split('=')[0].trim();
			})
			.filter(function (name) {
				return name && !seen[name];
			})
			.map(function (name) {
				// Reuse server-side classification heuristics client-side.
				var patterns = { _ga: ['Google Analytics', 'analytics'], _gid: ['Google Analytics', 'analytics'], _gat: ['Google Analytics', 'analytics'], _gcl_: ['Google Ads', 'advertising'], _fbp: ['Meta Pixel', 'advertising'], _hj: ['Hotjar', 'analytics'], _clck: ['Microsoft Clarity', 'analytics'], pll_language: ['Polylang', 'functional'], wordpress_: ['WordPress', 'necessary'], wp_settings: ['WordPress', 'necessary'], woocommerce_: ['WooCommerce', 'necessary'], consentia: ['Consentia', 'necessary'], cookieyes: ['CookieYes', 'functional'] };
				var info = ['Sin clasificar', 'functional'];
				Object.keys(patterns).some(function (p) {
					if (name.toLowerCase().indexOf(p.toLowerCase()) > -1) {
						info = patterns[p];
						return true;
					}
					return false;
				});
				return { id: 'cookie-' + name, type: 'cookie', value: name, provider: info[0], category: info[1], matched: '1' };
			});
		return serverRows.concat(extra);
	}

	function runScan(initial) {
		post('consentia_scan_run').then(function (res) {
			if (!res || !res.success) {
				return;
			}
			var cookies = mergeBrowserCookies(res.data.cookies || []);
			var scripts = res.data.scripts || [];
			renderScan(cookies.concat(scripts));
			var meta = $('#consentia-scan-meta');
			if (meta) {
				meta.textContent = (initial ? 'Último escaneo cargado. ' : 'Escaneo completado. ') + cookies.length + ' cookies y ' + scripts.length + ' scripts de terceros detectados.';
			}
		});
	}

	on($('#consentia-scan-run'), 'click', function () {
		runScan(false);
	});

	on($('#consentia-scan-save'), 'click', function () {
		post('consentia_scan_save', { items: JSON.stringify(scanItems) }).then(function (res) {
			var meta = $('#consentia-scan-meta');
			if (meta && res && res.success) {
				meta.textContent = 'Clasificación guardada (' + res.data.count + ' elementos). Úsala para redactar tu política de cookies.';
			}
		});
	});
})();
