<?php
/**
 * Plugin Name:       Consentia – Cookie Consent & GDPR
 * Plugin URI:        https://consentia.dev/
 * Description:       Consentimiento de cookies autoalojado: banner con bloqueo real de scripts, escáner de cookies, registro de consentimiento, Google Consent Mode v2, IAB TCF v2.2, CCPA/CPRA, geolocalización y sincronización entre dominios. Sin SaaS, sin límites de visitas.
 * Version:           1.1.0
 * Author:            Thecreator.business
 * Author URI:        https://thecreator.business/
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       consentia
 * Requires at least: 6.0
 * Requires PHP:      7.4
 *
 * @package Consentia
 */

defined( 'ABSPATH' ) || exit;

define( 'CONSENTIA_VERSION', '1.1.0' );
define( 'CONSENTIA_FILE', __FILE__ );
define( 'CONSENTIA_URL', plugin_dir_url( __FILE__ ) );
define( 'CONSENTIA_PATH', plugin_dir_path( __FILE__ ) );

require_once CONSENTIA_PATH . 'includes/class-consentia-settings.php';
require_once CONSENTIA_PATH . 'includes/class-consentia-logger.php';
require_once CONSENTIA_PATH . 'includes/class-consentia-scanner.php';
require_once CONSENTIA_PATH . 'includes/class-consentia-geo.php';
require_once CONSENTIA_PATH . 'includes/class-consentia-frontend.php';

/**
 * Main plugin bootstrap.
 */
final class Consentia {

	/**
	 * Singleton instance.
	 *
	 * @var Consentia|null
	 */
	private static $instance = null;

	/**
	 * Module: settings.
	 *
	 * @var Consentia_Settings
	 */
	public $settings;

	/**
	 * Module: consent log.
	 *
	 * @var Consentia_Logger
	 */
	public $logger;

	/**
	 * Module: cookie scanner.
	 *
	 * @var Consentia_Scanner
	 */
	public $scanner;

	/**
	 * Module: visitor geolocation.
	 *
	 * @var Consentia_Geo
	 */
	public $geo;

	/**
	 * Module: frontend output.
	 *
	 * @var Consentia_Frontend
	 */
	public $frontend;

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
	 * Wires every module.
	 */
	private function __construct() {
		$this->settings = Consentia_Settings::instance();
		$this->logger   = Consentia_Logger::instance();
		$this->scanner  = Consentia_Scanner::instance();
		$this->geo      = Consentia_Geo::instance();
		$this->frontend = Consentia_Frontend::instance();

		register_activation_hook( CONSENTIA_FILE, array( $this, 'activate' ) );
		register_deactivation_hook( CONSENTIA_FILE, array( $this, 'deactivate' ) );

		add_action( 'plugins_loaded', array( $this, 'load_textdomain' ) );
		add_filter( 'plugin_action_links_' . plugin_basename( CONSENTIA_FILE ), array( $this, 'action_links' ) );
		add_action( 'admin_notices', array( $this, 'first_run_notice' ) );
	}

	/**
	 * On activation: default options + consent log table.
	 *
	 * @return void
	 */
	public function activate() {
		Consentia_Settings::install_defaults();
		Consentia_Logger::create_table();
	}

	/**
	 * On deactivation: remove the scheduled cleanup cron.
	 *
	 * @return void
	 */
	public function deactivate() {
		wp_clear_scheduled_hook( 'consentia_daily_cleanup' );
	}

	/**
	 * Loads the translation files.
	 *
	 * @return void
	 */
	public function load_textdomain() {
		load_plugin_textdomain( 'consentia', false, dirname( plugin_basename( CONSENTIA_FILE ) ) . '/languages' );
	}

	/**
	 * Adds a shortcut to the settings screen.
	 *
	 * @param array $links Existing row links.
	 * @return array
	 */
	public function action_links( $links ) {
		$url     = admin_url( 'options-general.php?page=consentia' );
		$links[] = '<a href="' . esc_url( $url ) . '">' . esc_html__( 'Ajustes', 'consentia' ) . '</a>';
		return $links;
	}

	/**
	 * Friendly notice after the first activation.
	 *
	 * @return void
	 */
	public function first_run_notice() {
		if ( ! get_option( 'consentia_first_run' ) ) {
			return;
		}

		$url = admin_url( 'options-general.php?page=consentia' );
		printf(
			'<div class="notice notice-success is-dismissible"><p><strong>Consentia</strong> %s — %s <a href="%s">%s →</a></p></div>',
			esc_html( CONSENTIA_VERSION ),
			esc_html__( 'está activo. Personaliza el banner, lanza el escáner de cookies y revisa el registro de consentimiento en', 'consentia' ),
			esc_url( $url ),
			esc_html__( 'Ajustes → Consentia', 'consentia' )
		);
	}
}

/**
 * Global accessor.
 *
 * @return Consentia
 */
function consentia() {
	return Consentia::instance();
}

consentia();
