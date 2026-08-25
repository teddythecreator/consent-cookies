<?php
/**
 * Consent proof log for Consentia.
 *
 * GDPR art. 7.1 requires the controller to demonstrate that the data
 * subject consented. This class stores every decision (accept, reject,
 * update, withdraw) in a dedicated table: IP (optionally hashed), user
 * agent, timestamp, categories, plugin version and page URL.
 *
 * @package Consentia
 */

defined( 'ABSPATH' ) || exit;

class Consentia_Logger {

	/**
	 * Returns the log table name (prefixed).
	 *
	 * @return string
	 */
	public static function table() {
		global $wpdb;
		return $wpdb->prefix . 'consentia_consents';
	}

	/**
	 * Creates the log table on activation (idempotent dbDelta).
	 *
	 * @return void
	 */
	public static function maybe_create_table() {
		global $wpdb;

		require_once ABSPATH . 'wp-admin/includes/upgrade.php';

		$table   = self::table();
		$charset = $wpdb->get_charset_collate();

		$sql = "CREATE TABLE {$table} (
			id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
			consent_type varchar(20) NOT NULL DEFAULT 'granted',
			categories longtext NOT NULL,
			ip_address varchar(64) NOT NULL DEFAULT '',
			user_agent text NULL,
			page_url text NULL,
			plugin_version varchar(20) NOT NULL,
			consented_at datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
			PRIMARY KEY  (id),
			KEY consented_at (consented_at),
			KEY consent_type (consent_type)
		) {$charset};";

