import type { PresenceUser } from "@/types/collaboration";

type SessionUser = {
  id?: string | null;
  name?: string | null;
  email?: string | null;
};

// Fixed saturation/lightness chosen to stay legible as both a cursor colour and
// an avatar background in light and dark themes; only the hue varies per person.
const PRESENCE_SATURATION = 68;
const PRESENCE_LIGHTNESS = 52;

// Deterministic, well-distributed hue from any stable seed (a user id), so the
// same person always gets the same colour across sessions and devices without a
// server round-trip. djb2 string hash.
export function presenceColorFor(seed: string): string {
  let hash = 5381;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 33) ^ seed.charCodeAt(i);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} ${PRESENCE_SATURATION}% ${PRESENCE_LIGHTNESS}%)`;
}

function displayNameFor(user: SessionUser): string {
  return user.name?.trim() || user.email?.trim() || "Anonymous";
}

// Build the awareness identity for the local user. CollaborationCaret publishes
// this; every other client reads it back to draw cursors and the avatar stack.
export function buildLocalPresenceUser(user: SessionUser | null): PresenceUser {
  const id = user?.id ?? "anonymous";
  return {
    id,
    name: displayNameFor(user ?? {}),
    color: presenceColorFor(id),
  };
}

// Up-to-two-letter initials for avatars: first letters of the first two words,
// or the first two characters of a single word.
export function initialsFor(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}
