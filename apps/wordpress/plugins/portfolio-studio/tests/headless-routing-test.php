<?php

class Portfolio_Studio_Headless_Routing_Test extends WP_UnitTestCase {
	private $previous_frontend_url;

	public function set_up() {
		parent::set_up();
		$this->previous_frontend_url = getenv('NEXT_PUBLIC_SITE_URL');
		putenv('NEXT_PUBLIC_SITE_URL=https://192.0.2.10');
	}

	public function tear_down() {
		putenv(false === $this->previous_frontend_url ? 'NEXT_PUBLIC_SITE_URL' : 'NEXT_PUBLIC_SITE_URL=' . $this->previous_frontend_url);
		parent::tear_down();
	}

	public function test_known_pages_map_to_frontend_without_query_parameters() {
		foreach (array('about', 'contact', 'cv', 'portfolio', 'videos') as $slug) {
			$post_id = self::factory()->post->create(array(
				'post_type' => 'page',
				'post_status' => 'publish',
				'post_name' => $slug,
			));
			$this->go_to(add_query_arg('tracking', 'ignored', get_permalink($post_id)));
			$this->assertSame('https://192.0.2.10/' . $slug, portfolio_studio_frontend_redirect_target());
		}
	}

	public function test_home_unknown_pages_feeds_and_sitemaps_use_frontend_home() {
		foreach (array('/', '/missing-page/', '/?feed=rss2', '/?sitemap=index') as $path) {
			$this->go_to(home_url($path));
			$this->assertSame('https://192.0.2.10/', portfolio_studio_frontend_redirect_target());
		}
	}

	public function test_invalid_configuration_does_not_redirect() {
		$this->go_to(home_url('/'));
		foreach (array('', 'not-a-url', 'javascript:alert(1)', home_url(), site_url(), 'https://192.0.2.10/?redirect=elsewhere', 'https://192.0.2.10/#fragment') as $value) {
			putenv('NEXT_PUBLIC_SITE_URL=' . $value);
			$this->assertSame('', portfolio_studio_frontend_redirect_target());
		}
	}

	public function test_admin_is_not_redirected() {
		set_current_screen('dashboard');
		try {
			$this->assertSame('', portfolio_studio_frontend_redirect_target());
		} finally {
			set_current_screen('front');
		}
	}

	public function test_robots_remains_available_and_allows_only_uploads() {
		$this->go_to(home_url('/?robots=1'));
		$this->assertSame('', portfolio_studio_frontend_redirect_target());
		$this->assertSame("User-agent: *\nDisallow: /\nAllow: /wp-content/uploads/\n", apply_filters('robots_txt', 'original', '1'));
		putenv('NEXT_PUBLIC_SITE_URL');
		$this->assertSame('original', apply_filters('robots_txt', 'original', '1'));
	}

	public function test_redirect_runs_before_canonical_and_sitemap_handlers() {
		$this->assertSame(0, has_action('template_redirect', 'portfolio_studio_redirect_public_theme'));
	}
}