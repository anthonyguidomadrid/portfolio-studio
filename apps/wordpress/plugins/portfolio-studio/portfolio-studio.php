<?php
/**
 * Plugin Name: Portfolio Studio Content
 * Description: Portfolio content model and frontend cache revalidation for the headless portfolio site.
 * Version: 1.0.0
 * Requires at least: 6.4
 * Requires PHP: 8.0
 * License: MIT
 */

if (!defined('ABSPATH')) {
	exit;
}

require_once __DIR__ . '/portfolio-photos.php';
require_once __DIR__ . '/headless-routing.php';
require_once __DIR__ . '/not-found-settings.php';
require_once __DIR__ . '/page-image-alt.php';

function portfolio_studio_can_edit_meta($allowed, $meta_key, $post_id) {
	return current_user_can('edit_post', $post_id);
}

function portfolio_studio_sanitize_image_id($value) {
	$image_id = absint($value);
	return $image_id && 'image' === get_post_mime_type($image_id) ? $image_id : 0;
}

function portfolio_studio_sanitize_gallery_ids($value) {
	if (!is_array($value)) {
		return array();
	}

	return array_values(array_filter(array_map('portfolio_studio_sanitize_image_id', $value)));
}

function portfolio_studio_default_site_settings() {
	return array(
		'name' => 'Portfolio Studio',
		'description' => 'A flexible home for selected work.',
		'contact_email' => '',
		'instagram_url' => '',
		'facebook_url' => '',
		'twitter_url' => '',
		'youtube_url' => '',
		'pinterest_url' => '',
		'tumblr_url' => '',
		'flickr_url' => '',
		'home_video_url' => '',
		'home_video_start' => 0,
		'not_found_background_image_id' => 0,
		'social_links' => array(),
	);
}

function portfolio_studio_sanitize_youtube_video_url($value) {
	if (!is_string($value) || '' === trim($value)) {
		return '';
	}

	$parts = wp_parse_url(trim($value));
	if (!is_array($parts) || 'https' !== strtolower($parts['scheme'] ?? '') || isset($parts['user']) || isset($parts['port'])) {
		return '';
	}

	$host = preg_replace('/^(www|m)\./', '', strtolower($parts['host'] ?? ''));
	$path = $parts['path'] ?? '';
	$video_id = '';

	if ('youtu.be' === $host) {
		$video_id = explode('/', ltrim($path, '/'))[0];
	} elseif (in_array($host, array('youtube.com', 'youtube-nocookie.com'), true)) {
		if ('/watch' === $path) {
			parse_str($parts['query'] ?? '', $query);
			$video_id = $query['v'] ?? '';
		} elseif (preg_match('#^/(?:embed|shorts|live)/([^/]+)#', $path, $matches)) {
			$video_id = $matches[1];
		}
	}

	// Only the 11-character ID is trusted; the frontend builds the embed URL from it.
	return is_string($video_id) && preg_match('/^[A-Za-z0-9_-]{11}$/', $video_id)
		? 'https://www.youtube.com/watch?v=' . $video_id
		: '';
}

function portfolio_studio_sanitize_video_start($value) {
	return is_scalar($value) ? max(0, min((int) $value, 43200)) : 0;
}

function portfolio_studio_sanitize_social_url($value) {
	if (!is_string($value) || '' === trim($value)) {
		return '';
	}

	$url = esc_url_raw(trim((string) $value), array('http', 'https'));
	return $url && wp_http_validate_url($url) ? $url : '';
}

