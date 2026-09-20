/**
 * Skill levels.
 *
 * A skill is still stored with a numeric `level` (0–100) so existing data and
 * the admin API keep working, but the UI never shows a percentage — it only
 * offers these four named levels.
 *
 *   25  Beginner
 *   50  Intermediate (Lower)
 *   70  Intermediate (Upper)
 *   90  Advanced
 */

export interface SkillLevel {
  /** Canonical value stored for this level. */
  value: number;
  /** Label shown in the admin form and on the public site. */
  label: string;
  /** Inclusive upper bound, used to map older percentage values. */
  max: number;
}

export const SKILL_LEVELS: SkillLevel[] = [
  { value: 25, label: "Beginner", max: 39 },
  { value: 50, label: "Intermediate (Lower)", max: 59 },
  { value: 70, label: "Intermediate (Upper)", max: 79 },
  { value: 90, label: "Advanced", max: 100 },
];

/** Level used for new skills and for records without a usable level. */
export const DEFAULT_SKILL_LEVEL = 50;

/** Finds the level a stored value belongs to. */
export function skillLevelOf(level?: number | string | null): SkillLevel {
  const value =
    level === null || level === undefined || level === ""
      ? Number.NaN
      : Number(level);

  if (!Number.isFinite(value)) {
    return (
      SKILL_LEVELS.find((item) => item.value === DEFAULT_SKILL_LEVEL) ||
      SKILL_LEVELS[0]
    );
  }

  return (
    SKILL_LEVELS.find((item) => value <= item.max) ||
    SKILL_LEVELS[SKILL_LEVELS.length - 1]
  );
}

/** Level name for display, e.g. "Intermediate (Upper)". */
export function skillLevelLabel(level?: number | string | null): string {
  return skillLevelOf(level).label;
}

/** Canonical value of that level — used for the select and the bar width. */
export function skillLevelValue(level?: number | string | null): number {
  return skillLevelOf(level).value;
}
