import { LoadingScreen } from "@/components/shared/LoadingScreen";

export default function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoadingScreen label="Loading…" />
    </div>
  );
}
