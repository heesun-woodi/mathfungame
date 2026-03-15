"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { PlayerStats } from "@/db/schema";
import { motion } from "framer-motion";
import { ArrowLeft, Settings, Zap, Plus, X, Check } from "lucide-react";

const DAILY_LIMIT_OPTIONS = [
  { value: 10, label: "10문제" },
  { value: 20, label: "20문제" },
  { value: 30, label: "30문제" },
  { value: 0, label: "무제한" },
];

const LEVEL_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

type OperatorKey = "add" | "subtract" | "multiply" | "divide";

const OPERATOR_OPTIONS: { key: OperatorKey; label: string; symbol: string }[] = [
  { key: "add", label: "덧셈", symbol: "+" },
  { key: "subtract", label: "뺄셈", symbol: "-" },
  { key: "multiply", label: "곱셈", symbol: "×" },
  { key: "divide", label: "나눗셈", symbol: "÷" },
];

export default function SettingsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const playerId = parseInt(params.id || "0");

  const { data: stats, isLoading } = useQuery<PlayerStats>({
    queryKey: ["/api/players", playerId, "stats"],
  });

  const player = stats?.player;

  const [selectedLimit, setSelectedLimit] = useState<number | null>(null);
  const [selectedOperators, setSelectedOperators] = useState<OperatorKey[]>([]);

  const currentLimit = selectedLimit ?? player?.dailyLimit ?? 0;

  // Parse operators from player
  const currentOperators = (() => {
    if (selectedOperators.length > 0) return selectedOperators;
    if (!player?.operators) return ["add", "subtract", "multiply", "divide"];
    try {
      const parsed = JSON.parse(player.operators);
      return Array.isArray(parsed) && parsed.length > 0 
        ? parsed 
        : ["add", "subtract", "multiply", "divide"];
    } catch {
      return ["add", "subtract", "multiply", "divide"];
    }
  })();

  const saveMutation = useMutation({
    mutationFn: async (dailyLimit: number) => {
      const res = await apiRequest(
        "PUT",
        `/api/players/${playerId}/settings`,
        { dailyLimit }
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/players", playerId, "stats"],
      });
      toast({
        title: "설정이 저장되었습니다",
      });
    },
  });

  const levelMutation = useMutation({
    mutationFn: async (level: number) => {
      const res = await apiRequest(
        "PUT",
        `/api/players/${playerId}/level`,
        { level }
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/players", playerId, "stats"],
      });
      toast({
        title: "레벨이 변경되었습니다",
      });
    },
  });

  const operatorsMutation = useMutation({
    mutationFn: async (operators: OperatorKey[]) => {
      const res = await apiRequest(
        "PATCH",
        `/api/players/${playerId}`,
        { operators: JSON.stringify(operators) }
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/players", playerId, "stats"],
      });
      toast({
        title: "연산자 설정이 저장되었습니다",
      });
    },
  });

  const handleSelect = (value: number) => {
    setSelectedLimit(value);
    saveMutation.mutate(value);
  };

  const handleOperatorToggle = (op: OperatorKey) => {
    const newOperators = currentOperators.includes(op)
      ? currentOperators.filter(o => o !== op)
      : [...currentOperators, op];
    
    // At least one operator must be selected
    if (newOperators.length === 0) {
      toast({
        title: "최소 1개의 연산자를 선택해야 합니다",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedOperators(newOperators);
    operatorsMutation.mutate(newOperators);
  };

  if (isLoading || !player) {
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
        <h1 className="font-bold text-lg">설정</h1>
        <div className="w-10" />
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                레벨 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-5">
              <p className="text-sm text-muted-foreground mb-4">
                현재 레벨: <span className="font-bold text-primary">Lv.{player.level}</span>
              </p>
              <div className="grid grid-cols-5 gap-2">
                {LEVEL_OPTIONS.map((level) => (
                  <Button
                    key={level}
                    variant={player.level === level ? "default" : "outline"}
                    className="h-10 text-sm font-semibold"
                    onClick={() => levelMutation.mutate(level)}
                    disabled={levelMutation.isPending}
                  >
                    {level}
                  </Button>
                ))}
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
                <Plus className="w-5 h-5 text-primary" />
                연습할 연산 선택
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-5">
              <p className="text-sm text-muted-foreground mb-4">
                연습하고 싶은 연산을 선택하세요. (최소 1개)
              </p>
              <div className="grid grid-cols-2 gap-3">
                {OPERATOR_OPTIONS.map((option) => {
                  const isSelected = currentOperators.includes(option.key);
                  return (
                    <Button
                      key={option.key}
                      variant={isSelected ? "default" : "outline"}
                      className="h-12 text-base font-semibold flex items-center gap-2"
                      onClick={() => handleOperatorToggle(option.key)}
                      disabled={operatorsMutation.isPending}
                    >
                      {isSelected ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                      {option.label} ({option.symbol})
                    </Button>
                  );
                })}
              </div>
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
                <Settings className="w-5 h-5 text-primary" />
                일일 문제 수 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-5">
              <p className="text-sm text-muted-foreground mb-4">
                하루에 풀 문제 수를 설정하세요.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {DAILY_LIMIT_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    variant={currentLimit === option.value ? "default" : "outline"}
                    className="h-12 text-base font-semibold"
                    onClick={() => handleSelect(option.value)}
                    disabled={saveMutation.isPending}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
