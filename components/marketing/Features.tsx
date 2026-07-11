import {
  History,
  Radio,
  ShieldCheck,
  Users,
  WifiOff,
  Zap,
} from "lucide-react";

const FEATURES = [
  {
    icon: WifiOff,
    title: "Local-first",
    body: "Every keystroke is saved to your device first. Keep writing with zero network — the editor never blocks on a server.",
  },
  {
    icon: Radio,
    title: "Real-time sync",
    body: "CRDT-based syncing merges concurrent edits without conflicts, so multiple people can edit the same paragraph safely.",
  },
  {
    icon: History,
    title: "Version history",
    body: "Named snapshots and an append-only edit log let you travel back in time and restore any earlier state.",
  },
  {
    icon: Users,
    title: "Live collaboration",
    body: "See who else is in the document with presence cursors and shared selections as you work side by side.",
  },
  {
    icon: ShieldCheck,
    title: "Roles & sharing",
    body: "Owner, editor, and viewer roles keep control clear. Share a link and set exactly what each person can do.",
  },
  {
    icon: Zap,
    title: "AI assistant",
    body: "Summarize, fix grammar, and rewrite sections with an assistant that understands the whole document.",
  },
] as const;

export function Features() {
  return (
    <section className="mx-auto w-full max-w-5xl px-6 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-serif text-3xl font-medium tracking-tight sm:text-4xl">
          Everything a modern doc needs
        </h2>
        <p className="mt-4 text-muted-foreground">
          The speed of a local app with the reach of the cloud — without the
          usual trade-offs.
        </p>
      </div>
      <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="group border border-border bg-card p-6 transition-colors hover:border-primary/50"
          >
            <div className="flex size-10 -skew-x-9 items-center justify-center bg-primary/12 text-primary">
              <Icon className="size-5 skew-x-9" />
            </div>
            <h3 className="mt-5 font-medium">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
