import type { MathProblem, OperatorType, OperatorKey } from "@/db/schema";

interface LevelConfig {
  operators: OperatorType[];
  maxNumber: number;
  minNumber: number;
  description: string;
}

/**
 * 레벨별 난이도 설정 (한국 초등 수학 교육과정 기반)
 * Lv 1-2: 유치원~1학년 (10 이하)
 * Lv 3-4: 2학년 (20 이하, 구구단 2-5단)
 * Lv 5-6: 3학년 (100 이하, 구구단 완성, 나눗셈)
 * Lv 7-8: 4학년 (세 자리 수)
 * Lv 9-10: 5-6학년 (큰 수, 복잡한 연산)
 */
const LEVEL_CONFIGS: Record<number, LevelConfig> = {
  1: { operators: ["+"], maxNumber: 10, minNumber: 1, description: "한 자리 수 덧셈 (1+1부터 9+9)" },
  2: { operators: ["+", "-"], maxNumber: 10, minNumber: 0, description: "한 자리 수 덧셈과 뺄셈 (받아올림 없음)" },
  3: { operators: ["+", "-"], maxNumber: 20, minNumber: 1, description: "20 이하 덧셈과 뺄셈 (받아올림 연습)" },
  4: { operators: ["+", "-", "×"], maxNumber: 30, minNumber: 1, description: "30 이하 덧셈/뺄셈 + 구구단(2~5단)" },
  5: { operators: ["+", "-", "×"], maxNumber: 50, minNumber: 1, description: "50 이하 덧셈/뺄셈 + 구구단(2~9단)" },
  6: { operators: ["+", "-", "×", "÷"], maxNumber: 100, minNumber: 1, description: "100 이하 사칙연산 (나눗셈 시작)" },
  7: { operators: ["+", "-", "×", "÷"], maxNumber: 200, minNumber: 10, description: "세 자리 수 사칙연산" },
  8: { operators: ["+", "-", "×", "÷"], maxNumber: 500, minNumber: 10, description: "500 이하 사칙연산" },
  9: { operators: ["+", "-", "×", "÷"], maxNumber: 1000, minNumber: 10, description: "1000 이하 사칙연산" },
  10: { operators: ["+", "-", "×", "÷"], maxNumber: 9999, minNumber: 100, description: "네 자리 수 사칙연산 (고급)" },
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
      if (clampedLevel <= 2) {
        // Lv 1-2: 한 자리 수, 받아올림 없음
        operand1 = randomInt(config.minNumber, config.maxNumber);
        const maxOp2 = Math.min(config.maxNumber, 10 - operand1);
        operand2 = randomInt(config.minNumber, maxOp2);
      } else if (clampedLevel <= 4) {
        // Lv 3-4: 20~30 이하, 받아올림 연습
        operand1 = randomInt(config.minNumber, Math.min(20, config.maxNumber));
        operand2 = randomInt(config.minNumber, Math.min(20, config.maxNumber));
      } else {
        // Lv 5+: 큰 수
        operand1 = randomInt(config.minNumber, config.maxNumber);
        operand2 = randomInt(config.minNumber, config.maxNumber);
      }
      correctAnswer = operand1 + operand2;
      break;

    case "-":
      // 뺄셈: 음수 방지, 레벨별 난이도
      if (clampedLevel <= 2) {
        // Lv 1-2: 한 자리 수, 결과 0 이상
        operand1 = randomInt(config.minNumber, config.maxNumber);
        operand2 = randomInt(config.minNumber, operand1);
      } else if (clampedLevel <= 4) {
        // Lv 3-4: 받아내림 연습
        operand1 = randomInt(10, Math.min(30, config.maxNumber));
        operand2 = randomInt(config.minNumber, operand1);
      } else {
        // Lv 5+: 큰 수
        operand1 = randomInt(config.minNumber, config.maxNumber);
        operand2 = randomInt(config.minNumber, operand1);
      }
      correctAnswer = operand1 - operand2;
      break;

    case "×":
      // 곱셈: 구구단 기반, 레벨별 확장
      if (clampedLevel <= 4) {
        // Lv 4: 구구단 2~5단
        operand1 = randomInt(2, 5);
        operand2 = randomInt(1, 9);
      } else if (clampedLevel <= 6) {
        // Lv 5-6: 구구단 2~9단 완성
        operand1 = randomInt(2, 9);
        operand2 = randomInt(1, 9);
      } else if (clampedLevel <= 8) {
        // Lv 7-8: 두 자리 수 × 한 자리 수
        operand1 = randomInt(10, 99);
        operand2 = randomInt(2, 9);
      } else {
        // Lv 9-10: 두 자리 수 × 두 자리 수
        operand1 = randomInt(10, 99);
        operand2 = randomInt(10, 99);
      }
      correctAnswer = operand1 * operand2;
      break;

    case "÷":
      // 나눗셈: 나누어떨어지는 문제만, 레벨별 확장
      if (clampedLevel <= 6) {
        // Lv 6: 구구단 범위 (81 ÷ 9 = 9)
        operand2 = randomInt(2, 9);
        correctAnswer = randomInt(1, 9);
        operand1 = operand2 * correctAnswer;
      } else if (clampedLevel <= 8) {
        // Lv 7-8: 두 자리 수 ÷ 한 자리 수
        operand2 = randomInt(2, 9);
        correctAnswer = randomInt(2, 20);
        operand1 = operand2 * correctAnswer;
      } else {
        // Lv 9-10: 세 자리 수 ÷ 두 자리 수
        operand2 = randomInt(10, 50);
        correctAnswer = randomInt(2, 50);
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
