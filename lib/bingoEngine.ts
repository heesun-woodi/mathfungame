import type { Animal, CellState } from "@/db/schema";

// 동물 목록 (20개)
export const ANIMALS: Animal[] = [
  { ko: "사자", en: "lion" },
  { ko: "호랑이", en: "tiger" },
  { ko: "곰", en: "bear" },
  { ko: "코끼리", en: "elephant" },
  { ko: "기린", en: "giraffe" },
  { ko: "얼룩말", en: "zebra" },
  { ko: "펭귄", en: "penguin" },
  { ko: "고양이", en: "cat" },
  { ko: "강아지", en: "dog" },
  { ko: "토끼", en: "rabbit" },
  { ko: "다람쥐", en: "squirrel" },
  { ko: "여우", en: "fox" },
  { ko: "늑대", en: "wolf" },
  { ko: "판다", en: "panda" },
  { ko: "코알라", en: "koala" },
  { ko: "캥거루", en: "kangaroo" },
  { ko: "부엉이", en: "owl" },
  { ko: "독수리", en: "eagle" },
  { ko: "앵무새", en: "parrot" },
  { ko: "돌고래", en: "dolphin" },
];

/**
 * 5×5 빙고 보드 생성 (모두 잠금 상태)
 */
export function createBingoBoard(): CellState[] {
  return Array(25).fill("locked");
}

/**
 * 빙고 라인 체크
 * @returns 완성된 라인 수 (최대 12개)
 */
export function checkBingoLines(board: CellState[]): number {
  // 숫자 배열로 변환 (locked = 0, unlocked = 1)
  const numBoard = board.map((cell) => (cell === "unlocked" ? 1 : 0));

  const lines = [
    // 가로 5줄
    [0, 1, 2, 3, 4],
    [5, 6, 7, 8, 9],
    [10, 11, 12, 13, 14],
    [15, 16, 17, 18, 19],
    [20, 21, 22, 23, 24],
    // 세로 5줄
    [0, 5, 10, 15, 20],
    [1, 6, 11, 16, 21],
    [2, 7, 12, 17, 22],
    [3, 8, 13, 18, 23],
    [4, 9, 14, 19, 24],
    // 대각선 2줄
    [0, 6, 12, 18, 24],
    [4, 8, 12, 16, 20],
  ];

  let count = 0;
  for (const line of lines) {
    if (line.every((i) => numBoard[i] === 1)) {
      count++;
    }
  }

  return count;
}

/**
 * 완성된 빙고 라인들의 인덱스 반환
 * @returns 완성된 라인들의 배열
 */
export function getCompletedBingoLines(board: CellState[]): number[][] {
  const numBoard = board.map((cell) => (cell === "unlocked" ? 1 : 0));

  const lines = [
    // 가로 5줄
    [0, 1, 2, 3, 4],
    [5, 6, 7, 8, 9],
    [10, 11, 12, 13, 14],
    [15, 16, 17, 18, 19],
    [20, 21, 22, 23, 24],
    // 세로 5줄
    [0, 5, 10, 15, 20],
    [1, 6, 11, 16, 21],
    [2, 7, 12, 17, 22],
    [3, 8, 13, 18, 23],
    [4, 9, 14, 19, 24],
    // 대각선 2줄
    [0, 6, 12, 18, 24],
    [4, 8, 12, 16, 20],
  ];

  const completedLines: number[][] = [];
  for (const line of lines) {
    if (line.every((i) => numBoard[i] === 1)) {
      completedLines.push(line);
    }
  }

  return completedLines;
}

/**
 * 랜덤 동물 선택
 */
export function getRandomAnimal(): Animal {
  return ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
}

/**
 * 동물 이미지 URL 생성
 * Using curated Unsplash photos with specific IDs for each animal
 */
export function getAnimalImageUrl(animal: Animal): string {
  // Unsplash photo IDs for each animal (curated)
  const animalPhotos: Record<string, string> = {
    lion: "KMn4VEeEPR8", // Lion by Glen Carrie
    tiger: "TIrXot28Znc", // Tiger by Jessica Weiller
    bear: "yihlaRCCvd4", // Bear by Zdeněk Macháček
    elephant: "cOJgO4Zzs-w", // Elephant by Geran de Klerk
    giraffe: "MQUqbmszGGM", // Giraffe by Zdeněk Macháček
    zebra: "XH2JFgT4Abc", // Zebra by David Clode
    penguin: "N9Pf2J656aQ", // Penguin by Derek Oyen
    cat: "NodtnCsLdTE", // Cat by Mikhail Vasilyev
    dog: "vihfVtRRboQ", // Dog by Joe Caione
    rabbit: "nKC772R_qog", // Rabbit by Satyabrata sm
    squirrel: "75715CVEJhI", // Squirrel by Geranimo
    fox: "xpdmfXJ7qkM", // Fox by Ray Hennessy
    wolf: "m0oU20Bn20E", // Wolf by Milo Weiler
    panda: "tPF1KsY1u24", // Panda by Laura Smetsers
    koala: "tPF1KsY1u24", // Koala (placeholder)
    kangaroo: "5MtOJLGJB-4", // Kangaroo by David Clode
    owl: "E-0ON3VGrBc", // Owl by Zdeněk Macháček
    eagle: "7i5HLSaVLhY", // Eagle by Patrice Bouchard
    parrot: "98uYQ-KupiE", // Parrot by Timothy Dykes
    dolphin: "4Bcu-9tOvmw", // Dolphin by DLKR
  };

  const photoId = animalPhotos[animal.en] || "KMn4VEeEPR8"; // Default: lion
  return `https://images.unsplash.com/photo-${photoId}?w=800&h=800&fit=crop`;
}

/**
 * 동물 맞추기 힌트 생성
 * @param hintLevel 1~3
 */
export function getAnimalHint(animalName: string, hintLevel: number): string {
  switch (hintLevel) {
    case 1:
      // 첫 글자 초성
      const firstChar = animalName[0];
      const cho = [
        "ㄱ",
        "ㄲ",
        "ㄴ",
        "ㄷ",
        "ㄸ",
        "ㄹ",
        "ㅁ",
        "ㅂ",
        "ㅃ",
        "ㅅ",
        "ㅆ",
        "ㅇ",
        "ㅈ",
        "ㅉ",
        "ㅊ",
        "ㅋ",
        "ㅌ",
        "ㅍ",
        "ㅎ",
      ];
      const charCode = firstChar.charCodeAt(0) - 44032;
      if (charCode >= 0 && charCode <= 11171) {
        const choIndex = Math.floor(charCode / 588);
        return `첫 글자: ${cho[choIndex]}`;
      }
      return `첫 글자: ${firstChar}`;

    case 2:
      return `글자 수: ${animalName.length}글자`;

    case 3:
      const animal = ANIMALS.find((a) => a.ko === animalName);
      return animal ? `영어 이름: ${animal.en}` : "힌트를 찾을 수 없습니다";

    default:
      return "";
  }
}

/**
 * 보드 상태를 JSON 문자열로 변환
 */
export function boardToJson(board: CellState[]): string {
  return JSON.stringify(board);
}

/**
 * JSON 문자열을 보드 상태로 변환
 */
export function jsonToBoard(json: string): CellState[] {
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed) && parsed.length === 25) {
      return parsed as CellState[];
    }
    return createBingoBoard();
  } catch {
    return createBingoBoard();
  }
}
