import Link from "next/link";
import { Hash } from "lucide-react";

import { cn } from "@/lib/utils";

// The Scriptum wordmark: a violet rounded tile with a hash glyph plus the name.
// `href` makes it a link (nav/landing); omit it for static chrome.
export function WordmarkLogo({
  href,
  className,
}: {
  href?: string;
  className?: string;
}) {
  const content = (
    <span className={cn("flex items-center gap-2 font-semibold", className)}>
      <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <Hash className="size-4" />
      </span>
      <span className="text-lg tracking-tight">Scriptum</span>
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
