import { useState, useEffect, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  generateProblem,
  getLevelDescription,
  getRandomEncouragement,
} from "@/lib/mathEngine";
import type { Player, MathProblem, PlayerStats } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  ArrowLeft,
  BarChart3,
  Trophy,
  Zap,
  Target,
  ChevronUp,
  ChevronDown,
  Minus,
} from "lucide-react";

type FeedbackState = {
  isCorrect: boolean;
  message: string;
  correctAnswer: number;
} | null;

export default function Game() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const playerId = parseInt(params.id || "0");

  const [problem, setProblem] = useState<MathProblem | null>(null);
  const [userInput, setUserInput] = useState("");
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionTotal, setSessionTotal] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showLevelChange, setShowLevelChange] = useState<"up" | "down" | null>(null);

  const { data: stats, isLoading } = useQuery<PlayerStats>({
    queryKey: ["/api/players", playerId, "stats"],
  });

  const player = stats?.player;

  const submitMutation = useMutation({
    mutationFn: async (data: {
      playerId: number;
      operand1: number;
      operand2: number;
      operator: string;
      correctAnswer: number;
      userAnswer: number;
      isCorrect: boolean;
      level: number;
    }) => {
      const res = await apiRequest("POST", "/api/attempts", data);
      return res.json();
    },
    onSuccess: (result: { levelChanged: boolean; newLevel: number; direction: string }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/players", playerId, "stats"] });
      if (result.levelChanged) {
        setShowLevelChange(result.direction as "up" | "down");
        setTimeout(() => setShowLevelChange(null), 2500);
      }
    },
  });

  const generateNewProblem = useCallback(() => {
    if (player) {
      setProblem(generateProblem(player.level));
      setUserInput("");
      setFeedback(null);
    }
  }, [player]);

  useEffect(() => {
    if (player && !problem) {
      generateNewProblem();
    }
  }, [player, problem, generateNewProblem]);

  const handleSubmit = () => {
    if (!problem || !player || feedback) return;
    const answer = parseInt(userInput);
    if (isNaN(answer)) return;

    const isCorrect = answer === problem.correctAnswer;
    setFeedback({
      isCorrect,
      message: getRandomEncouragement(isCorrect),
      correctAnswer: problem.correctAnswer,
    });
    setSessionTotal((prev) => prev + 1);
    if (isCorrect) {
      setSessionCorrect((prev) => prev + 1);
      setStreak((prev) => prev + 1);
    } else {
      setStreak(0);
    }

    submitMutation.mutate({
      playerId: player.id,
      operand1: problem.operand1,
      operand2: problem.operand2,
      operator: problem.operator,
      correctAnswer: problem.correctAnswer,
      userAnswer: answer,
      isCorrect,
      level: player.level,
    });
  };

  const handleNumberClick = (num: string) => {
    if (feedback) return;
    if (num === "clear") {
      setUserInput("");
    } else if (num === "backspace") {
      setUserInput((prev) => prev.slice(0, -1));
    } else if (num === "negative") {
      setUserInput((prev) => (prev.startsWith("-") ? prev.slice(1) : "-" + prev));
    } else {
      setUserInput((prev) => prev + num);
    }
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        if (feedback) {
          generateNewProblem();
        } else {
          handleSubmit();
        }
      } else if (e.key === "Backspace") {
        if (!feedback) setUserInput((prev) => prev.slice(0, -1));
      } else if (/^[0-9]$/.test(e.key)) {
        if (!feedback) setUserInput((prev) => prev + e.key);
      }
    },
    [feedback, userInput, problem, player]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (isLoading || !player || !problem) {
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

  const sessionAccuracy = sessionTotal > 0 ? Math.round((sessionCorrect / sessionTotal) * 100) : 0;

  const getOperatorColor = (op: string) => {
    switch (op) {
      case "+": return "text-chart-4";
      case "-": return "text-chart-1";
      case "×": return "text-chart-3";
      case "÷": return "text-chart-2";
      default: return "text-primary";
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between gap-3 p-3 border-b bg-card/50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/")}
          data-testid="button-back-home"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
              {player.name[0]}
            </span>
            <span className="font-semibold text-sm" data-testid="text-player-name">{player.name}</span>
          </div>

          <div className="flex items-center gap-1 bg-primary/10 px-3 py-1 rounded-md" data-testid="text-level">
            <Zap className="w-4 h-4 text-primary" />
            <span className="font-bold text-sm text-primary">Lv.{player.level}</span>
          </div>

          {streak >= 3 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 bg-chart-3/15 px-3 py-1 rounded-md"
            >
              <span className="font-bold text-sm text-chart-3">{streak} 연속!</span>
            </motion.div>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation(`/dashboard/${player.id}`)}
          data-testid="button-dashboard"
        >
          <BarChart3 className="w-5 h-5" />
        </Button>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-4 gap-6 max-w-lg mx-auto w-full">
        <AnimatePresence>
          {showLevelChange && (
            <motion.div
              initial={{ opacity: 0, y: -30, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.8 }}
              className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-md font-bold text-lg ${
                showLevelChange === "up"
                  ? "bg-chart-4/15 text-chart-4 border border-chart-4/30"
                  : "bg-chart-3/15 text-chart-3 border border-chart-3/30"
              }`}
            >
              <div className="flex items-center gap-2">
                {showLevelChange === "up" ? (
                  <>
                    <ChevronUp className="w-6 h-6" />
                    레벨 업!
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-6 h-6" />
                    레벨 다운
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="text-center mb-2">
          <p className="text-sm text-muted-foreground">
            {getLevelDescription(player.level)}
          </p>
        </div>

        <Card className="w-full">
          <CardContent className="p-6 md:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${problem.operand1}-${problem.operator}-${problem.operand2}`}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
                className="text-center"
              >
                <div className="flex items-center justify-center gap-3 md:gap-5 mb-6">
                  <span className="text-4xl md:text-5xl font-bold" data-testid="text-operand1">
                    {problem.operand1}
                  </span>
                  <span className={`text-3xl md:text-4xl font-bold ${getOperatorColor(problem.operator)}`} data-testid="text-operator">
                    {problem.operator}
                  </span>
                  <span className="text-4xl md:text-5xl font-bold" data-testid="text-operand2">
                    {problem.operand2}
                  </span>
                  <span className="text-3xl md:text-4xl font-bold text-muted-foreground">=</span>
                  <span className="text-4xl md:text-5xl font-bold text-primary min-w-[80px]" data-testid="text-answer-display">
                    {userInput || "?"}
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>

            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`text-center p-4 rounded-md mb-4 ${
                    feedback.isCorrect
                      ? "bg-chart-4/10 border border-chart-4/20"
                      : "bg-destructive/10 border border-destructive/20"
                  }`}
                >
                  <p className={`font-bold text-lg ${
                    feedback.isCorrect ? "text-chart-4" : "text-destructive"
                  }`}>
                    {feedback.message}
                  </p>
                  {!feedback.isCorrect && (
                    <p className="text-sm text-muted-foreground mt-1">
                      정답: <span className="font-bold text-foreground">{feedback.correctAnswer}</span>
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {feedback ? (
              <Button
                size="lg"
                className="w-full"
                onClick={generateNewProblem}
                data-testid="button-next"
              >
                다음 문제
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <Button
                      key={num}
                      variant="outline"
                      size="lg"
                      className="text-xl font-bold"
                      onClick={() => handleNumberClick(String(num))}
                      data-testid={`button-num-${num}`}
                    >
                      {num}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => handleNumberClick("negative")}
                    data-testid="button-negative"
                  >
                    <Minus className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="text-xl font-bold"
                    onClick={() => handleNumberClick("0")}
                    data-testid="button-num-0"
                  >
                    0
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => handleNumberClick("backspace")}
                    data-testid="button-backspace"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                </div>
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={!userInput}
                  data-testid="button-submit"
                >
                  정답 확인
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {sessionTotal > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full"
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">이번 학습</span>
                  </div>
                  <span className="text-sm font-semibold" data-testid="text-session-score">
                    {sessionCorrect}/{sessionTotal} ({sessionAccuracy}%)
                  </span>
                </div>
                <Progress value={sessionAccuracy} className="h-2" />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {stats?.todayStats && stats.todayStats.totalAttempted > 0 && (
          <Card className="w-full">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-chart-3" />
                  <span className="text-sm text-muted-foreground">오늘 전체</span>
                </div>
                <span className="text-sm font-semibold" data-testid="text-today-score">
                  {stats.todayStats.totalCorrect}/{stats.todayStats.totalAttempted} ({stats.todayStats.accuracy}%)
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
