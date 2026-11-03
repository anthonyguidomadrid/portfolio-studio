const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");
const { runInNewContext } = require("node:vm");

const source = readFileSync(join(__dirname, "../assets/seo-admin.js"), "utf8");

function pickerFixture(id) {
  const callbacks = {};
  const input = { id, value: "0" };
  const preview = {
    children: [],
    replaceChildren(...children) {
      this.children = children;
    },
  };
  const choose = {
    dataset: { seoImage: id },
    addEventListener(event, callback) {
      callbacks.choose = callback;
    },
  };
  const remove = {
    dataset: { seoRemove: id },
    addEventListener(event, callback) {
      callbacks.remove = callback;
    },
  };
  let mediaOptions;
  let onSelect;
  let opened = false;
  let selected;
  runInNewContext(source, {
    document: {
      querySelectorAll: (selector) =>
        selector === "[data-seo-image]" ? [choose] : [remove],
      getElementById: (elementId) => (elementId === id ? input : preview),
      createElement: (tag) => ({ tag }),
    },
    window: {
      wp: {
        media(options) {
          mediaOptions = options;
          return {
            on(event, callback) {
              onSelect = callback;
            },
            state: () => ({
              get: () => ({ first: () => ({ toJSON: () => selected }) }),
            }),
            open() {
              opened = true;
            },
          };
        },
      },
    },
  });
  return {
    input,
    preview,
    choose(image) {
      selected = image;
      callbacks.choose();
      assert.equal(opened, true);
      assert.equal(mediaOptions.library.type, "image");
      assert.equal(mediaOptions.multiple, false);
      onSelect();
    },
    remove: () => callbacks.remove(),
  };
}

for (const id of [
  "portfolio-page-seo-image_id",
  "portfolio-home-seo-image_id",
  "portfolio-person-image_id",
  "portfolio-default-seo-image",
]) {
  test(`chooses and removes the sharing image for ${id}`, () => {
    const fixture = pickerFixture(id);
    fixture.choose({
      id: 123,
      url: "https://cms.example.test/full.jpg",
      sizes: { thumbnail: { url: "https://cms.example.test/thumb.jpg" } },
    });
    assert.equal(fixture.input.value, 123);
    assert.equal(fixture.preview.children.length, 1);
    assert.equal(
      fixture.preview.children[0].src,
      "https://cms.example.test/thumb.jpg",
    );
    assert.equal(fixture.preview.children[0].alt, "");
    fixture.remove();
    assert.equal(fixture.input.value, "0");
    assert.equal(fixture.preview.children.length, 0);
  });
}

test("falls back to the full image and replaces the previous preview", () => {
  const fixture = pickerFixture("portfolio-page-seo-image_id");
  fixture.choose({ id: 1, url: "https://cms.example.test/first.jpg" });
  fixture.choose({ id: 2, url: "https://cms.example.test/second.jpg" });
  assert.equal(fixture.input.value, 2);
  assert.equal(fixture.preview.children.length, 1);
  assert.equal(
    fixture.preview.children[0].src,
    "https://cms.example.test/second.jpg",
  );
});
