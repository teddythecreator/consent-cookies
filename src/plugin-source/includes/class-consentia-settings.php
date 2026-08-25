<?php
/**
 * Settings for Consentia (v1.2).
 *
 * Tabbed admin screen — Banner, Categorías, Cumplimiento, Geolocalización,
 * Registro (proof log + CSV), Escáner y Herramientas — with a live banner
 * preview and strict whitelist sanitization.
 *
 * @package Consentia
 */

defined( 'ABSPATH' ) || exit;

class Consentia_Settings {

	/**
	 * Option name.
	 */
	const OPTION = 'consentia_settings';

	/**
	 * Singleton instance.
	 *
	 * @var Consentia_Settings|null
	 */
	private static $instance = null;

	/**
	 * Returns the singleton instance.
	 *
	 * @return Consentia_Settings
	 */
	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Hooks (admin only).
	 */
	private function __construct() {
		if ( ! is_admin() ) {
			return;
		}
		add_action( 'admin_menu', array( $this, 'menu' ) );
		add_action( 'admin_init', array( $this, 'register' ) );
		add_action( 'admin_post_consentia_purge_log', array( $this, 'purge_log' ) );
	}

	/**
	 * Sanitized settings (with defaults).
	 *
	 * @return array<string, mixed>
	 */
	public static function get() {
		$saved = get_option( self::OPTION, array() );
		return is_array( $saved ) ? wp_parse_args( $saved, self::defaults() ) : self::defaults();
	}

	/**
	 * Defaults, also used on activation.
	 *
	 * @return array<string, mixed>
	 */
	public static function defaults() {
		return array(
			// Banner.
			'enabled'        => true,
			'banner_type'    => 'card', // card | bar | floating
			'position'       => 'bottom-left',
			'bg_color'       => '#111827',
			'text_color'     => '#f3f4f6',
			'accent_color'   => '#2f6fed',
			'corner_radius'  => 14,
			'show_delay_ms'  => 600,
			'title'          => __( 'Tu privacidad nos importa', 'consentia' ),
			'message'        => __( 'Utilizamos cookies propias y de terceros para que la web funcione, recordar tus preferencias, medir la audiencia y mostrar anuncios relevantes. Puedes aceptarlas, rechazarlas o configurarlas por categoría. Más información en nuestra política de cookies.', 'consentia' ),
			'accept_label'   => __( 'Aceptar todas', 'consentia' ),
			'reject_label'   => __( 'Rechazar', 'consentia' ),
			'prefs_label'    => __( 'Configurar', 'consentia' ),
			'privacy_url'    => '',
			'cookies_url'    => '',
			'custom_css'     => '',
			// Categories (necessary is always on and locked).
			'cat_preferences' => true,
			'cat_statistics'  => true,
			'cat_marketing'   => true,
			// Compliance.
			'consent_mode'          => false, // Google Consent Mode v2
			'consent_mode_advanced' => false,
			'tcf_enabled'           => false, // IAB TCF v2.2
			'tcf_cmp_id'            => 0,
			'tcf_publisher_cc'      => 'ES',
			'ccpa_enabled'          => false, // CCPA/CPRA
			'ccpa_do_not_sell'      => __( 'No vender ni compartir mi información personal', 'consentia' ),
			'gpc_respect'           => true,  // Global Privacy Control
			// Geolocation.
			'geo_enabled'          => false,
			'geo_source'           => 'auto', // auto | cloudflare | maxmind | ipapi
			'geo_maxmind_path'     => '',
			'geo_countries'        => '',
			'geo_country_override' => '',
			// Proof log.
			'log_enabled'        => true,
			'log_retention_days' => 365,
			'log_ip'             => false,
			// Renewal (CNIL/AEPD recommend 6 months; hard cap 365 days).
			'renew_months'    => 6,
			'renew_on_update' => true,
			// Analytics.
			'ga_id' => '',
		);
	}

