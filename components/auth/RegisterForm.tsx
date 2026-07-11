"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, TriangleAlert } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

export function RegisterForm() {
  const { register, isSubmitting, error } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // The submit button opens a "save your credentials" card first; the actual
  // account creation happens when the user confirms from inside it.
  const [showConfirm, setShowConfirm] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyBoth = async () => {
    try {
      await navigator.clipboard.writeText(
        `Email: ${email}\nPassword: ${password}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard may be unavailable (insecure context) — no-op.
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // Native required/minLength validation has already passed by the time submit
    // fires, so we can safely show the confirmation card.
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    try {
      await register({ name, email, password });
    } catch {
      // error is surfaced via useAuth().error, shown inside the card
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-serif text-3xl font-medium tracking-tight">
          Create your account
        </h1>
        <p className="text-sm text-muted-foreground">
          Start editing locally, sync when you&apos;re online.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        <Button type="submit" straight className="w-full">
          Create account
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Save your credentials</DialogTitle>
            <DialogDescription>
              Please copy these somewhere safe before continuing.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-start gap-2 border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            <span>
              Password recovery isn&apos;t available yet there&apos;s <br/> no
              &ldquo;forgot password&rdquo; flow, so remember your password.
            </span>
          </div>

          <div className="flex flex-col gap-3 rounded-lg border border-input bg-muted/40 p-3">
            <div className="flex items-baseline gap-3">
              <span className="w-20 shrink-0 text-xs text-muted-foreground">
                Email
              </span>
              <span className="truncate font-mono text-sm">{email}</span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="w-20 shrink-0 text-xs text-muted-foreground">
                Password
              </span>
              <span className="truncate font-mono text-sm">{password}</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              straight
              className="self-start"
              onClick={copyBoth}
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? "Copied" : "Copy email & password"}
            </Button>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              straight
              disabled={isSubmitting}
              onClick={() => setShowConfirm(false)}
            >
              Back
            </Button>
            <Button
              type="button"
              straight
              disabled={isSubmitting}
              onClick={handleConfirm}
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner className="text-current" />
                  Creating account…
                </>
              ) : (
                "I saved them — create account"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

