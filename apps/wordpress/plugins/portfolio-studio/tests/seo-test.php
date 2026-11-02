<?php

class Portfolio_Studio_SEO_Test extends WP_UnitTestCase {
	private $previous_post;

	public function set_up() {
		parent::set_up();
		$this->previous_post = $_POST;
		$GLOBALS['portfolio_studio_seo_events'] = array();
	}

	public function tear_down() {
		$_POST = $this->previous_post;
		parent::tear_down();
		$GLOBALS['portfolio_studio_seo_events'] = array();
		remove_action('shutdown', 'portfolio_studio_send_seo_events');
	}

	private function image($parent = 0) {
		$image_id = self::factory()->post->create(array('post_type' => 'attachment', 'post_status' => 'inherit', 'post_mime_type' => 'image/jpeg', 'post_parent' => $parent));
		update_post_meta($image_id, '_wp_attached_file', 'sharing.jpg');
		update_post_meta($image_id, '_wp_attachment_metadata', array('width' => 1200, 'height' => 630, 'file' => 'sharing.jpg'));
		update_post_meta($image_id, '_wp_attachment_image_alt', 'Media image description');
		return $image_id;
	}

	private function page($slug = 'about', $status = 'publish') {
		return self::factory()->post->create(array('post_type' => 'page', 'post_name' => $slug, 'post_status' => $status));
	}

	public function test_settings_defaults_and_public_page_projection() {
		wp_set_current_user(0);
		$settings = rest_get_server()->dispatch(new WP_REST_Request('GET', '/portfolio-studio/v1/settings'))->get_data();
		$this->assertSame(array('home' => array('title' => '', 'description' => '', 'image' => null), 'defaultImage' => null), $settings['seo']);
		$page_id = $this->page();
		update_post_meta($page_id, '_portfolio_seo_title', 'About the studio');
		update_post_meta($page_id, '_portfolio_seo_description', 'An editorial description.');
		$request = new WP_REST_Request('GET', '/wp/v2/pages');
		$request->set_param('slug', 'about');
		$request->set_param('_fields', 'slug,seo');
		$response = rest_get_server()->dispatch($request);
		$this->assertSame(200, $response->get_status());
		$data = rest_filter_response_fields($response, rest_get_server(), $request)->get_data()[0];
		$this->assertSame('About the studio', $data['seo']['title']);
		$this->assertSame('An editorial description.', $data['seo']['description']);
		$this->assertNull($data['seo']['image']);
		$this->assertArrayNotHasKey('meta', $data);
	}

	public function test_validates_text_types_markup_and_lengths() {
		$seo = portfolio_studio_sanitize_seo(array('title' => '<b>Title</b>', 'description' => array('invalid'), 'image_id' => -5, 'image_alt' => '<i>Image</i>'));
		$this->assertSame(array('title' => 'Title', 'description' => '', 'image_id' => 0, 'image_alt' => 'Image'), $seo);
		$this->assertSame(200, strlen(portfolio_studio_sanitize_seo_title(str_repeat('a', 250))));
		$this->assertSame(500, strlen(portfolio_studio_sanitize_seo_description(str_repeat('a', 600))));
		$this->assertSame('', portfolio_studio_sanitize_seo_title(array()));
		$this->assertSame(0, portfolio_studio_sanitize_seo(array('image_id' => array()))['image_id']);
	}

	public function test_exposes_public_image_with_dimensions_and_alt_fallback() {
		$image_id = $this->image();
		update_option('portfolio_studio_seo_settings', array('home' => array('title' => 'Home SEO', 'description' => 'Home description', 'image_id' => $image_id), 'default_image_id' => $image_id, 'default_image_alt' => 'Default description'));
		$seo = portfolio_studio_public_seo_settings();
		$this->assertSame('Home SEO', $seo['home']['title']);
		$this->assertSame(array('id' => $image_id, 'url' => wp_get_attachment_image_src($image_id, 'full')[0], 'width' => 1200, 'height' => 630, 'alt' => 'Media image description'), $seo['home']['image']);
		$this->assertSame('Default description', $seo['defaultImage']['alt']);
		$this->assertSame('Override', portfolio_studio_public_seo_image($image_id, 'Override')['alt']);
	}

	public function test_settings_sanitize_and_clear_optional_values() {
		$image_id = $this->image();
		$settings = portfolio_studio_sanitize_seo_settings(array('home' => array('title' => '<b>Home</b>', 'image_id' => (string) $image_id), 'default_image_id' => (string) $image_id, 'default_image_alt' => '<b>Description</b>'));
		$this->assertSame('Home', $settings['home']['title']);
		$this->assertSame($image_id, $settings['home']['image_id']);
		$this->assertSame($image_id, $settings['default_image_id']);
		$this->assertSame('Description', $settings['default_image_alt']);
		$this->assertSame(array('home' => array('title' => '', 'description' => '', 'image_id' => 0, 'image_alt' => ''), 'default_image_id' => 0, 'default_image_alt' => ''), portfolio_studio_sanitize_seo_settings(array()));
	}