function portfolio_studio_sanitize_site_settings($input) {
	$input = is_array($input) ? $input : array();
	$current_settings = get_option('portfolio_studio_site_settings', portfolio_studio_default_site_settings());
	$current_settings = is_array($current_settings) ? $current_settings : array();
	$social_links_text = isset($input['social_links_text']) ? sanitize_textarea_field($input['social_links_text']) : '';
	$social_links = isset($input['social_links_text']) ? array() : (array) ($current_settings['social_links'] ?? array());

	foreach (preg_split('/\r\n|\r|\n/', $social_links_text) as $line) {
		$parts = array_map('trim', explode('|', $line, 2));
		if (!isset($input['social_links_text']) || 2 !== count($parts) || '' === $parts[0]) {
			continue;
		}

		$url = esc_url_raw($parts[1], array('http', 'https'));
		if ($url && wp_http_validate_url($url)) {
			$social_links[] = array('label' => sanitize_text_field($parts[0]), 'href' => $url);
		}
	}

	return array(
		'name' => isset($input['name']) ? sanitize_text_field($input['name']) : '',
		'description' => isset($input['description']) ? sanitize_textarea_field($input['description']) : '',
		'contact_email' => isset($input['contact_email']) ? sanitize_email($input['contact_email']) : '',
		'instagram_url' => portfolio_studio_sanitize_social_url($input['instagram_url'] ?? ''),
		'facebook_url' => portfolio_studio_sanitize_social_url($input['facebook_url'] ?? ''),
		'twitter_url' => portfolio_studio_sanitize_social_url($input['twitter_url'] ?? ''),
		'youtube_url' => portfolio_studio_sanitize_social_url($input['youtube_url'] ?? ''),
		'pinterest_url' => portfolio_studio_sanitize_social_url($input['pinterest_url'] ?? ''),
		'tumblr_url' => portfolio_studio_sanitize_social_url($input['tumblr_url'] ?? ''),
		'flickr_url' => portfolio_studio_sanitize_social_url($input['flickr_url'] ?? ''),
		'home_video_url' => portfolio_studio_sanitize_youtube_video_url($input['home_video_url'] ?? ''),
		'home_video_start' => portfolio_studio_sanitize_video_start($input['home_video_start'] ?? 0),
		'not_found_background_image_id' => portfolio_studio_sanitize_not_found_image_id($input['not_found_background_image_id'] ?? 0),
		'social_links' => $social_links,
	);
}

function portfolio_studio_register_site_settings() {
	register_setting('portfolio_studio', 'portfolio_studio_site_settings', array(
		'type' => 'array',
		'default' => portfolio_studio_default_site_settings(),
		'sanitize_callback' => 'portfolio_studio_sanitize_site_settings',
	));
}
add_action('admin_init', 'portfolio_studio_register_site_settings');

function portfolio_studio_add_settings_page() {
	add_options_page(
		__('Portfolio site settings', 'portfolio-studio'),
		__('Portfolio site', 'portfolio-studio'),
		'manage_options',
		'portfolio-studio-settings',
		'portfolio_studio_render_settings_page'
	);
}
add_action('admin_menu', 'portfolio_studio_add_settings_page');