	/**
	 * Writes defaults on first activation.
	 *
	 * @return void
	 */
	public static function install_defaults() {
		if ( false === get_option( self::OPTION ) ) {
			update_option( self::OPTION, self::defaults() );
		}
		update_option( 'consentia_first_run', 1 );
	}

	/**
	 * Adds "Ajustes → Consentia".
	 *
	 * @return void
	 */
	public function menu() {
		add_options_page(
			__( 'Consentia — Cookies y RGPD', 'consentia' ),
			'Consentia',
			'manage_options',
			'consentia',
			array( $this, 'render_page' )
		);
	}

	/**
	 * Registers sections + fields with strict sanitization.
	 *
	 * @return void
	 */
	public function register() {
		register_setting( 'consentia', self::OPTION, array( 'sanitize_callback' => array( $this, 'sanitize' ) ) );

		add_settings_section( 'consentia_general', __( 'Banner', 'consentia' ), null, 'consentia_general' );
		add_settings_section( 'consentia_categories', __( 'Categorías de cookies', 'consentia' ), null, 'consentia_categories' );
		add_settings_section( 'consentia_compliance', __( 'Cumplimiento', 'consentia' ), null, 'consentia_compliance' );
		add_settings_section( 'consentia_geo', __( 'Geolocalización', 'consentia' ), null, 'consentia_geo' );
		add_settings_section( 'consentia_log', __( 'Registro y caducidad', 'consentia' ), null, 'consentia_log' );
		add_settings_section( 'consentia_tools', __( 'Herramientas', 'consentia' ), null, 'consentia_tools' );

		$add = function ( $id, $title, $section, $args = array() ) {
			add_settings_field( $id, $title, array( $this, 'field' ), $section, $section, array_merge( array( 'id' => $id ), $args ) );
		};

		// Banner.
		$add( 'enabled', __( 'Activar banner', 'consentia' ), 'consentia_general', array( 'type' => 'checkbox' ) );
		$add( 'banner_type', __( 'Formato', 'consentia' ), 'consentia_general', array(
			'type' => 'select',
			'options' => array(
				'card' => __( 'Tarjeta flotante', 'consentia' ),
				'bar' => __( 'Barra a ancho completo', 'consentia' ),
				'floating' => __( 'Píldora flotante (compacta)', 'consentia' ),
			),
		) );
		$add( 'position', __( 'Posición', 'consentia' ), 'consentia_general', array(
			'type' => 'select',
			'options' => array(
				'bottom-left' => __( 'Abajo izquierda', 'consentia' ),
				'bottom-right' => __( 'Abajo derecha', 'consentia' ),
				'bottom-center' => __( 'Abajo centrada', 'consentia' ),
				'top' => __( 'Barra superior', 'consentia' ),
			),
		) );
		$add( 'title', __( 'Título', 'consentia' ), 'consentia_general', array( 'type' => 'text' ) );
		$add( 'message', __( 'Mensaje', 'consentia' ), 'consentia_general', array( 'type' => 'textarea' ) );
		$add( 'accept_label', __( 'Texto «Aceptar»', 'consentia' ), 'consentia_general', array( 'type' => 'text', 'help' => __( 'Los tres botones se muestran siempre al mismo nivel e idéntica visibilidad (directriz EDPB 05/2020).', 'consentia' ) ) );
		$add( 'reject_label', __( 'Texto «Rechazar»', 'consentia' ), 'consentia_general', array( 'type' => 'text' ) );
		$add( 'prefs_label', __( 'Texto «Configurar»', 'consentia' ), 'consentia_general', array( 'type' => 'text' ) );
		$add( 'privacy_url', __( 'URL política de privacidad', 'consentia' ), 'consentia_general', array( 'type' => 'url' ) );
		$add( 'cookies_url', __( 'URL política de cookies', 'consentia' ), 'consentia_general', array( 'type' => 'url', 'help' => __( 'Puedes generarla con el shortcode [consentia_policy] en una página.', 'consentia' ) ) );
		$add( 'show_delay_ms', __( 'Retraso de aparición (ms)', 'consentia' ), 'consentia_general', array( 'type' => 'number', 'min' => 0, 'max' => 5000, 'step' => 50 ) );
		$add( 'bg_color', __( 'Color de fondo', 'consentia' ), 'consentia_general', array( 'type' => 'color' ) );
		$add( 'text_color', __( 'Color de texto', 'consentia' ), 'consentia_general', array( 'type' => 'color' ) );
		$add( 'accent_color', __( 'Color de acento (enlaces)', 'consentia' ), 'consentia_general', array( 'type' => 'color' ) );
		$add( 'corner_radius', __( 'Radio de esquina (px)', 'consentia' ), 'consentia_general', array( 'type' => 'number', 'min' => 0, 'max' => 40 ) );

		// Categories (4 legal categories; necessary is locked by design).
		$add( 'cat_preferences', __( 'Categoría «Preferencias»', 'consentia' ), 'consentia_categories', array( 'type' => 'checkbox', 'help' => __( 'Idioma, región, personalización. Aparece desmarcada por defecto, como exige el RGPD.', 'consentia' ) ) );
		$add( 'cat_statistics', __( 'Categoría «Estadísticas»', 'consentia' ), 'consentia_categories', array( 'type' => 'checkbox' ) );
		$add( 'cat_marketing', __( 'Categoría «Marketing»', 'consentia' ), 'consentia_categories', array( 'type' => 'checkbox' ) );
		$add( 'ga_id', __( 'ID de Google Analytics 4', 'consentia' ), 'consentia_categories', array( 'type' => 'text', 'placeholder' => 'G-XXXXXXX', 'help' => __( 'Solo se inyecta gtag.js si se aceptan las Estadísticas.', 'consentia' ) ) );

		// Compliance.
		$add( 'consent_mode', __( 'Google Consent Mode v2', 'consentia' ), 'consentia_compliance', array( 'type' => 'checkbox', 'help' => __( 'Envía señales ad_storage, analytics_storage, ad_user_data y ad_personalization a Google.', 'consentia' ) ) );
		$add( 'consent_mode_advanced', __( 'Modo avanzado (inyección de tags)', 'consentia' ), 'consentia_compliance', array( 'type' => 'checkbox' ) );
		$add( 'tcf_enabled', __( 'IAB TCF v2.2', 'consentia' ), 'consentia_compliance', array( 'type' => 'checkbox', 'help' => __( 'Registra __tcfapi y genera la TC string con el consentimiento.', 'consentia' ) ) );
		$add( 'tcf_cmp_id', __( 'ID de CMP (registro IAB)', 'consentia' ), 'consentia_compliance', array( 'type' => 'number', 'min' => 0, 'max' => 4095 ) );
		$add( 'tcf_publisher_cc', __( 'Código de país del editor', 'consentia' ), 'consentia_compliance', array( 'type' => 'text', 'placeholder' => 'ES' ) );
		$add( 'ccpa_enabled', __( 'CCPA / CPRA (California)', 'consentia' ), 'consentia_compliance', array( 'type' => 'checkbox', 'help' => __( 'Añade el enlace «Do Not Sell or Share» para visitantes de California.', 'consentia' ) ) );
		$add( 'ccpa_do_not_sell', __( 'Texto «Do Not Sell»', 'consentia' ), 'consentia_compliance', array( 'type' => 'text' ) );
		$add( 'gpc_respect', __( 'Respetar Global Privacy Control', 'consentia' ), 'consentia_compliance', array( 'type' => 'checkbox', 'help' => __( 'Si el navegador envía GPC, se registra un rechazo sin mostrar banner.', 'consentia' ) ) );

		// Geo.
		$add( 'geo_enabled', __( 'Aplicar reglas por geolocalización', 'consentia' ), 'consentia_geo', array( 'type' => 'checkbox', 'help' => __( 'Banner solo para visitantes de la UE/EEE/Reino Unido (y California para CCPA). País desconocido = se pide consentimiento (fail-closed).', 'consentia' ) ) );
		$add( 'geo_source', __( 'Fuente de detección', 'consentia' ), 'consentia_geo', array(
			'type' => 'select',
			'options' => array(
				'auto' => __( 'Automática (Cloudflare → MaxMind → geoip → ipapi.co)', 'consentia' ),
				'cloudflare' => __( 'Solo cabecera Cloudflare', 'consentia' ),
				'maxmind' => __( 'Solo MaxMind GeoIP2 (.mmdb)', 'consentia' ),
				'ipapi' => __( 'Solo ipapi.co (requiere internet)', 'consentia' ),
			),
		) );
		$add( 'geo_maxmind_path', __( 'Ruta al archivo .mmdb', 'consentia' ), 'consentia_geo', array( 'type' => 'text', 'placeholder' => '/ruta/a/GeoLite2-Country.mmdb' ) );
		$add( 'geo_countries', __( 'Países extra (ISO separados por coma)', 'consentia' ), 'consentia_geo', array( 'type' => 'text', 'placeholder' => 'CH, US' ) );
		$add( 'geo_country_override', __( 'Simular país (pruebas)', 'consentia' ), 'consentia_geo', array( 'type' => 'text', 'placeholder' => 'ES' ) );

		// Log + renewal.
		$add( 'log_enabled', __( 'Registrar consentimientos en la base de datos', 'consentia' ), 'consentia_log', array( 'type' => 'checkbox', 'help' => __( 'Tabla ' . Consentia_Logger::table() . ': prueba exigida por el art. 7.1 RGPD.', 'consentia' ) ) );
		$add( 'log_retention_days', __( 'Retención (días)', 'consentia' ), 'consentia_log', array( 'type' => 'number', 'min' => 1, 'max' => 3650 ) );
		$add( 'log_ip', __( 'Guardar IP anonimizada (hash)', 'consentia' ), 'consentia_log', array( 'type' => 'checkbox', 'help' => __( 'Con soporte de proxies y Cloudflare; se almacena como hash irreversible.', 'consentia' ) ) );
		$add( 'renew_months', __( 'Volver a pedir el consentimiento (meses)', 'consentia' ), 'consentia_log', array( 'type' => 'number', 'min' => 1, 'max' => 12, 'help' => __( 'Máximo legal: 365 días. Recomendado CNIL/AEPD: 6 meses.', 'consentia' ) ) );
		$add( 'renew_on_update', __( 'Renovar al cambiar el texto del banner', 'consentia' ), 'consentia_log', array( 'type' => 'checkbox' ) );

		// Tools.
		$add( 'custom_css', __( 'CSS adicional del banner', 'consentia' ), 'consentia_tools', array( 'type' => 'textarea', 'help' => __( 'Se imprime junto al banner. Los botones mantienen el mismo tamaño por ley; ajusta solo colores/espacios adicionales.', 'consentia' ) ) );
	}

