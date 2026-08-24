<?php
/**
 * Frontend output for Consentia (v1.1).
 *
 * Applies geolocation rules, enqueues banner + TCF assets, exposes the
 * full configuration to the front script and registers shortcodes.
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
	 * Enqueue banner assets and localize configuration.
	 *
	 * @return void
	 */
	public function assets() {
		$settings = Consentia_Settings::get();

		if ( empty( $settings['enabled'] ) ) {
			return;
		}

		$geo = Consentia_Geo::instance();
		if ( ! $geo->requires_banner() ) {
			return; // Visitor outside the GDPR scope: no banner, no TCF.
		}

		wp_enqueue_style( 'consentia', CONSENTIA_URL . 'assets/css/consentia.css', array(), CONSENTIA_VERSION );
		wp_enqueue_script( 'consentia', CONSENTIA_URL . 'assets/js/consentia.js', array(), CONSENTIA_VERSION, true );
		wp_script_add_data( 'consentia', 'defer', true );

		if ( ! empty( $settings['tcf_enabled'] ) ) {
			wp_enqueue_script( 'consentia-tcf', CONSENTIA_URL . 'assets/js/consentia-tcf.js', array( 'consentia' ), CONSENTIA_VERSION, true );
			wp_script_add_data( 'consentia-tcf', 'defer', true );
		}

		wp_localize_script(
			'consentia',
			'consentiaData',
			array(
				'settings'        => $settings,
				'categories'      => $this->categories( $settings ),
				'consent_version' => $this->consent_version( $settings ),
				'log_url'         => ! empty( $settings['log_enabled'] ) ? rest_url( 'consentia/v1/log' ) : '',
				'sync_domains'    => $this->sync_domains( $settings ),
				'geo_country'     => $geo->visitor_country(),
				'ccpa_scope'      => ! empty( $settings['ccpa_enabled'] ) && $geo->is_us_visitor(),
				'gpc'             => ! empty( $settings['gpc_respect'] ),
			)
		);

		if ( '' !== trim( (string) $settings['custom_css'] ) ) {
			wp_add_inline_style( 'consentia', $settings['custom_css'] );
		}
	}

	/**
	 * Hash of banner texts + plugin version, used to re-ask consent
	 * when the wording changes (renew_on_update).
	 *
	 * @param array $settings Sanitized settings.
	 * @return string
	 */
	private function consent_version( $settings ) {
		$material = CONSENTIA_VERSION . '|' . $settings['title'] . '|' . $settings['message'] . '|' . implode( ',', array_keys( $this->categories( $settings ) ) );
		return substr( md5( $material ), 0, 10 );
	}

	/**
	 * Visible categories, necessary always first.
	 *
	 * @param array $settings Sanitized settings.
	 * @return array<string, array<string, mixed>>
	 */
	private function categories( $settings ) {
		$cats = array(
			'necessary' => array(
				'label'       => __( 'Necesarias', 'consentia' ),
				'description' => __( 'Imprescindibles para que la web funcione: sesión, seguridad y carrito. No se pueden desactivar.', 'consentia' ),
				'locked'      => true,
			),
		);

		if ( ! empty( $settings['cat_functional'] ) ) {
			$cats['functional'] = array(
				'label'       => __( 'Funcionales', 'consentia' ),
				'description' => __( 'Recuerdan tus preferencias: idioma, región, chat o reproductor personalizado.', 'consentia' ),
				'locked'      => false,
			);
		}

		if ( ! empty( $settings['cat_analytics'] ) ) {
			$cats['analytics'] = array(
				'label'       => __( 'Analíticas', 'consentia' ),
				'description' => __( 'Nos ayudan a entender cómo se usa la web con datos agregados y anónimos.', 'consentia' ),
				'locked'      => false,
			);
		}

		if ( ! empty( $settings['cat_performance'] ) ) {
			$cats['performance'] = array(
				'label'       => __( 'Rendimiento', 'consentia' ),
				'description' => __( 'Miden tiempos de carga y errores para optimizar la velocidad del sitio.', 'consentia' ),
				'locked'      => false,
			);
		}

		if ( ! empty( $settings['cat_advertising'] ) ) {
			$cats['advertising'] = array(
				'label'       => __( 'Publicidad', 'consentia' ),
				'description' => __( 'Permiten mostrar anuncios relevantes y limitar las veces que los ves.', 'consentia' ),
				'locked'      => false,
			);
		}

		return $cats;
	}

	/**
	 * Parsed list of sibling domains for consent sync.
	 *
	 * @param array $settings Sanitized settings.
	 * @return string[]
	 */
	private function sync_domains( $settings ) {
		$domains = array();
		foreach ( preg_split( '/\r\n|\r|\n/', (string) $settings['sync_domains'] ) as $line ) {
			$url = esc_url_raw( trim( $line ) );
			if ( '' !== $url ) {
				$domains[] = untrailingslashit( $url );
			}
		}
		return array_values( array_unique( $domains ) );
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

		if ( ! Consentia_Geo::instance()->requires_banner() ) {
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
