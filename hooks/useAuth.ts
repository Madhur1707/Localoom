"use client";

import { useSession } from "next-auth/react";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import * as authService from "@/services/authService";
import type { RegisterInput } from "@/lib/validators/authSchema";

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(
    async (email: string, password: string) => {
      setIsSubmitting(true);
      setError(null);
      try {
        await authService.login(email, password);
        router.push("/dashboard");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Login failed");
        setIsSubmitting(false);
        throw err;
      }
    },
    [router]
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      setIsSubmitting(true);
      setError(null);
      try {
        await authService.register(input);
        await authService.login(input.email, input.password);
        router.push("/dashboard");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Registration failed");
        setIsSubmitting(false);
        throw err;
      }
    },
    [router]
  );

  const logout = useCallback(async () => {
    await authService.logout();
    router.push("/");
    router.refresh();
  }, [router]);

  return {
    user: session?.user ?? null,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    isSubmitting,
    error,
    login,
    register,
    logout,
  };
}
