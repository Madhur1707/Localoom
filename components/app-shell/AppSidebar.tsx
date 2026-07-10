"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { useDocuments } from "@/hooks/useDocuments";
import { Button } from "@/components/ui/button";
import { WordmarkLogo } from "@/components/shared/WordmarkLogo";
import type { DocumentSummary } from "@/types/document";

// Placeholder version-history entries — real per-document history lands in
// phase 5. Kept visually present so the shell matches the target design.
const VERSION_HISTORY_PLACEHOLDER = [
  { label: "Current version", meta: "Just now", current: true },
  { label: "Added auth flows", meta: "14 min ago", current: false },
  { label: "Revised error codes", meta: "1 hr ago", current: false },
] as const;

export function AppSidebar({ documents }: { documents: DocumentSummary[] }) {
  const pathname = usePathname();
  const { createDocument, isCreatingDocument } = useDocuments();

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-14 items-center border-b border-sidebar-border px-4">
        <WordmarkLogo href="/dashboard" />
      </div>

      <div className="flex items-center justify-between px-4 pt-5 pb-2">
        <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Files
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="New document"
          disabled={isCreatingDocument}
          onClick={() => createDocument("Untitled document")}
        >
          <Plus className="size-3.5" />
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-4">
        {documents.length === 0 ? (
          <p className="px-2 py-2 text-sm text-muted-foreground">
            No documents yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {documents.map((document) => {
              const href = `/documents/${document.id}`;
              const isActive = pathname === href;
              return (
                <li key={document.id}>
                  <Link
                    href={href}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors",
                      isActive
                        ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                        : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
                    )}
                  >
                    <FileText className="size-4 shrink-0" />
                    <span className="truncate">{document.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </nav>

      <div className="border-t border-sidebar-border px-4 py-4">
        <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Version history
        </span>
        <ul className="mt-3 flex flex-col gap-3">
          {VERSION_HISTORY_PLACEHOLDER.map(({ label, meta, current }) => (
            <li key={label} className="flex items-start gap-2.5">
              <span
                className={cn(
                  "mt-1 size-2 shrink-0 rounded-full",
                  current ? "bg-primary" : "border border-muted-foreground/40"
                )}
              />
              <span className="flex flex-col">
                <span className="text-sm text-foreground">{label}</span>
                <span className="text-xs text-muted-foreground">{meta}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
