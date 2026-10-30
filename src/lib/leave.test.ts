import { describe, expect, it } from "vitest";
import { computeLeaveStats, durationLabel, formatDays, workingDays } from "./leave";
import { createSeed } from "./seed";

describe("leave rules", () => {
  it("computes stats correctly for clean initial install state", () => {
    const seed = createSeed();
    const stats = computeLeaveStats(seed, "2026-10-26");
    expect(stats.available).toBe(25);
    expect(stats.pendingCount).toBe(0);
    expect(stats.upcoming).toBe(0);
    expect(stats.contract).toBe(25);
    expect(stats.carryover).toBe(0);
    expect(stats.holidays).toBe(0);
  });

  it("skips weekends and public holidays when counting days", () => {
    const holidays = [{ id: "h", date: "2026-11-11", name: "Test" }];
    expect(workingDays("2026-11-09", "2026-11-15", holidays)).toHaveLength(4);
  });

  it("labels durations naturally", () => {
    expect(durationLabel(1, 0)).toBe("1 day");
    expect(durationLabel(2, 4)).toBe("2 days 4 hours");
    expect(durationLabel(0, 1)).toBe("1 hour");
    expect(formatDays(0.75)).toBe("0.75");
    expect(formatDays(7)).toBe("7");
  });
});
