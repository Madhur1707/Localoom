import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { WordmarkLogo } from "@/components/shared/WordmarkLogo";

export function MarketingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        <WordmarkLogo href="/" />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button
            size="lg"
            className="px-7"
            nativeButton={false}
            render={<Link href="/register" />}
          >
            Get started
          </Button>
        </div>
      </div>
    </header>
  );
}
