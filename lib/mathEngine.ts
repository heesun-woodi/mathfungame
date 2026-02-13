import type { MathProblem, OperatorType } from "@/db/schema";

interface LevelConfig {
  operators: OperatorType[];
  maxNumber: number;
  minNumber: number;
  description: string;
}

const LEVEL_CONFIGS: Record<number, LevelConfig> = {
  1: { operators: ["+"], maxNumber: 10, minNumber: 1, description: "10 이하 덧셈" },
  2: { operators: ["+", "-"], maxNumber: 10, minNumber: 1, description: "10 이하 덧셈과 뺄셈" },
  3: { operators: ["+", "-"], maxNumber: 20, minNumber: 1, description: "20 이하 덧셈과 뺄셈" },
  4: { operators: ["+", "-", "×"], maxNumber: 20, minNumber: 1, description: "20 이하 덧셈, 뺄셈, 구구단(2~5단)" },
  5: { operators: ["+", "-", "×"], maxNumber: 50, minNumber: 1, description: "50 이하 덧셈, 뺄셈, 구구단(2~9단)" },
  6: { operators: ["+", "-", "×", "÷"], maxNumber: 50, minNumber: 1, description: "50 이하 사칙연산" },
  7: { operators: ["+", "-", "×", "÷"], maxNumber: 100, minNumber: 1, description: "100 이하 사칙연산" },
  8: { operators: ["+", "-", "×", "÷"], maxNumber: 200, minNumber: 10, description: "200 이하 사칙연산" },
  9: { operators: ["+", "-", "×", "÷"], maxNumber: 500, minNumber: 10, description: "500 이하 사칙연산" },
  10: { operators: ["+", "-", "×", "÷"], maxNumber: 1000, minNumber: 10, description: "1000 이하 사칙연산" },
};

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateProblem(level: number): MathProblem {
  const clampedLevel = Math.max(1, Math.min(10, level));
  const config = LEVEL_CONFIGS[clampedLevel];
  const operator = config.operators[randomInt(0, config.operators.length - 1)];

  let operand1: number;
  let operand2: number;
  let correctAnswer: number;

  switch (operator) {
    case "+":
      operand1 = randomInt(config.minNumber, config.maxNumber);
      operand2 = randomInt(config.minNumber, config.maxNumber);
      correctAnswer = operand1 + operand2;
      break;
    case "-":
      operand1 = randomInt(config.minNumber, config.maxNumber);
      operand2 = randomInt(config.minNumber, operand1);
      correctAnswer = operand1 - operand2;
      break;
    case "×":
      if (clampedLevel <= 4) {
        operand1 = randomInt(2, 5);
        operand2 = randomInt(1, 9);
      } else {
        operand1 = randomInt(2, 9);
        operand2 = randomInt(1, 9);
      }
      correctAnswer = operand1 * operand2;
      break;
    case "÷":
      operand2 = randomInt(2, 9);
      correctAnswer = randomInt(1, Math.floor(config.maxNumber / operand2));
      operand1 = operand2 * correctAnswer;
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
  "대단해요! 정답이에요!",
  "와! 천재인데요?",
  "멋져요! 잘했어요!",
  "최고예요! 정답!",
  "훌륭해요! 맞았어요!",
  "짝짝짝! 정답!",
  "완벽해요!",
  "역시 잘하네요!",
];

export const ENCOURAGEMENT_WRONG = [
  "아쉬워요! 다시 도전해봐요!",
  "괜찮아요, 다음에 맞추면 돼요!",
  "실수는 괜찮아요! 다시 해봐요!",
  "힘내요! 조금만 더 생각해봐요!",
  "아깝다! 다음엔 꼭 맞출 수 있어요!",
];

export function getRandomEncouragement(isCorrect: boolean): string {
  const list = isCorrect ? ENCOURAGEMENT_CORRECT : ENCOURAGEMENT_WRONG;
  return list[randomInt(0, list.length - 1)];
}
