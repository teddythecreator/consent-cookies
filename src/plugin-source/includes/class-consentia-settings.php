<?php
/**
 * Admin settings for Consentia.
 *
 * Registers the option, the Settings API sections/fields with full
 * sanitization, the settings page with a live preview pane and the
 * admin assets.
 *
 * @package Consentia
 */

defined( 'ABSPATH' ) || exit;

class Consentia_Settings {

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
	 * Hooks.
	 */
	private function __construct() {
		add_action( 'admin_init', array( $this, 'register' ) );
		add_action( 'admin_menu', array( $this, 'menu' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'assets' ) );
		add_filter( 'plugin_action_links_' . plugin_basename( CONSENTIA_FILE ), array( $this, 'action_links' ) );
	}

	/**
	 * Default settings.
	 *
	 * @return array<string, mixed>
	 */
	public static function defaults() {
		return array(
			'enabled'      => 1,
			'banner_type'  => 'card',
			'position'     => 'bottom-left',
			'title'        => 'Tu privacidad nos importa',
			'message'      => 'Utilizamos cookies propias y de terceros para mejorar tu experiencia, analizar el tráfico y personalizar contenido. Puedes aceptar todas, rechazarlas o configurarlas.',
			'accept_label' => 'Aceptar todas',
			'reject_label' => 'Rechazar',
			'prefs_label'  => 'Configurar',
			'privacy_url'  => '',
			'bg_color'     => '#111827',
			'text_color'   => '#f3f4f6',
			'accent_color' => '#2f6fed',
			'radius'       => 14,
			'delay_ms'     => 400,
			'renew_months' => 6,
			'ga4_id'       => '',
		);
	}

	/**
	 * Merged settings (defaults + saved values).
	 *
	 * @return array<string, mixed>
	 */
	public static function get() {
		return wp_parse_args( get_option( CONSENTIA_OPTION, array() ), self::defaults() );
	}

	/**
	 * Register option, sections and fields.
	 *
	 * @return void
	 */
	public function register() {
		register_setting(
			'consentia_group',
			CONSENTIA_OPTION,
			array(
				'type'              => 'array',
				'description'       => 'Consentia banner settings.',
				'sanitize_callback' => array( $this, 'sanitize' ),
				'default'           => self::defaults(),
			)
		);

		add_settings_section( 'consentia_banner', __( 'Banner', 'consentia' ), null, 'consentia' );
		add_settings_section( 'consentia_appearance', __( 'Apariencia', 'consentia' ), null, 'consentia' );
		add_settings_section( 'consentia_scripts', __( 'Scripts y analítica', 'consentia' ), null, 'consentia' );

		$this->add_field( 'enabled', 'consentia_banner', __( 'Activar banner', 'consentia' ), 'checkbox' );
		$this->add_field( 'banner_type', 'consentia_banner', __( 'Formato', 'consentia' ), 'select', array( 'card' => __( 'Tarjeta flotante', 'consentia' ), 'bar' => __( 'Barra a ancho completo', 'consentia' ) ) );
		$this->add_field( 'position', 'consentia_banner', __( 'Posición', 'consentia' ), 'select', array( 'bottom-left' => __( 'Abajo izquierda', 'consentia' ), 'bottom-right' => __( 'Abajo derecha', 'consentia' ), 'bottom-center' => __( 'Abajo centrada', 'consentia' ), 'top' => __( 'Barra superior', 'consentia' ) ) );
		$this->add_field( 'title', 'consentia_banner', __( 'Título', 'consentia' ), 'text' );
		$this->add_field( 'message', 'consentia_banner', __( 'Mensaje', 'consentia' ), 'textarea' );
		$this->add_field( 'accept_label', 'consentia_banner', __( 'Texto «Aceptar»', 'consentia' ), 'text' );
		$this->add_field( 'reject_label', 'consentia_banner', __( 'Texto «Rechazar»', 'consentia' ), 'text' );
		$this->add_field( 'prefs_label', 'consentia_banner', __( 'Texto «Configurar»', 'consentia' ), 'text' );
		$this->add_field( 'privacy_url', 'consentia_banner', __( 'URL política de privacidad', 'consentia' ), 'url' );
		$this->add_field( 'delay_ms', 'consentia_banner', __( 'Retraso de aparición (ms)', 'consentia' ), 'number' );
		$this->add_field( 'renew_months', 'consentia_banner', __( 'Renovar consentimiento (meses)', 'consentia' ), 'number' );

		$this->add_field( 'bg_color', 'consentia_appearance', __( 'Color de fondo', 'consentia' ), 'color' );
		$this->add_field( 'text_color', 'consentia_appearance', __( 'Color de texto', 'consentia' ), 'color' );
		$this->add_field( 'accent_color', 'consentia_appearance', __( 'Color de acento', 'consentia' ), 'color' );
		$this->add_field( 'radius', 'consentia_appearance', __( 'Radio de esquina (px)', 'consentia' ), 'number' );

		$this->add_field( 'ga4_id', 'consentia_scripts', __( 'ID de Google Analytics 4', 'consentia' ), 'text', array(), __( 'Formato G-XXXXXXX. Solo se cargará gtag.js cuando se acepten las cookies analíticas.', 'consentia' ) );
	}