function portfolio_studio_render_settings_page() {
	if (!current_user_can('manage_options')) {
		return;
	}

	$settings = wp_parse_args(get_option('portfolio_studio_site_settings', array()), portfolio_studio_default_site_settings());
	?>
	<div class="wrap">
		<h1><?php esc_html_e('Portfolio site settings', 'portfolio-studio'); ?></h1>
		<form action="options.php" method="post">
			<?php settings_fields('portfolio_studio'); ?>
			<table class="form-table" role="presentation">
				<tr>
					<th scope="row"><label for="portfolio-site-name"><?php esc_html_e('Site name', 'portfolio-studio'); ?></label></th>
					<td><input class="regular-text" id="portfolio-site-name" name="portfolio_studio_site_settings[name]" type="text" maxlength="120" required value="<?php echo esc_attr($settings['name']); ?>"></td>
				</tr>
				<tr>
					<th scope="row"><label for="portfolio-site-description"><?php esc_html_e('Site description', 'portfolio-studio'); ?></label></th>
					<td><textarea class="large-text" id="portfolio-site-description" name="portfolio_studio_site_settings[description]" rows="3" maxlength="320"><?php echo esc_textarea($settings['description']); ?></textarea></td>
				</tr>
				<tr>
					<th scope="row"><label for="portfolio-contact-email"><?php esc_html_e('Contact email', 'portfolio-studio'); ?></label></th>
					<td><input class="regular-text" id="portfolio-contact-email" name="portfolio_studio_site_settings[contact_email]" type="email" value="<?php echo esc_attr($settings['contact_email']); ?>"></td>
				</tr>
				<tr>
					<th scope="row"><label for="portfolio-home-video-url"><?php esc_html_e('Home video (YouTube URL)', 'portfolio-studio'); ?></label></th>
					<td>
						<input class="regular-text" id="portfolio-home-video-url" name="portfolio_studio_site_settings[home_video_url]" type="url" value="<?php echo esc_attr($settings['home_video_url']); ?>" placeholder="https://www.youtube.com/watch?v=">
						<p class="description"><?php esc_html_e('Optional. Plays muted behind the home page. Only YouTube video links (watch, youtu.be, embed, shorts) are saved; anything else is cleared.', 'portfolio-studio'); ?></p>
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="portfolio-home-video-start"><?php esc_html_e('Home video start (seconds)', 'portfolio-studio'); ?></label></th>
					<td>
						<input class="small-text" id="portfolio-home-video-start" name="portfolio_studio_site_settings[home_video_start]" type="number" min="0" max="43200" step="1" value="<?php echo esc_attr((string) $settings['home_video_start']); ?>">
						<p class="description"><?php esc_html_e('Optional. Whole seconds into the video where playback begins. Leave 0 to start from the beginning.', 'portfolio-studio'); ?></p>
					</td>
				</tr>
				<?php
				portfolio_studio_render_not_found_image_setting($settings);
				$social_platforms = array(
					'instagram' => __('Instagram URL', 'portfolio-studio'),
					'facebook' => __('Facebook URL', 'portfolio-studio'),
					'twitter' => __('X (Twitter) URL', 'portfolio-studio'),
					'youtube' => __('YouTube URL', 'portfolio-studio'),
					'pinterest' => __('Pinterest URL', 'portfolio-studio'),
					'tumblr' => __('Tumblr URL', 'portfolio-studio'),
					'flickr' => __('Flickr URL', 'portfolio-studio'),
				);
				foreach ($social_platforms as $platform => $label) :
					$field_id = 'portfolio-' . $platform . '-url';
				?>
				<?php if ('instagram' === $platform) : ?>
				<tr>
					<td colspan="2"><p class="description"><?php esc_html_e('All profile links are optional. Only valid HTTP and HTTPS URLs are published.', 'portfolio-studio'); ?></p></td>
				</tr>
				<?php endif; ?>
				<tr>
					<th scope="row"><label for="<?php echo esc_attr($field_id); ?>"><?php echo esc_html($label); ?></label></th>
					<td><input class="regular-text" id="<?php echo esc_attr($field_id); ?>" name="portfolio_studio_site_settings[<?php echo esc_attr($platform); ?>_url]" type="url" value="<?php echo esc_attr($settings[$platform . '_url']); ?>" placeholder="https://"></td>
				</tr>
				<?php endforeach; ?>
			</table>
			<?php submit_button(); ?>
		</form>
	</div>
	<?php
}

function portfolio_studio_get_public_site_settings() {
	$settings = wp_parse_args(get_option('portfolio_studio_site_settings', array()), portfolio_studio_default_site_settings());
	return rest_ensure_response(array(
		'name' => $settings['name'],
		'description' => $settings['description'],
		'contactEmail' => $settings['contact_email'],
		'socialLinks' => $settings['social_links'],
		'instagramUrl' => $settings['instagram_url'],
		'facebookUrl' => $settings['facebook_url'],
		'twitterUrl' => $settings['twitter_url'],
		'youtubeUrl' => $settings['youtube_url'],
		'pinterestUrl' => $settings['pinterest_url'],
		'tumblrUrl' => $settings['tumblr_url'],
		'flickrUrl' => $settings['flickr_url'],
		'homeVideoUrl' => $settings['home_video_url'],
		'homeVideoStart' => (int) $settings['home_video_start'],
		'notFoundBackgroundImage' => portfolio_studio_public_not_found_image($settings['not_found_background_image_id']),
	));
}

