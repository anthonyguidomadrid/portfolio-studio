"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { FaArrowLeft } from "react-icons/fa6";
import { ROUTES, type NotFoundBackgroundImage } from "@/lib/site-config";
import { messages } from "@/messages/en";

export function NotFoundView({
  image,
}: {
  image: NotFoundBackgroundImage | null;
}) {
  const [failedUrl, setFailedUrl] = useState<string>();
  const showImage = image && image.url !== failedUrl;

  return (
    <main
      aria-labelledby="not-found-title"
      className="relative isolate flex min-h-[65svh] flex-1 overflow-hidden bg-primary text-primary-foreground"
    >
      {showImage && (
        <Image
          alt=""
          className="pointer-events-none object-cover"
          fill
          onError={() => setFailedUrl(image.url)}
          preload
          sizes="100vw"
          src={image.url}
        />
      )}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-primary/65"
      />
      <section className="relative mx-auto flex w-full max-w-content flex-col items-start justify-center px-page-gutter py-section">
        <h1
          id="not-found-title"
          className="max-w-[18ch] text-4xl leading-tight font-semibold tracking-normal sm:text-5xl"
        >
          {messages.notFound.title}
        </h1>
        <p className="mt-6 max-w-prose text-body text-primary-foreground/90">
          {messages.notFound.subtitle}
        </p>
        <Link
          className="mt-10 inline-flex min-h-12 items-center gap-3 border border-primary-foreground bg-primary-foreground px-6 py-3 text-small font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-primary-foreground motion-reduce:transition-none"
          href={ROUTES.home}
        >
          <FaArrowLeft aria-hidden="true" size={14} />
          {messages.notFound.home}
        </Link>
      </section>
    </main>
  );
}
