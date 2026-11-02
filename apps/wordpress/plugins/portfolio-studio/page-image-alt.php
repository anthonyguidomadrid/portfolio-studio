<?php

if (!defined('ABSPATH')) {
	exit;
}

function portfolio_studio_page_image_alt($response, $post) {
	if (!in_array($post->post_name, array('about', 'contact'), true)) {
		return $response;
	}
	$data = $response->get_data();
	if (!isset($data['content']['rendered']) || !is_string($data['content']['rendered'])) {
		return $response;
	}
	$html = new WP_HTML_Tag_Processor($data['content']['rendered']);
	while ($html->next_tag('IMG')) {
		$alt = $html->get_attribute('alt');
		if ((is_string($alt) && '' !== trim($alt)) || 'true' === $html->get_attribute('aria-hidden') || in_array($html->get_attribute('role'), array('presentation', 'none'), true)) {
			continue;
		}
		$classes = $html->get_attribute('class');
		if (!is_string($classes) || !preg_match('/(?:^|\s)wp-image-([1-9][0-9]*)(?:\s|$)/', $classes, $matches)) {
			continue;
		}
		$attachment_id = (int) $matches[1];
		if (!wp_attachment_is_image($attachment_id)) {
			continue;
		}
		$media_alt = get_post_meta($attachment_id, '_wp_attachment_image_alt', true);
		if (is_string($media_alt) && '' !== trim($media_alt)) {
			$html->set_attribute('alt', trim(wp_strip_all_tags($media_alt)));
		}
	}
	$data['content']['rendered'] = $html->get_updated_html();
	$response->set_data($data);
	return $response;
}
add_filter('rest_prepare_page', 'portfolio_studio_page_image_alt', 10, 2);