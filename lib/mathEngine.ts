import type { MathProblem, OperatorType, OperatorKey } from "@/db/schema";

interface LevelConfig {
  operators: OperatorType[];
  maxNumber: number;
  minNumber: number;
  description: string;
}

/**
 * 레벨별 난이도 설정 (2022 개정 초등 수학 교육과정 기반)
 * Lv 1-2: 1학년 (한 자리 수, 받아올림 없음)
 * Lv 3-4: 2학년 전반 (받아올림, 100 이하 덧셈/뺄셈)
 * Lv 5: 2학년 후반 (구구단 2-9단 완성)
 * Lv 6: 3학년 (사칙연산 시작, 나눗셈)
 * Lv 7-8: 3-4학년 (세 자리 수, 큰 수)
 * Lv 9-10: 5-6학년 (네 자리 수, 고급)
 */
const LEVEL_CONFIGS: Record<number, LevelConfig> = {
  1: { operators: ["+"], maxNumber: 10, minNumber: 1, description: "한 자리 수 덧셈 (1학년 1학기)" },
  2: { operators: ["+", "-"], maxNumber: 10, minNumber: 0, description: "한 자리 수 덧셈/뺄셈 (1학년 2학기)" },
  3: { operators: ["+", "-"], maxNumber: 20, minNumber: 1, description: "받아올림/받아내림 (2학년 1학기)" },
  4: { operators: ["+", "-"], maxNumber: 100, minNumber: 1, description: "100 이하 덧셈/뺄셈 (2학년 2학기)" },
  5: { operators: ["+", "-", "×"], maxNumber: 100, minNumber: 1, description: "구구단 2~9단 완성 (2학년 필수)" },
  6: { operators: ["+", "-", "×", "÷"], maxNumber: 100, minNumber: 1, description: "사칙연산 시작 (3학년)" },
  7: { operators: ["+", "-", "×", "÷"], maxNumber: 1000, minNumber: 10, description: "세 자리 수 연산 (3-4학년)" },
  8: { operators: ["+", "-", "×", "÷"], maxNumber: 1000, minNumber: 10, description: "1000 이하 사칙연산 (4학년)" },
  9: { operators: ["+", "-", "×", "÷"], maxNumber: 10000, minNumber: 100, description: "네 자리 수 연산 (5학년)" },
  10: { operators: ["+", "-", "×", "÷"], maxNumber: 99999, minNumber: 100, description: "다섯 자리 수 연산 (6학년)" },
};

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const OPERATOR_KEY_MAP: Record<OperatorKey, OperatorType> = {
  add: "+",
  subtract: "-",
  multiply: "×",
  divide: "÷",
};

