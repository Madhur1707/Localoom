import Link from "next/link";

import { cn } from "@/lib/utils";

// The Localoom wordmark: a slanted accent tile with an "L" glyph plus the name,
// echoing the app's signature skewed buttons. `href` makes it a link (nav/
// landing); omit it for static chrome.
export function WordmarkLogo({
  href,
  className,
}: {
  href?: string;
  className?: string;
}) {
  const content = (
    <span className={cn("flex items-center gap-2.5 font-semibold", className)}>
      <span className="flex size-7 -skew-x-9 items-center justify-center bg-primary text-primary-foreground shadow-[2px_2px_0_0_#000]">
        <span className="skew-x-9 font-display text-base font-bold leading-none">
          L
        </span>
      </span>
      <span className="text-lg tracking-tight">Localoom</span>
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="outline-none focus-visible:opacity-80">
        {content}
      </Link>
    );
  }
  return content;
}
