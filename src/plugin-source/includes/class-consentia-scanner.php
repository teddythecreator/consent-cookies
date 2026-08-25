<?php
/**
 * Cookie scanner for Consentia.
 *
 * Audits the site in two passes:
 *  1. Server side — every cookie present in the request ($_COOKIE) plus
 *     third-party tracker domains found in registered scripts.
 *  2. Client side — the admin JS reads document.cookie and merges it in.
 *
 * Results are classified against a built-in pattern list and stored in
 * an option; admins can re-classify each entry and save.
 *
 * @package Consentia
 */

defined( 'ABSPATH' ) || exit;

class Consentia_Scanner {

	/**
	 * Option that stores the last scan.
	 */
	const OPTION = 'consentia_scan';

	/**
	 * Singleton instance.
	 *
	 * @var Consentia_Scanner|null
	 */
	private static $instance = null;

	/**
	 * Returns the singleton instance.
	 *
	 * @return Consentia_Scanner
	 */
	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Known cookie patterns: prefix/substring => [ name, category ].
	 *
	 * @return array<string, array{0: string, 1: string}>
	 */
	public static function cookie_patterns() {
		return array(
			'_ga'                       => array( 'Google Analytics', 'analytics' ),
			'_gid'                      => array( 'Google Analytics', 'analytics' ),
			'_gat'                      => array( 'Google Analytics', 'analytics' ),
			'_gcl_'                     => array( 'Google Ads conversion links', 'advertising' ),
			'AMP_TOKEN'                 => array( 'Google AMP', 'analytics' ),
			'__gads'                    => array( 'Google Ads', 'advertising' ),
			'_fbp'                      => array( 'Meta / Facebook Pixel', 'advertising' ),
			'_fbc'                      => array( 'Meta / Facebook click', 'advertising' ),
			'fr'                        => array( 'Meta / Facebook', 'advertising' ),
			'_pin_unauth'               => array( 'Pinterest Tag', 'advertising' ),
			'_tt_enable_cookie'         => array( 'TikTok Pixel', 'advertising' ),
			'_hj'                       => array( 'Hotjar', 'analytics' ),
			'_clck'                     => array( 'Microsoft Clarity', 'analytics' ),
			'_clsk'                     => array( 'Microsoft Clarity', 'analytics' ),
			'MUID'                      => array( 'Microsoft / Bing', 'advertising' ),
			'IDE'                       => array( 'Google DoubleClick', 'advertising' ),
			'test_cookie'               => array( 'Google DoubleClick', 'advertising' ),
			'_ga_'                      => array( 'Google Analytics 4', 'analytics' ),
			'pll_language'              => array( 'Polylang', 'functional' ),
			'wp-wpml_current_language'  => array( 'WPML', 'functional' ),
			'wp-settings'               => array( 'WordPress', 'necessary' ),
			'wordpress_logged_in'       => array( 'WordPress (sesión)', 'necessary' ),
			'wordpress_sec'             => array( 'WordPress (sesión)', 'necessary' ),
			'woocommerce_'              => array( 'WooCommerce', 'necessary' ),
			'wp_woocommerce_session'    => array( 'WooCommerce (carrito)', 'necessary' ),
			'cookielawinfo'             => array( 'Otro gestor de cookies', 'functional' ),
			'cookieyes'                 => array( 'CookieYes', 'functional' ),
			'consentia'                 => array( 'Consentia', 'necessary' ),
			'comment_author'            => array( 'WordPress (comentarios)', 'functional' ),
		);
	}

	/**
	 * Known third-party tracker domains found in script srcs.
	 *
	 * @return array<string, array{0: string, 1: string}>
	 */
	public static function tracker_domains() {
		return array(
			'google-analytics.com'        => array( 'Google Analytics', 'analytics' ),
			'googletagmanager.com'        => array( 'Google Tag Manager', 'analytics' ),
			'doubleclick.net'             => array( 'Google DoubleClick', 'advertising' ),
			'googleads.g.doubleclick.net' => array( 'Google Ads', 'advertising' ),
			'facebook.net'                => array( 'Meta / Facebook Pixel', 'advertising' ),
			'connect.facebook.net'        => array( 'Meta / Facebook', 'advertising' ),
			'hotjar.com'                  => array( 'Hotjar', 'analytics' ),
			'clarity.ms'                  => array( 'Microsoft Clarity', 'analytics' ),
			'tiktok.com'                  => array( 'TikTok Pixel', 'advertising' ),
			'pinterest'                   => array( 'Pinterest Tag', 'advertising' ),
			'ads.linkedin.com'            => array( 'LinkedIn Insight', 'advertising' ),
			'ads-twitter.com'             => array( 'X / Twitter Pixel', 'advertising' ),
			'addthis.com'                 => array( 'AddThis', 'advertising' ),
			'sharethis.com'               => array( 'ShareThis', 'advertising' ),
			'outbrain.com'                => array( 'Outbrain', 'advertising' ),
			'taboola.com'                 => array( 'Taboola', 'advertising' ),
			'crisp.chat'                  => array( 'Crisp (chat)', 'functional' ),
			'intercom.io'                 => array( 'Intercom (chat)', 'functional' ),
			'hubspot'                     => array( 'HubSpot', 'advertising' ),
			'freshchat.com'               => array( 'Freshchat', 'functional' ),
			'youtube.com/embed'           => array( 'YouTube (incrustación)', 'functional' ),
		);
	}

