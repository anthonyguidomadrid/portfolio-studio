<?php

class Portfolio_Studio_Not_Found_Settings_Test extends WP_UnitTestCase {
	public function tear_down() {
		remove_action('shutdown', 'portfolio_studio_send_not_found_settings_revalidation');
		parent::tear_down();
	}

	private function image($parent = 0) {
		$image_id = self::factory()->post->create(array(
			'post_type' => 'attachment',
			'post_mime_type' => 'image/jpeg',
			'post_status' => 'inherit',
			'post_parent' => $parent,
		));
		update_post_meta($image_id, '_wp_attached_file', 'background.jpg');
		update_post_meta($image_id, '_wp_attachment_metadata', array(
			'width' => 1600, 'height' => 1000, 'file' => 'background.jpg',
		));
		return $image_id;
	}

	public function test_public_api_defaults_to_null_and_exposes_selected_image() {
		wp_set_current_user(0);
		$request = new WP_REST_Request('GET', '/portfolio-studio/v1/settings');
		$response = rest_get_server()->dispatch($request);
		$this->assertSame(200, $response->get_status());
		$this->assertNull($response->get_data()['notFoundBackgroundImage']);
		$image_id = $this->image();
		update_option('portfolio_studio_site_settings', array('not_found_background_image_id' => $image_id));
		$data = rest_get_server()->dispatch($request)->get_data();
		$this->assertSame(array(
			'id' => $image_id,
			'url' => wp_get_attachment_image_src($image_id, 'full')[0],
			'width' => 1600,
			'height' => 1000,
		), $data['notFoundBackgroundImage']);
		$this->assertArrayNotHasKey('not_found_background_image_id', $data);
	}

	public function test_sanitizes_image_selection_and_removal() {
		$image_id = $this->image();
		$settings = portfolio_studio_sanitize_site_settings(array('not_found_background_image_id' => (string) $image_id));
		$this->assertSame($image_id, $settings['not_found_background_image_id']);
		foreach (array(0, '', -1, 'invalid', array(), self::factory()->post->create()) as $value) {
			$this->assertSame(0, portfolio_studio_sanitize_not_found_image_id($value));
		}
		$this->assertSame(0, portfolio_studio_sanitize_site_settings(array('not_found_background_image_id' => '0'))['not_found_background_image_id']);
	}

	public function test_nonpublic_or_protected_parent_is_not_exposed() {
		$parent_id = self::factory()->post->create(array('post_status' => 'publish'));
		$image_id = $this->image($parent_id);
		$this->assertNotNull(portfolio_studio_public_not_found_image($image_id));
		foreach (array('draft', 'private', 'trash') as $status) {
			wp_update_post(array('ID' => $parent_id, 'post_status' => $status));
			$this->assertNull(portfolio_studio_public_not_found_image($image_id));
		}
		wp_update_post(array('ID' => $parent_id, 'post_status' => 'publish', 'post_password' => 'protected'));
		$this->assertNull(portfolio_studio_public_not_found_image($image_id));
	}

	public function test_missing_dimensions_deleted_or_trashed_images_are_not_exposed() {
		$image_id = $this->image();
		delete_post_meta($image_id, '_wp_attachment_metadata');
		$this->assertNull(portfolio_studio_public_not_found_image($image_id));
		$image_id = $this->image();
		wp_update_post(array('ID' => $image_id, 'post_status' => 'trash'));
		$this->assertNull(portfolio_studio_public_not_found_image($image_id));
		wp_delete_attachment($image_id, true);
		$this->assertNull(portfolio_studio_public_not_found_image($image_id));
	}

	public function test_external_image_urls_are_not_exposed() {
		$image_id = $this->image();
		$filter = static function () {
			return array('https://external.example.org/background.jpg', 1600, 1000, false);
		};
		add_filter('wp_get_attachment_image_src', $filter);
		try {
			$this->assertNull(portfolio_studio_public_not_found_image($image_id));
		} finally {
			remove_filter('wp_get_attachment_image_src', $filter);
		}
	}

	public function test_selected_image_and_parent_changes_queue_settings_invalidation() {
		$parent_id = self::factory()->post->create(array('post_status' => 'publish'));
		$image_id = $this->image($parent_id);
		update_option('portfolio_studio_site_settings', array('not_found_background_image_id' => $image_id));
		update_post_meta($image_id, '_wp_attached_file', 'replacement.jpg');
		$this->assertNotFalse(has_action('shutdown', 'portfolio_studio_send_not_found_settings_revalidation'));
		remove_action('shutdown', 'portfolio_studio_send_not_found_settings_revalidation');
		wp_update_post(array('ID' => $parent_id, 'post_status' => 'private'));
		$this->assertNotFalse(has_action('shutdown', 'portfolio_studio_send_not_found_settings_revalidation'));
	}

	public function test_settings_picker_requires_manage_options() {
		wp_set_current_user(self::factory()->user->create(array('role' => 'subscriber')));
		ob_start();
		portfolio_studio_render_settings_page();
		$this->assertSame('', ob_get_clean());
		wp_set_current_user(self::factory()->user->create(array('role' => 'administrator')));
		ob_start();
		portfolio_studio_render_settings_page();
		$html = ob_get_clean();
		$this->assertStringContainsString('portfolio-not-found-image-id', $html);
		$this->assertStringContainsString('_wpnonce', $html);
	}
}