import { signIn, signOut } from "next-auth/react";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import type { RegisterInput } from "@/lib/validators/authSchema";

// Client-side calls. These are the only place components/hooks are allowed
// to talk to next-auth or fetch() directly.
export async function login(email: string, password: string) {
  const result = await signIn("credentials", {
    email,
    password,
    redirect: false,
  });

  if (!result || result.error) {
    throw new Error("Invalid email or password");
  }

  return result;
}

export async function register(input: RegisterInput) {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.error ?? "Registration failed");
  }

  return body.user;
}

export async function logout() {
  await signOut({ redirect: false });
}

// Server-side only — for use in Server Components, Route Handlers, and
// Server Actions. Never import this into a Client Component.
export async function getSession() {
  return auth();
}

// Same as getSession(), but for pages that must not render without a user —
// redirects to /login instead of returning null, so callers can trust the
// returned session's user is always present.
export async function requireSession() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }
  return session;
}
