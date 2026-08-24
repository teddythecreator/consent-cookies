<?php
/**
 * Consent log for Consentia.
 *
 * Stores every consent decision in a dedicated table, exposes a public
 * REST endpoint for the front script, and provides admin tools:
 * stats (last 30 days), CSV export, purge and retention cleanup.
 *
 * @package Consentia
 */

defined( 'ABSPATH' ) || exit;

class Consentia_Logger {

	/**
	 * Singleton instance.
	 *
	 * @var Consentia_Logger|null
	 */
	private static $instance = null;

	/**
	 * Returns the singleton instance.
	 *
	 * @return Consentia_Logger
	 */
	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Log table name (with prefix).
	 *
	 * @return string
	 */
	public static function table() {
		global $wpdb;
		return $wpdb->prefix . 'consentia_log';
	}

	/**
	 * Creates or upgrades the log table.
	 *
	 * @return void
	 */
	public static function create_table() {
		global $wpdb;

		require_once ABSPATH . 'wp-admin/includes/upgrade.php';

		$table   = self::table();
		$charset = $wpdb->get_charset_collate();

		$sql = "CREATE TABLE {$table} (
			id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
			consent_id CHAR(36) NOT NULL,
			consent_date DATETIME NOT NULL,
			consent TEXT NOT NULL,
			consent_source VARCHAR(32) NOT NULL DEFAULT 'banner',
			consent_version VARCHAR(32) NOT NULL DEFAULT '',
			country VARCHAR(2) NOT NULL DEFAULT '',
			visitor_hash CHAR(64) NOT NULL DEFAULT '',
			ip_hash CHAR(64) DEFAULT NULL,
			user_agent VARCHAR(191) NOT NULL DEFAULT '',
			PRIMARY KEY  (id),
			KEY consent_date (consent_date),
			KEY consent_source (consent_source),
			KEY visitor_hash (visitor_hash)
		) {$charset};";

