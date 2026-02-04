"use client";

import Script from "next/script";

export function FloatingTypeform() {
  return (
    <>
      <div
        className="w-fit bg-green rounded-4xl"
        data-tf-live="01KBE0D2Q2QX30N070V4HBYEES"
        suppressHydrationWarning
      />
      <Script
        src="//embed.typeform.com/next/embed.js"
        strategy="afterInteractive"
      />
    </>
  );
}
