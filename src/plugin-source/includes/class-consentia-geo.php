<?php
/**
 * Visitor geolocation for Consentia.
 *
 * Resolves the visitor country from (in order): a plugin filter, the
 * geo cookie, a Cloudflare header, MaxMind GeoIP2 (composer package,
 * optional) or the PHP geoip extension. Results are cached for 30 days
 * in a cookie. When geo rules are on and the country cannot be
 * resolved, EU rules apply — the safe default.
 *
 * @package Consentia
 */

defined( 'ABSPATH' ) || exit;

class Consentia_Geo {

	/**
	 * Singleton instance.
	 *
	 * @var Consentia_Geo|null
	 */
	private static $instance = null;

	/**
	 * Returns the singleton instance.
	 *
	 * @return Consentia_Geo
	 */
	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * EU member states + EEA + UK (GDPR scope).
	 *
	 * @return string[]
	 */
	public static function gdpr_countries() {
		return array(
			'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU',
			'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
			'IS', 'LI', 'NO', // EEA
			'GB', 'UK',       // United Kingdom
		);
	}

	/**
	 * Hooks.
	 */
	private function __construct() {
		// Nothing to hook: resolution is lazy and cached.
	}

	/**
	 * Returns the visitor ISO-2 country code ('' when unknown).
	 *
	 * @return string
	 */
	public function visitor_country() {
		/**
		 * Allows themes/other plugins to supply the country directly.
		 *
		 * @param string $country ISO-2 code or ''.
		 */
		$filtered = apply_filters( 'consentia_visitor_country', '' );
		if ( $this->is_valid_code( $filtered ) ) {
			return strtoupper( $filtered );
		}

		// 30-day cache.
		if ( isset( $_COOKIE['consentia_geo'] ) && $this->is_valid_code( wp_unslash( $_COOKIE['consentia_geo'] ) ) ) {
			return strtoupper( sanitize_key( wp_unslash( $_COOKIE['consentia_geo'] ) ) );
		}

		$country = $this->detect();

		if ( ! headers_sent() ) {
			setcookie( 'consentia_geo', $country ? $country : 'XX', time() + 30 * DAY_IN_SECONDS, '/', '', is_ssl(), true );
		}

		return $country;
	}

	/**
	 * Detection pipeline.
	 *
	 * @return string ISO-2 code or ''.
	 */
	private function detect() {
		$settings = Consentia_Settings::get();
		$source   = isset( $settings['geo_source'] ) ? $settings['geo_source'] : 'auto';

		// Explicit country list override for testing/edge cases.
		if ( ! empty( $settings['geo_country_override'] ) ) {
			$override = strtoupper( trim( (string) $settings['geo_country_override'] ) );
			if ( $this->is_valid_code( $override ) ) {
				return $override;
			}
		}

		if ( in_array( $source, array( 'auto', 'cloudflare' ), true ) ) {
			$cf = $this->from_cloudflare();
			if ( $cf ) {
				return $cf;
			}
		}

		if ( in_array( $source, array( 'auto', 'maxmind' ), true ) ) {
			$mm = $this->from_maxmind( (string) $settings['geo_maxmind_path'] );
			if ( $mm ) {
				return $mm;
			}
		}

		if ( 'auto' === $source ) {
			$ext = $this->from_geoip_ext();
			if ( $ext ) {
				return $ext;
			}
		}

		return '';
	}

	/**
	 * Cloudflare sets the visitor country in this header.
	 *
	 * @return string
	 */
	private function from_cloudflare() {
		if ( ! empty( $_SERVER['HTTP_CF_IPCOUNTRY'] ) ) {
			$code = strtoupper( sanitize_key( wp_unslash( $_SERVER['HTTP_CF_IPCOUNTRY'] ) ) );
			if ( $this->is_valid_code( $code ) ) {
				return $code;
			}
		}
		return '';
	}

	/**
	 * MaxMind GeoIP2 — needs geoip2/geoip2 installed (Composer).
	 *
	 * @param string $db_path Path to a .mmdb file.
	 * @return string
	 */
	private function from_maxmind( $db_path ) {
		if ( '' === $db_path || ! class_exists( 'GeoIp2\Database\Reader' ) || ! file_exists( $db_path ) ) {
			return '';
		}

		try {
			$ip      = $this->client_ip();
			$reader  = new \GeoIp2\Database\Reader( $db_path );
			$record  = $reader->country( $ip );
			$iso     = $record->country->isoCode;
			return $this->is_valid_code( $iso ) ? strtoupper( $iso ) : '';
		} catch ( \Exception $e ) {
			return '';
		}
	}

	/**
	 * Legacy PHP geoip extension fallback.
	 *
	 * @return string
	 */
	private function from_geoip_ext() {
		if ( ! function_exists( 'geoip_country_code_by_name' ) ) {
			return '';
		}

		$code = @geoip_country_code_by_name( $this->client_ip() ); // phpcs:ignore -- silenced by design.
		return $this->is_valid_code( $code ) ? strtoupper( $code ) : '';
	}

	/**
	 * Client IP helper (proxy-aware).
	 *
	 * @return string
	 */
	private function client_ip() {
		$keys = array( 'HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR' );
		foreach ( $keys as $key ) {
			if ( ! empty( $_SERVER[ $key ] ) ) {
				$ip = explode( ',', sanitize_text_field( wp_unslash( $_SERVER[ $key ] ) ) );
				$ip = trim( $ip[0] );
				if ( filter_var( $ip, FILTER_VALIDATE_IP ) ) {
					return $ip;
				}
			}
		}
		return '';
	}

	/**
	 * Basic ISO-2 shape check.
	 *
	 * @param mixed $code Candidate code.
	 * @return bool
	 */
	private function is_valid_code( $code ) {
		return is_string( $code ) && 1 === preg_match( '/^[A-Z]{2}$/i', $code );
	}

	/**
	 * Should the GDPR banner show for this visitor?
	 *
	 * @return bool
	 */
	public function requires_banner() {
		$settings = Consentia_Settings::get();

		if ( empty( $settings['geo_enabled'] ) ) {
			return true;
		}

		$country = $this->visitor_country();

		if ( '' === $country ) {
			return true; // Unknown → apply EU rules (safe default).
		}

		$extra = array();
		if ( ! empty( $settings['geo_countries'] ) ) {
			$extra = array_map( 'trim', explode( ',', strtoupper( (string) $settings['geo_countries'] ) ) );
		}

		return in_array( $country, array_merge( self::gdpr_countries(), $extra ), true );
	}

	/**
	 * Is the visitor in the US (CCPA/CPRA scope)?
	 *
	 * @return bool
	 */
	public function is_us_visitor() {
		return 'US' === $this->visitor_country();
	}
}
