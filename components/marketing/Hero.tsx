import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-6 pt-16 pb-16 lg:grid-cols-2 lg:gap-14 lg:pt-24">
      {/* Left: headline, copy, actions. */}
      <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
        {/* Slanted tag echoing the button shape (skew + offset shadow). */}
        <span className="inline-block -skew-x-9 border border-border bg-card shadow-[3px_3px_0_0_#000]">
          <span className="inline-flex skew-x-9 items-center gap-2 px-3.5 py-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Local-first · Real-time · AI-assisted
          </span>
        </span>
        <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.15] tracking-tight text-balance sm:text-5xl">
          Write Together.
          <br />
          <span className="text-primary">Anywhere. Anytime.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-justify leading-relaxed text-muted-foreground">
          Localoom keeps every keystroke on your device first, then syncs it
          conflict-free the moment you&apos;re back online — with live cursors,
          full version history, and an AI assistant that knows your whole
          document.
        </p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Button
            size="lg"
            nativeButton={false}
            render={<Link href="/register" />}
          >
            Start writing free
            <ArrowRight className="size-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            nativeButton={false}
            render={<Link href="/login" />}
          >
            Sign in
          </Button>
        </div>
      </div>

      {/* Right: product shot. */}
      <div className="relative">
        <Image
          src="/hero2.png"
          alt="The Localoom collaborative editor"
          width={1919}
          height={1077}
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="h-auto w-full border border-border shadow-[10px_10px_0_0_rgba(0,0,0,0.55)]"
        />
      </div>
    </section>
  );
}
