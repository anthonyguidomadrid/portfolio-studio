(() => {
  document.querySelectorAll("[data-seo-image]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = document.getElementById(button.dataset.seoImage);
      const preview = document.getElementById(`${input.id}-preview`);
      const frame = window.wp.media({
        title: "Choose sharing image",
        button: { text: "Use image" },
        library: { type: "image" },
        multiple: false,
      });
      frame.on("select", () => {
        const selected = frame.state().get("selection").first().toJSON();
        input.value = selected.id;
        const image = document.createElement("img");
        image.src = selected.sizes?.thumbnail?.url || selected.url;
        image.alt = "";
        preview.replaceChildren(image);
      });
      frame.open();
    });
  });
  document.querySelectorAll("[data-seo-remove]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = document.getElementById(button.dataset.seoRemove);
      input.value = "0";
      document.getElementById(`${input.id}-preview`).replaceChildren();
    });
  });
})();
