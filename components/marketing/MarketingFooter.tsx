import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { WordmarkLogo } from "@/components/shared/WordmarkLogo";

const AUTHOR_LINKS = [
  { label: "GitHub", href: "https://github.com/Madhur1707" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/madhurpathak/" },
] as const;

export function MarketingFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
        <WordmarkLogo href="/" />
        <p className="flex items-center gap-1 text-sm text-muted-foreground">
          Made with <span className="text-destructive">❤</span> by{" "}
          <span className="font-medium text-foreground">Madhur Pathak</span>
        </p>
        <div className="flex items-center gap-4 text-muted-foreground">
          {AUTHOR_LINKS.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              target="_blank"
              rel="noreferrer noopener"
              className="flex items-center gap-1 text-sm transition-colors hover:text-foreground"
            >
              {label}
              <ArrowUpRight className="size-3.5" />
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