	/**
	 * Helper to register a field.
	 *
	 * @param string $key     Setting key.
	 * @param string $section Section id.
	 * @param string $label   Field label.
	 * @param string $type    Field type.
	 * @param array  $choices Select choices.
	 * @param string $help    Help text.
	 * @return void
	 */
	private function add_field( $key, $section, $label, $type, $choices = array(), $help = '' ) {
		add_settings_field(
			'consentia_' . $key,
			$label,
			array( $this, 'render_field' ),
			'consentia',
			$section,
			array(
				'label_for' => 'consentia_' . $key,
				'key'       => $key,
				'type'      => $type,
				'choices'   => $choices,
				'help'      => $help,
			)
		);
	}

	/**
	 * Field renderer (escaped output).
	 *
	 * @param array $args Field arguments.
	 * @return void
	 */
	public function render_field( $args ) {
		$s     = self::get();
		$key   = $args['key'];
		$value = isset( $s[ $key ] ) ? $s[ $key ] : '';
		$name  = CONSENTIA_OPTION . '[' . $key . ']';
		$id    = 'consentia_' . $key;

		switch ( $args['type'] ) {
			case 'checkbox':
				printf( '<input type="checkbox" id="%s" name="%s" value="1" %s />', esc_attr( $id ), esc_attr( $name ), checked( $value, 1, false ) );
				break;
			case 'textarea':
				printf( '<textarea id="%s" name="%s" rows="4" class="large-text code">%s</textarea>', esc_attr( $id ), esc_attr( $name ), esc_textarea( $value ) );
				break;
			case 'select':
				printf( '<select id="%s" name="%s">', esc_attr( $id ), esc_attr( $name ) );
				foreach ( $args['choices'] as $option_value => $option_label ) {
					printf( '<option value="%s" %s>%s</option>', esc_attr( $option_value ), selected( $value, $option_value, false ), esc_html( $option_label ) );
				}
				echo '</select>';
				break;
			case 'color':
				printf( '<input type="color" id="%s" name="%s" value="%s" class="consentia-color" />', esc_attr( $id ), esc_attr( $name ), esc_attr( $value ) );
				break;
			case 'url':
				printf( '<input type="url" id="%s" name="%s" value="%s" class="regular-text" placeholder="https://" />', esc_attr( $id ), esc_attr( $name ), esc_url( $value ) );
				break;
			case 'number':
				printf( '<input type="number" id="%s" name="%s" value="%s" min="0" step="1" class="small-text" />', esc_attr( $id ), esc_attr( $name ), esc_attr( $value ) );
				break;
			default:
				printf( '<input type="text" id="%s" name="%s" value="%s" class="regular-text" />', esc_attr( $id ), esc_attr( $name ), esc_attr( $value ) );
		}

		if ( ! empty( $args['help'] ) ) {
			printf( '<p class="description">%s</p>', esc_html( $args['help'] ) );
		}
	}

