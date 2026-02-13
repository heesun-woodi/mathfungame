export function getLevelForAge(age: number): number {
  if (age <= 5) return 1;
  if (age <= 6) return 2;
  if (age <= 7) return 3;
  if (age <= 8) return 4;
  if (age <= 9) return 5;
  if (age <= 10) return 6;
  if (age <= 11) return 7;
  if (age <= 12) return 8;
  return 9;
}

const REQUIRED_DAYS = 3;
const LEVEL_UP_ACCURACY = 80;
const LEVEL_DOWN_ACCURACY = 50;

export function evaluateLevelChange(
  currentLevel: number,
  dailyStats: { date: string; accuracy: number }[],
  lastLevelChangeAt: Date | null,
): { shouldChange: boolean; newLevel: number; direction: "up" | "down" | "none" } {
  // Not enough qualifying days
  if (dailyStats.length < REQUIRED_DAYS) {
    return { shouldChange: false, newLevel: currentLevel, direction: "none" };
  }

  // Prevent multiple level changes on the same day
  if (lastLevelChangeAt) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const changeDate = new Date(lastLevelChangeAt);
    changeDate.setHours(0, 0, 0, 0);
    if (changeDate.getTime() === today.getTime()) {
      return { shouldChange: false, newLevel: currentLevel, direction: "none" };
    }
  }

  const highDays = dailyStats.filter((d) => d.accuracy >= LEVEL_UP_ACCURACY).length;
  const lowDays = dailyStats.filter((d) => d.accuracy <= LEVEL_DOWN_ACCURACY).length;

  if (highDays >= REQUIRED_DAYS && currentLevel < 10) {
    return { shouldChange: true, newLevel: currentLevel + 1, direction: "up" };
  }
  if (lowDays >= REQUIRED_DAYS && currentLevel > 1) {
    return { shouldChange: true, newLevel: currentLevel - 1, direction: "down" };
  }

  return { shouldChange: false, newLevel: currentLevel, direction: "none" };
}
