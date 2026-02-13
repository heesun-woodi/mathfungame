"use client";

import { useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getRandomEncouragement } from "@/lib/mathEngine";
import type { Attempt } from "@/db/schema";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Star,
  Target,
} from "lucide-react";

type ReviewProblem = Attempt;

type FeedbackState = {
  isCorrect: boolean;
  message: string;
  correctAnswer: number;
} | null;

export default function ReviewGame() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const playerId = parseInt(params.id || "0");
  const inputRef = useRef<HTMLInputElement>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionTotal, setSessionTotal] = useState(0);
  const [completed, setCompleted] = useState(false);

  const { data: problems, isLoading } = useQuery<ReviewProblem[]>({
    queryKey: ["/api/players", playerId, "review-problems"],
  });

  const submitMutation = useMutation({
    mutationFn: async (data: {
      playerId: number;
      originalAttemptId: number;
      userAnswer: number;
      isCorrect: boolean;
    }) => {
      const res = await apiRequest("POST", "/api/review-attempts", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/players", playerId, "review-problems"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/players", playerId, "stats"],
      });
    },
  });

  const currentProblem = problems?.[currentIndex] ?? null;

  const handleSubmit = useCallback(() => {
    if (!currentProblem || feedback) return;
    const answer = parseInt(userInput);
    if (isNaN(answer)) return;

    const isCorrect = answer === currentProblem.correctAnswer;
    setFeedback({
      isCorrect,
      message: getRandomEncouragement(isCorrect),
      correctAnswer: currentProblem.correctAnswer,
    });
    setSessionTotal((prev) => prev + 1);
    if (isCorrect) {
      setSessionCorrect((prev) => prev + 1);
    }

    submitMutation.mutate({
      playerId,
      originalAttemptId: currentProblem.id,
      userAnswer: answer,
      isCorrect,
    });
  }, [currentProblem, feedback, userInput, playerId, submitMutation]);

  const handleNext = useCallback(() => {
    if (!problems) return;
    if (currentIndex + 1 >= problems.length) {
      setCompleted(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
      setUserInput("");
      setFeedback(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [currentIndex, problems]);

  if (isLoading) {
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

  // Empty state: no review problems
  if (!problems || problems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <header className="flex items-center justify-between gap-3 p-3 border-b bg-card/50">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/game/${playerId}`)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="bg-purple-500/15 text-purple-600 dark:text-purple-400 px-3 py-1 rounded-md text-sm font-semibold">
              복습 모드
            </span>
          </div>
          <div className="w-10" />
        </header>

        <div className="max-w-lg mx-auto p-4 flex flex-col items-center justify-center min-h-[60vh]">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="w-full">
              <CardContent className="p-8 text-center space-y-4">
                <CheckCircle2 className="w-16 h-16 mx-auto text-chart-4 opacity-60" />
                <h2 className="text-2xl font-bold">복습할 문제가 없어요!</h2>
                <p className="text-muted-foreground">
                  틀린 문제가 없습니다. 정말 잘하고 있어요!
                </p>
                <Button
                  className="mt-4"
                  onClick={() => router.push(`/game/${playerId}`)}
                >
                  게임으로 돌아가기
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  const sessionAccuracy =
    sessionTotal > 0 ? Math.round((sessionCorrect / sessionTotal) * 100) : 0;
  const progressPercent =
    problems.length > 0
      ? Math.round(((currentIndex + (feedback ? 1 : 0)) / problems.length) * 100)
      : 0;

  const getOperatorColor = (op: string) => {
    switch (op) {
      case "+": return "text-chart-4";
      case "-": return "text-chart-1";
      case "\u00d7": return "text-chart-3";
      case "\u00f7": return "text-chart-2";
      default: return "text-primary";
    }
  };

  // Completion state
  if (completed) {
    return (
      <div className="min-h-screen bg-background">
        <header className="flex items-center justify-between gap-3 p-3 border-b bg-card/50">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/game/${playerId}`)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="bg-purple-500/15 text-purple-600 dark:text-purple-400 px-3 py-1 rounded-md text-sm font-semibold">
              복습 모드
            </span>
          </div>
          <div className="w-10" />
        </header>

        <div className="max-w-lg mx-auto p-4 flex flex-col items-center justify-center min-h-[60vh]">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="w-full">
              <CardContent className="p-8 text-center space-y-4">
                <Star className="w-16 h-16 mx-auto text-chart-3" />
                <h2 className="text-2xl font-bold">복습 완료!</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-muted/50 rounded-md">
                    <p className="text-2xl font-bold text-primary">
                      {sessionTotal}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">풀은 문제</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-md">
                    <p className="text-2xl font-bold text-chart-4">
                      {sessionCorrect}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">정답</p>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between gap-2 text-sm mb-1">
                    <span className="text-muted-foreground">정답률</span>
                    <span className="font-semibold">{sessionAccuracy}%</span>
                  </div>
                  <Progress value={sessionAccuracy} className="h-3" />
                </div>
                <div className="flex gap-3 mt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => router.push(`/game/${playerId}`)}
                  >
                    게임으로 돌아가기
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => router.push(`/dashboard/${playerId}`)}
                  >
                    학습 현황 보기
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between gap-3 p-3 border-b bg-card/50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/game/${playerId}`)}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <div className="flex items-center gap-3">
          <span className="bg-purple-500/15 text-purple-600 dark:text-purple-400 px-3 py-1 rounded-md text-sm font-semibold">
            복습 모드
          </span>
          <span className="text-sm font-semibold text-muted-foreground">
            {currentIndex + 1}/{problems.length}
          </span>
        </div>

        <div className="w-10" />
      </header>

      <div className="w-full max-w-lg mx-auto px-4 pt-2">
        <Progress value={progressPercent} className="h-2" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 gap-6 max-w-lg mx-auto w-full">
        {currentProblem && (
          <Card className="w-full">
            <CardContent className="p-6 md:p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${currentProblem.operand1}-${currentProblem.operator}-${currentProblem.operand2}-${currentIndex}`}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.25 }}
                  className="text-center"
                >
                  <div className="flex items-center justify-center gap-3 md:gap-5 mb-6">
                    <span className="text-4xl md:text-5xl font-bold">
                      {currentProblem.operand1}
                    </span>
                    <span
                      className={`text-3xl md:text-4xl font-bold ${getOperatorColor(currentProblem.operator)}`}
                    >
                      {currentProblem.operator}
                    </span>
                    <span className="text-4xl md:text-5xl font-bold">
                      {currentProblem.operand2}
                    </span>
                    <span className="text-3xl md:text-4xl font-bold text-muted-foreground">
                      =
                    </span>
                    <span className="text-4xl md:text-5xl font-bold text-primary min-w-[80px]">
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
                    <p
                      className={`font-bold text-lg ${
                        feedback.isCorrect
                          ? "text-chart-4"
                          : "text-destructive"
                      }`}
                    >
                      {feedback.message}
                    </p>
                    {!feedback.isCorrect && (
                      <p className="text-sm text-muted-foreground mt-1">
                        정답:{" "}
                        <span className="font-bold text-foreground">
                          {feedback.correctAnswer}
                        </span>
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {feedback ? (
                <Button size="lg" className="w-full" onClick={handleNext}>
                  다음 문제
                </Button>
              ) : (
                <div className="space-y-3">
                  <Input
                    ref={inputRef}
                    type="text"
                    inputMode="numeric"
                    value={userInput}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, "");
                      setUserInput(val);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSubmit();
                      }
                    }}
                    placeholder="정답 입력"
                    className="text-center text-2xl font-bold h-14"
                    autoFocus
                  />
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={handleSubmit}
                    disabled={!userInput}
                  >
                    정답 확인
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {sessionTotal > 0 && !completed && (
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
                    <span className="text-sm text-muted-foreground">
                      복습 진행
                    </span>
                  </div>
                  <span className="text-sm font-semibold">
                    {sessionCorrect}/{sessionTotal} ({sessionAccuracy}%)
                  </span>
                </div>
                <Progress value={sessionAccuracy} className="h-2" />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