	/**
	 * Field renderer.
	 *
	 * @param array $args Field definition.
	 * @return void
	 */
	public function field( $args ) {
		$s    = self::get();
		$id   = $args['id'];
		$val  = isset( $s[ $id ] ) ? $s[ $id ] : '';
		$name = self::OPTION . '[' . $id . ']';

		switch ( $args['type'] ) {
			case 'checkbox':
				printf(
					'<label><input type="checkbox" name="%s" value="1" %s class="consentia-field" data-field="%s" /> %s</label>',
					esc_attr( $name ),
					checked( ! empty( $val ), true, false ),
					esc_attr( $id ),
					esc_html__( 'Activado', 'consentia' )
				);
				break;

			case 'select':
				echo '<select name="' . esc_attr( $name ) . '" class="consentia-field" data-field="' . esc_attr( $id ) . '">';
				foreach ( $args['options'] as $k => $label ) {
					printf( '<option value="%s" %s>%s</option>', esc_attr( $k ), selected( $val, $k, false ), esc_html( $label ) );
				}
				echo '</select>';
				break;

			case 'color':
				printf(
					'<input type="color" name="%s" value="%s" class="consentia-color consentia-field" data-field="%s" />',
					esc_attr( $name ),
					esc_attr( $val ),
					esc_attr( $id )
				);
				break;

			case 'textarea':
				printf(
					'<textarea name="%s" rows="4" class="large-text code consentia-field" data-field="%s">%s</textarea>',
					esc_attr( $name ),
					esc_attr( $id ),
					esc_textarea( $val )
				);
				break;

			case 'number':
				printf(
					'<input type="number" name="%s" value="%s" min="%d" max="%d" step="%d" class="small-text consentia-field" data-field="%s" />',
					esc_attr( $name ),
					esc_attr( $val ),
					isset( $args['min'] ) ? (int) $args['min'] : 0,
					isset( $args['max'] ) ? (int) $args['max'] : 9999,
					isset( $args['step'] ) ? (int) $args['step'] : 1,
					esc_attr( $id )
				);
				break;

			default:
				printf(
					'<input type="%s" name="%s" value="%s" class="regular-text consentia-field" data-field="%s" placeholder="%s" />',
					'url' === $args['type'] ? 'url' : 'text',
					esc_attr( $name ),
					esc_attr( $val ),
					esc_attr( $id ),
					isset( $args['placeholder'] ) ? esc_attr( $args['placeholder'] ) : ''
				);
		}

		if ( ! empty( $args['help'] ) ) {
			echo '<p class="description">' . wp_kses_post( $args['help'] ) . '</p>';
		}
	}

