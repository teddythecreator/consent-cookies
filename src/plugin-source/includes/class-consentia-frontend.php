<?php
/**
 * Frontend for Consentia (v1.2 — strict RGPD / LSSI-CE / ePrivacy mode).
 *
 * Renders the consent banner (three equally visible buttons) and the
 * second-layer settings panel directly in PHP, enqueues the assets with
 * every translatable string, and documents the prior script-blocking
 * strategy based on type="text/consentia".
 *
 * @package Consentia
 */

defined( 'ABSPATH' ) || exit;

class Consentia_Frontend {

	/**
	 * Singleton instance.
	 *
	 * @var Consentia_Frontend|null
	 */
	private static $instance = null;

	/**
	 * Returns the singleton instance.
	 *
	 * @return Consentia_Frontend
	 */
	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Hooks (frontend only).
	 */
	private function __construct() {
		if ( is_admin() ) {
			return;
		}
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_assets' ) );
		add_action( 'wp_footer', array( $this, 'render_banner' ), 20 );
		add_action( 'wp_footer', array( $this, 'render_settings_panel' ), 21 );
		add_shortcode( 'consentia_manage', array( $this, 'shortcode_manage' ) );
		add_shortcode( 'consentia_status', array( $this, 'shortcode_status' ) );
	}

	/**
	 * Enqueue banner assets and localize settings + i18n strings.
	 *
	 * @return void
	 */
	public function enqueue_assets() {
		$settings = Consentia_Settings::get();

		if ( empty( $settings['enabled'] ) ) {
			return;
		}

		$geo = Consentia_Geo::instance();
		if ( ! $geo->requires_consent() ) {
			return; // Visitor out of scope (geo enabled): no banner needed.
		}

		wp_enqueue_style( 'consentia', CONSENTIA_URL . 'assets/css/consentia.css', array(), CONSENTIA_VERSION );
		wp_enqueue_script( 'consentia', CONSENTIA_URL . 'assets/js/consentia.js', array(), CONSENTIA_VERSION, true );
		wp_script_add_data( 'consentia', 'defer', true );

		// i18n requirement: every JS-facing string comes from PHP via
		// wp_localize_script, never hardcoded in the script.
		wp_localize_script(
			'consentia',
			'consentiaData',
			array(
				'settings'   => $settings,
				'categories' => $this->categories(),
				'strings'    => $this->strings(),
				'ajax'       => array(
					'url'   => admin_url( 'admin-ajax.php' ),
					'nonce' => wp_create_nonce( 'consentia_ajax' ),
				),
				'gpc'        => ! empty( $settings['gpc_respect'] ),
				'log'        => ! empty( $settings['log_enabled'] ),
			)
		);

		if ( ! empty( $settings['tcf_enabled'] ) ) {
			wp_enqueue_script( 'consentia-tcf', CONSENTIA_URL . 'assets/js/consentia-tcf.js', array( 'consentia' ), CONSENTIA_VERSION, true );
			wp_script_add_data( 'consentia-tcf', 'defer', true );
		}

		if ( '' !== trim( (string) $settings['custom_css'] ) ) {
			wp_add_inline_style( 'consentia', $settings['custom_css'] );
		}

		$this->block_scripts();
	}

	/**
	 * Prior blocking of non-essential scripts — the most critical legal
	 * requirement (ePrivacy art. 5.3: no storage/access before consent).
	 *
	 * Strategy: themes and plugins mark non-essential snippets with
	 * type="text/consentia" (or legacy type="text/plain" data-consentia).
	 * Browsers never execute those types; consentia.js clones them into
	 * real <script> elements only after an explicit, logged decision,
	 * without reloading the page. This works with every caching plugin
	 * because nothing is filtered server-side.
	 *
	 * Example:
	 *   <script type="text/consentia" data-consentia-category="statistics"
	 *           src="https://www.googletagmanager.com/gtag/js?id=G-XXXX"></script>
	 *
	 * @return void
	 */
	public function block_scripts() {
		// Client-side activation lives in assets/js/consentia.js →
		// enableScriptsByCategory(). Nothing to enqueue here.
	}

	/**
	 * Helper for themes: renders an already-blocked script tag.
	 *
	 * @param string $src      Script URL.
	 * @param string $category preferences | statistics | marketing.
	 * @return string Safe HTML.
	 */
	public static function script_tag( $src, $category ) {
		return sprintf(
			'<script type="text/consentia" data-consentia-category="%s" src="%s"></script>',
			esc_attr( $category ),
			esc_url( $src )
		);
	}