function portfolio_studio_register_settings_route() {
	register_rest_route('portfolio-studio/v1', '/settings', array(
		'methods' => WP_REST_Server::READABLE,
		'callback' => 'portfolio_studio_get_public_site_settings',
		'permission_callback' => '__return_true',
	));
}
add_action('rest_api_init', 'portfolio_studio_register_settings_route');

function portfolio_studio_register_content() {
	register_post_type('portfolio_item', array(
		'labels' => array(
			'name' => __('Portfolio items', 'portfolio-studio'),
			'singular_name' => __('Portfolio item', 'portfolio-studio'),
			'add_new_item' => __('Add portfolio item', 'portfolio-studio'),
			'edit_item' => __('Edit portfolio item', 'portfolio-studio'),
	),
		'public' => true,
		'publicly_queryable' => true,
		'show_in_rest' => true,
		'rest_base' => 'portfolio_item',
		'has_archive' => false,
		'rewrite' => array('slug' => 'portfolio', 'with_front' => false),
		'menu_icon' => 'dashicons-format-gallery',
		'supports' => array('title', 'editor', 'excerpt', 'thumbnail', 'custom-fields'),
	));

	register_taxonomy('portfolio_tag', array('portfolio_item'), array(
		'labels' => array(
			'name' => __('Portfolio tags', 'portfolio-studio'),
			'singular_name' => __('Portfolio tag', 'portfolio-studio'),
			'add_new_item' => __('Add portfolio tag', 'portfolio-studio'),
	),
		'public' => true,
		'hierarchical' => false,
		'show_in_rest' => true,
		'rest_base' => 'portfolio_tag',
		'show_admin_column' => true,
	));

	$fields = array(
		'portfolio_cover_image_id' => array(
			'type' => 'integer',
			'single' => true,
			'show_in_rest' => array('schema' => array('type' => 'integer', 'minimum' => 0)),
			'default' => 0,
		),
		'portfolio_gallery_image_ids' => array(
			'type' => 'array',
			'single' => true,
			'show_in_rest' => array('schema' => array(
				'type' => 'array',
				'items' => array('type' => 'integer', 'minimum' => 1),
			)),
			'default' => array(),
		),
		'portfolio_video_url' => array(
			'type' => 'string',
			'single' => true,
			'show_in_rest' => array('schema' => array('type' => 'string', 'format' => 'uri', 'maxLength' => 2048)),
		),
		'portfolio_credits' => array(
			'type' => 'string',
			'single' => true,
			'show_in_rest' => array('schema' => array('type' => 'string', 'maxLength' => 5000)),
		),
		'portfolio_display_order' => array(
			'type' => 'integer',
			'single' => true,
			'show_in_rest' => array('schema' => array('type' => 'integer', 'minimum' => 0)),
			'default' => 0,
		),
	);

	foreach ($fields as $key => $args) {
		$args['auth_callback'] = 'portfolio_studio_can_edit_meta';
		$args['sanitize_callback'] = array(
			'portfolio_cover_image_id' => 'portfolio_studio_sanitize_image_id',
			'portfolio_gallery_image_ids' => 'portfolio_studio_sanitize_gallery_ids',
			'portfolio_video_url' => 'esc_url_raw',
			'portfolio_credits' => 'sanitize_textarea_field',
			'portfolio_display_order' => 'absint',
		)[$key];
		register_post_meta('portfolio_item', $key, $args);
	}
}
add_action('init', 'portfolio_studio_register_content');

function portfolio_studio_add_meta_box() {
	add_meta_box(
		'portfolio-studio-details',
		__('Portfolio details', 'portfolio-studio'),
		'portfolio_studio_render_meta_box',
		'portfolio_item',
		'normal',
		'high'
	);
}
add_action('add_meta_boxes_portfolio_item', 'portfolio_studio_add_meta_box');