	public function test_nonpublic_parent_or_invalid_media_is_not_exposed() {
		$parent = $this->page();
		$image_id = $this->image($parent);
		foreach (array('draft', 'private', 'trash') as $status) {
			wp_update_post(array('ID' => $parent, 'post_status' => $status));
			$this->assertNull(portfolio_studio_public_seo_image($image_id));
		}
		wp_update_post(array('ID' => $parent, 'post_status' => 'publish', 'post_password' => 'secret'));
		$this->assertNull(portfolio_studio_public_seo_image($image_id));
		$this->assertNull(portfolio_studio_public_seo_image($parent));
		$image_id = $this->image();
		delete_post_meta($image_id, '_wp_attachment_metadata');
		$this->assertNull(portfolio_studio_public_seo_image($image_id));
	}

	public function test_external_media_and_deleted_images_are_not_exposed() {
		$image_id = $this->image();
		$filter = static function () { return array('https://external.example.org/image.jpg', 1200, 630, false); };
		add_filter('wp_get_attachment_image_src', $filter);
		try {
			$this->assertNull(portfolio_studio_public_seo_image($image_id));
		} finally {
			remove_filter('wp_get_attachment_image_src', $filter);
		}
		wp_delete_attachment($image_id, true);
		$this->assertNull(portfolio_studio_public_seo_image($image_id));
	}

	public function test_nonpublic_page_seo_is_null_even_for_authorized_editor() {
		wp_set_current_user(self::factory()->user->create(array('role' => 'administrator')));
		$page_id = $this->page('about', 'draft');
		update_post_meta($page_id, '_portfolio_seo_title', 'Private draft title');
		$request = new WP_REST_Request('GET', '/wp/v2/pages/' . $page_id);
		$request->set_param('context', 'edit');
		$this->assertNull(rest_get_server()->dispatch($request)->get_data()['seo']);
		wp_update_post(array('ID' => $page_id, 'post_status' => 'publish', 'post_password' => 'secret'));
		$this->assertNull(rest_get_server()->dispatch($request)->get_data()['seo']);
	}

	public function test_rest_writes_require_edit_capability_and_validate_metadata() {
		$page_id = $this->page();
		$request = new WP_REST_Request('POST', '/wp/v2/pages/' . $page_id);
		$request->set_param('meta', array('_portfolio_seo_title' => 'New SEO title'));
		wp_set_current_user(0);
		$this->assertSame(401, rest_get_server()->dispatch($request)->get_status());
		wp_set_current_user(self::factory()->user->create(array('role' => 'subscriber')));
		$this->assertSame(403, rest_get_server()->dispatch($request)->get_status());
		wp_set_current_user(self::factory()->user->create(array('role' => 'editor')));
		$this->assertSame(200, rest_get_server()->dispatch($request)->get_status());
		$this->assertSame('New SEO title', get_post_meta($page_id, '_portfolio_seo_title', true));
		$request->set_param('meta', array('_portfolio_seo_title' => str_repeat('a', 201)));
		$this->assertSame(400, rest_get_server()->dispatch($request)->get_status());
	}

	public function test_meta_box_save_requires_nonce_and_capability() {
		$page_id = $this->page();
		wp_set_current_user(self::factory()->user->create(array('role' => 'administrator')));
		$_POST = array('portfolio_studio_seo' => array('title' => 'Saved title'));
		portfolio_studio_save_page_seo($page_id);
		$this->assertSame('', get_post_meta($page_id, '_portfolio_seo_title', true));
		$_POST['portfolio_studio_seo_nonce'] = wp_create_nonce('portfolio_studio_save_seo');
		portfolio_studio_save_page_seo($page_id);
		$this->assertSame('Saved title', get_post_meta($page_id, '_portfolio_seo_title', true));
		wp_set_current_user(self::factory()->user->create(array('role' => 'subscriber')));
		$_POST['portfolio_studio_seo_nonce'] = wp_create_nonce('portfolio_studio_save_seo');
		$_POST['portfolio_studio_seo']['title'] = 'Unauthorized change';
		portfolio_studio_save_page_seo($page_id);
		$this->assertSame('Saved title', get_post_meta($page_id, '_portfolio_seo_title', true));
	}

	public function test_settings_ui_requires_manage_options_and_includes_pickers() {
		wp_set_current_user(self::factory()->user->create(array('role' => 'subscriber')));
		ob_start();
		portfolio_studio_render_seo_settings();
		$this->assertSame('', ob_get_clean());
		wp_set_current_user(self::factory()->user->create(array('role' => 'administrator')));
		ob_start();
		portfolio_studio_render_seo_settings();
		$html = ob_get_clean();
		$this->assertStringContainsString('portfolio_studio_seo_settings[home][title]', $html);
		$this->assertStringContainsString('data-seo-image="portfolio-default-seo-image"', $html);
		$this->assertStringContainsString('_wpnonce', $html);
	}

