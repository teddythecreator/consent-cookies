<?php
/**
 * Cookie policy template — rendered by the [consentia_policy] shortcode.
 *
 * Covers the information duties of LSSI-CE art. 22.2 and GDPR arts. 12–13:
 * what cookies are, categories and specific cookies in use, international
 * transfers, browser management instructions, user rights and the date of
 * the last update.
 *
 * Available variables: $settings (sanitized plugin settings).
 *
 * @package Consentia
 */

defined( 'ABSPATH' ) || exit;

$privacy_url  = '' !== $settings['privacy_url'] ? $settings['privacy_url'] : get_privacy_policy_url();
$updated_date = date_i18n( get_option( 'date_format' ), current_time( 'timestamp' ) );
?>
<div class="consentia-policy">

	<h2><?php esc_html_e( 'Política de Cookies', 'consentia' ); ?></h2>
	<p class="consentia-policy__updated">
		<?php
		/* translators: %s: localized date */
		printf( esc_html__( 'Última actualización: %s', 'consentia' ), esc_html( $updated_date ) );
		?>
	</p>

	<h3><?php esc_html_e( '¿Qué son las cookies?', 'consentia' ); ?></h3>
	<p>
		<?php esc_html_e( 'Las cookies son pequeños archivos de texto que los sitios web guardan en tu dispositivo (ordenador, tableta o móvil) cuando los visitas. Sirven para que la web funcione, para recordar tus preferencias y, en algunos casos, para analizar el uso del sitio o mostrar publicidad personalizada. Conforme a la Ley 34/2002 (LSSI-CE) y al RGPD, las cookies que no sean estrictamente necesarias solo pueden almacenarse con tu consentimiento previo, informado y explícito.', 'consentia' ); ?>
	</p>
	<p>
		<?php esc_html_e( 'Además de cookies, existen tecnologías similares como el almacenamiento local del navegador (localStorage), los píxeles de seguimiento o las balizas web. En esta política nos referimos a todas ellas conjuntamente como «cookies».', 'consentia' ); ?>
	</p>

	<h3><?php esc_html_e( '¿Qué tipos de cookies utilizamos?', 'consentia' ); ?></h3>
	<table class="consentia-policy__table">
		<thead>
			<tr>
				<th><?php esc_html_e( 'Categoría', 'consentia' ); ?></th>
				<th><?php esc_html_e( 'Finalidad', 'consentia' ); ?></th>
				<th><?php esc_html_e( 'Duración', 'consentia' ); ?></th>
				<th><?php esc_html_e( 'Titular', 'consentia' ); ?></th>
			</tr>
		</thead>
		<tbody>
			<tr>
				<td><?php esc_html_e( 'Necesarias', 'consentia' ); ?></td>
				<td><?php esc_html_e( 'Permiten la navegación y funciones esenciales: sesión, seguridad, carrito de compra. Sin ellas la web no puede funcionar. No requieren consentimiento (art. 22.2 LSSI).', 'consentia' ); ?></td>
				<td><?php esc_html_e( 'Sesión / 365 días', 'consentia' ); ?></td>
				<td><?php echo esc_html( get_bloginfo( 'name' ) ); ?></td>
			</tr>
			<tr>
				<td><?php esc_html_e( 'Preferencias', 'consentia' ); ?></td>
				<td><?php esc_html_e( 'Recuerdan tus elecciones: idioma, región o personalización de la interfaz.', 'consentia' ); ?></td>
				<td><?php esc_html_e( 'Hasta 365 días', 'consentia' ); ?></td>
				<td><?php echo esc_html( get_bloginfo( 'name' ) ); ?></td>
			</tr>
			<tr>
				<td><?php esc_html_e( 'Estadísticas', 'consentia' ); ?></td>
				<td><?php esc_html_e( 'Miden el uso del sitio con datos agregados y anónimos para poder mejorarlo (p. ej. Google Analytics 4).', 'consentia' ); ?></td>
				<td><?php esc_html_e( 'Hasta 365 días', 'consentia' ); ?></td>
				<td><?php echo esc_html( get_bloginfo( 'name' ) ); ?> / Google LLC</td>
			</tr>
			<tr>
				<td><?php esc_html_e( 'Marketing', 'consentia' ); ?></td>
				<td><?php esc_html_e( 'Muestran anuncios relevantes para ti y limitan el número de impactos publicitarios (p. ej. Meta Pixel, Google Ads).', 'consentia' ); ?></td>
				<td><?php esc_html_e( 'Hasta 365 días', 'consentia' ); ?></td>
				<td><?php echo esc_html( get_bloginfo( 'name' ) ); ?> / Meta, Google LLC</td>
			</tr>
		</tbody>
	</table>

	<h3><?php esc_html_e( 'Cookies concretas utilizadas', 'consentia' ); ?></h3>
	<table class="consentia-policy__table">
		<thead>
			<tr>
				<th><?php esc_html_e( 'Nombre', 'consentia' ); ?></th>
				<th><?php esc_html_e( 'Tipo', 'consentia' ); ?></th>
				<th><?php esc_html_e( 'Finalidad', 'consentia' ); ?></th>
				<th><?php esc_html_e( 'Duración', 'consentia' ); ?></th>
			</tr>
		</thead>
		<tbody>
			<tr>
				<td><code>consentia_consent</code></td>
				<td><?php esc_html_e( 'Propia / técnica', 'consentia' ); ?></td>
				<td><?php esc_html_e( 'Guarda tu decisión de consentimiento («granted» o «rejected»).', 'consentia' ); ?></td>
				<td><?php esc_html_e( '365 días', 'consentia' ); ?></td>
			</tr>
			<tr>
				<td><code>consentia_consent_date</code></td>
				<td><?php esc_html_e( 'Propia / técnica', 'consentia' ); ?></td>
				<td><?php esc_html_e( 'Fecha de la decisión, para pedirte el consentimiento de nuevo al caducar.', 'consentia' ); ?></td>
				<td><?php esc_html_e( '365 días', 'consentia' ); ?></td>
			</tr>
			<tr>
				<td><code>consentia_categories</code></td>
				<td><?php esc_html_e( 'Propia / técnica', 'consentia' ); ?></td>
				<td><?php esc_html_e( 'Categorías aceptadas, en formato JSON.', 'consentia' ); ?></td>
				<td><?php esc_html_e( '365 días', 'consentia' ); ?></td>
			</tr>
			<tr>
				<td><code>_ga / _ga_*</code></td>
				<td><?php esc_html_e( 'Tercero / estadística', 'consentia' ); ?></td>
				<td><?php esc_html_e( 'Google Analytics 4: identificación anónima de visitantes y sesiones. Solo si aceptas la categoría Estadísticas.', 'consentia' ); ?></td>
				<td><?php esc_html_e( 'Hasta 365 días', 'consentia' ); ?></td>
			</tr>
			<tr>
				<td><code>_fbp</code></td>
				<td><?php esc_html_e( 'Tercero / marketing', 'consentia' ); ?></td>
				<td><?php esc_html_e( 'Meta Pixel: medición de campañas publicitarias. Solo si aceptas la categoría Marketing.', 'consentia' ); ?></td>
				<td><?php esc_html_e( '90 días', 'consentia' ); ?></td>
			</tr>
		</tbody>
	</table>

	<h3><?php esc_html_e( 'Transferencias internacionales de datos', 'consentia' ); ?></h3>
	<p>
		<?php esc_html_e( 'Si aceptas las categorías Estadísticas o Marketing, algunos proveedores (como Google LLC o Meta Platforms Inc.) pueden tratar datos fuera del Espacio Económico Europeo, por ejemplo en Estados Unidos. Estos proveedores están adheridos al Marco de Privacidad de Datos UE-EE. UU. (EU-US Data Privacy Framework) o aplican cláusulas contractuales tipo aprobadas por la Comisión Europea (art. 46 RGPD).', 'consentia' ); ?>
	</p>
	<p>
		<?php esc_html_e( 'El propio Consentia no envía tus decisiones a ningún servidor externo: el registro de consentimiento se guarda únicamente en la base de datos de este sitio web.', 'consentia' ); ?>
	</p>

	<h3><?php esc_html_e( 'Cómo gestionar o eliminar las cookies desde tu navegador', 'consentia' ); ?></h3>
	<ul>
		<li>
			<strong>Google Chrome:</strong>
			<?php esc_html_e( 'Configuración → Privacidad y seguridad → Cookies y otros datos de sitios.', 'consentia' ); ?>
		</li>
		<li>
			<strong>Mozilla Firefox:</strong>
			<?php esc_html_e( 'Ajustes → Privacidad y seguridad → Cookies y datos del sitio.', 'consentia' ); ?>
		</li>
		<li>
			<strong>Safari:</strong>
			<?php esc_html_e( 'Preferencias → Privacidad → Gestionar datos de sitios web.', 'consentia' ); ?>
		</li>
		<li>
			<strong>Microsoft Edge:</strong>
			<?php esc_html_e( 'Configuración → Cookies y permisos del sitio → Administrar y eliminar cookies.', 'consentia' ); ?>
		</li>
	</ul>
	<p>
		<?php esc_html_e( 'Recuerda: si borras las cookies de este sitio, volveremos a pedirte el consentimiento la próxima vez que nos visites.', 'consentia' ); ?>
	</p>

	<h3><?php esc_html_e( 'Tus derechos', 'consentia' ); ?></h3>
	<p>
		<?php esc_html_e( 'En relación con tus datos personales puedes ejercer los derechos de:', 'consentia' ); ?>
	</p>
	<ul>
		<li><strong><?php esc_html_e( 'Acceso', 'consentia' ); ?></strong> — <?php esc_html_e( 'conocer qué datos tratamos.', 'consentia' ); ?></li>
		<li><strong><?php esc_html_e( 'Rectificación', 'consentia' ); ?></strong> — <?php esc_html_e( 'corregir datos inexactos.', 'consentia' ); ?></li>
		<li><strong><?php esc_html_e( 'Supresión', 'consentia' ); ?></strong> — <?php esc_html_e( 'pedir que eliminemos tus datos.', 'consentia' ); ?></li>
		<li><strong><?php esc_html_e( 'Retirada del consentimiento', 'consentia' ); ?></strong> — <?php esc_html_e( 'tan fácil como darlo: usa el botón flotante «Configuración de Cookies» en cualquier momento.', 'consentia' ); ?></li>
		<li><strong><?php esc_html_e( 'Oposición, limitación y portabilidad', 'consentia' ); ?></strong> — <?php esc_html_e( 'en los supuestos previstos por el RGPD.', 'consentia' ); ?></li>
	</ul>
	<p>
		<?php esc_html_e( 'Para ejercerlos, contacta con el responsable del sitio a través de la dirección indicada en la', 'consentia' ); ?>
		<?php if ( $privacy_url ) : ?>
			<a href="<?php echo esc_url( $privacy_url ); ?>"><?php esc_html_e( 'política de privacidad', 'consentia' ); ?></a>.
		<?php else : ?>
			<?php esc_html_e( 'política de privacidad de este sitio.', 'consentia' ); ?>
		<?php endif; ?>
		<?php esc_html_e( 'También puedes reclamar ante la Agencia Española de Protección de Datos (AEPD), www.aepd.es, si consideras que no hemos atendido correctamente tus derechos.', 'consentia' ); ?>
	</p>

	<p class="consentia-policy__note">
		<?php esc_html_e( 'Esta página se genera con el plugin Consentia y refleja las categorías configuradas en Ajustes → Consentia. Revisa la fecha de actualización al inicio de esta página.', 'consentia' ); ?>
	</p>

	<style>
		.consentia-policy__table { width: 100%; border-collapse: collapse; margin: 1em 0; font-size: 0.95em; }
		.consentia-policy__table th, .consentia-policy__table td { border: 1px solid currentColor; border-color: rgba(127,127,127,0.35); padding: 8px 12px; text-align: left; vertical-align: top; }
		.consentia-policy__table th { font-weight: 600; }
		.consentia-policy__updated { font-size: 0.9em; opacity: 0.75; }
		.consentia-policy__note { font-size: 0.85em; opacity: 0.7; margin-top: 2em; }
	</style>
</div>
