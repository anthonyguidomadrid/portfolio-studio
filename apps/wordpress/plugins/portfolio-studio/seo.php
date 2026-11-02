<?php

if (!defined('ABSPATH')) {
	exit;
}

function portfolio_studio_seo_fields() {
	return array(
		'title' => array('label' => __('SEO title', 'portfolio-studio'), 'limit' => 200),
		'description' => array('label' => __('Meta description', 'portfolio-studio'), 'limit' => 500),
		'image_id' => array('label' => __('Sharing image', 'portfolio-studio'), 'limit' => 0),
		'image_alt' => array('label' => __('Sharing image alternative text', 'portfolio-studio'), 'limit' => 500),
	);
}

function portfolio_studio_sanitize_seo_title($value) {
	return is_string($value) ? wp_html_excerpt(sanitize_text_field($value), 200, '') : '';
}

function portfolio_studio_sanitize_seo_description($value) {
	return is_string($value) ? wp_html_excerpt(sanitize_text_field($value), 500, '') : '';
}

function portfolio_studio_sanitize_seo($value) {
	$value = is_array($value) ? $value : array();
	return array(
		'title' => portfolio_studio_sanitize_seo_title($value['title'] ?? ''),
		'description' => portfolio_studio_sanitize_seo_description($value['description'] ?? ''),
		'image_id' => portfolio_studio_sanitize_not_found_image_id($value['image_id'] ?? 0),
		'image_alt' => portfolio_studio_sanitize_seo_description($value['image_alt'] ?? ''),
	);
}

function portfolio_studio_public_seo_image($image_id, $alt = '') {
	$image = portfolio_studio_public_not_found_image($image_id);
	if (!$image) {
		return null;
	}
	$image['alt'] = portfolio_studio_sanitize_seo_description($alt);
	if ('' === $image['alt']) {
		$image['alt'] = portfolio_studio_sanitize_seo_description(get_post_meta($image['id'], '_wp_attachment_image_alt', true));
	}
	return $image;
}

function portfolio_studio_public_seo($value) {
	$value = portfolio_studio_sanitize_seo($value);
	return array(
		'title' => $value['title'],
		'description' => $value['description'],
		'image' => portfolio_studio_public_seo_image($value['image_id'], $value['image_alt']),
	);
}

function portfolio_studio_public_seo_settings() {
	$settings = get_option('portfolio_studio_seo_settings', array());
	$settings = is_array($settings) ? $settings : array();
	return array(
		'home' => portfolio_studio_public_seo($settings['home'] ?? array()),
		'defaultImage' => portfolio_studio_public_seo_image($settings['default_image_id'] ?? 0, $settings['default_image_alt'] ?? ''),
	);
}

function portfolio_studio_sanitize_seo_settings($value) {
	$value = is_array($value) ? $value : array();
	return array(
		'home' => portfolio_studio_sanitize_seo($value['home'] ?? array()),
		'default_image_id' => portfolio_studio_sanitize_not_found_image_id($value['default_image_id'] ?? 0),
		'default_image_alt' => portfolio_studio_sanitize_seo_description($value['default_image_alt'] ?? ''),
	);
}

function portfolio_studio_register_seo() {
	add_post_type_support('page', 'custom-fields');
	foreach (portfolio_studio_seo_fields() as $field => $definition) {
		$is_image = 'image_id' === $field;
		$schema = array('type' => $is_image ? 'integer' : 'string', 'context' => array('edit'));
		if ($is_image) {
			$schema['minimum'] = 0;
		} else {
			$schema['maxLength'] = $definition['limit'];
		}
		register_post_meta('page', '_portfolio_seo_' . $field, array(
			'type' => $schema['type'],
			'single' => true,
			'default' => $is_image ? 0 : '',
			'show_in_rest' => array('schema' => $schema),
			'auth_callback' => 'portfolio_studio_can_edit_meta',
			'sanitize_callback' => $is_image ? 'portfolio_studio_sanitize_not_found_image_id' : ('title' === $field ? 'portfolio_studio_sanitize_seo_title' : 'portfolio_studio_sanitize_seo_description'),
		));
	}
}
add_action('init', 'portfolio_studio_register_seo');

