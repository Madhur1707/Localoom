import { LoadingScreen } from "@/components/shared/LoadingScreen";

export default function WorkspaceLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoadingScreen label="Opening your workspace…" />
    </div>
  );
}
