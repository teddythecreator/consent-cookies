<?php
/**
 * Consentia uninstall routine.
 *
 * Removes every option the plugin created, on single sites and
 * across every site of a multisite network.
 *
 * @package Consentia
 */

// If uninstall was not called from WordPress, exit.
defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

wp_clear_scheduled_hook( 'consentia_daily_cleanup' );

if ( is_multisite() ) {
	$site_ids = get_sites( array( 'fields' => 'ids' ) );
	foreach ( $site_ids as $site_id ) {
		switch_to_blog( $site_id );
		delete_option( 'consentia_settings' );
		delete_option( 'consentia_first_run' );
		delete_option( 'consentia_table_ok' );
		restore_current_blog();
	}
} else {
	delete_option( 'consentia_settings' );
	delete_option( 'consentia_first_run' );
	delete_option( 'consentia_table_ok' );
}

// Note: the consent proof table ({prefix}consentia_consents) is kept on
// purpose — it is the site owner's legal evidence (GDPR art. 7.1) and
// belongs to the controller, not to the plugin.