function portfolio_studio_get_page_seo($post_id) {
	$value = array();
	foreach (portfolio_studio_seo_fields() as $field => $definition) {
		$value[$field] = get_post_meta($post_id, '_portfolio_seo_' . $field, true);
	}
	return $value;
}

function portfolio_studio_register_seo_rest_field() {
	register_rest_field('page', 'seo', array(
		'schema' => array(
			'description' => 'Optional public SEO overrides; null for nonpublic pages.',
			'type' => array('object', 'null'),
			'context' => array('view', 'edit', 'embed'),
			'readonly' => true,
			'properties' => array(
				'title' => array('type' => 'string', 'maxLength' => 200),
				'description' => array('type' => 'string', 'maxLength' => 500),
				'image' => array(
					'type' => array('object', 'null'),
					'properties' => array(
						'id' => array('type' => 'integer'),
						'url' => array('type' => 'string', 'format' => 'uri'),
						'width' => array('type' => 'integer'),
						'height' => array('type' => 'integer'),
						'alt' => array('type' => 'string', 'maxLength' => 500),
					),
				),
			),
		),
	));
}
add_action('rest_api_init', 'portfolio_studio_register_seo_rest_field');

function portfolio_studio_prepare_page_seo($response, $post) {
	$data = $response->get_data();
	$data['seo'] = 'publish' === $post->post_status && '' === $post->post_password
		? portfolio_studio_public_seo(portfolio_studio_get_page_seo($post->ID))
		: null;
	$response->set_data($data);
	return $response;
}
add_filter('rest_prepare_page', 'portfolio_studio_prepare_page_seo', 10, 2);

function portfolio_studio_render_seo_fields($prefix, $value, $id_prefix) {
	$value = portfolio_studio_sanitize_seo($value);
	foreach (portfolio_studio_seo_fields() as $field => $definition) {
		$id = $id_prefix . '-' . $field;
		echo '<p><label for="' . esc_attr($id) . '"><strong>' . esc_html($definition['label']) . '</strong></label><br>';
		if ('image_id' === $field) {
			portfolio_studio_render_seo_image_picker($prefix . '[' . $field . ']', $value[$field], $id);
		} elseif ('description' === $field) {
			echo '<textarea class="widefat" rows="3" id="' . esc_attr($id) . '" name="' . esc_attr($prefix . '[' . $field . ']') . '" maxlength="500">' . esc_textarea($value[$field]) . '</textarea>';
		} else {
			echo '<input class="widefat" type="text" id="' . esc_attr($id) . '" name="' . esc_attr($prefix . '[' . $field . ']') . '" maxlength="' . esc_attr((string) $definition['limit']) . '" value="' . esc_attr($value[$field]) . '">';
		}
		echo '</p>';
	}
}

function portfolio_studio_render_seo_image_picker($name, $value, $id) {
	echo '<input type="hidden" id="' . esc_attr($id) . '" name="' . esc_attr($name) . '" value="' . esc_attr((string) $value) . '">';
	echo '<span id="' . esc_attr($id . '-preview') . '" aria-live="polite">';
	if ($value) {
		echo wp_get_attachment_image($value, 'thumbnail', false, array('alt' => ''));
	}
	echo '</span> <button type="button" class="button" data-seo-image="' . esc_attr($id) . '">' . esc_html__('Choose sharing image', 'portfolio-studio') . '</button> ';
	echo '<button type="button" class="button" data-seo-remove="' . esc_attr($id) . '">' . esc_html__('Remove image', 'portfolio-studio') . '</button>';
}

function portfolio_studio_add_seo_meta_box() {
	add_meta_box('portfolio-studio-seo', __('SEO and sharing', 'portfolio-studio'), 'portfolio_studio_render_seo_meta_box', 'page', 'normal');
}
add_action('add_meta_boxes_page', 'portfolio_studio_add_seo_meta_box');

function portfolio_studio_render_seo_meta_box($post) {
	wp_nonce_field('portfolio_studio_save_seo', 'portfolio_studio_seo_nonce');
	portfolio_studio_render_seo_fields('portfolio_studio_seo', portfolio_studio_get_page_seo($post->ID), 'portfolio-page-seo');
}

