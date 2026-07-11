import type { ReactNode } from "react";
import Link from "next/link";
import { GitBranch, History, Sparkles, WifiOff } from "lucide-react";

import { WordmarkLogo } from "@/components/shared/WordmarkLogo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const BRAND_POINTS = [
  { icon: WifiOff, text: "Keep writing offline — sync catches up automatically." },
  { icon: GitBranch, text: "Conflict-free real-time collaboration." },
  { icon: History, text: "Full version history and time travel." },
  { icon: Sparkles, text: "An AI assistant that understands your whole document." },
] as const;

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel — solid, no gradient; hidden on small screens. */}
      <aside className="hidden border-r border-border bg-card lg:flex lg:flex-col lg:justify-between lg:p-12">
        <WordmarkLogo href="/" />
        <div className="max-w-md">
          <h2 className="font-serif text-4xl font-medium tracking-tight text-balance">
            The document editor that never blocks your flow.
          </h2>
          <ul className="mt-10 flex flex-col gap-5">
            {BRAND_POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span className="flex size-9 -skew-x-9 items-center justify-center bg-primary/12 text-primary">
                  <Icon className="size-4 skew-x-9" />
                </span>
                <span className="text-sm text-muted-foreground">{text}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Localoom
        </p>
      </aside>

      {/* Form column. */}
      <div className="flex flex-col bg-background">
        <div className="flex items-center justify-between p-6">
          <Link href="/" className="lg:hidden">
            <WordmarkLogo />
          </Link>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center px-6 pb-16">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>
    </div>
  );
}
