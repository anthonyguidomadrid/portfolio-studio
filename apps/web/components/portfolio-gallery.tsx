"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { FaChevronLeft, FaChevronRight, FaXmark } from "react-icons/fa6";
import type { PortfolioPhoto, PortfolioTag } from "@/lib/portfolio-photos";
import { messages } from "@/messages/en";

interface PortfolioGalleryProps {
  items: PortfolioPhoto[];
  tags: PortfolioTag[];
  initialTag: string;
}

export function PortfolioGallery({
  items,
  tags,
  initialTag,
}: PortfolioGalleryProps) {
  const [selectedTag, setSelectedTag] = useState(() =>
    tags.some((tag) => tag.slug === initialTag) ? initialTag : "",
  );
  const [activePhotoId, setActivePhotoId] = useState<number>();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const filteredItems = selectedTag
    ? items.filter((item) => item.tags.some((tag) => tag.slug === selectedTag))
    : items;
  const activeIndex = filteredItems.findIndex((item) => item.id === activePhotoId);
  const activePhoto = activeIndex >= 0 ? filteredItems[activeIndex] : undefined;

  useEffect(() => {
    const onPopState = () => {
      setSelectedTag(new URL(window.location.href).searchParams.get("tag") ?? "");
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (activePhotoId === undefined) {
      triggerRef.current?.focus();
      return;
    }

    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    return () => {
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [activePhotoId]);

  useEffect(() => {
    if (!activePhoto || activePhotoId === undefined) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    function handleKeys(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setActivePhotoId(undefined);
      } else if (event.key === "ArrowLeft" && activeIndex > 0) {
        const previous = items
          .filter((item) => !selectedTag || item.tags.some((tag) => tag.slug === selectedTag))
          [activeIndex - 1];
        if (previous) setActivePhotoId(previous.id);
      } else if (event.key === "ArrowRight" && activeIndex < filteredItems.length - 1) {
        const next = items
          .filter((item) => !selectedTag || item.tags.some((tag) => tag.slug === selectedTag))
          [activeIndex + 1];
        if (next) setActivePhotoId(next.id);
      }
    }

    dialog.addEventListener("keydown", handleKeys);
    return () => {
      dialog.removeEventListener("keydown", handleKeys);
    };
  }, [activeIndex, activePhoto, activePhotoId, filteredItems.length, items, selectedTag]);

  function selectTag(tag: string) {
    setSelectedTag(tag);
    const url = new URL(window.location.href);
    if (tag) url.searchParams.set("tag", tag);
    else url.searchParams.delete("tag");
    window.history.pushState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }

  function openPhoto(photo: PortfolioPhoto, trigger: HTMLElement) {
    triggerRef.current = trigger;
    setActivePhotoId(photo.id);
  }

  function stepPhoto(direction: -1 | 1) {
    const nextPhoto = filteredItems[activeIndex + direction];
    if (nextPhoto) setActivePhotoId(nextPhoto.id);
  }

  return (
    <>
      <section aria-label={messages.portfolio.filtersLabel} className="mb-8">
        <div className="flex flex-wrap gap-2" role="group">
          <button
            aria-pressed={selectedTag === ""}
            className={`min-h-11 border px-4 py-2 text-small transition-colors motion-reduce:transition-none ${selectedTag === "" ? "border-foreground bg-foreground text-background" : "border-border bg-background text-foreground hover:border-foreground"}`}
            onClick={() => selectTag("")}
            type="button"
          >
            {messages.portfolio.allFilter}
          </button>
          {tags.map((tag) => (
            <button
              aria-pressed={selectedTag === tag.slug}
              className={`min-h-11 border px-4 py-2 text-small transition-colors motion-reduce:transition-none ${selectedTag === tag.slug ? "border-foreground bg-foreground text-background" : "border-border bg-background text-foreground hover:border-foreground"}`}
              key={tag.id}
              onClick={() => selectTag(tag.slug)}
              type="button"
            >
              {tag.name}
            </button>
          ))}
        </div>
      </section>

      <p aria-live="polite" className="sr-only" role="status">
        {filteredItems.length} {messages.portfolio.photosCount}
      </p>

      {filteredItems.length === 0 ? (
        <p className="text-body text-muted-foreground">
          {selectedTag
            ? messages.portfolio.noFilteredItems
            : messages.portfolio.noItems}
        </p>
      ) : (
        <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
          {filteredItems.map((photo) => {
            const accessibleLabel = [photo.title, photo.image.alt]
              .filter(Boolean)
              .join(", ");

            return (
              <li className="min-w-0" key={photo.id}>
                <button
                  aria-label={`${messages.portfolio.openPhoto}: ${accessibleLabel || messages.portfolio.openPhoto}`}
                  className="group block w-full overflow-hidden bg-muted-surface text-left focus-visible:outline-3 focus-visible:outline-ring"
                  onClick={(event) => openPhoto(photo, event.currentTarget)}
                  type="button"
                >
                  <span className="relative block aspect-[4/5] overflow-hidden">
                    <Image
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none"
                      height={photo.image.height}
                      sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 25vw"
                      src={photo.image.url}
                      width={photo.image.width}
                    />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <dialog
        aria-label={messages.portfolio.lightboxLabel}
        className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none border-0 bg-black/95 p-4 text-white backdrop:bg-black/80 sm:p-8"
        onCancel={(event) => {
          event.preventDefault();
          setActivePhotoId(undefined);
        }}
        onClick={(event) => {
          if (event.target === dialogRef.current) setActivePhotoId(undefined);
        }}
        ref={dialogRef}
      >
        {activePhoto && (
          <div className="mx-auto grid h-full max-w-content grid-rows-[auto_1fr_auto] gap-4">
            <div className="flex justify-end">
              <button
                aria-label={messages.portfolio.closePhoto}
                className="flex size-11 items-center justify-center text-white hover:bg-white/15 focus-visible:outline-white"
                onClick={() => setActivePhotoId(undefined)}
                ref={closeButtonRef}
                type="button"
              >
                <FaXmark aria-hidden="true" size={24} />
              </button>
            </div>
            <div className="flex min-h-0 items-center justify-center gap-2 sm:gap-5">
              <button
                aria-label={messages.portfolio.previousPhoto}
                className="flex size-11 shrink-0 items-center justify-center text-white hover:bg-white/15 disabled:invisible focus-visible:outline-white sm:size-12"
                disabled={activeIndex <= 0}
                onClick={() => stepPhoto(-1)}
                type="button"
              >
                <FaChevronLeft aria-hidden="true" size={20} />
              </button>
              <Image
                alt={activePhoto.image.alt}
                className="h-auto max-h-full w-auto max-w-full object-contain"
                height={activePhoto.image.height}
                sizes="(max-width: 767px) 85vw, 80vw"
                src={activePhoto.image.url}
                width={activePhoto.image.width}
              />
              <button
                aria-label={messages.portfolio.nextPhoto}
                className="flex size-11 shrink-0 items-center justify-center text-white hover:bg-white/15 disabled:invisible focus-visible:outline-white sm:size-12"
                disabled={activeIndex >= filteredItems.length - 1}
                onClick={() => stepPhoto(1)}
                type="button"
              >
                <FaChevronRight aria-hidden="true" size={20} />
              </button>
            </div>
            <p className="m-0 min-h-6 text-center text-small text-white/85">
              {activePhoto.image.caption || activePhoto.title}
            </p>
          </div>
        )}
      </dialog>
    </>
  );
}