<?php

if (!defined('ABSPATH')) {
	exit;
}

function portfolio_studio_sanitize_not_found_image_id($value) {
	if (!is_scalar($value) || !ctype_digit((string) $value)) {
		return 0;
	}
	$image_id = (int) $value;
	return portfolio_studio_public_not_found_image($image_id) ? $image_id : 0;
}

function portfolio_studio_public_not_found_image($image_id) {
	if (!is_scalar($image_id) || !ctype_digit((string) $image_id) || (int) $image_id < 1) {
		return null;
	}
	$image_id = (int) $image_id;
	$image = get_post($image_id);
	if (!$image || 'attachment' !== $image->post_type || !wp_attachment_is_image($image_id) || !in_array($image->post_status, array('inherit', 'publish'), true) || '' !== $image->post_password) {
		return null;
	}
	if ($image->post_parent) {
		$parent = get_post($image->post_parent);
		if (!$parent || 'publish' !== $parent->post_status || '' !== $parent->post_password) {
			return null;
		}
	}
	$source = wp_get_attachment_image_src($image_id, 'full');
	$uploads = wp_get_upload_dir();
	if (!$source || $source[1] < 1 || $source[2] < 1 || $uploads['error']) {
		return null;
	}
	$url = esc_url_raw($source[0], array('http', 'https'));
	if (!$url || 0 !== strpos($url, trailingslashit($uploads['baseurl']))) {
		return null;
	}
	return array('id' => $image_id, 'url' => $url, 'width' => (int) $source[1], 'height' => (int) $source[2]);
}

function portfolio_studio_render_not_found_image_setting($settings) {
	$image_id = portfolio_studio_sanitize_not_found_image_id($settings['not_found_background_image_id']);
	?>
	<tr>
		<th scope="row"><?php esc_html_e('404 background image', 'portfolio-studio'); ?></th>
		<td>
			<input id="portfolio-not-found-image-id" name="portfolio_studio_site_settings[not_found_background_image_id]" type="hidden" value="<?php echo esc_attr((string) $image_id); ?>">
			<div id="portfolio-not-found-image-preview" aria-live="polite">
				<?php if ($image_id) { echo wp_get_attachment_image($image_id, 'medium', false, array('alt' => '')); } ?>
			</div>
			<button type="button" class="button" data-portfolio-media="not-found"><?php esc_html_e('Choose 404 background image', 'portfolio-studio'); ?></button>
			<button type="button" class="button" id="portfolio-not-found-image-remove"><?php esc_html_e('Remove 404 background image', 'portfolio-studio'); ?></button>
			<p class="description"><?php esc_html_e('Optional public image for the frontend 404 background. Save changes after choosing or removing an image. Images attached to private, draft, or password-protected content are not published.', 'portfolio-studio'); ?></p>
		</td>
	</tr>
	<?php
}

function portfolio_studio_queue_not_found_settings_revalidation($post_id) {
	$settings = get_option('portfolio_studio_site_settings', array());
	$image_id = is_array($settings) ? (int) ($settings['not_found_background_image_id'] ?? 0) : 0;
	if (!$image_id || ((int) $post_id !== $image_id && (int) $post_id !== (int) wp_get_post_parent_id($image_id))) {
		return;
	}
	if (!has_action('shutdown', 'portfolio_studio_send_not_found_settings_revalidation')) {
		add_action('shutdown', 'portfolio_studio_send_not_found_settings_revalidation');
	}
}

function portfolio_studio_send_not_found_settings_revalidation() {
	portfolio_studio_revalidate_site_settings(null, null);
}

function portfolio_studio_not_found_image_meta_changed($meta_id, $post_id, $meta_key) {
	if (in_array($meta_key, array('_wp_attachment_metadata', '_wp_attached_file'), true)) {
		portfolio_studio_queue_not_found_settings_revalidation($post_id);
	}
}
add_action('added_post_meta', 'portfolio_studio_not_found_image_meta_changed', 10, 3);
add_action('updated_post_meta', 'portfolio_studio_not_found_image_meta_changed', 10, 3);
add_action('deleted_post_meta', 'portfolio_studio_not_found_image_meta_changed', 10, 3);
add_action('post_updated', 'portfolio_studio_queue_not_found_settings_revalidation');
add_action('before_delete_post', 'portfolio_studio_queue_not_found_settings_revalidation');