	/**
	 * Hooks (admin only).
	 */
	private function __construct() {
		add_action( 'wp_ajax_consentia_scan_run', array( $this, 'ajax_run' ) );
		add_action( 'wp_ajax_consentia_scan_save', array( $this, 'ajax_save' ) );
	}

	/**
	 * Classifies one cookie/script name.
	 *
	 * @param string $name Cookie name or script src.
	 * @return array{name: string, category: string, matched: bool}
	 */
	public function classify( $name ) {
		foreach ( self::cookie_patterns() as $pattern => $info ) {
			if ( false !== stripos( $name, $pattern ) ) {
				return array( 'name' => $info[0], 'category' => $info[1], 'matched' => true );
			}
		}
		return array( 'name' => __( 'Sin clasificar', 'consentia' ), 'category' => 'functional', 'matched' => false );
	}

	/**
	 * Server-side pass: request cookies + registered scripts.
	 *
	 * @return array{cookies: array<int, array<string,string>>, scripts: array<int, array<string,string>>}
	 */
	public function run_server_scan() {
		$cookies = array();

		// phpcs:ignore WordPressVIPMinimum.Variables.RestrictedVariables.cache_constraints___COOKIE -- reading is the whole point.
		foreach ( array_keys( $_COOKIE ) as $name ) {
			$name      = sanitize_key( $name );
			$info      = $this->classify( $name );
			$cookies[] = array(
				'id'       => 'cookie-' . md5( $name ),
				'type'     => 'cookie',
				'value'    => $name,
				'provider' => $info['name'],
				'category' => $info['category'],
				'matched'  => $info['matched'] ? '1' : '0',
			);
		}

		$scripts = array();

		if ( function_exists( 'wp_scripts' ) ) {
			$wp_scripts = wp_scripts();
			foreach ( (array) $wp_scripts->registered as $handle => $dep ) {
				$src = isset( $dep->src ) ? (string) $dep->src : '';
				if ( '' === $src ) {
					continue;
				}
				foreach ( self::tracker_domains() as $domain => $info ) {
					if ( false !== stripos( $src, $domain ) ) {
						$scripts[] = array(
							'id'       => 'script-' . md5( $src ),
							'type'     => 'script',
							'value'    => esc_url_raw( $src ),
							'provider' => $info[0],
							'category' => $info[1],
							'matched'  => '1',
						);
						break;
					}
				}
			}
		}

		return array( 'cookies' => $cookies, 'scripts' => $scripts );
	}

	/**
	 * AJAX: run the server pass (admin JS merges document.cookie).
	 *
	 * @return void
	 */
	public function ajax_run() {
		check_ajax_referer( 'consentia_admin', 'nonce' );

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array( 'message' => 'forbidden' ), 403 );
		}

		$scan = $this->run_server_scan();

		update_option(
			self::OPTION,
			array(
				'ran_at'  => current_time( 'mysql' ),
				'cookies' => $scan['cookies'],
				'scripts' => $scan['scripts'],
			)
		);

		wp_send_json_success( $scan );
	}

	/**
	 * AJAX: persist the admin's manual classification.
	 *
	 * @return void
	 */
	public function ajax_save() {
		check_ajax_referer( 'consentia_admin', 'nonce' );

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array( 'message' => 'forbidden' ), 403 );
		}

		$items = isset( $_POST['items'] ) ? wp_unslash( $_POST['items'] ) : ''; // phpcs:ignore -- sanitized below.
		$items = is_string( $items ) ? json_decode( $items, true ) : $items;

		if ( ! is_array( $items ) ) {
			wp_send_json_error( array( 'message' => 'bad_payload' ), 400 );
		}

		$clean   = array();
		$cats    = array( 'necessary', 'functional', 'analytics', 'performance', 'advertising' );

		foreach ( $items as $item ) {
			if ( empty( $item['value'] ) ) {
				continue;
			}
			$clean[] = array(
				'id'       => sanitize_key( (string) $item['id'] ),
				'type'     => in_array( $item['type'], array( 'cookie', 'script' ), true ) ? $item['type'] : 'cookie',
				'value'    => sanitize_text_field( (string) $item['value'] ),
				'provider' => sanitize_text_field( (string) $item['provider'] ),
				'category' => in_array( $item['category'], $cats, true ) ? $item['category'] : 'functional',
				'matched'  => empty( $item['matched'] ) ? '0' : '1',
			);
		}

		update_option(
			self::OPTION,
			array(
				'ran_at'  => current_time( 'mysql' ),
				'cookies' => array_values( array_filter( $clean, function ( $i ) { return 'cookie' === $i['type']; } ) ),
				'scripts' => array_values( array_filter( $clean, function ( $i ) { return 'script' === $i['type']; } ) ),
			)
		);

		wp_send_json_success( array( 'count' => count( $clean ) ) );
	}

	/**
	 * Last saved scan, if any.
	 *
	 * @return array|null
	 */
	public function get_results() {
		$scan = get_option( self::OPTION );
		return is_array( $scan ) ? $scan : null;
	}
}
