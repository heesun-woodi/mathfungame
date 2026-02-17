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

// 날짜가 연속인지 확인하는 헬퍼 함수
function areConsecutiveDays(dates: string[]): boolean {
  if (dates.length < 2) return true;
  
  const sorted = [...dates].sort();
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays !== 1) return false;
  }
  return true;
}

// 최근 N일 연속 조건을 만족하는지 확인
function checkConsecutiveCondition(
  dailyStats: { date: string; accuracy: number }[],
  threshold: number,
  isAbove: boolean,
  requiredDays: number
): boolean {
  if (dailyStats.length < requiredDays) return false;
  
  // 날짜순 정렬 (최신순)
  const sorted = [...dailyStats].sort((a, b) => b.date.localeCompare(a.date));
  
  // 최근 requiredDays개 확인
  const recent = sorted.slice(0, requiredDays);
  
  // 모두 조건 만족하는지 확인
  const allMeetCondition = recent.every((d) =>
    isAbove ? d.accuracy >= threshold : d.accuracy <= threshold
  );
  
  if (!allMeetCondition) return false;
  
  // 연속 날짜인지 확인
  return areConsecutiveDays(recent.map((d) => d.date));
}

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

  // 연속 3일 80% 이상이면 레벨업
  if (checkConsecutiveCondition(dailyStats, LEVEL_UP_ACCURACY, true, REQUIRED_DAYS) && currentLevel < 10) {
    return { shouldChange: true, newLevel: currentLevel + 1, direction: "up" };
  }
  
  // 연속 3일 50% 이하면 레벨다운
  if (checkConsecutiveCondition(dailyStats, LEVEL_DOWN_ACCURACY, false, REQUIRED_DAYS) && currentLevel > 1) {
    return { shouldChange: true, newLevel: currentLevel - 1, direction: "down" };
  }

  return { shouldChange: false, newLevel: currentLevel, direction: "none" };
}
