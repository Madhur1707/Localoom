// Human-friendly "3 minutes ago" style timestamps for the version history list.
// Uses the platform Intl.RelativeTimeFormat so wording/pluralisation is correct
// without pulling in a date library.

const DIVISIONS: { amountInSmaller: number; unit: Intl.RelativeTimeFormatUnit }[] =
  [
    { amountInSmaller: 60, unit: "second" },
    { amountInSmaller: 60, unit: "minute" },
    { amountInSmaller: 24, unit: "hour" },
    { amountInSmaller: 7, unit: "day" },
    { amountInSmaller: 4.34524, unit: "week" },
    { amountInSmaller: 12, unit: "month" },
    { amountInSmaller: Number.POSITIVE_INFINITY, unit: "year" },
  ];

const relativeTimeFormatter = new Intl.RelativeTimeFormat("en", {
  numeric: "auto",
});

export function formatRelativeTime(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  // Negative because a past timestamp is "in the past" relative to now.
  let delta = (date.getTime() - Date.now()) / 1000;

  for (const division of DIVISIONS) {
    if (Math.abs(delta) < division.amountInSmaller) {
      return relativeTimeFormatter.format(Math.round(delta), division.unit);
    }
    delta /= division.amountInSmaller;
  }
  return relativeTimeFormatter.format(Math.round(delta), "year");
}
