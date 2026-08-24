/**
 * Consentia — settings page live preview.
 *
 * Re-renders a miniature banner inside the admin whenever any field
 * of the settings form changes. No dependencies.
 *
 * @package Consentia
 */
( function () {
	'use strict';

	document.addEventListener( 'DOMContentLoaded', function () {
		var box  = document.getElementById( 'consentia-admin-preview-box' );
		var form = box ? box.closest( 'form' ) : null;
		if ( ! box || ! form ) {
			return;
		}

		var base = {};
		try {
			base = JSON.parse( box.getAttribute( 'data-settings' ) || '{}' );
		} catch ( e ) {
			base = {};
		}

		function readForm() {
			var values = Object.assign( {}, base );
			form.querySelectorAll( 'input, select, textarea' ).forEach( function ( field ) {
				var match = field.name && field.name.match( /^consentia_settings\[([a-z0-9_]+)\]$/ );
				if ( ! match ) {
					return;
				}
				var key = match[1];
				if ( field.type === 'checkbox' ) {
					values[ key ] = field.checked ? 1 : 0;
				} else if ( field.type === 'number' ) {
					values[ key ] = parseInt( field.value, 10 ) || 0;
				} else {
					values[ key ] = field.value;
				}
			} );
			return values;
		}

		function render() {
			var s = readForm();
			var isBar = s.banner_type === 'bar';
			var pos = s.position || 'bottom-left';

			var align = 'flex-start';
			if ( pos === 'bottom-right' ) { align = 'flex-end'; }
			if ( pos === 'bottom-center' ) { align = 'center'; }

			var privacy = s.privacy_url
				? ' <a style="color:' + s.accent_color + '">Política de cookies</a>'
				: '';

			box.innerHTML =
				'<div class="consentia-admin-mini">' +
					'<div class="consentia-admin-mini-site">' +
						'<span class="consentia-admin-mini-bar"></span>' +
						'<span class="consentia-admin-mini-line w70"></span>' +
						'<span class="consentia-admin-mini-line w100"></span>' +
						'<span class="consentia-admin-mini-line w85"></span>' +
						'<span class="consentia-admin-mini-line w60"></span>' +
					'</div>' +
					'<div class="consentia-admin-mini-banner' + ( isBar ? ' is-bar' : '' ) + ( pos === 'top' ? ' is-top' : '' ) + '"' +
						' style="align-self:' + align + ';' +
						'--consentia-bg:' + s.bg_color + ';' +
						'--consentia-text:' + s.text_color + ';' +
						'--consentia-accent:' + s.accent_color + ';' +
						'--consentia-radius:' + ( s.radius || 0 ) + 'px">' +
						'<strong>' + escapeHtml( s.title ) + '</strong>' +
						'<small>' + escapeHtml( truncate( s.message, 90 ) ) + privacy + '</small>' +
						'<div class="consentia-admin-mini-actions">' +
							'<em class="a">' + escapeHtml( s.accept_label ) + '</em>' +
							'<em class="r">' + escapeHtml( s.reject_label ) + '</em>' +
							'<em class="p">' + escapeHtml( s.prefs_label ) + '</em>' +
						'</div>' +
					'</div>' +
				'</div>' +
				( s.enabled ? '' : '<p class="consentia-admin-disabled">El banner está desactivado.</p>' );
		}

		function escapeHtml( str ) {
			var div = document.createElement( 'div' );
			div.appendChild( document.createTextNode( str || '' ) );
			return div.innerHTML;
		}

		function truncate( str, max ) {
			str = str || '';
			return str.length > max ? str.slice( 0, max ) + '…' : str;
		}

		form.addEventListener( 'input', render );
		form.addEventListener( 'change', render );
		render();
	} );
} )();
