import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { Player, PlayerStats, Attempt } from "@shared/schema";
import { getLevelDescription } from "@/lib/mathEngine";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Play,
  Target,
  Trophy,
  Zap,
  TrendingUp,
  BookOpen,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export default function Dashboard() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const playerId = parseInt(params.id || "0");

  const { data: stats, isLoading: statsLoading } = useQuery<PlayerStats>({
    queryKey: ["/api/players", playerId, "stats"],
  });

  const { data: wrongAttempts, isLoading: wrongLoading } = useQuery<Attempt[]>({
    queryKey: ["/api/players", playerId, "wrong-attempts"],
  });

  if (statsLoading || !stats) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="text-primary font-bold text-xl"
        >
          불러오는 중...
        </motion.div>
      </div>
    );
  }

  const { player, todayStats } = stats;
  const overallAccuracy = player.totalAttempted > 0
    ? Math.round((player.totalCorrect / player.totalAttempted) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between gap-3 p-3 border-b bg-card/50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation(`/game/${playerId}`)}
          data-testid="button-back-game"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="font-bold text-lg" data-testid="text-dashboard-title">학습 현황</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation(`/game/${playerId}`)}
          data-testid="button-play"
        >
          <Play className="w-5 h-5" />
        </Button>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                  {player.name[0]}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold" data-testid="text-dashboard-name">{player.name}</h2>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="flex items-center gap-1 text-sm bg-primary/10 px-2 py-0.5 rounded-md text-primary font-semibold">
                      <Zap className="w-3 h-3" />
                      Lv.{player.level}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {getLevelDescription(player.level)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="w-5 h-5 text-chart-3" />
                오늘의 학습
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-5">
              {todayStats.totalAttempted > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-muted/50 rounded-md">
                      <p className="text-2xl font-bold text-primary" data-testid="text-today-attempted">
                        {todayStats.totalAttempted}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">풀은 문제</p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-md">
                      <p className="text-2xl font-bold text-chart-4" data-testid="text-today-correct">
                        {todayStats.totalCorrect}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">정답</p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-md">
                      <p className="text-2xl font-bold text-chart-3" data-testid="text-today-accuracy">
                        {todayStats.accuracy}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">정답률</p>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between gap-2 text-sm mb-1">
                      <span className="text-muted-foreground">정답률</span>
                      <span className="font-semibold">{todayStats.accuracy}%</span>
                    </div>
                    <Progress value={todayStats.accuracy} className="h-3" />
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Target className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p>오늘은 아직 문제를 풀지 않았어요!</p>
                  <Button
                    className="mt-4"
                    onClick={() => setLocation(`/game/${playerId}`)}
                    data-testid="button-start-today"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    학습 시작하기
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-chart-2" />
                전체 기록
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-5">
              {player.totalAttempted > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-muted/50 rounded-md">
                      <p className="text-2xl font-bold text-primary" data-testid="text-total-attempted">
                        {player.totalAttempted}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">총 문제</p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-md">
                      <p className="text-2xl font-bold text-chart-4" data-testid="text-total-correct">
                        {player.totalCorrect}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">총 정답</p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-md">
                      <p className="text-2xl font-bold text-chart-3" data-testid="text-total-accuracy">
                        {overallAccuracy}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">정답률</p>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between gap-2 text-sm mb-1">
                      <span className="text-muted-foreground">전체 정답률</span>
                      <span className="font-semibold">{overallAccuracy}%</span>
                    </div>
                    <Progress value={overallAccuracy} className="h-3" />
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <p>아직 풀은 문제가 없어요.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-destructive" />
                틀린 문제 복습
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-5">
              {wrongLoading ? (
                <p className="text-center text-muted-foreground py-4">불러오는 중...</p>
              ) : wrongAttempts && wrongAttempts.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {wrongAttempts.slice(0, 20).map((attempt) => (
                    <div
                      key={attempt.id}
                      className="flex items-center justify-between gap-2 p-3 bg-muted/30 rounded-md flex-wrap"
                      data-testid={`wrong-attempt-${attempt.id}`}
                    >
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                        <span className="font-mono text-base font-semibold">
                          {attempt.operand1} {attempt.operator} {attempt.operand2}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-destructive line-through">
                          {attempt.userAnswer}
                        </span>
                        <span className="flex items-center gap-1 text-chart-4 font-semibold">
                          <CheckCircle2 className="w-3 h-3" />
                          {attempt.correctAnswer}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p>틀린 문제가 없어요! 완벽해요!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
