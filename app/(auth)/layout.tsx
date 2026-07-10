import type { ReactNode } from "react";
import Link from "next/link";
import { GitBranch, History, WifiOff } from "lucide-react";

import { WordmarkLogo } from "@/components/shared/WordmarkLogo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const BRAND_POINTS = [
  { icon: WifiOff, text: "Keep writing offline — sync catches up automatically." },
  { icon: GitBranch, text: "Conflict-free real-time collaboration." },
  { icon: History, text: "Full version history and time travel." },
] as const;

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand / marketing panel — hidden on small screens. */}
      <aside className="relative hidden overflow-hidden bg-linear-to-br from-primary/25 via-background to-background lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -left-24 size-112 rounded-full bg-primary/25 blur-[120px]"
        />
        <WordmarkLogo href="/" className="relative" />
        <div className="relative max-w-md">
          <h2 className="text-3xl font-semibold tracking-tight">
            The document editor that never blocks your flow.
          </h2>
          <ul className="mt-8 flex flex-col gap-4">
            {BRAND_POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Icon className="size-4" />
                </span>
                <span className="text-sm text-muted-foreground">{text}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-muted-foreground">
          © {new Date().getFullYear()} Scriptum
        </p>
      </aside>

      {/* Form column. */}
      <div className="relative flex flex-col">
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
