const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { runInNewContext } = require("node:vm");
const { join } = require("node:path");

function setup(mode) {
  const elements = new Map();
  function element() {
    return {
      value: "0",
      style: {},
      children: [],
      listeners: {},
      addEventListener(event, callback) { this.listeners[event] = callback; },
      replaceChildren(...children) { this.children = children; },
      append(child) { this.children.push(child); },
    };
  }
  const button = element();
  button.dataset = { portfolioMedia: mode };
  const frame = {
    callbacks: {},
    on(event, callback) { this.callbacks[event] = callback; },
    open() { this.opened = true; },
    state() { return { get: () => ({ toJSON: () => [{ id: 12, url: "https://cms.example.org/background.jpg" }] }) }; },
  };
  let options;
  const document = {
    querySelector(selector) {
      if (!elements.has(selector)) elements.set(selector, element());
      return elements.get(selector);
    },
    querySelectorAll: () => [button],
    createElement: () => element(),
  };
  runInNewContext(readFileSync(join(__dirname, "../assets/portfolio-admin.js"), "utf8"), {
    document,
    window: { wp: { media(value) { options = value; return frame; } } },
  });
  button.listeners.click({ preventDefault() {} });
  frame.callbacks.select();
  return { document, frame, options };
}

test("404 picker selects a single image and removal clears the hidden input and preview", () => {
  const { document, frame, options } = setup("not-found");
  assert.equal(options.multiple, false);
  assert.equal(options.library.type, "image");
  assert.equal(frame.opened, true);
  const input = document.querySelector("#portfolio-not-found-image-id");
  const preview = document.querySelector("#portfolio-not-found-image-preview");
  assert.equal(input.value, 12);
  assert.equal(preview.children[0].alt, "");
  assert.equal(preview.children[0].src, "https://cms.example.org/background.jpg");
  document.querySelector("#portfolio-not-found-image-remove").listeners.click();
  assert.equal(input.value, "0");
  assert.equal(preview.children.length, 0);
});

test("existing cover and gallery pickers retain their selection behavior", () => {
  const cover = setup("cover");
  assert.equal(cover.document.querySelector("#portfolio_cover_image_id").value, 12);
  assert.equal(cover.options.multiple, false);
  const gallery = setup("gallery");
  assert.equal(gallery.document.querySelector("#portfolio_gallery_image_ids").value, "12");
  assert.equal(gallery.options.multiple, true);
});