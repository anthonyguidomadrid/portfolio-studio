<?php

class Portfolio_Studio_Photos_REST_Test extends WP_UnitTestCase {
	private function photo($title, $order, $status = 'publish') {
		$post_id = self::factory()->post->create(array(
			'post_type' => 'portfolio_item',
			'post_title' => $title,
			'post_status' => $status,
		));
		$image_id = self::factory()->post->create(array(
			'post_type' => 'attachment',
			'post_mime_type' => 'image/jpeg',
			'post_status' => 'inherit',
			'post_parent' => $post_id,
		));
		update_post_meta($image_id, '_wp_attached_file', 'test-photo.jpg');
		update_post_meta($image_id, '_wp_attachment_metadata', array(
			'width' => 800, 'height' => 1000, 'file' => 'test-photo.jpg',
		));
		update_post_meta($image_id, '_wp_attachment_image_alt', 'Test portrait');
		update_post_meta($post_id, 'portfolio_cover_image_id', $image_id);
		update_post_meta($post_id, 'portfolio_display_order', $order);
		return $post_id;
	}

	private function collection($params = array()) {
		wp_set_current_user(0);
		$request = new WP_REST_Request('GET', '/portfolio-studio/v1/photos');
		foreach ($params as $key => $value) {
			$request->set_param($key, $value);
		}
		return rest_get_server()->dispatch($request);
	}

	public function test_public_collection_is_ordered_and_omits_ineligible_items() {
		$last = $this->photo('Last', 8);
		$first = $this->photo('Alpha', 0);
		$tie = $this->photo('Alpha', 0);
		$this->photo('Draft', 0, 'draft');
		$protected = $this->photo('Protected', 0);
		wp_update_post(array('ID' => $protected, 'post_password' => 'private'));
		$missing = $this->photo('Missing image', 0);
		delete_post_meta($missing, 'portfolio_cover_image_id');
		$default_order = $this->photo('Beta', 0);
		delete_post_meta($default_order, 'portfolio_display_order');

		$response = $this->collection();
		$this->assertSame(200, $response->get_status());
		$data = $response->get_data();
		$this->assertSame(array($first, $tie, $default_order, $last), array_column($data['items'], 'id'));
		$this->assertSame(4, $data['total']);
		$this->assertSame(800, $data['items'][0]['image']['width']);
		$this->assertSame('Test portrait', $data['items'][0]['image']['alt']);
	}

	public function test_filters_before_pagination_and_returns_collection_tags() {
		$first = $this->photo('Alpha', 0);
		$second = $this->photo('Beta', 1);
		$third = $this->photo('Gamma', 2);
		wp_set_object_terms($first, 'Editorial', 'portfolio_tag');
		wp_set_object_terms($third, 'Editorial', 'portfolio_tag');
		wp_set_object_terms($second, 'Commercial', 'portfolio_tag');

		$response = $this->collection(array('tag' => 'editorial', 'per_page' => 1, 'page' => 2));
		$data = $response->get_data();
		$this->assertSame(array($third), array_column($data['items'], 'id'));
		$this->assertSame(2, $data['total']);
		$this->assertSame(2, $data['totalPages']);
		$this->assertSame(array('commercial', 'editorial'), array_column($data['tags'], 'slug'));
		$this->assertSame(400, $this->collection(array('per_page' => 101))->get_status());
		$this->assertSame(400, $this->collection(array('page' => 99))->get_status());
	}

	public function test_unknown_tag_returns_empty_collection() {
		$this->photo('Alpha', 0);
		$data = $this->collection(array('tag' => 'missing'))->get_data();
		$this->assertSame(array(), $data['items']);
		$this->assertSame(0, $data['total']);
		$this->assertSame(0, $data['totalPages']);
	}

	public function test_cover_with_private_parent_is_not_exposed() {
		$post_id = $this->photo('Public photo', 0);
		$image_id = (int) get_post_meta($post_id, 'portfolio_cover_image_id', true);
		$private_id = self::factory()->post->create(array('post_status' => 'private'));
		wp_update_post(array('ID' => $image_id, 'post_parent' => $private_id));
		$data = $this->collection()->get_data();
		$this->assertSame(array(), $data['items']);
	}
}