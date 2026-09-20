/**
 * Experience timeline ordering.
 *
 * Entries are sorted by year (newest first), and any role that is still going
 * — "Present" — is always shown at the top. Dates are free text, so the year is
 * extracted from values like "2023", "Jan 2023" or "2023-05".
 */
import type { Experience } from "../api/types";

/** End-date wording that means the role is still ongoing. */
const ONGOING = /present|current|ongoing|now|today|to date|till date/i;

/** Pulls the most recent 4-digit year out of free text, or NaN. */
export function experienceYear(value?: string | null): number {
  const years = String(value || "").match(/(?:19|20)\d{2}/g);
  if (!years || years.length === 0) return Number.NaN;
  return Number(years[years.length - 1]);
}

/** True when a role has no end date, or one that reads "Present". */
export function isCurrentExperience(
  item: Pick<Experience, "endDate">
): boolean {
  const end = (item.endDate || "").trim();
  return end === "" || ONGOING.test(end);
}

/** Period label such as "2023 — Present", normalising any ongoing wording. */
export function experiencePeriod(
  item: Pick<Experience, "startDate" | "endDate">
): string {
  const start = (item.startDate || "").trim();
  const end = isCurrentExperience(item)
    ? "Present"
    : (item.endDate || "").trim() || "Present";
  return start ? `${start} — ${end}` : end;
}

/**
 * Present roles first, then the newest start year, then the latest end year.
 * Entries without a usable year keep their relative order at the end.
 */
export function sortExperience(items: Experience[]): Experience[] {
  return [...items].sort((a, b) => {
    const aCurrent = isCurrentExperience(a);
    const bCurrent = isCurrentExperience(b);
    if (aCurrent !== bCurrent) return aCurrent ? -1 : 1;

    const aStart = experienceYear(a.startDate);
    const bStart = experienceYear(b.startDate);
    const aHasStart = !Number.isNaN(aStart);
    const bHasStart = !Number.isNaN(bStart);

    if (aHasStart && bHasStart) {
      if (aStart !== bStart) return bStart - aStart;
    } else if (aHasStart !== bHasStart) {
      return aHasStart ? -1 : 1;
    }

    const aEnd = experienceYear(a.endDate);
    const bEnd = experienceYear(b.endDate);
    if (!Number.isNaN(aEnd) && !Number.isNaN(bEnd) && aEnd !== bEnd) {
      return bEnd - aEnd;
    }

    return 0;
  });
}