	/**
	 * Whitelist-based sanitization of every setting.
	 *
	 * @param mixed $input Raw form input.
	 * @return array<string, mixed>
	 */
	public function sanitize( $input ) {
		if ( ! is_array( $input ) ) {
			return self::defaults();
		}

		$clean = array();
		$d     = self::defaults();

		$clean['enabled'] = empty( $input['enabled'] ) ? 0 : 1;

		$clean['banner_type'] = in_array( $input['banner_type'] ?? '', array( 'card', 'bar' ), true ) ? $input['banner_type'] : $d['banner_type'];
		$clean['position']    = in_array( $input['position'] ?? '', array( 'bottom-left', 'bottom-right', 'bottom-center', 'top' ), true ) ? $input['position'] : $d['position'];

		$clean['title']        = sanitize_text_field( $input['title'] ?? $d['title'] );
		$clean['message']      = wp_kses_post( $input['message'] ?? $d['message'] );
		$clean['accept_label'] = sanitize_text_field( $input['accept_label'] ?? $d['accept_label'] );
		$clean['reject_label'] = sanitize_text_field( $input['reject_label'] ?? $d['reject_label'] );
		$clean['prefs_label']  = sanitize_text_field( $input['prefs_label'] ?? $d['prefs_label'] );
		$clean['privacy_url']  = esc_url_raw( $input['privacy_url'] ?? '' );

		foreach ( array( 'bg_color', 'text_color', 'accent_color' ) as $color_key ) {
			$sanitized            = sanitize_hex_color( $input[ $color_key ] ?? '' );
			$clean[ $color_key ]  = $sanitized ? $sanitized : $d[ $color_key ];
		}

		$clean['radius']       = min( absint( $input['radius'] ?? $d['radius'] ), 32 );
		$clean['delay_ms']     = min( absint( $input['delay_ms'] ?? $d['delay_ms'] ), 5000 );
		$clean['renew_months'] = min( max( absint( $input['renew_months'] ?? $d['renew_months'] ), 1 ), 24 );

		$ga4               = strtoupper( sanitize_text_field( $input['ga4_id'] ?? '' ) );
		$clean['ga4_id']   = preg_match( '/^G-[A-Z0-9]{6,16}$/', $ga4 ) ? $ga4 : '';

		return $clean;
	}

	/**
	 * Settings submenu under "Ajustes".
	 *
	 * @return void
	 */
	public function menu() {
		add_options_page(
			__( 'Consentia — Consentimiento de cookies', 'consentia' ),
			'Consentia',
			'manage_options',
			'consentia',
			array( $this, 'page' )
		);
	}

	/**
	 * Settings page markup.
	 *
	 * @return void
	 */
	public function page() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		delete_option( 'consentia_first_run' );
		$settings = self::get();
		?>
		<div class="wrap consentia-admin">
			<h1>
				Consentia
				<span class="consentia-admin-version">v<?php echo esc_html( CONSENTIA_VERSION ); ?></span>
			</h1>

			<form method="post" action="options.php">
				<?php settings_fields( 'consentia_group' ); ?>

				<div class="consentia-admin-grid">
					<div class="consentia-admin-fields">
						<?php do_settings_sections( 'consentia' ); ?>
						<?php submit_button( __( 'Guardar cambios', 'consentia' ) ); ?>
					</div>

					<div class="consentia-admin-preview">
						<p class="consentia-admin-preview-label"><?php esc_html_e( 'Vista previa en vivo', 'consentia' ); ?></p>
						<div
							id="consentia-admin-preview-box"
							class="consentia-admin-preview-box"
							data-settings="<?php echo esc_attr( wp_json_encode( $settings ) ); ?>"
						></div>
						<p class="description">
							<?php esc_html_e( 'La vista previa se actualiza mientras escribes. En portada, el banner aparece con estos estilos.', 'consentia' ); ?>
						</p>
					</div>
				</div>
			</form>
		</div>
		<?php
	}

	/**
	 * Enqueue admin assets on the settings screen only.
	 *
	 * @param string $hook_suffix Current admin page hook.
	 * @return void
	 */
	public function assets( $hook_suffix ) {
		if ( 'settings_page_consentia' !== $hook_suffix ) {
			return;
		}
		wp_enqueue_style( 'consentia', CONSENTIA_URL . 'assets/css/consentia.css', array(), CONSENTIA_VERSION );
		wp_enqueue_style( 'consentia-admin', CONSENTIA_URL . 'assets/css/consentia-admin.css', array(), CONSENTIA_VERSION );
		wp_enqueue_script( 'consentia-admin', CONSENTIA_URL . 'assets/js/consentia-admin.js', array(), CONSENTIA_VERSION, true );
	}

	/**
	 * "Ajustes" quick link on the plugins list.
	 *
	 * @param array $links Existing action links.
	 * @return array
	 */
	public function action_links( $links ) {
		$url     = admin_url( 'options-general.php?page=consentia' );
		$links[] = '<a href="' . esc_url( $url ) . '">' . esc_html__( 'Ajustes', 'consentia' ) . '</a>';
		return $links;
	}
}