		dbDelta( $sql );
	}

	/**
	 * Inserts one consent decision.
	 *
	 * The IP is hashed (one-way) when the site enables it, so the log is
	 * evidence without becoming personal-data heavy.
	 *
	 * @param array  $categories Map category => bool.
	 * @param string $type       granted | rejected | updated | revoked | gpc | reset.
	 * @param string $url        Page where the decision happened.
	 * @return int|false Inserted row ID.
	 */
	public static function log_consent( $categories, $type = 'granted', $url = '' ) {
		global $wpdb;

		$settings = Consentia_Settings::get();

		$ip = '';
		if ( ! empty( $settings['log_ip'] ) ) {
			$ip = wp_hash( self::get_user_ip() . '|' . wp_salt() );
		}

		if ( '' === $url && ! empty( $_SERVER['REQUEST_URI'] ) ) {
			$url = esc_url_raw( home_url( wp_unslash( $_SERVER['REQUEST_URI'] ) ) );
		}

		$user_agent = ! empty( $_SERVER['HTTP_USER_AGENT'] )
			? sanitize_text_field( wp_unslash( $_SERVER['HTTP_USER_AGENT'] ) )
			: '';

		$result = $wpdb->insert(
			self::table(),
			array(
				'consent_type'   => sanitize_key( $type ),
				'categories'     => (string) wp_json_encode( $categories ),
				'ip_address'     => $ip,
				'user_agent'     => $user_agent,
				'page_url'       => esc_url_raw( $url ),
				'plugin_version' => CONSENTIA_VERSION,
				'consented_at'   => current_time( 'mysql', true ),
			),
			array( '%s', '%s', '%s', '%s', '%s', '%s', '%s' )
		);

		return false === $result ? false : (int) $wpdb->insert_id;
	}

	/**
	 * Real visitor IP with proxy / Cloudflare / load-balancer support.
	 *
	 * Walks CF-Connecting-IP → X-Forwarded-For → X-Real-IP → REMOTE_ADDR
	 * and ignores private/reserved ranges in forwarded lists.
	 *
	 * @return string
	 */
	public static function get_user_ip() {
		$headers = array( 'HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'REMOTE_ADDR' );

		foreach ( $headers as $header ) {
			if ( empty( $_SERVER[ $header ] ) ) {
				continue;
			}

			$list  = explode( ',', wp_unslash( $_SERVER[ $header ] ) );
			$candidate = trim( $list[0] );

			if ( filter_var( $candidate, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE ) ) {
				return $candidate;
			}
		}

		return ! empty( $_SERVER['REMOTE_ADDR'] ) ? wp_unslash( $_SERVER['REMOTE_ADDR'] ) : '';
	}

	/**
	 * Latest decisions for the admin table.
	 *
	 * @param int $limit  Rows to fetch.
	 * @param int $offset Pagination offset.
	 * @return array<int, object>
	 */
	public static function get_consents( $limit = 100, $offset = 0 ) {
		global $wpdb;

		$limit  = max( 1, min( 500, (int) $limit ) );
		$offset = max( 0, (int) $offset );

		return $wpdb->get_results(
			$wpdb->prepare(
				"SELECT id, consent_type, categories, ip_address, page_url, plugin_version, consented_at
				FROM " . self::table() . "
				ORDER BY consented_at DESC
				LIMIT %d OFFSET %d",
				$limit,
				$offset
			)
		);
	}

	/**
	 * Totals for the last N days, by decision type.
	 *
	 * @param int $days Window in days.
	 * @return array{granted:int,rejected:int,updated:int,revoked:int,total:int}
	 */
	public static function count_recent( $days = 30 ) {
		global $wpdb;

		$since = gmdate( 'Y-m-d H:i:s', time() - ( absint( $days ) * DAY_IN_SECONDS ) );

		$rows = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT consent_type, COUNT(*) AS total
				FROM " . self::table() . "
				WHERE consented_at >= %s
				GROUP BY consent_type",
				$since
			)
		);

		$out = array( 'granted' => 0, 'rejected' => 0, 'updated' => 0, 'revoked' => 0, 'total' => 0 );
		foreach ( (array) $rows as $row ) {
			if ( isset( $out[ $row->consent_type ] ) ) {
				$out[ $row->consent_type ] = (int) $row->total;
			}
			$out['total'] += (int) $row->total;
		}

		return $out;
	}

	/**
	 * Daily scheduled purge beyond the configured retention (GDPR art. 5.1.e
	 * storage limitation).
	 *
	 * @return void
	 */
	public static function scheduled_purge() {
		$settings = Consentia_Settings::get();

		if ( empty( $settings['log_enabled'] ) ) {
			return;
		}

		self::purge_older_than( (int) $settings['log_retention_days'] );
	}

	/**
	 * Deletes rows older than N days.
	 *
	 * @param int $days Retention window.
	 * @return int Deleted rows.
	 */
	public static function purge_older_than( $days ) {
		global $wpdb;

		$cutoff = gmdate( 'Y-m-d H:i:s', time() - ( max( 1, (int) $days ) * DAY_IN_SECONDS ) );

		return (int) $wpdb->query(
			$wpdb->prepare( "DELETE FROM " . self::table() . " WHERE consented_at < %s", $cutoff )
		);
	}

	/**
	 * Removes every row (admin action, double-confirmed in the UI).
	 *
	 * @return int Deleted rows.
	 */
	public static function purge_all() {
		global $wpdb;
		return (int) $wpdb->query( "TRUNCATE TABLE " . self::table() );
	}

	/**
	 * Streams the whole log as CSV download.
	 *
	 * @return void
	 */
	public static function export_csv() {
		global $wpdb;

		$rows = $wpdb->get_results(
			"SELECT consented_at, consent_type, categories, ip_address, user_agent, page_url, plugin_version
			FROM " . self::table() . "
			ORDER BY consented_at DESC",
			ARRAY_A
		);

		nocache_headers();
		header( 'Content-Type: text/csv; charset=utf-8' );
		header( 'Content-Disposition: attachment; filename=consentia-consents-' . gmdate( 'Y-m-d' ) . '.csv' );

		$out = fopen( 'php://output', 'w' );
		fprintf( $out, chr( 0xEF ) . chr( 0xBB ) . chr( 0xBF ) ); // UTF-8 BOM for Excel.

		fputcsv(
			$out,
			array( 'Fecha (UTC)', 'Decisión', 'Categorías', 'IP (hash)', 'User Agent', 'URL', 'Versión plugin' ),
			';'
		);

		foreach ( (array) $rows as $row ) {
			fputcsv(
				$out,
				array(
					$row['consented_at'],
					$row['consent_type'],
					$row['categories'],
					$row['ip_address'],
					$row['user_agent'],
					$row['page_url'],
					$row['plugin_version'],
				),
				';'
			);
		}

		fclose( $out );
		exit;
	}
}
