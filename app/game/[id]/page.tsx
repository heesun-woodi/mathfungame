"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { generateProblem } from "@/lib/mathEngine";
import { getAnimalHint } from "@/lib/bingoEngine";
import type { MathProblem, PlayerStats, CellState } from "@/db/schema";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  ArrowLeft,
  BarChart3,
  Settings,
  Sparkles,
  CheckCircle2,
  Lock,
  Lightbulb,
  Trophy,
  ChevronUp,
  Zap,
} from "lucide-react";

type GamePhase = "playing" | "guessing";

export default function BingoGame() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const playerId = parseInt(params.id || "0");
  const inputRef = useRef<HTMLInputElement>(null);

  // Session state
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [boardState, setBoardState] = useState<CellState[]>(Array(25).fill("locked"));
  const [animalImageUrl, setAnimalImageUrl] = useState<string>("");
  const [completedLines, setCompletedLines] = useState(0);
  const [phase, setPhase] = useState<GamePhase>("playing");

  // Problem state
  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const [problem, setProblem] = useState<MathProblem | null>(null);
  const [userInput, setUserInput] = useState("");
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);

  // Guessing state
  const [animalGuess, setAnimalGuess] = useState("");
  const [hintLevel, setHintLevel] = useState(0);
  const [hintText, setHintText] = useState("");
  const [guessFeedback, setGuessFeedback] = useState<string | null>(null);

  const { data: stats, isLoading } = useQuery<PlayerStats>({
    queryKey: ["/api/players", playerId, "stats"],
  });

  const player = stats?.player;

  // Start new bingo session
  const startSession = useCallback(async () => {
    if (!player) return;

    try {
      const response = await apiRequest("POST", "/api/bingo/start", {
        playerId: player.id,
        level: player.level,
      });
      const data = await response.json();

      setSessionId(data.sessionId);
      setBoardState(data.boardState);
      setAnimalImageUrl(data.animalImageUrl);
      setCompletedLines(0);
      setPhase("playing");
      setSelectedCell(null);
      setProblem(null);
      setHintLevel(0);
      setHintText("");
    } catch (error) {
      console.error("Failed to start bingo session:", error);
    }
  }, [player]);

  // Initialize session
  useEffect(() => {
    if (player && !sessionId) {
      startSession();
    }
  }, [player, sessionId, startSession]);

  // Select cell and generate problem
  const handleCellClick = useCallback(
    (index: number) => {
      if (boardState[index] === "unlocked" || selectedCell !== null || phase !== "playing") return;

      setSelectedCell(index);
      setFeedback(null);

      if (player) {
        let operatorKeys: ("add" | "subtract" | "multiply" | "divide")[] | undefined;
        try {
          const parsed = JSON.parse(player.operators || "[]");
          if (Array.isArray(parsed) && parsed.length > 0) {
            operatorKeys = parsed as ("add" | "subtract" | "multiply" | "divide")[];
          }
        } catch {
          // Use default
        }
        setProblem(generateProblem(player.level, operatorKeys));
        setUserInput("");
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    },
    [boardState, selectedCell, phase, player]
  );

  // Submit answer
  const handleSubmit = useCallback(async () => {
    if (!problem || !sessionId || selectedCell === null) return;

    const answer = parseInt(userInput);
    if (isNaN(answer)) return;

    try {
      const response = await apiRequest("POST", `/api/bingo/${sessionId}/attempt`, {
        cellIndex: selectedCell,
        operand1: problem.operand1,
        operand2: problem.operand2,
        operator: problem.operator,
        correctAnswer: problem.correctAnswer,
        userAnswer: answer,
      });
      const data = await response.json();

      setFeedback({
        isCorrect: data.isCorrect,
        message: data.isCorrect ? "정답입니다! 🎉" : "틀렸어요. 다시 시도해보세요!",
      });

      if (data.isCorrect) {
        setBoardState(data.boardState);
        setCompletedLines(data.completedLines);

        if (data.isCompleted) {
          setTimeout(() => {
            setPhase("guessing");
            setSelectedCell(null);
            setProblem(null);
          }, 1500);
        } else {
          setTimeout(() => {
            setSelectedCell(null);
            setProblem(null);
            setFeedback(null);
          }, 1500);
        }
      }
    } catch (error) {
      console.error("Failed to submit attempt:", error);
    }
  }, [problem, sessionId, selectedCell, userInput]);

  // Submit animal guess
  const handleAnimalGuess = useCallback(async () => {
    if (!sessionId || !animalGuess.trim()) return;

    try {
      const response = await apiRequest("POST", `/api/bingo/${sessionId}/guess`, {
        animalGuess: animalGuess.trim(),
      });
      const data = await response.json();

      if (data.isCorrect) {
        setGuessFeedback("정답입니다! 🎉");
        queryClient.invalidateQueries({ queryKey: ["/api/players", playerId, "stats"] });
      } else {
        setGuessFeedback("틀렸어요. 힌트를 확인해보세요!");
      }
    } catch (error) {
      console.error("Failed to submit guess:", error);
    }
  }, [sessionId, animalGuess, playerId]);

  // Show hint
  const handleShowHint = useCallback(async () => {
    if (!sessionId || hintLevel >= 3) return;

    try {
      const response = await apiRequest("GET", `/api/bingo/${sessionId}`, {});
      const data = await response.json();
      const nextHintLevel = hintLevel + 1;
      const hint = getAnimalHint(data.animalName, nextHintLevel);
      setHintText(hint);
      setHintLevel(nextHintLevel);
    } catch (error) {
      console.error("Failed to get hint:", error);
    }
  }, [sessionId, hintLevel]);

  if (isLoading || !player) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Star className="w-12 h-12 text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between gap-3 p-3 border-b bg-card/50">
        <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
              {player.name[0]}
            </span>
            <span className="font-semibold text-sm">{player.name}</span>
          </div>

          <div className="flex items-center gap-1 bg-primary/10 px-3 py-1 rounded-md">
            <Zap className="w-4 h-4 text-primary" />
            <span className="font-bold text-sm text-primary">Lv.{player.level}</span>
          </div>

          {completedLines > 0 && (
            <div className="flex items-center gap-1 bg-chart-3/15 px-3 py-1 rounded-md">
              <Sparkles className="w-4 h-4 text-chart-3" />
              <span className="font-bold text-sm text-chart-3">{completedLines}줄</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/settings/${player.id}`)}>
            <Settings className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => router.push(`/dashboard/${player.id}`)}>
            <BarChart3 className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 gap-6 max-w-2xl mx-auto w-full">
        {phase === "playing" ? (
          <>
            {/* Bingo Board */}
            <div
              className="relative w-full aspect-square max-w-md rounded-lg overflow-hidden shadow-lg"
              style={{
                backgroundImage: `url(${animalImageUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              {/* Grid overlay */}
              <div className="absolute inset-0 grid grid-cols-5 grid-rows-5 gap-1 p-1 bg-black/40">
                {boardState.map((state, index) => (
                  <motion.button
                    key={index}
                    onClick={() => handleCellClick(index)}
                    disabled={state === "unlocked" || selectedCell !== null}
                    className={`
                      relative rounded-md border-2 transition-all
                      ${state === "locked" ? "bg-gray-800/90 backdrop-blur-md border-gray-600 hover:bg-gray-700/90" : "bg-transparent border-green-500"}
                      ${selectedCell === index ? "border-blue-500 ring-4 ring-blue-500/50" : ""}
                      disabled:cursor-not-allowed
                    `}
                    whileHover={state === "locked" && selectedCell === null ? { scale: 1.05 } : {}}
                    whileTap={state === "locked" && selectedCell === null ? { scale: 0.95 } : {}}
                  >
                    {state === "locked" && <Lock className="w-4 h-4 md:w-6 md:h-6 text-gray-400 absolute inset-0 m-auto" />}
                    {state === "unlocked" && <CheckCircle2 className="w-4 h-4 md:w-6 md:h-6 text-green-500 absolute inset-0 m-auto" />}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Problem Card */}
            {selectedCell !== null && problem && (
              <Card className="w-full">
                <CardContent className="p-6">
                  <div className="text-center mb-4">
                    <p className="text-sm text-muted-foreground mb-2">칸 {selectedCell + 1}</p>
                    <div className="flex items-center justify-center gap-3 mb-6">
                      <span className="text-3xl font-bold">{problem.operand1}</span>
                      <span className="text-2xl font-bold text-primary">{problem.operator}</span>
                      <span className="text-3xl font-bold">{problem.operand2}</span>
                      <span className="text-2xl font-bold text-muted-foreground">=</span>
                      <span className="text-3xl font-bold text-primary min-w-[60px]">{userInput || "?"}</span>
                    </div>
                  </div>

                  <AnimatePresence>
                    {feedback && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`text-center p-3 rounded-md mb-4 ${
                          feedback.isCorrect
                            ? "bg-green-500/10 border border-green-500/20 text-green-600"
                            : "bg-red-500/10 border border-red-500/20 text-red-600"
                        }`}
                      >
                        <p className="font-bold">{feedback.message}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {!feedback && (
                    <div className="space-y-3">
                      <Input
                        ref={inputRef}
                        type="text"
                        inputMode="numeric"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value.replace(/[^0-9-]/g, ""))}
                        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                        placeholder="정답 입력"
                        className="text-center text-xl font-bold h-12"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setSelectedCell(null);
                            setProblem(null);
                          }}
                        >
                          취소
                        </Button>
                        <Button className="flex-1" onClick={handleSubmit} disabled={!userInput}>
                          확인
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {completedLines >= 5 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <p className="text-2xl font-bold text-green-600 mb-2">🎉 5줄 완성!</p>
                <p className="text-muted-foreground">동물을 맞춰보세요!</p>
              </motion.div>
            )}
          </>
        ) : (
          /* Animal Guessing Phase */
          <Card className="w-full">
            <CardContent className="p-6 text-center space-y-4">
              <Trophy className="w-16 h-16 mx-auto text-yellow-500" />
              <h2 className="text-2xl font-bold">빙고 완성! 🎉</h2>

              {/* Full animal image */}
              <div className="w-full aspect-square max-w-sm mx-auto rounded-lg overflow-hidden">
                <img src={animalImageUrl} alt="동물" className="w-full h-full object-cover" />
              </div>

              <p className="text-lg font-semibold">이 동물은 무엇일까요?</p>

              {hintText && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-md p-3"
                >
                  <Lightbulb className="w-5 h-5 text-yellow-600" />
                  <p className="text-sm font-semibold text-yellow-700">{hintText}</p>
                </motion.div>
              )}

              {guessFeedback && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`p-3 rounded-md ${
                    guessFeedback.includes("정답")
                      ? "bg-green-500/10 border border-green-500/20 text-green-600"
                      : "bg-red-500/10 border border-red-500/20 text-red-600"
                  }`}
                >
                  <p className="font-bold">{guessFeedback}</p>
                </motion.div>
              )}

              {!guessFeedback?.includes("정답") ? (
                <div className="space-y-3">
                  <Input
                    type="text"
                    value={animalGuess}
                    onChange={(e) => setAnimalGuess(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAnimalGuess()}
                    placeholder="동물 이름 입력 (예: 사자)"
                    className="text-center text-lg h-12"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={handleShowHint} disabled={hintLevel >= 3}>
                      <Lightbulb className="w-4 h-4 mr-2" />
                      힌트 ({hintLevel}/3)
                    </Button>
                    <Button className="flex-1" onClick={handleAnimalGuess} disabled={!animalGuess.trim()}>
                      정답 확인
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3 mt-4">
                  <Button
                    className="w-full"
                    onClick={async () => {
                      if (player.level >= 10) {
                        alert("이미 최대 레벨입니다!");
                        return;
                      }
                      await apiRequest("PUT", `/api/players/${player.id}/level`, {
                        level: player.level + 1,
                      });
                      queryClient.invalidateQueries({ queryKey: ["/api/players", playerId, "stats"] });
                      startSession();
                    }}
                  >
                    <ChevronUp className="w-5 h-5 mr-2" />
                    레벨 올리기 (Lv.{Math.min(player.level + 1, 10)})
                  </Button>
                  <Button variant="outline" className="w-full" onClick={startSession}>
                    <Zap className="w-5 h-5 mr-2" />
                    같은 레벨 더 하기
                  </Button>
                  <Button variant="ghost" className="w-full" onClick={() => router.push("/")}>
                    그만하기
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
