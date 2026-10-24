<?php

if (!defined('ABSPATH')) {
	exit;
}

function portfolio_studio_public_photo($post) {
	if ('publish' !== $post->post_status || '' !== $post->post_password) {
		return null;
	}

	$image_id = (int) get_post_meta($post->ID, 'portfolio_cover_image_id', true);
	if (!$image_id) {
		$image_id = (int) get_post_thumbnail_id($post->ID);
	}
	$image = get_post($image_id);
	if (!$image || 'attachment' !== $image->post_type || !wp_attachment_is_image($image_id) || !in_array($image->post_status, array('inherit', 'publish'), true)) {
		return null;
	}
	if ($image->post_parent && $image->post_parent !== $post->ID) {
		$parent = get_post($image->post_parent);
		if (!$parent || 'publish' !== $parent->post_status || '' !== $parent->post_password) {
			return null;
		}
	}

	$source = wp_get_attachment_image_src($image_id, 'full');
	if (!$source || $source[1] < 1 || $source[2] < 1) {
		return null;
	}
	$terms = wp_get_object_terms($post->ID, 'portfolio_tag', array('orderby' => 'name', 'order' => 'ASC'));
	if (is_wp_error($terms)) {
		return $terms;
	}
	$tags = array_map(static function ($term) {
		return array('id' => (int) $term->term_id, 'slug' => $term->slug, 'name' => $term->name);
	}, $terms);

	return array(
		'id' => (int) $post->ID,
		'slug' => $post->post_name,
		'title' => wp_strip_all_tags($post->post_title),
		'displayOrder' => absint(get_post_meta($post->ID, 'portfolio_display_order', true)),
		'image' => array(
			'id' => $image_id,
			'url' => esc_url_raw($source[0]),
			'width' => (int) $source[1],
			'height' => (int) $source[2],
			'alt' => wp_strip_all_tags((string) get_post_meta($image_id, '_wp_attachment_image_alt', true)),
			'caption' => wp_strip_all_tags($image->post_excerpt),
		),
		'tags' => $tags,
	);
}

function portfolio_studio_get_photos($request) {
	$query = new WP_Query(array(
		'post_type' => 'portfolio_item',
		'post_status' => 'publish',
		'has_password' => false,
		'posts_per_page' => -1,
		'no_found_rows' => true,
		'orderby' => 'ID',
		'order' => 'ASC',
	));
	$photos = array();
	$tags = array();
	foreach ($query->posts as $post) {
		$photo = portfolio_studio_public_photo($post);
		if (is_wp_error($photo)) {
			return new WP_Error('portfolio_tags_unavailable', 'Portfolio tags are unavailable.', array('status' => 503));
		}
		if (!$photo) {
			continue;
		}
		$photos[] = $photo;
		foreach ($photo['tags'] as $tag) {
			$tags[$tag['id']] = $tag;
		}
	}
	usort($photos, static function ($first, $second) {
		return ($first['displayOrder'] <=> $second['displayOrder'])
			?: strnatcasecmp($first['title'], $second['title'])
			?: ($first['id'] <=> $second['id']);
	});
	usort($tags, static function ($first, $second) {
		return strnatcasecmp($first['name'], $second['name']) ?: ($first['id'] <=> $second['id']);
	});
	$tag_slug = $request->get_param('tag');
	if ($tag_slug) {
		$photos = array_values(array_filter($photos, static function ($photo) use ($tag_slug) {
			return in_array($tag_slug, array_column($photo['tags'], 'slug'), true);
		}));
	}
	$total = count($photos);
	$per_page = (int) $request->get_param('per_page');
	$page = (int) $request->get_param('page');
	$total_pages = (int) ceil($total / $per_page);
	if ($page > max(1, $total_pages)) {
		return new WP_Error('portfolio_invalid_page', 'Page exceeds the available photo collection.', array('status' => 400));
	}
	$response = rest_ensure_response(array(
		'items' => array_slice($photos, ($page - 1) * $per_page, $per_page),
		'tags' => array_values($tags),
		'total' => $total,
		'totalPages' => $total_pages,
		'page' => $page,
	));
	$response->header('X-WP-Total', $total);
	$response->header('X-WP-TotalPages', $total_pages);
	return $response;
}