function portfolio_studio_render_meta_box($post) {
	wp_nonce_field('portfolio_studio_save_meta', 'portfolio_studio_meta_nonce');
	$cover_id = (int) get_post_meta($post->ID, 'portfolio_cover_image_id', true);
	$gallery_ids = get_post_meta($post->ID, 'portfolio_gallery_image_ids', true);
	$gallery_ids = is_array($gallery_ids) ? array_map('absint', $gallery_ids) : array();
	$gallery_ids = array_values(array_filter($gallery_ids));
	$video_url = (string) get_post_meta($post->ID, 'portfolio_video_url', true);
	$credits = (string) get_post_meta($post->ID, 'portfolio_credits', true);
	$display_order = (int) get_post_meta($post->ID, 'portfolio_display_order', true);
	?>
	<p>
		<label for="portfolio_video_url"><strong><?php esc_html_e('Video URL', 'portfolio-studio'); ?></strong></label><br>
		<input class="widefat" type="url" id="portfolio_video_url" name="portfolio_video_url" value="<?php echo esc_attr($video_url); ?>" placeholder="https://">
		<span class="description"><?php esc_html_e('YouTube, Vimeo, or a direct MP4/WebM URL.', 'portfolio-studio'); ?></span>
	</p>
	<p>
		<label for="portfolio_credits"><strong><?php esc_html_e('Credits', 'portfolio-studio'); ?></strong></label><br>
		<textarea class="widefat" rows="3" id="portfolio_credits" name="portfolio_credits"><?php echo esc_textarea($credits); ?></textarea>
	</p>
	<p>
		<label for="portfolio_display_order"><strong><?php esc_html_e('Display order', 'portfolio-studio'); ?></strong></label><br>
		<input type="number" min="0" step="1" id="portfolio_display_order" name="portfolio_display_order" value="<?php echo esc_attr((string) $display_order); ?>">
		<span class="description"><?php esc_html_e('Lower numbers appear first; ties are sorted by title.', 'portfolio-studio'); ?></span>
	</p>
	<hr>
	<p><strong><?php esc_html_e('Cover image', 'portfolio-studio'); ?></strong></p>
	<input type="hidden" id="portfolio_cover_image_id" name="portfolio_cover_image_id" value="<?php echo esc_attr((string) $cover_id); ?>">
	<div id="portfolio-cover-preview">
		<?php if ($cover_id) : ?>
			<?php echo wp_get_attachment_image($cover_id, 'medium', false, array('style' => 'max-width:220px;height:auto')); ?>
		<?php endif; ?>
	</div>
	<p><button type="button" class="button" data-portfolio-media="cover"><?php esc_html_e('Choose cover image', 'portfolio-studio'); ?></button></p>
	<hr>
	<p><strong><?php esc_html_e('Gallery images', 'portfolio-studio'); ?></strong></p>
	<input type="hidden" id="portfolio_gallery_image_ids" name="portfolio_gallery_image_ids" value="<?php echo esc_attr(implode(',', $gallery_ids)); ?>">
	<div id="portfolio-gallery-preview">
		<?php foreach ($gallery_ids as $gallery_id) : ?>
			<?php echo wp_get_attachment_image($gallery_id, 'thumbnail', false, array('style' => 'width:72px;height:72px;object-fit:cover;margin:0 6px 6px 0')); ?>
		<?php endforeach; ?>
	</div>
	<p><button type="button" class="button" data-portfolio-media="gallery"><?php esc_html_e('Choose gallery images', 'portfolio-studio'); ?></button></p>
	<?php
}

function portfolio_studio_enqueue_admin_assets($hook) {
	$screen = get_current_screen();
	$is_settings = 'settings_page_portfolio-studio-settings' === $hook && current_user_can('manage_options');
	if (!$is_settings && (!$screen || 'portfolio_item' !== $screen->post_type || !in_array($hook, array('post.php', 'post-new.php'), true))) {
		return;
	}

	wp_enqueue_media();
	wp_enqueue_script(
		'portfolio-studio-admin',
		plugin_dir_url(__FILE__) . 'assets/portfolio-admin.js',
		array('wp-i18n', 'media-editor'),
		'1.1.0',
		true
	);
}
add_action('admin_enqueue_scripts', 'portfolio_studio_enqueue_admin_assets');