	/**
	 * Cookie categories. "Necesarias" is locked (legitimate interest,
	 * strictly necessary — ePrivacy art. 5.3 exemption). The other three
	 * start UNCHECKED by default, as GDPR requires (no pre-ticking).
	 *
	 * @return array<string, array<string, mixed>>
	 */
	private function categories() {
		return array(
			'necessary'   => array(
				'label'       => __( 'Necesarias', 'consentia' ),
				'description' => __( 'Imprescindibles para que la web funcione: sesión, seguridad y carrito. No se pueden desactivar.', 'consentia' ),
				'locked'      => true,
			),
			'preferences' => array(
				'label'       => __( 'Preferencias', 'consentia' ),
				'description' => __( 'Recuerdan tus elecciones: idioma, región o personalización de la interfaz.', 'consentia' ),
				'locked'      => false,
			),
			'statistics'  => array(
				'label'       => __( 'Estadísticas', 'consentia' ),
				'description' => __( 'Miden el uso de la web con datos agregados para poder mejorarla.', 'consentia' ),
				'locked'      => false,
			),
			'marketing'   => array(
				'label'       => __( 'Marketing', 'consentia' ),
				'description' => __( 'Permiten mostrar anuncios relevantes y limitar las veces que los ves.', 'consentia' ),
				'locked'      => false,
			),
		);
	}

	/**
	 * Translatable UI strings consumed by consentia.js.
	 *
	 * @return array<string, string>
	 */
	private function strings() {
		return array(
			'accepted' => __( 'Has aceptado todas las cookies', 'consentia' ),
			'rejected' => __( 'Has rechazado las cookies no esenciales', 'consentia' ),
			'saved'    => __( 'Preferencias guardadas', 'consentia' ),
			'revoked'  => __( 'Consentimiento retirado. Recargando…', 'consentia' ),
			'widget'   => __( 'Configuración de Cookies', 'consentia' ),
			'expired'  => __( 'Tu consentimiento ha caducado, vuelve a elegir', 'consentia' ),
		);
	}

	/**
	 * Renders the first-layer banner.
	 *
	 * Legal checklist implemented here:
	 *  – Clear informative text + privacy/cookie policy links (LSSI 22.2).
	 *  – THREE buttons at the same level and identical visibility
	 *    (Aceptar / Rechazar / Configurar): rejecting must be as easy as
	 *    accepting (EDPB guidelines 05/2020).
	 *  – role="alertdialog" + aria-modal + labelledby/describedby (WCAG).
	 *  – Only shown when the 'consentia_consent' cookie is absent; the
	 *    front script checks the cookie on load and removes it otherwise.
	 *
	 * @return void
	 */
	public function render_banner() {
		$settings = Consentia_Settings::get();

		if ( empty( $settings['enabled'] ) || ! Consentia_Geo::instance()->requires_consent() ) {
			return;
		}

		$type     = in_array( $settings['banner_type'], array( 'card', 'bar', 'floating' ), true ) ? $settings['banner_type'] : 'card';
		$position = in_array( $settings['position'], array( 'bottom-left', 'bottom-right', 'bottom-center', 'top' ), true ) ? $settings['position'] : 'bottom-left';
		$radius   = (int) $settings['corner_radius'];

		$style = sprintf(
			'--consentia-bg:%s;--consentia-text:%s;--consentia-accent:%s;--consentia-radius:%dpx;',
			esc_attr( $settings['bg_color'] ),
			esc_attr( $settings['text_color'] ),
			esc_attr( $settings['accent_color'] ),
			$radius
		);

		$privacy_url = '' !== $settings['privacy_url'] ? $settings['privacy_url'] : get_privacy_policy_url();
		$cookies_url = '' !== $settings['cookies_url'] ? $settings['cookies_url'] : $privacy_url;

		echo '<div id="consentia-root" style="' . esc_attr( $style ) . '">';

		echo '<div id="consentia-banner" class="consentia-banner consentia-banner--' . esc_attr( $type ) . ' consentia-banner--' . esc_attr( $position ) . '" role="alertdialog" aria-modal="true" aria-labelledby="consentia-banner-title" aria-describedby="consentia-banner-desc">';

		echo '<h2 id="consentia-banner-title" class="consentia-banner__title">' . esc_html( $settings['title'] ) . '</h2>';

		echo '<p id="consentia-banner-desc" class="consentia-banner__desc">' . esc_html( $settings['message'] ) . ' ';
		if ( $privacy_url ) {
			echo '<a class="consentia-banner__link" href="' . esc_url( $privacy_url ) . '">' . esc_html__( 'Política de privacidad', 'consentia' ) . '</a> · ';
		}
		if ( $cookies_url ) {
			echo '<a class="consentia-banner__link" href="' . esc_url( $cookies_url ) . '">' . esc_html__( 'Política de cookies', 'consentia' ) . '</a>';
		}
		echo '</p>';

		// Three buttons, identical footprint: same min-width, same padding,
		// all with visible borders. No dark patterns.
		echo '<div class="consentia-banner__actions">';
		echo '<button type="button" id="consentia-accept" class="consentia-btn consentia-btn--accept">' . esc_html( $settings['accept_label'] ) . '</button>';
		echo '<button type="button" id="consentia-reject" class="consentia-btn consentia-btn--reject">' . esc_html( $settings['reject_label'] ) . '</button>';
		echo '<button type="button" id="consentia-prefs" class="consentia-btn consentia-btn--prefs">' . esc_html( $settings['prefs_label'] ) . '</button>';
		echo '</div>';

		echo '</div>'; // #consentia-banner

		// Screen-reader live region (WCAG 4.1.3 status messages).
		echo '<div id="consentia-live" class="consentia-sr-only" role="status" aria-live="polite"></div>';

		echo '</div>'; // #consentia-root
	}

