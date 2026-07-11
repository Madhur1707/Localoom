"use client";

import type { ReactNode } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

// Wraps next-themes with Localoom's defaults: it drives the `.dark` class on
// <html> (matching the `.dark { ... }` token block in globals.css), starts in
// dark to match the design language, and still honours the OS preference.
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