		dbDelta( $sql );
	}

	/**
	 * Hooks.
	 */
	private function __construct() {
		add_action( 'rest_api_init', array( $this, 'rest_routes' ) );
		add_action( 'admin_post_consentia_export_csv', array( $this, 'export_csv' ) );
		add_action( 'wp_ajax_consentia_log_stats', array( $this, 'ajax_stats' ) );
		add_action( 'wp_ajax_consentia_log_purge', array( $this, 'ajax_purge' ) );
		add_action( 'wp_ajax_consentia_log_latest', array( $this, 'ajax_latest' ) );
		add_action( 'consentia_daily_cleanup', array( $this, 'cleanup' ) );

		if ( ! wp_next_scheduled( 'consentia_daily_cleanup' ) ) {
			wp_schedule_event( time(), 'daily', 'consentia_daily_cleanup' );
		}
	}

	/**
	 * Public endpoint so the front script can record decisions.
	 *
	 * @return void
	 */
	public function rest_routes() {
		register_rest_route(
			'consentia/v1',
			'/log',
			array(
				'methods'             => 'POST',
				'permission_callback' => '__return_true',
				'callback'            => array( $this, 'rest_log' ),
				'args'                => array(
					'consent'         => array( 'required' => true, 'type' => 'object' ),
					'source'          => array( 'required' => false, 'type' => 'string' ),
					'visitor_id'      => array( 'required' => false, 'type' => 'string' ),
					'consent_version' => array( 'required' => false, 'type' => 'string' ),
				),
			)
		);
	}

	/**
	 * REST callback: persist one decision.
	 *
	 * @param WP_REST_Request $request Incoming request.
	 * @return WP_REST_Response
	 */
	public function rest_log( $request ) {
		$settings = Consentia_Settings::get();

		if ( empty( $settings['log_enabled'] ) ) {
			return rest_ensure_response( array( 'ok' => false, 'reason' => 'log_disabled' ) );
		}

		$consent = $request->get_param( 'consent' );
		$source  = sanitize_key( (string) $request->get_param( 'source' ) );
		$vid     = sanitize_text_field( (string) $request->get_param( 'visitor_id' ) );
		$version = sanitize_text_field( (string) $request->get_param( 'consent_version' ) );

		if ( empty( $consent ) || ! is_array( $consent ) ) {
			return rest_ensure_response( array( 'ok' => false, 'reason' => 'bad_consent' ) );
		}

		$allowed = array( 'accepted', 'rejected', 'custom', 'gpc', 'sync', 'renewed' );
		if ( ! in_array( $source, $allowed, true ) ) {
			$source = 'banner';
		}

		$geo     = Consentia_Geo::instance();
		$country = $geo->visitor_country();

		$this->log( $consent, $source, $country, $vid, $version );

		return rest_ensure_response( array( 'ok' => true ) );
	}

	/**
	 * Inserts one row in the log.
	 *
	 * @param array  $consent Category => bool map.
	 * @param string $source  Where the decision came from.
	 * @param string $country ISO country code, if known.
	 * @param string $visitor_id Client-side random visitor id.
	 * @param string $version Banner text/version hash.
	 * @return int|false Insert id.
	 */
	public function log( $consent, $source = 'banner', $country = '', $visitor_id = '', $version = '' ) {
		global $wpdb;

		$settings = Consentia_Settings::get();

		$payload = array(
			'necessary'   => true,
			'functional'  => ! empty( $consent['functional'] ),
			'analytics'   => ! empty( $consent['analytics'] ),
			'performance' => ! empty( $consent['performance'] ),
			'advertising' => ! empty( $consent['advertising'] ),
		);

		$data = array(
			'consent_id'      => wp_generate_uuid4(),
			'consent_date'    => current_time( 'mysql', true ),
			'consent'         => wp_json_encode( $payload ),
			'consent_source'  => $source,
			'consent_version' => $version,
			'country'         => strtoupper( substr( sanitize_text_field( $country ), 0, 2 ) ),
			'visitor_hash'    => $visitor_id ? wp_hash( $visitor_id, 'nonce' ) : '',
			'ip_hash'         => ! empty( $settings['log_ip'] ) ? wp_hash( $this->client_ip(), 'nonce' ) : null,
			'user_agent'      => isset( $_SERVER['HTTP_USER_AGENT'] ) ? substr( sanitize_text_field( wp_unslash( $_SERVER['HTTP_USER_AGENT'] ) ), 0, 191 ) : '',
		);

		$wpdb->insert( self::table(), $data ); // phpcs:ignore -- arrays above are sanitized.

		return $wpdb->insert_id;
	}

	/**
	 * Best-effort client IP, anonymized downstream via hashing.
	 *
	 * @return string
	 */
	private function client_ip() {
		$keys = array( 'HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR' );
		foreach ( $keys as $key ) {
			if ( ! empty( $_SERVER[ $key ] ) ) {
				$ip = explode( ',', sanitize_text_field( wp_unslash( $_SERVER[ $key ] ) ) );
				return trim( $ip[0] );
			}
		}
		return '';
	}

	/**
	 * Aggregated stats for the admin chart.
	 *
	 * @return array{totals: array<string,int>, daily: array<int, array{date: string, accepted: int, rejected: int, custom: int}>}
	 */
	public function stats() {
		global $wpdb;

		$table = self::table();

		$totals = array( 'accepted' => 0, 'rejected' => 0, 'custom' => 0, 'gpc' => 0, 'sync' => 0 );
		$rows   = $wpdb->get_results(
			"SELECT consent_source, COUNT(*) AS total FROM {$table} GROUP BY consent_source",
			ARRAY_A
		);

		if ( is_array( $rows ) ) {
			foreach ( $rows as $row ) {
				if ( isset( $totals[ $row['consent_source'] ] ) ) {
					$totals[ $row['consent_source'] ] = (int) $row['total'];
				}
			}
		}

		$daily_rows = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT DATE(consent_date) AS d, consent_source, COUNT(*) AS total
				 FROM {$table}
				 WHERE consent_date >= %s
				 GROUP BY d, consent_source
				 ORDER BY d ASC",
				gmdate( 'Y-m-d H:i:s', strtotime( '-30 days' ) )
			),
			ARRAY_A
		);

		$daily = array();
		if ( is_array( $daily_rows ) ) {
			foreach ( $daily_rows as $row ) {
				$date = $row['d'];
				if ( ! isset( $daily[ $date ] ) ) {
					$daily[ $date ] = array( 'date' => $date, 'accepted' => 0, 'rejected' => 0, 'custom' => 0 );
				}
				$source = $row['consent_source'];
				if ( in_array( $source, array( 'accepted', 'rejected', 'custom' ), true ) ) {
					$daily[ $date ][ $source ] = (int) $row['total'];
				}
			}
		}

		return array(
			'totals' => $totals,
			'daily'  => array_values( $daily ),
		);
	}

	/**
	 * AJAX: stats for the Registro tab.
	 *
	 * @return void
	 */
	public function ajax_stats() {
		check_ajax_referer( 'consentia_admin', 'nonce' );

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array( 'message' => 'forbidden' ), 403 );
		}

		wp_send_json_success( $this->stats() );
	}

	/**
	 * AJAX: latest entries preview.
	 *
	 * @return void
	 */
	public function ajax_latest() {
		global $wpdb;

		check_ajax_referer( 'consentia_admin', 'nonce' );

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array( 'message' => 'forbidden' ), 403 );
		}

		$table = self::table();
		$rows  = $wpdb->get_results(
			"SELECT consent_id, consent_date, consent, consent_source, country FROM {$table} ORDER BY id DESC LIMIT 10",
			ARRAY_A
		);

		wp_send_json_success( array( 'rows' => is_array( $rows ) ? $rows : array() ) );
	}

	/**
	 * AJAX: delete every entry.
	 *
	 * @return void
	 */
	public function ajax_purge() {
		global $wpdb;

		check_ajax_referer( 'consentia_admin', 'nonce' );

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array( 'message' => 'forbidden' ), 403 );
		}

		$wpdb->query( 'TRUNCATE TABLE ' . self::table() ); // phpcs:ignore -- table name is ours.

		wp_send_json_success( array( 'message' => 'purged' ) );
	}

	/**
	 * Streams the full log as CSV (admin-post, manage_options only).
	 *
	 * @return void
	 */
	public function export_csv() {
		global $wpdb;

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'No tienes permisos para exportar el registro.', 'consentia' ) );
		}

		if ( ! isset( $_GET['_wpnonce'] ) || ! wp_verify_nonce( sanitize_key( wp_unslash( $_GET['_wpnonce'] ) ), 'consentia_export' ) ) {
			wp_die( esc_html__( 'Solicitud no válida.', 'consentia' ) );
		}

		$table = self::table();
		$rows  = $wpdb->get_results( "SELECT * FROM {$table} ORDER BY id ASC", ARRAY_A ); // phpcs:ignore -- table name is ours.

		header( 'Content-Type: text/csv; charset=utf-8' );
		header( 'Content-Disposition: attachment; filename="consentia-log-' . gmdate( 'Y-m-d' ) . '.csv"' );

		$out = fopen( 'php://output', 'w' );
		fputcsv( $out, array( 'id', 'consent_id', 'consent_date', 'necessary', 'functional', 'analytics', 'performance', 'advertising', 'consent_source', 'consent_version', 'country', 'visitor_hash', 'ip_hash', 'user_agent' ) );

		if ( is_array( $rows ) ) {
			foreach ( $rows as $row ) {
				$consent = json_decode( (string) $row['consent'], true );
				if ( ! is_array( $consent ) ) {
					$consent = array();
				}
				fputcsv(
					$out,
					array(
						$row['id'],
						$row['consent_id'],
						$row['consent_date'],
						empty( $consent['necessary'] ) ? '0' : '1',
						empty( $consent['functional'] ) ? '0' : '1',
						empty( $consent['analytics'] ) ? '0' : '1',
						empty( $consent['performance'] ) ? '0' : '1',
						empty( $consent['advertising'] ) ? '0' : '1',
						$row['consent_source'],
						$row['consent_version'],
						$row['country'],
						$row['visitor_hash'],
						$row['ip_hash'],
						$row['user_agent'],
					)
				);
			}
		}

		fclose( $out );
		exit;
	}

	/**
	 * Removes entries older than the retention window.
	 *
	 * @return void
	 */
	public function cleanup() {
		global $wpdb;

		$settings = Consentia_Settings::get();
		$days     = max( 1, (int) $settings['log_retention_days'] );

		$wpdb->query(
			$wpdb->prepare(
				'DELETE FROM ' . self::table() . ' WHERE consent_date < %s', // phpcs:ignore -- table name is ours.
				gmdate( 'Y-m-d H:i:s', strtotime( "-{$days} days" ) )
			)
		);
	}
}