export function generateProblem(level: number, allowedOperatorKeys?: OperatorKey[]): MathProblem {
  const clampedLevel = Math.max(1, Math.min(10, level));
  const config = LEVEL_CONFIGS[clampedLevel];
  
  // Filter operators based on allowed keys
  let availableOperators = config.operators;
  if (allowedOperatorKeys && allowedOperatorKeys.length > 0) {
    const allowedOperators = allowedOperatorKeys.map(key => OPERATOR_KEY_MAP[key]);
    availableOperators = config.operators.filter(op => allowedOperators.includes(op));
    // If no overlap, fallback to config operators
    if (availableOperators.length === 0) {
      availableOperators = config.operators;
    }
  }
  
  const operator = availableOperators[randomInt(0, availableOperators.length - 1)];

  let operand1: number;
  let operand2: number;
  let correctAnswer: number;

  switch (operator) {
    case "+":
      // 덧셈: 레벨에 따라 받아올림 난이도 조절
      if (clampedLevel === 1) {
        // Lv 1: 한 자리 수 덧셈, 받아올림 없음 (1학년 1학기)
        operand1 = randomInt(1, 9);
        const maxOp2 = Math.min(9, 10 - operand1);
        operand2 = randomInt(1, maxOp2);
      } else if (clampedLevel === 2) {
        // Lv 2: 한 자리 수, 받아올림 없음 (1학년 2학기)
        operand1 = randomInt(0, 9);
        operand2 = randomInt(0, 9);
      } else if (clampedLevel === 3) {
        // Lv 3: 20 이하, 받아올림 연습 (2학년 1학기)
        operand1 = randomInt(1, 20);
        operand2 = randomInt(1, 20);
      } else if (clampedLevel <= 5) {
        // Lv 4-5: 100 이하 (2학년)
        operand1 = randomInt(1, 100);
        operand2 = randomInt(1, 100);
      } else {
        // Lv 6+: 큰 수
        operand1 = randomInt(config.minNumber, config.maxNumber);
        operand2 = randomInt(config.minNumber, config.maxNumber);
      }
      correctAnswer = operand1 + operand2;
      break;

    case "-":
      // 뺄셈: 음수 방지, 레벨별 난이도
      if (clampedLevel === 1) {
        // Lv 1: 덧셈만 (뺄셈 없음)
        operand1 = randomInt(1, 9);
        operand2 = randomInt(1, operand1);
      } else if (clampedLevel === 2) {
        // Lv 2: 한 자리 수, 받아내림 없음 (1학년 2학기)
        operand1 = randomInt(0, 9);
        operand2 = randomInt(0, operand1);
      } else if (clampedLevel === 3) {
        // Lv 3: 20 이하, 받아내림 연습 (2학년 1학기)
        operand1 = randomInt(1, 20);
        operand2 = randomInt(1, operand1);
      } else if (clampedLevel <= 5) {
        // Lv 4-5: 100 이하 (2학년)
        operand1 = randomInt(1, 100);
        operand2 = randomInt(1, operand1);
      } else {
        // Lv 6+: 큰 수
        operand1 = randomInt(config.minNumber, config.maxNumber);
        operand2 = randomInt(config.minNumber, operand1);
      }
      correctAnswer = operand1 - operand2;
      break;

    case "×":
      // 곱셈: 2학년(Lv5)부터 구구단 시작
      if (clampedLevel <= 5) {
        // Lv 5: 구구단 2~9단 (2학년 핵심)
        operand1 = randomInt(2, 9);
        operand2 = randomInt(1, 9);
      } else if (clampedLevel <= 7) {
        // Lv 6-7: 구구단 완성 (3학년)
        operand1 = randomInt(2, 9);
        operand2 = randomInt(1, 9);
      } else if (clampedLevel <= 8) {
        // Lv 8: 두 자리 수 × 한 자리 수 (4학년)
        operand1 = randomInt(10, 99);
        operand2 = randomInt(2, 9);
      } else {
        // Lv 9-10: 두 자리 수 × 두 자리 수 (5-6학년)
        operand1 = randomInt(10, 99);
        operand2 = randomInt(10, 99);
      }
      correctAnswer = operand1 * operand2;
      break;

    case "÷":
      // 나눗셈: 3학년(Lv6)부터 시작, 항상 나누어떨어짐
      if (clampedLevel <= 7) {
        // Lv 6-7: 구구단 범위 나눗셈 (3학년)
        operand2 = randomInt(2, 9);
        correctAnswer = randomInt(1, 9);
        operand1 = operand2 * correctAnswer;
      } else if (clampedLevel <= 8) {
        // Lv 8: 두 자리 수 ÷ 한 자리 수 (4학년)
        operand2 = randomInt(2, 9);
        correctAnswer = randomInt(2, 20);
        operand1 = operand2 * correctAnswer;
      } else {
        // Lv 9-10: 세 자리 수 ÷ 두 자리 수 (5-6학년)
        operand2 = randomInt(10, 50);
        correctAnswer = randomInt(2, 99);
        operand1 = operand2 * correctAnswer;
      }
      break;

    default:
      operand1 = 1;
      operand2 = 1;
      correctAnswer = 2;
  }

  return { operand1, operand2, operator, correctAnswer };
}

export function getLevelForAge(age: number): number {
  // 2022 개정 교육과정 기준 학년별 권장 레벨
  if (age <= 5) return 1;  // 유치원
  if (age <= 6) return 1;  // 1학년 입학 전
  if (age === 7) return 2; // 1학년
  if (age === 8) return 4; // 2학년 (Lv 3-5)
  if (age === 9) return 6; // 3학년 (Lv 6-7)
  if (age === 10) return 8; // 4학년
  if (age === 11) return 9; // 5학년
  if (age >= 12) return 10; // 6학년 이상
  return 5; // 기본값 (2학년 구구단)
}

export function getLevelDescription(level: number): string {
  const clampedLevel = Math.max(1, Math.min(10, level));
  return LEVEL_CONFIGS[clampedLevel].description;
}

export const ENCOURAGEMENT_CORRECT = [
  "대단해요! 정답이에요! 🎉",
  "와! 천재인데요? ⭐",
  "멋져요! 잘했어요! 👏",
  "최고예요! 정답! 🏆",
  "훌륭해요! 맞았어요! 💯",
  "짝짝짝! 정답! 👍",
  "완벽해요! ✨",
  "역시 잘하네요! 🌟",
  "정확해요! 👌",
  "대박! 맞았어요! 🚀",
  "너무 잘해요! 😊",
  "수학 천재! 🧠",
  "빙고! 정답! 🎯",
  "야호! 맞췄어요! 🎊",
  "환상적이에요! ⚡",
];

export const ENCOURAGEMENT_WRONG = [
  "아쉬워요! 다시 도전해봐요! 💪",
  "괜찮아요, 다음에 맞추면 돼요! 😊",
  "실수는 괜찮아요! 다시 해봐요! 🔄",
  "힘내요! 조금만 더 생각해봐요! 🤔",
  "아깝다! 다음엔 꼭 맞출 수 있어요! ✨",
  "괜찮아요! 한 번 더! 🎯",
  "실수할 수 있어요! 다시 도전! 💫",
  "조금만 더! 거의 다 왔어요! 🏃",
  "포기하지 마세요! 할 수 있어요! 💪",
  "다시 생각해봐요! 🧠",
];

export function getRandomEncouragement(isCorrect: boolean): string {
  const list = isCorrect ? ENCOURAGEMENT_CORRECT : ENCOURAGEMENT_WRONG;
  return list[randomInt(0, list.length - 1)];
}
