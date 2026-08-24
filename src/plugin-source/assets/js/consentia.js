/**
 * Consentia — frontend consent manager.
 *
 * Vanilla JS, no dependencies. Reads `consentiaData` localized by
 * WordPress, renders the banner, stores consent in a first-party
 * cookie (+ localStorage fallback), unblocks category scripts and
 * exposes the window.Consentia API.
 *
 * Events dispatched on `document`:
 *   - consentia:granted  (first decision)
 *   - consentia:updated  (any change)
 *
 * @package Consentia
 */
( function () {
	'use strict';

	if ( window.__consentiaLoaded || typeof window.consentiaData === 'undefined' ) {
		return;
	}
	window.__consentiaLoaded = true;

	var data      = window.consentiaData;
	var settings  = data.settings || {};
	var cats      = data.categories || {};
	var COOKIE    = 'consentia';
	var reduced   = window.matchMedia && window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches;
	var consent   = readConsent();
	var bannerEl  = null;
	var prefsEl   = null;

	/* ------------------------------------------------ storage ---- */

	function monthsToSeconds( months ) {
		return Math.max( 1, parseInt( months, 10 ) || 6 ) * 30 * 24 * 60 * 60;
	}

	function writeConsent( value ) {
		var payload = JSON.stringify( value );
		var maxAge  = monthsToSeconds( settings.renew_months );
		try {
			document.cookie = COOKIE + '=' + encodeURIComponent( payload ) +
				';path=/;max-age=' + maxAge + ';SameSite=Lax';
			window.localStorage.setItem( COOKIE, payload );
		} catch ( e ) { /* storage unavailable: cookie alone is enough */ }
	}

	function readConsent() {
		var raw = null;
		try {
			var match = document.cookie.match( new RegExp( '(?:^|; )' + COOKIE + '=([^;]+)' ) );
			if ( match ) {
				raw = decodeURIComponent( match[1] );
			} else {
				raw = window.localStorage.getItem( COOKIE );
			}
		} catch ( e ) {
			return null;
		}
		if ( ! raw ) {
			return null;
		}
		try {
			var value = JSON.parse( raw );
			var maxAge = monthsToSeconds( settings.renew_months ) * 1000;
			if ( value && value.ts && ( Date.now() - value.ts ) > maxAge ) {
				return null; // renewal period expired: ask again
			}
			return value;
		} catch ( e ) {
			return null;
		}
	}

	/* --------------------------------------------- script gate ---- */

	function activateScripts( categories ) {
		var blocked = document.querySelectorAll( 'script[type="text/plain"][data-consentia]' );
		Array.prototype.forEach.call( blocked, function ( node ) {
			var cat = node.getAttribute( 'data-consentia' );
			if ( ! categories[ cat ] ) {
				return;
			}
			var fresh = document.createElement( 'script' );
			Array.prototype.forEach.call( node.attributes, function ( attr ) {
				if ( attr.name !== 'type' && attr.name !== 'data-consentia' ) {
					fresh.setAttribute( attr.name, attr.value );
				}
			} );
			fresh.text = node.textContent;
			node.parentNode.replaceChild( fresh, node );
		} );
	}

	function injectGa4() {
		var id = settings.ga4_id;
		if ( ! id || ! consent.analytics || document.getElementById( 'consentia-ga4' ) ) {
			return;
		}
		var gtag = document.createElement( 'script' );
		gtag.id  = 'consentia-ga4';
		gtag.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent( id );
		gtag.async = true;
		document.head.appendChild( gtag );
		var inline = document.createElement( 'script' );
		inline.textContent =
			'window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}' +
			'gtag("js",new Date());gtag("config","' + id.replace( /"/g, '' ) + '");';
		document.head.appendChild( inline );
	}

	function applyConsent( value, isFirst ) {
		consent = value;
		writeConsent( value );
		var granted = { necessary: true, analytics: !! value.analytics, marketing: !! value.marketing };
		activateScripts( granted );
		if ( granted.analytics ) {
			injectGa4();
		}
		var type = isFirst ? 'consentia:granted' : 'consentia:updated';
		document.dispatchEvent( new CustomEvent( type, { detail: granted } ) );
		updateStatusShortcodes( granted );
	}

	/* -------------------------------------------------- render ---- */

	function el( tag, className, html ) {
		var node = document.createElement( tag );
		if ( className ) {
			node.className = className;
		}
		if ( html ) {
			node.innerHTML = html;
		}
		return node;
	}

	function esc( str ) {
		var div = document.createElement( 'div' );
		div.appendChild( document.createTextNode( str || '' ) );
		return div.innerHTML;
	}

	function buildBanner() {
		var type = settings.banner_type === 'bar' ? 'bar' : 'card';
		bannerEl = el( 'div', 'consentia-banner consentia-' + type + ' consentia-' + ( settings.position || 'bottom-left' ) );
		bannerEl.setAttribute( 'role', 'dialog' );
		bannerEl.setAttribute( 'aria-label', settings.title || 'Consentimiento de cookies' );
		bannerEl.style.setProperty( '--consentia-bg', settings.bg_color );
		bannerEl.style.setProperty( '--consentia-text', settings.text_color );
		bannerEl.style.setProperty( '--consentia-accent', settings.accent_color );
		bannerEl.style.setProperty( '--consentia-radius', ( settings.radius || 0 ) + 'px' );

		var privacyLink = settings.privacy_url
			? ' <a class="consentia-link" href="' + esc( settings.privacy_url ) + '">' + esc( 'Política de cookies' ) + '</a>'
			: '';

		bannerEl.innerHTML =
			'<div class="consentia-inner">' +
				'<p class="consentia-title">' + esc( settings.title ) + '</p>' +
				'<p class="consentia-message">' + esc( settings.message ) + privacyLink + '</p>' +
				'<div class="consentia-actions">' +
					'<button type="button" class="consentia-btn consentia-btn-accept">' + esc( settings.accept_label ) + '</button>' +
					'<button type="button" class="consentia-btn consentia-btn-reject">' + esc( settings.reject_label ) + '</button>' +
					'<button type="button" class="consentia-btn consentia-btn-prefs">' + esc( settings.prefs_label ) + '</button>' +
				'</div>' +
			'</div>';

		document.getElementById( 'consentia-root' ).appendChild( bannerEl );

		bannerEl.querySelector( '.consentia-btn-accept' ).addEventListener( 'click', function () {
			applyConsent( { necessary: true, analytics: true, marketing: true, ts: Date.now() }, ! consent );
			hideBanner();
		} );
		bannerEl.querySelector( '.consentia-btn-reject' ).addEventListener( 'click', function () {
			applyConsent( { necessary: true, analytics: false, marketing: false, ts: Date.now() }, ! consent );
			hideBanner();
		} );
		bannerEl.querySelector( '.consentia-btn-prefs' ).addEventListener( 'click', openPrefs );

		requestAnimationFrame( function () {
			bannerEl.classList.add( 'consentia-visible' );
		} );
	}

	function hideBanner() {
		if ( ! bannerEl ) {
			return;
		}
		bannerEl.classList.remove( 'consentia-visible' );
		setTimeout( function () {
			if ( bannerEl && bannerEl.parentNode ) {
				bannerEl.parentNode.removeChild( bannerEl );
			}
			bannerEl = null;
		}, reduced ? 0 : 300 );
	}

	function openPrefs() {
		if ( prefsEl ) {
			return;
		}
		prefsEl = el( 'div', 'consentia-prefs consentia-visible' );
		prefsEl.setAttribute( 'role', 'dialog' );
		prefsEl.setAttribute( 'aria-modal', 'true' );
		prefsEl.setAttribute( 'aria-label', 'Preferencias de cookies' );
		prefsEl.style.setProperty( '--consentia-bg', settings.bg_color );
		prefsEl.style.setProperty( '--consentia-text', settings.text_color );
		prefsEl.style.setProperty( '--consentia-accent', settings.accent_color );
		prefsEl.style.setProperty( '--consentia-radius', ( settings.radius || 0 ) + 'px' );

		var rows = '';
		Object.keys( cats ).forEach( function ( key ) {
			var cat     = cats[ key ];
			var locked  = !! cat.locked;
			var checked = locked || ( consent ? !! consent[ key ] : false );
			rows +=
				'<label class="consentia-pref-row' + ( locked ? ' consentia-locked' : '' ) + '">' +
					'<span>' +
						'<strong>' + esc( cat.label ) + '</strong>' +
						'<small>' + esc( cat.description ) + '</small>' +
					'</span>' +
					'<span class="consentia-switch">' +
						'<input type="checkbox" data-cat="' + esc( key ) + '"' +
							( checked ? ' checked' : '' ) + ( locked ? ' disabled' : '' ) + ' />' +
						'<span class="consentia-switch-track" aria-hidden="true"></span>' +
					'</span>' +
				'</label>';
		} );

		prefsEl.innerHTML =
			'<div class="consentia-prefs-panel">' +
				'<p class="consentia-title">Preferencias de cookies</p>' +
				rows +
				'<div class="consentia-actions">' +
					'<button type="button" class="consentia-btn consentia-btn-save">' + esc( 'Guardar preferencias' ) + '</button>' +
					'<button type="button" class="consentia-btn consentia-btn-accept">' + esc( settings.accept_label ) + '</button>' +
				'</div>' +
			'</div>';

		document.getElementById( 'consentia-root' ).appendChild( prefsEl );

		prefsEl.querySelector( '.consentia-btn-save' ).addEventListener( 'click', savePrefs );
		prefsEl.querySelector( '.consentia-btn-accept' ).addEventListener( 'click', function () {
			applyConsent( { necessary: true, analytics: true, marketing: true, ts: Date.now() }, ! consent );
			closePrefs();
			hideBanner();
		} );

		var panel = prefsEl.querySelector( '.consentia-prefs-panel' );
		document.addEventListener( 'keydown', onPrefsKey );
		var firstInput = panel.querySelector( 'input, button' );
		if ( firstInput ) {
			firstInput.focus();
		}
	}

	function onPrefsKey( event ) {
		if ( event.key === 'Escape' ) {
			closePrefs();
		}
	}

	function savePrefs() {
		var value = { necessary: true, ts: Date.now() };
		prefsEl.querySelectorAll( 'input[data-cat]' ).forEach( function ( input ) {
			value[ input.getAttribute( 'data-cat' ) ] = input.checked;
		} );
		applyConsent( value, ! consent );
		closePrefs();
		hideBanner();
	}

	function closePrefs() {
		document.removeEventListener( 'keydown', onPrefsKey );
		if ( prefsEl && prefsEl.parentNode ) {
			prefsEl.parentNode.removeChild( prefsEl );
		}
		prefsEl = null;
	}

	function updateStatusShortcodes( granted ) {
		var labels = [];
		Object.keys( granted ).forEach( function ( key ) {
			if ( granted[ key ] && cats[ key ] ) {
				labels.push( cats[ key ].label );
			}
		} );
		document.querySelectorAll( '[data-consentia-status]' ).forEach( function ( node ) {
			node.textContent = labels.join( ' · ' );
		} );
	}

	/* ---------------------------------------------------- boot ---- */

	function bindOpenButtons() {
		document.addEventListener( 'click', function ( event ) {
			var target = event.target.closest ? event.target.closest( '[data-consentia-open]' ) : null;
			if ( target ) {
				openPrefs();
			}
		} );
	}

	function boot() {
		bindOpenButtons();

		if ( consent ) {
			// Returning visitor: silently apply the saved decision.
			applyConsent( consent, false );
			return;
		}

		var delay = parseInt( settings.delay_ms, 10 ) || 0;
		setTimeout( buildBanner, reduced ? 0 : delay );
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', boot );
	} else {
		boot();
	}

	/* ----------------------------------------------------- API ---- */

	window.Consentia = {
		open: openPrefs,
		close: closePrefs,
		status: function () {
			return consent || null;
		},
		showBanner: buildBanner
	};
} )();
