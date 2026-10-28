"use client";

import { useEffect, useRef, useState } from "react";
import { FaXmark } from "react-icons/fa6";
import { useConsent } from "@/components/consent/provider";
import { messages } from "@/messages/en";

const buttonClass =
  "min-h-11 rounded-none border border-foreground bg-background px-5 py-2.5 text-small font-medium text-foreground transition-colors hover:bg-foreground hover:text-background motion-reduce:transition-none";

export function CookieSettingsButton() {
  const { openSettings } = useConsent();
  return (
    <button
      className="min-h-11 text-small text-muted-foreground transition-colors hover:text-foreground motion-reduce:transition-none"
      onClick={openSettings}
      type="button"
    >
      {messages.consent.cookieSettings}
    </button>
  );
}

function SettingsDialog() {
  const { choices, savePreferences, closeSettings } = useConsent();
  const [draft, setDraft] = useState({
    analytics: choices.analytics,
    youtube: choices.youtube,
  });
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    element?.showModal();
    return () => {
      element?.close();
      previousFocus?.focus();
    };
  }, []);

  return (
    <dialog
      ref={dialog}
      aria-labelledby="consent-title"
      aria-describedby="consent-description"
      onCancel={(event) => {
        event.preventDefault();
        closeSettings();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          closeSettings();
        }
      }}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-none border border-border bg-background p-6 text-foreground shadow-2xl backdrop:bg-black/50 sm:p-8"
    >
      <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
        <h2 className="text-base font-semibold" id="consent-title">
          {messages.consent.cookieSettings}
        </h2>
        <button
          aria-label={messages.consent.closeSettings}
          className="flex size-11 shrink-0 items-center justify-center"
          onClick={closeSettings}
          type="button"
        >
          <FaXmark aria-hidden="true" size={22} />
        </button>
      </div>
      <p
        className="mt-5 text-small text-muted-foreground"
        id="consent-description"
      >
        {messages.consent.description}
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          savePreferences(draft);
        }}
      >
        <label className="mt-5 flex cursor-pointer items-start gap-3 border-t border-border pt-5">
          <input
            checked={draft.analytics}
            className="mt-1 size-5 shrink-0 accent-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            onChange={(event) =>
              setDraft({ ...draft, analytics: event.target.checked })
            }
            type="checkbox"
          />
          <span>
            <span className="block font-semibold">
              {messages.consent.analytics}
            </span>
            <span className="block text-small">
              {messages.consent.analyticsDescription}
            </span>
          </span>
        </label>
        <label className="mt-5 flex cursor-pointer items-start gap-3 border-t border-border pt-5">
          <input
            checked={draft.youtube}
            className="mt-1 size-5 shrink-0 accent-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            onChange={(event) =>
              setDraft({ ...draft, youtube: event.target.checked })
            }
            type="checkbox"
          />
          <span>
            <span className="block font-semibold">
              {messages.consent.youtube}
            </span>
            <span className="block text-small">
              {messages.consent.youtubeDescription}
            </span>
          </span>
        </label>
        <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
          <button className={buttonClass} type="submit">
            {messages.consent.save}
          </button>
          <a className="text-small underline underline-offset-4" href="/legal">
            {messages.consent.legal}
          </a>
        </div>
      </form>
    </dialog>
  );
}

export function ConsentInterface() {
  const {
    ready,
    record,
    settingsOpen,
    storageError,
    savePreferences,
    openSettings,
  } = useConsent();
  return (
    <>
      {ready && !record && (
        <section
          aria-label={messages.consent.bannerLabel}
          className="fixed inset-x-0 bottom-0 z-50 rounded-none border-t border-border bg-background px-page-gutter py-5 text-foreground shadow-[0_-8px_32px_rgb(0_0_0/0.06)] sm:py-6"
        >
          <div className="mx-auto flex max-w-content flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
            <div className="max-w-xl">
              <h2 className="mb-2 text-small font-semibold">
                {messages.consent.title}
              </h2>
              <p className="text-small text-muted-foreground">
                {messages.consent.bannerDescription}{" "}
                <a className="underline underline-offset-4" href="/legal">
                  {messages.consent.legal}
                </a>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0 sm:items-center sm:gap-3">
              <button
                className={buttonClass}
                onClick={() =>
                  savePreferences({ analytics: true, youtube: true })
                }
                type="button"
              >
                {messages.consent.acceptAll}
              </button>
              <button
                className={buttonClass}
                onClick={() =>
                  savePreferences({ analytics: false, youtube: false })
                }
                type="button"
              >
                {messages.consent.rejectOptional}
              </button>
              <button
                className="col-span-2 min-h-11 px-4 py-2 text-small text-muted-foreground transition-colors hover:text-foreground motion-reduce:transition-none"
                onClick={openSettings}
                type="button"
              >
                {messages.consent.settings}
              </button>
            </div>
          </div>
        </section>
      )}
      {storageError && (
        <p
          role="status"
          className="fixed left-4 top-4 z-[70] max-w-sm border border-border bg-background p-3 text-small text-foreground"
        >
          {messages.consent.storageError}
        </p>
      )}
      {settingsOpen && <SettingsDialog />}
    </>
  );
}
