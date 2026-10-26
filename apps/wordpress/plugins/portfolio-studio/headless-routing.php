<?php

if (!defined('ABSPATH')) {
	exit;
}

function portfolio_studio_frontend_url() {
	$value = getenv('NEXT_PUBLIC_SITE_URL');
	$url = is_string($value) ? wp_http_validate_url(trim($value)) : false;
	if (!$url) {
		return '';
	}
	$parts = wp_parse_url($url);
	if (isset($parts['query']) || isset($parts['fragment'])) {
		return '';
	}
	foreach (array(home_url(), site_url()) as $cms_url) {
		if (0 === strcasecmp($parts['host'], (string) wp_parse_url($cms_url, PHP_URL_HOST))) {
			return '';
		}
	}
	return untrailingslashit($url);
}

function portfolio_studio_frontend_redirect_target() {
	if (is_admin() || wp_doing_ajax() || wp_doing_cron() || (defined('REST_REQUEST') && REST_REQUEST) || is_robots()) {
		return '';
	}
	$frontend = portfolio_studio_frontend_url();
	if (!$frontend) {
		return '';
	}
	if (!is_front_page() && is_page(array('about', 'contact', 'cv', 'portfolio', 'videos'))) {
		return $frontend . '/' . get_queried_object()->post_name;
	}
	return $frontend . '/';
}

function portfolio_studio_redirect_public_theme() {
	$target = portfolio_studio_frontend_redirect_target();
	if ($target) {
		nocache_headers();
		header('X-Robots-Tag: noindex, nofollow', true);
		if (wp_redirect($target, 302, 'Portfolio Studio')) {
			exit;
		}
	}
}
add_action('template_redirect', 'portfolio_studio_redirect_public_theme', 0);

function portfolio_studio_headless_robots($output) {
	return portfolio_studio_frontend_url() ? "User-agent: *\nDisallow: /\n" : $output;
}
add_filter('robots_txt', 'portfolio_studio_headless_robots');