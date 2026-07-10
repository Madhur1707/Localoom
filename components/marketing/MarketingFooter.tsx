import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { WordmarkLogo } from "@/components/shared/WordmarkLogo";

export function MarketingFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
        <WordmarkLogo href="/" />
        <p className="text-sm text-muted-foreground">
          Built as a local-first collaborative editor.
        </p>
        <div className="flex items-center gap-4 text-muted-foreground">
          <Link
            href="https://github.com"
            className="flex items-center gap-1 text-sm transition-colors hover:text-foreground"
          >
            GitHub
            <ArrowUpRight className="size-3.5" />
          </Link>
          <Link
            href="https://linkedin.com"
            className="flex items-center gap-1 text-sm transition-colors hover:text-foreground"
          >
            LinkedIn
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </footer>
  );
}
