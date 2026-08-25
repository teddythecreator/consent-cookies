<?php
/**
 * Geolocation for Consentia (v1.2).
 *
 * Decides whether the visitor is under a privacy law that requires
 * consent:
 *   – GDPR/ePrivacy: EU-27 + EEA (NO, IS, LI) + United Kingdom.
 *   – CCPA/CPRA: California (US-CA).
 *
 * Detection sources (no third-party call by default): Cloudflare header,
 * MaxMind GeoIP2 (.mmdb via Composer), PHP geoip extension, or the
 * optional ipapi.co API (cached 12 h in a transient).
 *
 * Fail-closed: any detection error assumes consent IS required.
 *
 * @package Consentia
 */

defined( 'ABSPATH' ) || exit;

class Consentia_Geo {

	/**
	 * GDPR + ePrivacy countries: EU-27, EEA and United Kingdom.
	 *
	 * @var string[]
	 */
	const GDPR_COUNTRIES = array(
		'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE',
		'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT',
		'RO', 'SK', 'SI', 'ES', 'SE', 'NO', 'IS', 'LI', 'GB',
	);

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
	 * Whether the visitor requires a consent banner.
	 *
	 *  – Geo disabled  → always true (always ask: safe default).
	 *  – Unknown/error → true (fail-closed).
	 *  – GDPR country  → true.
	 *  – California    → true (CCPA scope; the banner shows the CCPA notice).
	 *  – Extra countries configured in settings → true.
	 *
	 * @return bool
	 */
	public function requires_consent() {
		$settings = Consentia_Settings::get();

		if ( empty( $settings['geo_enabled'] ) ) {
			return true;
		}

		$country = $this->visitor_country();

		if ( '' === $country ) {
			return true; // Error → assume consent is required.
		}

		if ( in_array( $country, self::GDPR_COUNTRIES, true ) ) {
			return true;
		}

		if ( 'US' === $country && $this->is_california() ) {
			return true; // CCPA / CPRA.
		}

		$extra = array_filter( array_map( 'trim', explode( ',', strtoupper( (string) $settings['geo_countries'] ) ) ) );

		return in_array( $country, $extra, true );
	}

	/**
	 * Detects California within US visitors (CCPA §1798.140).
	 * Uses the Cloudflare region header when available; without region
	 * data it treats every US visitor as potentially Californian
	 * (conservative, fail-closed).
	 *
	 * @return bool
	 */
	public function is_california() {
		if ( ! empty( $_SERVER['HTTP_CF_REGION'] ) ) {
			return 'CA' === strtoupper( trim( wp_unslash( $_SERVER['HTTP_CF_REGION'] ) ) );
		}
		return true;
	}

	/**
	 * Whether the visitor is in the United States (CCPA notices).
	 *
	 * @return bool
	 */
	public function is_us_visitor() {
		return 'US' === $this->visitor_country();
	}

	/**
	 * Detects the visitor country (ISO 3166-1 alpha-2).
	 *
	 * Priority: admin override (testing) → configured source.
	 * Cached in a 12-hour transient keyed by hashed IP.
	 *
	 * @return string Country code, or '' when undetectable.
	 */
	public function visitor_country() {
		$settings = Consentia_Settings::get();

		// Testing override (Settings → Geolocation).
		if ( ! empty( $settings['geo_country_override'] ) ) {
			$override = strtoupper( trim( (string) $settings['geo_country_override'] ) );
			if ( preg_match( '/^[A-Z]{2}$/', $override ) ) {
				return $override;
			}
		}

		$ip = Consentia_Logger::get_user_ip();

		if ( '' === $ip ) {
			return '';
		}

		$cache_key = 'consentia_geo_' . md5( $ip . wp_salt() );
		$cached    = get_transient( $cache_key );

		if ( false !== $cached ) {
			return (string) $cached;
		}

		$country = '';
		$source  = isset( $settings['geo_source'] ) ? $settings['geo_source'] : 'auto';

		if ( in_array( $source, array( 'auto', 'cloudflare' ), true ) ) {
			$country = $this->from_cloudflare();
		}

		if ( '' === $country && in_array( $source, array( 'auto', 'maxmind' ), true ) ) {
			$country = $this->from_maxmind( (string) $settings['geo_maxmind_path'], $ip );
		}

		if ( '' === $country && 'auto' === $source ) {
			$country = $this->from_geoip_ext( $ip );
		}

		if ( '' === $country && in_array( $source, array( 'auto', 'ipapi' ), true ) ) {
			$country = $this->from_ipapi( $ip );
		}

		$country = preg_match( '/^[A-Z]{2}$/', strtoupper( $country ) ) ? strtoupper( $country ) : '';

		set_transient( $cache_key, $country, 12 * HOUR_IN_SECONDS );

		return $country;
	}

	/**
	 * Cloudflare: CF-IPCountry header (free plan).
	 *
	 * @return string
	 */
	private function from_cloudflare() {
		return ! empty( $_SERVER['HTTP_CF_IPCOUNTRY'] ) ? strtoupper( trim( wp_unslash( $_SERVER['HTTP_CF_IPCOUNTRY'] ) ) ) : '';
	}

	/**
	 * MaxMind GeoIP2 .mmdb database via the geoip2/geoip2 Composer package.
	 *
	 * @param string $path Absolute path to GeoLite2-Country.mmdb.
	 * @param string $ip   Visitor IP.
	 * @return string
	 */
	private function from_maxmind( $path, $ip ) {
		if ( '' === $path || ! is_readable( $path ) ) {
			return '';
		}

		$reader_class = '\\GeoIp2\\Database\\Reader';
		if ( ! class_exists( $reader_class ) ) {
			return '';
		}

		try {
			$reader  = new $reader_class( $path );
			$record  = $reader->country( $ip );
			$country = $record->country->isoCode;
			return is_string( $country ) ? $country : '';
		} catch ( \Exception $e ) {
			return '';
		}
	}

	/**
	 * PHP geoip extension (when installed server-side).
	 *
	 * @param string $ip Visitor IP.
	 * @return string
	 */
	private function from_geoip_ext( $ip ) {
		if ( ! function_exists( 'geoip_country_code_by_addr' ) ) {
			return '';
		}

		$country = @geoip_country_code_by_addr( $ip );

		return is_string( $country ) ? $country : '';
	}

	/**
	 * ipapi.co free API (only when selected; result cached 12 h).
	 *
	 * @param string $ip Visitor IP.
	 * @return string
	 */
	private function from_ipapi( $ip ) {
		$response = wp_remote_get(
			'https://ipapi.co/' . rawurlencode( $ip ) . '/country/',
			array( 'timeout' => 3 )
		);

		if ( is_wp_error( $response ) ) {
			return '';
		}

		$body = trim( (string) wp_remote_retrieve_body( $response ) );

		return preg_match( '/^[A-Z]{2}$/', $body ) ? $body : '';
	}
}
