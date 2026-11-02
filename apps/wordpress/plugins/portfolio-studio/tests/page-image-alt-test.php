<?php

class Portfolio_Studio_Page_Image_Alt_Test extends WP_UnitTestCase {
	private function render_content($slug, $html) {
		$post = new WP_Post((object) array('post_type' => 'page', 'post_name' => $slug));
		$response = new WP_REST_Response(array('content' => array('rendered' => $html)));
		return apply_filters('rest_prepare_page', $response, $post)->get_data()['content']['rendered'];
	}

	private function create_image($alt) {
		$attachment_id = self::factory()->post->create(array('post_type' => 'attachment', 'post_mime_type' => 'image/jpeg'));
		update_post_meta($attachment_id, '_wp_attachment_image_alt', $alt);
		return $attachment_id;
	}

	public function test_about_and_contact_use_media_alt_for_empty_or_missing_alt() {
		$attachment_id = $this->create_image('Portrait & studio "lights"');
		foreach (array('about', 'contact') as $slug) {
			foreach (array(' alt=""', '', ' alt="   "') as $alt) {
				$source = '<figure><img class="wp-image-' . $attachment_id . ' size-full" src="https://example.test/portrait.jpg"' . $alt . '></figure>';
				$html = new WP_HTML_Tag_Processor($this->render_content($slug, $source));
				$this->assertTrue($html->next_tag('IMG'));
				$this->assertSame('Portrait & studio "lights"', $html->get_attribute('alt'));
			}
		}
	}

	public function test_preserves_authored_alt_and_explicit_decorative_images() {
		$attachment_id = $this->create_image('Media description');
		foreach (array('alt="Page description"', 'alt="" role="presentation"', 'alt="" role="none"', 'alt="" aria-hidden="true"') as $attributes) {
			$html = '<img class="wp-image-' . $attachment_id . '" ' . $attributes . '>';
			$this->assertSame($html, $this->render_content('about', $html));
		}
	}

	public function test_does_not_invent_alt_or_modify_other_pages() {
		$attachment_id = $this->create_image('');
		$html = '<img class="wp-image-' . $attachment_id . '" alt="">';
		$this->assertSame($html, $this->render_content('about', $html));
		update_post_meta($attachment_id, '_wp_attachment_image_alt', 'Media description');
		$this->assertSame($html, $this->render_content('portfolio', $html));
		$external = '<img src="https://example.test/image.jpg" alt="">';
		$this->assertSame($external, $this->render_content('contact', $external));
	}

	public function test_handles_responses_without_rendered_content() {
		$post_id = self::factory()->post->create(array('post_type' => 'page', 'post_name' => 'about'));
		$response = new WP_REST_Response(array('slug' => 'about'));
		$this->assertSame($response, apply_filters('rest_prepare_page', $response, get_post($post_id)));
		$this->assertSame('about', $response->get_data()['slug']);
		$this->assertArrayNotHasKey('content', $response->get_data());
	}
}