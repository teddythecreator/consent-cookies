/**
 * Consentia — settings screen behaviour (v1.2).
 *
 * Handles the section tabs and the live banner preview, which updates
 * while the admin types. The consent-log tab is rendered server-side by
 * admin/views/consents-list.php, so no AJAX is needed here.
 *
 * @package Consentia
 */
(function () {
	'use strict';

	var cfg = window.consentiaAdmin || {};
	var settings = cfg.settings || {};

	function $(sel, ctx) {
		return (ctx || document).querySelector(sel);
	}

	function on(el, evt, fn) {
		if (el) {
			el.addEventListener(evt, fn);
		}
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
	}

	tabs.forEach(function (t) {
		on(t, 'click', function () {
			selectTab(t.getAttribute('data-tab'));
		});
	});

	/* --------------------------------------------- live preview ---- */

	var preview = $('#consentia-preview');
	var bannerEl = $('#consentia-preview-banner');
	var fields = document.querySelectorAll('.consentia-field');

	/**
	 * Reads the current value of a settings field from the form.
	 *
	 * @param {string} id Field id.
	 * @returns {*}
	 */
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

	/**
	 * Re-draws the miniature banner from the current form values, so the
	 * admin sees exactly what visitors will get.
	 */
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

		// The three buttons keep identical styling on purpose: preview the
		// "same level" legal requirement (EDPB 05/2020).
		$('#consentia-preview-accept').textContent = s.accept_label;
		$('#consentia-preview-reject').textContent = s.reject_label;
		$('#consentia-preview-prefs').textContent = s.prefs_label;

		var ccpa = $('#consentia-preview-ccpa');
		if (ccpa) {
			ccpa.hidden = !s.ccpa_enabled;
			ccpa.textContent = s.ccpa_do_not_sell || 'Do Not Sell or Share';
		}
	}

	fields.forEach(function (f) {
		on(f, 'input', refreshPreview);
		on(f, 'change', refreshPreview);
	});

	refreshPreview();
})();