function portfolio_studio_save_page_seo($post_id) {
	if (!isset($_POST['portfolio_studio_seo_nonce']) || !is_string($_POST['portfolio_studio_seo_nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['portfolio_studio_seo_nonce'])), 'portfolio_studio_save_seo') || (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) || wp_is_post_revision($post_id) || !current_user_can('edit_post', $post_id)) {
		return;
	}
	if (!isset($_POST['portfolio_studio_seo']) || !is_array($_POST['portfolio_studio_seo'])) {
		return;
	}
	foreach (portfolio_studio_sanitize_seo(wp_unslash($_POST['portfolio_studio_seo'])) as $field => $value) {
		update_post_meta($post_id, '_portfolio_seo_' . $field, $value);
	}
}
add_action('save_post_page', 'portfolio_studio_save_page_seo');

function portfolio_studio_register_seo_settings() {
	register_setting('portfolio_studio_seo', 'portfolio_studio_seo_settings', array('type' => 'array', 'sanitize_callback' => 'portfolio_studio_sanitize_seo_settings', 'default' => array()));
}
add_action('admin_init', 'portfolio_studio_register_seo_settings');

function portfolio_studio_add_seo_settings_page() {
	add_options_page(__('Portfolio SEO', 'portfolio-studio'), __('Portfolio SEO', 'portfolio-studio'), 'manage_options', 'portfolio-studio-seo', 'portfolio_studio_render_seo_settings');
}
add_action('admin_menu', 'portfolio_studio_add_seo_settings_page');

function portfolio_studio_render_seo_settings() {
	if (!current_user_can('manage_options')) {
		return;
	}
	$settings = portfolio_studio_sanitize_seo_settings(get_option('portfolio_studio_seo_settings', array()));
	echo '<div class="wrap"><h1>' . esc_html__('Portfolio SEO', 'portfolio-studio') . '</h1><form action="options.php" method="post">';
	settings_fields('portfolio_studio_seo');
	echo '<h2>' . esc_html__('Home page', 'portfolio-studio') . '</h2>';
	portfolio_studio_render_seo_fields('portfolio_studio_seo_settings[home]', $settings['home'], 'portfolio-home-seo');
	echo '<h2>' . esc_html__('Default sharing image', 'portfolio-studio') . '</h2>';
	portfolio_studio_render_seo_image_picker('portfolio_studio_seo_settings[default_image_id]', $settings['default_image_id'], 'portfolio-default-seo-image');
	echo '<p><label for="portfolio-default-seo-alt">' . esc_html__('Default sharing image alternative text', 'portfolio-studio') . '</label><br><input class="widefat" id="portfolio-default-seo-alt" name="portfolio_studio_seo_settings[default_image_alt]" maxlength="500" value="' . esc_attr($settings['default_image_alt']) . '"></p>';
	submit_button();
	echo '</form></div>';
}

function portfolio_studio_enqueue_seo_assets($hook) {
	$screen = get_current_screen();
	if (!('settings_page_portfolio-studio-seo' === $hook && current_user_can('manage_options')) && !($screen && 'page' === $screen->post_type && in_array($hook, array('post.php', 'post-new.php'), true))) {
		return;
	}
	wp_enqueue_media();
	wp_enqueue_script('portfolio-studio-seo', plugin_dir_url(__FILE__) . 'assets/seo-admin.js', array('media-editor'), '1.0.0', true);
}
add_action('admin_enqueue_scripts', 'portfolio_studio_enqueue_seo_assets');

function portfolio_studio_queue_seo_event($type, $slug = '') {
	$GLOBALS['portfolio_studio_seo_events'][$type . ':' . $slug] = array('type' => $type, 'slug' => $slug);
	if (!has_action('shutdown', 'portfolio_studio_send_seo_events')) {
		add_action('shutdown', 'portfolio_studio_send_seo_events');
	}
}

function portfolio_studio_queue_page_seo_event($post) {
	if ($post && 'page' === $post->post_type && in_array($post->post_name, array('about', 'contact', 'portfolio', 'videos', 'legal'), true)) {
		portfolio_studio_queue_seo_event('page', $post->post_name);
	}
}

function portfolio_studio_seo_page_transition($new_status, $old_status, $post) {
	if ('publish' === $new_status || 'publish' === $old_status) {
		portfolio_studio_queue_page_seo_event($post);
	}
}
add_action('transition_post_status', 'portfolio_studio_seo_page_transition', 10, 3);

function portfolio_studio_seo_related_image_changed($post_id) {
	$image_ids = array((int) $post_id);
	$image_ids = array_merge($image_ids, get_posts(array('post_type' => 'attachment', 'post_status' => 'any', 'post_parent' => $post_id, 'fields' => 'ids', 'posts_per_page' => -1)));
	$settings = get_option('portfolio_studio_seo_settings', array());
	if (is_array($settings) && (in_array((int) ($settings['default_image_id'] ?? 0), $image_ids, true) || in_array((int) ($settings['home']['image_id'] ?? 0), $image_ids, true))) {
		portfolio_studio_queue_seo_event('site_settings');
	}
	$pages = get_posts(array('post_type' => 'page', 'post_status' => 'publish', 'posts_per_page' => -1, 'meta_query' => array(array('key' => '_portfolio_seo_image_id', 'value' => $image_ids, 'compare' => 'IN', 'type' => 'NUMERIC'))));
	foreach ($pages as $page) {
		portfolio_studio_queue_page_seo_event($page);
	}
}
add_action('post_updated', 'portfolio_studio_seo_related_image_changed');
add_action('before_delete_post', 'portfolio_studio_seo_related_image_changed');
add_action('before_delete_post', 'portfolio_studio_queue_page_seo_event_by_id');

function portfolio_studio_queue_page_seo_event_by_id($post_id) {
	$post = get_post($post_id);
	if ($post && 'publish' === $post->post_status) {
		portfolio_studio_queue_page_seo_event($post);
	}
}

function portfolio_studio_seo_meta_changed($meta_id, $post_id, $meta_key) {
	if (in_array($meta_key, array('_portfolio_seo_title', '_portfolio_seo_description', '_portfolio_seo_image_id', '_portfolio_seo_image_alt'), true)) {
		portfolio_studio_queue_page_seo_event_by_id($post_id);
	} elseif (in_array($meta_key, array('_wp_attachment_image_alt', '_wp_attachment_metadata', '_wp_attached_file'), true)) {
		portfolio_studio_seo_related_image_changed($post_id);
	}
}
add_action('added_post_meta', 'portfolio_studio_seo_meta_changed', 10, 3);
add_action('updated_post_meta', 'portfolio_studio_seo_meta_changed', 10, 3);
add_action('deleted_post_meta', 'portfolio_studio_seo_meta_changed', 10, 3);

function portfolio_studio_seo_settings_changed() {
	portfolio_studio_queue_seo_event('site_settings');
}
add_action('add_option_portfolio_studio_seo_settings', 'portfolio_studio_seo_settings_changed');
add_action('update_option_portfolio_studio_seo_settings', 'portfolio_studio_seo_settings_changed');
add_action('delete_option_portfolio_studio_seo_settings', 'portfolio_studio_seo_settings_changed');

function portfolio_studio_send_seo_events() {
	$events = $GLOBALS['portfolio_studio_seo_events'] ?? array();
	$GLOBALS['portfolio_studio_seo_events'] = array();
	$site_url = getenv('NEXT_PUBLIC_SITE_URL');
	$secret = getenv('REVALIDATION_SECRET');
	if (!$site_url || !$secret || !wp_http_validate_url($site_url)) {
		return;
	}
	foreach ($events as $event) {
		wp_remote_post(rtrim($site_url, '/') . '/api/revalidate', array(
			'timeout' => 3,
			'redirection' => 0,
			'blocking' => true,
			'sslverify' => true,
			'headers' => array('Authorization' => 'Bearer ' . $secret, 'Content-Type' => 'application/json'),
			'body' => wp_json_encode($event),
		));
	}
}