	/**
	 * Whitelist sanitization for every field.
	 *
	 * @param mixed $input Raw form data.
	 * @return array<string, mixed>
	 */
	public function sanitize( $input ) {
		if ( ! is_array( $input ) ) {
			return self::get();
		}

		$hex = function ( $v, $fallback ) {
			$v = is_string( $v ) ? trim( $v ) : '';
			return preg_match( '/^#[0-9a-fA-F]{6}$/', $v ) ? $v : $fallback;
		};
		$int = function ( $v, $min, $max, $fallback ) {
			$n = is_numeric( $v ) ? (int) $v : $fallback;
			return max( $min, min( $max, $n ) );
		};
		$oneof = function ( $v, $allowed, $fallback ) {
			return in_array( $v, $allowed, true ) ? $v : $fallback;
		};

		$d = self::defaults();

		return array(
			'enabled'               => ! empty( $input['enabled'] ),
			'banner_type'           => $oneof( isset( $input['banner_type'] ) ? $input['banner_type'] : '', array( 'card', 'bar', 'floating' ), 'card' ),
			'position'              => $oneof( isset( $input['position'] ) ? $input['position'] : '', array( 'bottom-left', 'bottom-right', 'bottom-center', 'top' ), 'bottom-left' ),
			'bg_color'              => $hex( isset( $input['bg_color'] ) ? $input['bg_color'] : '', $d['bg_color'] ),
			'text_color'            => $hex( isset( $input['text_color'] ) ? $input['text_color'] : '', $d['text_color'] ),
			'accent_color'          => $hex( isset( $input['accent_color'] ) ? $input['accent_color'] : '', $d['accent_color'] ),
			'corner_radius'         => $int( isset( $input['corner_radius'] ) ? $input['corner_radius'] : 0, 0, 40, 14 ),
			'show_delay_ms'         => $int( isset( $input['show_delay_ms'] ) ? $input['show_delay_ms'] : 0, 0, 5000, 600 ),
			'title'                 => isset( $input['title'] ) ? sanitize_text_field( $input['title'] ) : $d['title'],
			'message'               => isset( $input['message'] ) ? sanitize_textarea_field( $input['message'] ) : $d['message'],
			'accept_label'          => isset( $input['accept_label'] ) ? sanitize_text_field( $input['accept_label'] ) : $d['accept_label'],
			'reject_label'          => isset( $input['reject_label'] ) ? sanitize_text_field( $input['reject_label'] ) : $d['reject_label'],
			'prefs_label'           => isset( $input['prefs_label'] ) ? sanitize_text_field( $input['prefs_label'] ) : $d['prefs_label'],
			'privacy_url'           => isset( $input['privacy_url'] ) ? esc_url_raw( $input['privacy_url'] ) : '',
			'cookies_url'           => isset( $input['cookies_url'] ) ? esc_url_raw( $input['cookies_url'] ) : '',
			'custom_css'            => isset( $input['custom_css'] ) ? wp_strip_all_tags( $input['custom_css'] ) : '',

			'cat_preferences'       => ! empty( $input['cat_preferences'] ),
			'cat_statistics'        => ! empty( $input['cat_statistics'] ),
			'cat_marketing'         => ! empty( $input['cat_marketing'] ),

			'consent_mode'          => ! empty( $input['consent_mode'] ),
			'consent_mode_advanced' => ! empty( $input['consent_mode_advanced'] ),
			'tcf_enabled'           => ! empty( $input['tcf_enabled'] ),
			'tcf_cmp_id'            => $int( isset( $input['tcf_cmp_id'] ) ? $input['tcf_cmp_id'] : 0, 0, 4095, 0 ),
			'tcf_publisher_cc'      => preg_match( '/^[A-Za-z]{2}$/', isset( $input['tcf_publisher_cc'] ) ? $input['tcf_publisher_cc'] : '' ) ? strtoupper( $input['tcf_publisher_cc'] ) : 'ES',
			'ccpa_enabled'          => ! empty( $input['ccpa_enabled'] ),
			'ccpa_do_not_sell'      => isset( $input['ccpa_do_not_sell'] ) ? sanitize_text_field( $input['ccpa_do_not_sell'] ) : $d['ccpa_do_not_sell'],
			'gpc_respect'           => ! empty( $input['gpc_respect'] ),

			'geo_enabled'           => ! empty( $input['geo_enabled'] ),
			'geo_source'            => $oneof( isset( $input['geo_source'] ) ? $input['geo_source'] : '', array( 'auto', 'cloudflare', 'maxmind', 'ipapi' ), 'auto' ),
			'geo_maxmind_path'      => isset( $input['geo_maxmind_path'] ) ? sanitize_text_field( $input['geo_maxmind_path'] ) : '',
			'geo_countries'         => isset( $input['geo_countries'] ) ? strtoupper( sanitize_text_field( $input['geo_countries'] ) ) : '',
			'geo_country_override'  => isset( $input['geo_country_override'] ) ? strtoupper( sanitize_text_field( $input['geo_country_override'] ) ) : '',

			'log_enabled'           => ! empty( $input['log_enabled'] ),
			'log_retention_days'    => $int( isset( $input['log_retention_days'] ) ? $input['log_retention_days'] : 365, 1, 3650, 365 ),
			'log_ip'                => ! empty( $input['log_ip'] ),
			'renew_months'          => $int( isset( $input['renew_months'] ) ? $input['renew_months'] : 6, 1, 12, 6 ),
			'renew_on_update'       => ! empty( $input['renew_on_update'] ),

			'ga_id'                 => isset( $input['ga_id'] ) ? sanitize_text_field( $input['ga_id'] ) : '',
		);
	}