	/**
	 * Renders the second-layer settings panel (hidden by default).
	 *
	 * Non-necessary checkboxes are rendered UNCHECKED; "Necesarias" is
	 * checked + disabled. Save / Cancel actions included.
	 *
	 * @return void
	 */
	public function render_settings_panel() {
		$settings = Consentia_Settings::get();

		if ( empty( $settings['enabled'] ) || ! Consentia_Geo::instance()->requires_consent() ) {
			return;
		}

		echo '<div id="consentia-panel-overlay" class="consentia-panel-overlay" hidden></div>';

		echo '<div id="consentia-panel" class="consentia-panel" role="dialog" aria-modal="true" aria-labelledby="consentia-panel-title" hidden>';

		echo '<h3 id="consentia-panel-title" class="consentia-panel__title">' . esc_html__( 'Preferencias de cookies', 'consentia' ) . '</h3>';
		echo '<p class="consentia-panel__intro">' . esc_html__( 'Elige qué categorías aceptas. Las necesarias no se pueden desactivar porque la web las necesita para funcionar. Puedes cambiar tu decisión cuando quieras.', 'consentia' ) . '</p>';

		echo '<fieldset class="consentia-panel__cats">';
		echo '<legend class="consentia-sr-only">' . esc_html__( 'Categorías de cookies', 'consentia' ) . '</legend>';

		foreach ( $this->categories() as $key => $cat ) {
			$locked  = ! empty( $cat['locked'] );
			$checked = $locked ? ' checked' : ''; // Non-necessary: unchecked (GDPR).
			$disabled = $locked ? ' disabled' : '';

			echo '<label class="consentia-cat' . ( $locked ? ' consentia-cat--locked' : '' ) . '">';
			echo '<input type="checkbox" class="consentia-cat__input" data-category="' . esc_attr( $key ) . '"' . $checked . $disabled . ' />';
			echo '<span class="consentia-cat__box" aria-hidden="true"></span>';
			echo '<span class="consentia-cat__body">';
			echo '<strong class="consentia-cat__name">' . esc_html( $cat['label'] ) . ( $locked ? ' <span class="consentia-cat__badge">' . esc_html__( 'siempre activas', 'consentia' ) . '</span>' : '' ) . '</strong>';
			echo '<span class="consentia-cat__desc">' . esc_html( $cat['description'] ) . '</span>';
			echo '</span>';
			echo '</label>';
		}

		echo '</fieldset>';

		echo '<div class="consentia-panel__actions">';
		echo '<button type="button" id="consentia-panel-save" class="consentia-btn consentia-btn--accept">' . esc_html__( 'Guardar preferencias', 'consentia' ) . '</button>';
		echo '<button type="button" id="consentia-panel-cancel" class="consentia-btn consentia-btn--reject">' . esc_html__( 'Cancelar', 'consentia' ) . '</button>';
		echo '</div>';

		echo '<button type="button" id="consentia-revoke" class="consentia-panel__revoke">' . esc_html__( 'Retirar todo el consentimiento', 'consentia' ) . '</button>';

		echo '</div>'; // #consentia-panel
	}

	/**
	 * [consentia_manage] — button that reopens the settings panel.
	 *
	 * @return string
	 */
	public function shortcode_manage() {
		return sprintf(
			'<button type="button" class="consentia-manage-button" data-consentia-open>%s</button>',
			esc_html__( 'Configurar cookies', 'consentia' )
		);
	}

	/**
	 * [consentia_status] — placeholder filled with the current consent.
	 *
	 * @return string
	 */
	public function shortcode_status() {
		return '<span class="consentia-status" data-consentia-status>' . esc_html__( 'Preferencias de cookies…', 'consentia' ) . '</span>';
	}
}