function portfolio_studio_register_photos_route() {
	register_rest_route('portfolio-studio/v1', '/photos', array(
		'methods' => WP_REST_Server::READABLE,
		'callback' => 'portfolio_studio_get_photos',
		'permission_callback' => '__return_true',
		'args' => array(
			'page' => array('type' => 'integer', 'minimum' => 1, 'default' => 1),
			'per_page' => array('type' => 'integer', 'minimum' => 1, 'maximum' => 100, 'default' => 24),
			'tag' => array(
				'type' => 'string',
				'maxLength' => 200,
				'default' => '',
				'sanitize_callback' => static function ($value) {
					return sanitize_title($value);
				},
			),
		),
	));
}
add_action('rest_api_init', 'portfolio_studio_register_photos_route');

function portfolio_studio_queue_photo_revalidation() {
	static $queued = false;
	if (!$queued) {
		$queued = true;
		add_action('shutdown', 'portfolio_studio_send_photo_revalidation');
	}
}

function portfolio_studio_send_photo_revalidation() {
	$site_url = getenv('NEXT_PUBLIC_SITE_URL');
	$secret = getenv('REVALIDATION_SECRET');
	if (!$site_url || !$secret || !wp_http_validate_url($site_url)) {
		return;
	}
	wp_remote_post(rtrim($site_url, '/') . '/api/revalidate', array(
		'timeout' => 3,
		'redirection' => 0,
		'blocking' => true,
		'sslverify' => true,
		'headers' => array('Authorization' => 'Bearer ' . $secret, 'Content-Type' => 'application/json'),
		'body' => wp_json_encode(array('type' => 'portfolio_item', 'slug' => '')),
	));
}

function portfolio_studio_photo_meta_changed($meta_id, $object_id, $meta_key) {
	if ('portfolio_item' === get_post_type($object_id) && in_array($meta_key, array('portfolio_cover_image_id', 'portfolio_display_order'), true)) {
		portfolio_studio_queue_photo_revalidation();
	}
	if ('attachment' === get_post_type($object_id) && in_array($meta_key, array('_wp_attachment_image_alt', '_wp_attachment_metadata', '_wp_attached_file'), true)) {
		portfolio_studio_queue_photo_revalidation();
	}
}
add_action('added_post_meta', 'portfolio_studio_photo_meta_changed', 10, 3);
add_action('updated_post_meta', 'portfolio_studio_photo_meta_changed', 10, 3);
add_action('deleted_post_meta', 'portfolio_studio_photo_meta_changed', 10, 3);

function portfolio_studio_photo_terms_changed($object_id, $terms, $tt_ids, $taxonomy) {
	if ('portfolio_tag' === $taxonomy) {
		portfolio_studio_queue_photo_revalidation();
	}
}
add_action('set_object_terms', 'portfolio_studio_photo_terms_changed', 10, 4);
function portfolio_studio_photo_relationships_deleted($object_id, $tt_ids, $taxonomy) {
	if ('portfolio_tag' === $taxonomy) {
		portfolio_studio_queue_photo_revalidation();
	}
}
add_action('deleted_term_relationships', 'portfolio_studio_photo_relationships_deleted', 10, 3);
add_action('edited_portfolio_tag', 'portfolio_studio_queue_photo_revalidation');
add_action('delete_portfolio_tag', 'portfolio_studio_queue_photo_revalidation');

function portfolio_studio_photo_deleted($post_id, $post) {
	if (in_array($post->post_type, array('portfolio_item', 'attachment'), true)) {
		portfolio_studio_queue_photo_revalidation();
	}
}
add_action('before_delete_post', 'portfolio_studio_photo_deleted', 10, 2);
add_action('edit_attachment', 'portfolio_studio_queue_photo_revalidation');