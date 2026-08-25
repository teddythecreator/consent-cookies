<?php
/**
 * Plugin Name:       Consentia – Cookie Consent & GDPR
 * Plugin URI:        https://consentia.dev/
 * Description:       Gestión de consentimiento RGPD, LSSI-CE y ePrivacy: banner con tres botones de igual visibilidad, bloqueo previo de scripts (type="text/consentia"), registro probatorio en tu base de datos, widget de revocación, política de cookies con [consentia_policy], geolocalización UE/California y accesibilidad WCAG 2.1 AA. Autoalojado, ~12 KB, sin jQuery.
 * Version:           1.2.0
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Author:            Consentia Team
 * Author URI:        https://thecreator.business/
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       consentia
 * Domain Path:       /languages
 *
 * @package Consentia
 */

defined( 'ABSPATH' ) || exit;

define( 'CONSENTIA_VERSION', '1.2.0' );
define( 'CONSENTIA_FILE', __FILE__ );
define( 'CONSENTIA_PATH', plugin_dir_path( __FILE__ ) );
define( 'CONSENTIA_URL', plugin_dir_url( __FILE__ ) );

require_once CONSENTIA_PATH . 'includes/class-consentia-logger.php';
require_once CONSENTIA_PATH . 'includes/class-consentia-geo.php';
require_once CONSENTIA_PATH . 'includes/class-consentia-settings.php';
require_once CONSENTIA_PATH . 'includes/class-consentia-frontend.php';

/**
 * Main plugin class: lifecycle, AJAX proof-of-consent endpoints,
 * CSV export and the [consentia_policy] shortcode.
 */
final class Consentia {

	/**
	 * Singleton instance.
	 *
	 * @var Consentia|null
	 */
	private static $instance = null;

	/**
	 * Returns the singleton instance.
	 *
	 * @return Consentia
	 */
	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Registers every hook.
	 */
	private function __construct() {
		// Activation: proof-of-consent table + default options (GDPR art. 7.1).
		register_activation_hook( CONSENTIA_FILE, array( $this, 'activate' ) );
		register_deactivation_hook( CONSENTIA_FILE, array( $this, 'deactivate' ) );

		add_action( 'init', array( $this, 'load_textdomain' ) );
		add_action( 'admin_notices', array( $this, 'first_run_notice' ) );

		// AJAX: proof of consent (GDPR art. 7.1 — the controller must be
		// able to demonstrate that the subject gave consent).
		add_action( 'wp_ajax_consentia_save_consent', array( $this, 'ajax_save_consent' ) );
		add_action( 'wp_ajax_nopriv_consentia_save_consent', array( $this, 'ajax_save_consent' ) );
		add_action( 'wp_ajax_consentia_reset_consent', array( $this, 'ajax_reset_consent' ) );
		add_action( 'wp_ajax_nopriv_consentia_reset_consent', array( $this, 'ajax_reset_consent' ) );

		// Admin: CSV export of the consent log.
		add_action( 'admin_post_consentia_export_csv', array( $this, 'export_csv' ) );

		// LSSI-CE art. 22.2: clear and complete information about cookies.
		add_shortcode( 'consentia_policy', array( $this, 'shortcode_policy' ) );

		// Daily purge of records beyond the retention period.
		add_action( 'consentia_daily_cleanup', array( 'Consentia_Logger', 'scheduled_purge' ) );

		if ( is_admin() ) {
			Consentia_Settings::instance();
		} else {
			Consentia_Frontend::instance();
		}
	}

	/**
	 * On activation: create the log table, seed defaults, schedule cleanup.
	 *
	 * @return void
	 */
	public function activate() {
		Consentia_Logger::maybe_create_table();
		Consentia_Settings::install_defaults();

		if ( ! wp_next_scheduled( 'consentia_daily_cleanup' ) ) {
			wp_schedule_event( time(), 'daily', 'consentia_daily_cleanup' );
		}
	}

	/**
	 * On deactivation: clear the scheduled cleanup.
	 *
	 * @return void
	 */
	public function deactivate() {
		wp_clear_scheduled_hook( 'consentia_daily_cleanup' );
	}

