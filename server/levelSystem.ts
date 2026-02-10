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

export function shouldLevelUp(recentAccuracy: number): boolean {
  return recentAccuracy >= 80;
}

export function shouldLevelDown(recentAccuracy: number): boolean {
  return recentAccuracy <= 50;
}

export function evaluateLevelChange(
  currentLevel: number,
  recentAttempts: { isCorrect: boolean | null }[]
): { shouldChange: boolean; newLevel: number; direction: "up" | "down" | "none" } {
  if (recentAttempts.length < 10) {
    return { shouldChange: false, newLevel: currentLevel, direction: "none" };
  }

  const correctCount = recentAttempts.filter((a) => a.isCorrect).length;
  const accuracy = (correctCount / recentAttempts.length) * 100;

  if (accuracy >= 80 && currentLevel < 10) {
    return { shouldChange: true, newLevel: currentLevel + 1, direction: "up" };
  }
  if (accuracy <= 50 && currentLevel > 1) {
    return { shouldChange: true, newLevel: currentLevel - 1, direction: "down" };
  }

  return { shouldChange: false, newLevel: currentLevel, direction: "none" };
}