	public function test_page_and_image_updates_queue_deduplicated_cache_events() {
		$parent = $this->page('about');
		$image_id = $this->image($parent);
		$page_id = $this->page('portfolio');
		update_post_meta($page_id, '_portfolio_seo_image_id', $image_id);
		update_option('portfolio_studio_seo_settings', array('default_image_id' => $image_id));
		$GLOBALS['portfolio_studio_seo_events'] = array();
		update_post_meta($image_id, '_wp_attachment_image_alt', 'Updated description');
		$this->assertArrayHasKey('page:portfolio', $GLOBALS['portfolio_studio_seo_events']);
		$this->assertArrayHasKey('site_settings:', $GLOBALS['portfolio_studio_seo_events']);
		$GLOBALS['portfolio_studio_seo_events'] = array();
		wp_update_post(array('ID' => $parent, 'post_status' => 'private'));
		$this->assertArrayHasKey('page:portfolio', $GLOBALS['portfolio_studio_seo_events']);
		$this->assertArrayHasKey('site_settings:', $GLOBALS['portfolio_studio_seo_events']);
		foreach (array('about', 'contact', 'portfolio', 'videos', 'legal') as $slug) {
			$post = new WP_Post((object) array('post_type' => 'page', 'post_name' => $slug));
			portfolio_studio_seo_page_transition('publish', 'publish', $post);
			portfolio_studio_seo_page_transition('publish', 'publish', $post);
			$this->assertSame(array('type' => 'page', 'slug' => $slug), $GLOBALS['portfolio_studio_seo_events']['page:' . $slug]);
		}
	}

	public function test_sender_uses_existing_authenticated_events_without_redirects() {
		$previous_url = getenv('NEXT_PUBLIC_SITE_URL');
		$previous_secret = getenv('REVALIDATION_SECRET');
		putenv('NEXT_PUBLIC_SITE_URL=https://192.0.2.10');
		putenv('REVALIDATION_SECRET=test-only-secret');
		$requests = array();
		$intercept = static function ($preempt, $args, $url) use (&$requests) {
			$requests[] = array('url' => $url, 'args' => $args);
			return array('headers' => array(), 'body' => '{}', 'response' => array('code' => 200, 'message' => 'OK'));
		};
		add_filter('pre_http_request', $intercept, 10, 3);
		try {
			portfolio_studio_queue_seo_event('page', 'about');
			portfolio_studio_queue_seo_event('page', 'about');
			portfolio_studio_send_seo_events();
			$this->assertCount(1, $requests);
			$this->assertSame('https://192.0.2.10/api/revalidate', $requests[0]['url']);
			$this->assertSame('Bearer test-only-secret', $requests[0]['args']['headers']['Authorization']);
			$this->assertSame(0, $requests[0]['args']['redirection']);
			$this->assertSame(array('type' => 'page', 'slug' => 'about'), json_decode($requests[0]['args']['body'], true));
			$this->assertSame(array(), $GLOBALS['portfolio_studio_seo_events']);
		} finally {
			remove_filter('pre_http_request', $intercept, 10);
			putenv(false === $previous_url ? 'NEXT_PUBLIC_SITE_URL' : 'NEXT_PUBLIC_SITE_URL=' . $previous_url);
			putenv(false === $previous_secret ? 'REVALIDATION_SECRET' : 'REVALIDATION_SECRET=' . $previous_secret);
		}
	}

	public function test_sender_skips_delivery_without_configuration() {
		$previous_url = getenv('NEXT_PUBLIC_SITE_URL');
		$previous_secret = getenv('REVALIDATION_SECRET');
		$requests = 0;
		$intercept = static function () use (&$requests) { $requests++; return new WP_Error('unexpected_request'); };
		add_filter('pre_http_request', $intercept);
		try {
			foreach (array(array('', 'secret'), array('https://192.0.2.10', ''), array('not-a-url', 'secret')) as $configuration) {
				putenv('NEXT_PUBLIC_SITE_URL=' . $configuration[0]);
				putenv('REVALIDATION_SECRET=' . $configuration[1]);
				portfolio_studio_queue_seo_event('page', 'about');
				portfolio_studio_send_seo_events();
			}
			$this->assertSame(0, $requests);
		} finally {
			remove_filter('pre_http_request', $intercept);
			putenv(false === $previous_url ? 'NEXT_PUBLIC_SITE_URL' : 'NEXT_PUBLIC_SITE_URL=' . $previous_url);
			putenv(false === $previous_secret ? 'REVALIDATION_SECRET' : 'REVALIDATION_SECRET=' . $previous_secret);
		}
	}
}