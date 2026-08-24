<?php
/**
 * Plugin Name:       Consentia – Cookie Consent & GDPR
 * Plugin URI:        https://consentia.dev/
 * Description:       Lightweight cookie consent banner for GDPR & ePrivacy. Blocks non-essential scripts until the visitor decides. Fully customizable, accessible, no jQuery, multisite compatible.
 * Version:           1.0.0
 * Requires at least: 6.0
 * Tested up to:      6.7
 * Requires PHP:      7.4
 * Author:            Consentia Team
 * Author URI:        https://consentia.dev/
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       consentia
 * Domain Path:       /languages
 *
 * @package Consentia
 */

defined( 'ABSPATH' ) || exit;

define( 'CONSENTIA_VERSION', '1.0.0' );
define( 'CONSENTIA_FILE', __FILE__ );
define( 'CONSENTIA_PATH', plugin_dir_path( __FILE__ ) );
define( 'CONSENTIA_URL', plugin_dir_url( __FILE__ ) );
define( 'CONSENTIA_OPTION', 'consentia_settings' );

require_once CONSENTIA_PATH . 'includes/class-consentia-settings.php';
require_once CONSENTIA_PATH . 'includes/class-consentia-frontend.php';

/**
 * Activation hook: seed default options and flag the first-run notice.
 *
 * @return void
 */
function consentia_activate() {
	if ( false === get_option( CONSENTIA_OPTION ) ) {
		add_option( CONSENTIA_OPTION, Consentia_Settings::defaults(), '', false );
	}
	add_option( 'consentia_first_run', 1 );
}
register_activation_hook( CONSENTIA_FILE, 'consentia_activate' );

/**
 * Bootstrap the plugin once all plugins are loaded.
 *
 * @return void
 */
function consentia_boot() {
	load_plugin_textdomain( 'consentia', false, dirname( plugin_basename( CONSENTIA_FILE ) ) . '/languages' );
	Consentia_Settings::instance();
	Consentia_Frontend::instance();
}
add_action( 'plugins_loaded', 'consentia_boot' );

/**
 * Dismissible first-run notice pointing to the settings page.
 *
 * @return void
 */
function consentia_admin_notice() {
	if ( ! get_option( 'consentia_first_run' ) || ! current_user_can( 'manage_options' ) ) {
		return;
	}
	printf(
		'<div class="notice notice-success is-dismissible"><p>%s <a href="%s"><strong>%s</strong></a></p></div>',
		esc_html__( 'Consentia está activo. Personaliza tu banner de cookies en', 'consentia' ),
		esc_url( admin_url( 'options-general.php?page=consentia' ) ),
		esc_html__( 'Ajustes → Consentia', 'consentia' )
	);
}
add_action( 'admin_notices', 'consentia_admin_notice' );
