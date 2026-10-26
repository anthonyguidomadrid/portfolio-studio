(() => {
  const coverInput = document.querySelector("#portfolio_cover_image_id");
  const galleryInput = document.querySelector("#portfolio_gallery_image_ids");
  const coverPreview = document.querySelector("#portfolio-cover-preview");
  const galleryPreview = document.querySelector("#portfolio-gallery-preview");
  const notFoundInput = document.querySelector("#portfolio-not-found-image-id");
  const notFoundPreview = document.querySelector("#portfolio-not-found-image-preview");

  document.querySelector("#portfolio-not-found-image-remove")?.addEventListener("click", () => {
    notFoundInput.value = "0";
    notFoundPreview.replaceChildren();
  });

  document.querySelectorAll("[data-portfolio-media]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      const mode = button.dataset.portfolioMedia;
      const frame = window.wp.media({
        title:
          mode === "not-found"
            ? "Choose a 404 background image"
            : mode === "cover" ? "Choose a cover image" : "Choose gallery images",
        button: { text: "Use selected images" },
        library: { type: "image" },
        multiple: mode === "gallery",
      });

      frame.on("select", () => {
        const selection = frame.state().get("selection").toJSON();

        if (mode === "not-found" && selection[0]) {
          const image = selection[0];
          notFoundInput.value = image.id;
          const preview = document.createElement("img");
          preview.src = image.sizes?.medium?.url || image.url;
          preview.alt = "";
          preview.style.maxWidth = "300px";
          preview.style.height = "auto";
          notFoundPreview.replaceChildren(preview);
        }

        if (mode === "cover" && selection[0]) {
          const image = selection[0];
          coverInput.value = image.id;
          coverPreview.replaceChildren();
          const preview = document.createElement("img");
          preview.src = image.sizes?.medium?.url || image.url;
          preview.alt = image.alt || "";
          preview.style.maxWidth = "220px";
          preview.style.height = "auto";
          coverPreview.append(preview);
        }

        if (mode === "gallery") {
          galleryInput.value = selection.map((image) => image.id).join(",");
          galleryPreview.replaceChildren();
          selection.forEach((image) => {
            const preview = document.createElement("img");
            preview.src = image.sizes?.thumbnail?.url || image.url;
            preview.alt = "";
            preview.style.width = "72px";
            preview.style.height = "72px";
            preview.style.objectFit = "cover";
            preview.style.margin = "0 6px 6px 0";
            galleryPreview.append(preview);
          });
        }
      });

      frame.open();
    });
  });
})();