function portfolio_studio_save_meta($post_id) {
	if (
		!isset($_POST['portfolio_studio_meta_nonce']) ||
		!wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['portfolio_studio_meta_nonce'])), 'portfolio_studio_save_meta') ||
		(defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) ||
		wp_is_post_revision($post_id) ||
		!current_user_can('edit_post', $post_id)
	) {
		return;
	}

	$cover_id = isset($_POST['portfolio_cover_image_id']) ? absint($_POST['portfolio_cover_image_id']) : 0;
	$gallery_value = isset($_POST['portfolio_gallery_image_ids']) ? sanitize_text_field(wp_unslash($_POST['portfolio_gallery_image_ids'])) : '';
	$gallery_ids = array_values(array_filter(array_map('absint', explode(',', $gallery_value))));
	$cover_id = $cover_id && 'image' === get_post_mime_type($cover_id) ? $cover_id : 0;
	$gallery_ids = array_values(array_filter($gallery_ids, static function ($attachment_id) {
		return 'image' === get_post_mime_type($attachment_id);
	}));
	$video_url = isset($_POST['portfolio_video_url']) ? esc_url_raw(wp_unslash($_POST['portfolio_video_url'])) : '';
	$credits = isset($_POST['portfolio_credits']) ? sanitize_textarea_field(wp_unslash($_POST['portfolio_credits'])) : '';
	$display_order = isset($_POST['portfolio_display_order']) ? absint($_POST['portfolio_display_order']) : 0;

	update_post_meta($post_id, 'portfolio_cover_image_id', $cover_id);
	update_post_meta($post_id, 'portfolio_gallery_image_ids', $gallery_ids);
	update_post_meta($post_id, 'portfolio_display_order', $display_order);
	$video_url ? update_post_meta($post_id, 'portfolio_video_url', $video_url) : delete_post_meta($post_id, 'portfolio_video_url');
	$credits ? update_post_meta($post_id, 'portfolio_credits', $credits) : delete_post_meta($post_id, 'portfolio_credits');
}
add_action('save_post_portfolio_item', 'portfolio_studio_save_meta');

function portfolio_studio_revalidate_frontend($new_status, $old_status, $post) {
	if (!($post instanceof WP_Post) || ('publish' !== $new_status && 'publish' !== $old_status)) {
		return;
	}

	if ('portfolio_item' === $post->post_type) {
		portfolio_studio_queue_photo_revalidation();
		return;
	} elseif ('page' === $post->post_type && in_array($post->post_name, array('about', 'contact'), true)) {
		$type = 'page';
	} else {
		return;
	}

	$site_url = getenv('NEXT_PUBLIC_SITE_URL');
	$secret = getenv('REVALIDATION_SECRET');
	if (!$site_url || !$secret || !wp_http_validate_url($site_url)) {
		return;
	}

	wp_remote_post(rtrim($site_url, '/') . '/api/revalidate', array(
		'timeout' => 0.01,
		'redirection' => 0,
		'blocking' => false,
		'sslverify' => true,
		'headers' => array(
			'Authorization' => 'Bearer ' . $secret,
			'Content-Type' => 'application/json',
		),
		'body' => wp_json_encode(array('type' => $type, 'slug' => $post->post_name)),
	));
}
add_action('transition_post_status', 'portfolio_studio_revalidate_frontend', 10, 3);

function portfolio_studio_revalidate_site_settings($old_value, $new_value) {
	$site_url = getenv('NEXT_PUBLIC_SITE_URL');
	$secret = getenv('REVALIDATION_SECRET');
	if (!$site_url || !$secret || !wp_http_validate_url($site_url)) {
		return;
	}

	wp_remote_post(rtrim($site_url, '/') . '/api/revalidate', array(
		'timeout' => 0.01,
		'redirection' => 0,
		'blocking' => false,
		'sslverify' => true,
		'headers' => array(
			'Authorization' => 'Bearer ' . $secret,
			'Content-Type' => 'application/json',
		),
		'body' => wp_json_encode(array('type' => 'site_settings')),
	));
}
add_action('update_option_portfolio_studio_site_settings', 'portfolio_studio_revalidate_site_settings', 10, 2);
add_action('add_option_portfolio_studio_site_settings', 'portfolio_studio_revalidate_site_settings', 10, 2);