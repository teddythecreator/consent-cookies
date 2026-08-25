<?php
/**
 * Admin view: consent proof log (Ajustes → Consentia → Registro).
 *
 * Shows totals for the last 30 days, the latest 100 decisions and the
 * CSV export / purge actions. Loaded from the settings screen.
 *
 * @package Consentia
 */

defined( 'ABSPATH' ) || exit;

$totals = Consentia_Logger::count_recent( 30 );
$rows   = Consentia_Logger::get_consents( 100, 0 );
?>
<div class="consentia-consents-view">

	<h2><?php esc_html_e( 'Registro de consentimiento', 'consentia' ); ?></h2>
	<p class="description">
		<?php esc_html_e( 'Prueba de cumplimiento (art. 7.1 RGPD): cada decisión queda anotada con fecha, categorías, origen y versión del plugin. Exportable en CSV y con retención automática.', 'consentia' ); ?>
	</p>

	<div class="consentia-consents-totals">
		<div class="consentia-consents-card">
			<span class="consentia-consents-card__num"><?php echo esc_html( $totals['granted'] ); ?></span>
			<span class="consentia-consents-card__label"><?php esc_html_e( 'Aceptadas (30 d)', 'consentia' ); ?></span>
		</div>
		<div class="consentia-consents-card">
			<span class="consentia-consents-card__num"><?php echo esc_html( $totals['rejected'] ); ?></span>
			<span class="consentia-consents-card__label"><?php esc_html_e( 'Rechazadas (30 d)', 'consentia' ); ?></span>
		</div>
		<div class="consentia-consents-card">
			<span class="consentia-consents-card__num"><?php echo esc_html( $totals['updated'] ); ?></span>
			<span class="consentia-consents-card__label"><?php esc_html_e( 'Actualizadas (30 d)', 'consentia' ); ?></span>
		</div>
		<div class="consentia-consents-card">
			<span class="consentia-consents-card__num"><?php echo esc_html( $totals['revoked'] ); ?></span>
			<span class="consentia-consents-card__label"><?php esc_html_e( 'Revocadas (30 d)', 'consentia' ); ?></span>
		</div>
	</div>

	<p>
		<a class="button button-primary" href="<?php echo esc_url( wp_nonce_url( admin_url( 'admin-post.php?action=consentia_export_csv' ), 'consentia_export' ) ); ?>">
			<?php esc_html_e( 'Exportar CSV', 'consentia' ); ?>
		</a>
		<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" style="display:inline" onsubmit="return confirm('<?php echo esc_js( __( '¿Vaciar todo el registro? Esta acción no se puede deshacer.', 'consentia' ) ); ?>');">
			<input type="hidden" name="action" value="consentia_purge_log" />
			<?php wp_nonce_field( 'consentia_purge' ); ?>
			<button type="submit" class="button"><?php esc_html_e( 'Vaciar registro', 'consentia' ); ?></button>
		</form>
	</p>

	<h3><?php esc_html_e( 'Últimas 100 decisiones', 'consentia' ); ?></h3>

	<?php if ( empty( $rows ) ) : ?>
		<p class="description"><?php esc_html_e( 'Aún no hay decisiones registradas. El registro empezará a llenarse cuando tus visitantes interactúen con el banner.', 'consentia' ); ?></p>
	<?php else : ?>
		<table class="widefat striped consentia-consents-table">
			<thead>
				<tr>
					<th><?php esc_html_e( 'Fecha (UTC)', 'consentia' ); ?></th>
					<th><?php esc_html_e( 'Decisión', 'consentia' ); ?></th>
					<th><?php esc_html_e( 'Categorías aceptadas', 'consentia' ); ?></th>
					<th><?php esc_html_e( 'URL', 'consentia' ); ?></th>
					<th><?php esc_html_e( 'Versión', 'consentia' ); ?></th>
				</tr>
			</thead>
			<tbody>
				<?php foreach ( $rows as $row ) : ?>
					<?php
					$cats      = json_decode( (string) $row->categories, true );
					$accepted  = is_array( $cats ) ? array_keys( array_filter( $cats ) ) : array();
					$badge_cls = 'granted' === $row->consent_type || 'updated' === $row->consent_type
						? 'consentia-badge--ok'
						: ( 'rejected' === $row->consent_type || 'revoked' === $row->consent_type ? 'consentia-badge--no' : '' );
					?>
					<tr>
						<td><?php echo esc_html( $row->consented_at ); ?></td>
						<td><span class="consentia-badge <?php echo esc_attr( $badge_cls ); ?>"><?php echo esc_html( $row->consent_type ); ?></span></td>
						<td><?php echo esc_html( implode( ', ', $accepted ) ); ?></td>
						<td><?php echo esc_html( wp_parse_url( (string) $row->page_url, PHP_URL_PATH ) ); ?></td>
						<td><?php echo esc_html( $row->plugin_version ); ?></td>
					</tr>
				<?php endforeach; ?>
			</tbody>
		</table>
	<?php endif; ?>

	<style>
		.consentia-consents-totals { display: flex; flex-wrap: wrap; gap: 12px; margin: 16px 0; }
		.consentia-consents-card { background: #fff; border: 1px solid #c3c4c7; border-radius: 8px; padding: 12px 18px; min-width: 140px; }
		.consentia-consents-card__num { display: block; font-size: 24px; font-weight: 700; }
		.consentia-consents-card__label { font-size: 12px; color: #646970; }
		.consentia-badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; background: #f0f0f1; }
		.consentia-badge--ok { background: #d5f0dc; color: #0a6320; }
		.consentia-badge--no { background: #f5c6c6; color: #8a1f1f; }
	</style>
</div>
