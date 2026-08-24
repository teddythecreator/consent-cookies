<?php
/**
 * Frontend output for Consentia.
 *
 * Enqueues the banner assets, passes the sanitized settings to the
 * script, renders the root container and registers shortcodes.
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
		add_action( 'wp_enqueue_scripts', array( $this, 'assets' ) );
		add_action( 'wp_footer', array( $this, 'render_root' ), 20 );
		add_shortcode( 'consentia_manage', array( $this, 'shortcode_manage' ) );
		add_shortcode( 'consentia_status', array( $this, 'shortcode_status' ) );
	}

	/**
	 * Enqueue banner assets and localize settings.
	 *
	 * @return void
	 */
	public function assets() {
		$settings = Consentia_Settings::get();

		if ( empty( $settings['enabled'] ) ) {
			return;
		}

		wp_enqueue_style( 'consentia', CONSENTIA_URL . 'assets/css/consentia.css', array(), CONSENTIA_VERSION );
		wp_enqueue_script( 'consentia', CONSENTIA_URL . 'assets/js/consentia.js', array(), CONSENTIA_VERSION, true );
		wp_script_add_data( 'consentia', 'defer', true );

		wp_localize_script(
			'consentia',
			'consentiaData',
			array(
				'settings'   => $settings,
				'categories' => $this->categories(),
			)
		);
	}

	/**
	 * Cookie categories exposed to the front script.
	 *
	 * @return array<string, array<string, mixed>>
	 */
	private function categories() {
		return array(
			'necessary' => array(
				'label'       => __( 'Necesarias', 'consentia' ),
				'description' => __( 'Imprescindibles para que la web funcione: sesión, seguridad y carrito. No se pueden desactivar.', 'consentia' ),
				'locked'      => true,
			),
			'analytics' => array(
				'label'       => __( 'Analíticas', 'consentia' ),
				'description' => __( 'Nos ayudan a entender cómo se usa la web con datos agregados y anónimos.', 'consentia' ),
				'locked'      => false,
			),
			'marketing' => array(
				'label'       => __( 'Marketing', 'consentia' ),
				'description' => __( 'Permiten mostrar anuncios relevantes y limitar las veces que los ves.', 'consentia' ),
				'locked'      => false,
			),
		);
	}

	/**
	 * Root container; the banner DOM is built by consentia.js.
	 *
	 * @return void
	 */
	public function render_root() {
		$settings = Consentia_Settings::get();

		if ( empty( $settings['enabled'] ) ) {
			return;
		}

		echo '<div id="consentia-root" aria-live="polite"></div>' . "\n";
	}

	/**
	 * [consentia_manage] — button that reopens the preferences panel.
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