	/**
	 * Purges the whole proof log (capability + nonce guarded).
	 *
	 * @return void
	 */
	public function purge_log() {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'No tienes permisos.', 'consentia' ) );
		}
		check_admin_referer( 'consentia_purge' );

		Consentia_Logger::purge_all();

		wp_safe_redirect( admin_url( 'options-general.php?page=consentia' ) );
		exit;
	}

	/**
	 * Tabbed settings screen with live preview.
	 *
	 * @return void
	 */
	public function render_page() {
		$s = self::get();

		wp_enqueue_style( 'consentia-admin', CONSENTIA_URL . 'assets/css/consentia-admin.css', array(), CONSENTIA_VERSION );
		wp_enqueue_script( 'consentia-admin', CONSENTIA_URL . 'assets/js/consentia-admin.js', array(), CONSENTIA_VERSION, true );

		wp_localize_script(
			'consentia-admin',
			'consentiaAdmin',
			array(
				'settings'   => $s,
				'nonce'      => wp_create_nonce( 'consentia_admin' ),
				'ajaxurl'    => admin_url( 'admin-ajax.php' ),
				'saved_text' => __( 'Guardado.', 'consentia' ),
			)
		);

		$tabs = array(
			'general'    => __( 'Banner', 'consentia' ),
			'categories' => __( 'Categorías', 'consentia' ),
			'compliance' => __( 'Cumplimiento', 'consentia' ),
			'geo'        => __( 'Geolocalización', 'consentia' ),
			'log'        => __( 'Registro', 'consentia' ),
			'tools'      => __( 'Herramientas', 'consentia' ),
		);

		echo '<div class="wrap consentia-admin-wrap">';
		echo '<h1>Consentia <span class="consentia-admin-version">' . esc_html( CONSENTIA_VERSION ) . '</span></h1>';
		echo '<p class="description">' . esc_html__( 'Cumplimiento RGPD, LSSI-CE y ePrivacy: consentimiento explícito, bloqueo previo, registro probatorio, revocación y política de cookies.', 'consentia' ) . '</p>';

		echo '<nav class="consentia-admin-tabs" role="tablist" aria-label="' . esc_attr__( 'Secciones de Consentia', 'consentia' ) . '">';
		foreach ( $tabs as $key => $label ) {
			printf(
				'<button type="button" role="tab" class="consentia-admin-tab" data-tab="%s" aria-selected="%s">%s</button>',
				esc_attr( $key ),
				'general' === $key ? 'true' : 'false',
				esc_html( $label )
			);
		}
		echo '</nav>';

		echo '<form method="post" action="options.php" class="consentia-admin-grid">';
		settings_fields( 'consentia' );

		$panes = array(
			'general'    => 'consentia_general',
			'categories' => 'consentia_categories',
			'compliance' => 'consentia_compliance',
			'geo'        => 'consentia_geo',
			'log'        => 'consentia_log',
			'tools'      => 'consentia_tools',
		);

		foreach ( $panes as $key => $section ) {
			printf( '<div class="consentia-admin-pane" data-pane="%s" %s>', esc_attr( $key ), 'general' === $key ? '' : 'hidden' );
			do_settings_sections( $section );
			echo '</div>';
		}

		// Registro pane: proof log view (totals, table, CSV export).
		echo '<div class="consentia-admin-pane" data-pane="log" hidden>';
		include CONSENTIA_PATH . 'admin/views/consents-list.php';
		echo '</div>';

		submit_button( __( 'Guardar cambios', 'consentia' ) );
		echo '</form>';

		// Live preview column.
		echo '<aside class="consentia-admin-preview" aria-live="polite">';
		echo '<p class="consentia-admin-preview-label">' . esc_html__( 'Vista previa en vivo', 'consentia' ) . '</p>';
		echo '<div class="consentia-admin-mini" id="consentia-preview">';
		echo '<div class="consentia-admin-mini-site"><span class="consentia-admin-mini-bar"></span><span class="consentia-admin-mini-line w100"></span><span class="consentia-admin-mini-line w85"></span><span class="consentia-admin-mini-line w70"></span><span class="consentia-admin-mini-line w60"></span></div>';
		echo '<div class="consentia-admin-mini-banner" id="consentia-preview-banner">';
		echo '<strong id="consentia-preview-title"></strong>';
		echo '<small id="consentia-preview-message"></small>';
		echo '<div class="consentia-admin-mini-actions"><em class="a" id="consentia-preview-accept"></em><em class="r" id="consentia-preview-reject"></em><em class="p" id="consentia-preview-prefs"></em></div>';
		echo '<small class="consentia-preview-ccpa" id="consentia-preview-ccpa" hidden></small>';
		echo '</div>';
		echo '</div>';
		echo '<p class="description">' . esc_html__( 'Los tres botones siempre se dibujan al mismo nivel: rechazar es tan fácil como aceptar.', 'consentia' ) . '</p>';
		echo '</aside>';

		echo '</div>'; // .wrap
	}
}