	/**
	 * Loads the 'consentia' text domain (i18n requirement).
	 *
	 * @return void
	 */
	public function load_textdomain() {
		load_plugin_textdomain( 'consentia', false, dirname( plugin_basename( CONSENTIA_FILE ) ) . '/languages' );
	}

	/**
	 * First-run pointer to the settings screen.
	 *
	 * @return void
	 */
	public function first_run_notice() {
		if ( ! current_user_can( 'manage_options' ) || ! get_option( 'consentia_first_run' ) ) {
			return;
		}

		printf(
			'<div class="notice notice-info is-dismissible"><p><strong>Consentia:</strong> %s <a href="%s">%s</a>.</p></div>',
			esc_html__( 'el plugin está activo. Personaliza tu banner de cookies en', 'consentia' ),
			esc_url( admin_url( 'options-general.php?page=consentia' ) ),
			esc_html__( 'Ajustes → Consentia', 'consentia' )
		);

		delete_option( 'consentia_first_run' );
	}

	/**
	 * AJAX handler: stores an explicit consent decision as legal proof.
	 *
	 * Expected POST: nonce, categories (JSON), consent_type, url.
	 * Consent is ONLY ever recorded after an explicit click — the front
	 * script never sends this on scroll or navigation (GDPR recital 32).
	 *
	 * @return void
	 */
	public function ajax_save_consent() {
		check_ajax_referer( 'consentia_ajax', 'nonce' );

		$raw      = isset( $_POST['categories'] ) ? wp_unslash( $_POST['categories'] ) : '';
		$decoded  = json_decode( (string) $raw, true );
		$incoming = is_array( $decoded ) ? $decoded : array();

		// Whitelist: only the four legal categories, cast to booleans.
		$categories = array( 'necessary' => true );
		foreach ( array( 'preferences', 'statistics', 'marketing' ) as $key ) {
			$categories[ $key ] = ! empty( $incoming[ $key ] );
		}

		$type = isset( $_POST['consent_type'] ) ? sanitize_key( wp_unslash( $_POST['consent_type'] ) ) : 'granted';
		if ( ! in_array( $type, array( 'granted', 'rejected', 'updated', 'revoked', 'gpc', 'reset' ), true ) ) {
			$type = 'granted';
		}

		$url = isset( $_POST['url'] ) ? esc_url_raw( wp_unslash( $_POST['url'] ) ) : '';

		Consentia_Logger::log_consent( $categories, $type, $url );

		wp_send_json_success( array( 'logged' => true ) );
	}

	/**
	 * AJAX handler: consent withdrawal (GDPR art. 7.3 — as easy to
	 * withdraw as to give). The front script reloads right after, so all
	 * non-essential scripts stop immediately.
	 *
	 * @return void
	 */
	public function ajax_reset_consent() {
		check_ajax_referer( 'consentia_ajax', 'nonce' );

		$url = isset( $_POST['url'] ) ? esc_url_raw( wp_unslash( $_POST['url'] ) ) : '';

		Consentia_Logger::log_consent( array( 'necessary' => true ), 'revoked', $url );

		wp_send_json_success( array( 'revoked' => true ) );
	}

	/**
	 * Streams the consent log as CSV (capability + nonce guarded).
	 *
	 * @return void
	 */
	public function export_csv() {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'No tienes permisos para exportar el registro.', 'consentia' ) );
		}

		check_admin_referer( 'consentia_export' );

		Consentia_Logger::export_csv();
	}

	/**
	 * [consentia_policy] — renders the detailed cookie policy template
	 * (LSSI-CE art. 22.2 + GDPR arts. 12–13 information duties).
	 *
	 * @param array $atts Shortcode attributes (unused).
	 * @return string
	 */
	public function shortcode_policy( $atts = array() ) {
		$settings = Consentia_Settings::get();

		ob_start();
		include CONSENTIA_PATH . 'templates/cookie-policy.php';
		return (string) ob_get_clean();
	}
}

Consentia::instance();
