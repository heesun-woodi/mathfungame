"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getLevelForAge, getLevelDescription } from "@/lib/mathEngine";
import { useToast } from "@/hooks/use-toast";
import type { Player } from "@/db/schema";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Sparkles,
  User,
  Calendar,
  ArrowRight,
  Play,
  Pencil,
  Trash2,
  Check,
  X,
} from "lucide-react";

export default function Welcome() {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [step, setStep] = useState<"select" | "register">("select");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  const { data: players, isLoading: playersLoading } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });

  const registerMutation = useMutation({
    mutationFn: async (data: { name: string; age: number }) => {
      const res = await apiRequest("POST", "/api/players", data);
      return res.json();
    },
    onSuccess: (player: Player) => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      router.push(`/game/${player.id}`);
    },
    onError: () => {
      toast({
        title: "등록 실패",
        description: "다시 시도해주세요.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (playerId: number) => {
      await apiRequest("DELETE", `/api/players/${playerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      toast({ title: "삭제되었습니다." });
    },
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      const res = await apiRequest("PATCH", `/api/players/${id}`, { name });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      setEditingId(null);
      toast({ title: "이름이 변경되었습니다." });
    },
  });

  const handleRegister = () => {
    const ageNum = parseInt(age);
    if (!name.trim()) {
      toast({ title: "이름을 입력해주세요!", variant: "destructive" });
      return;
    }
    if (isNaN(ageNum) || ageNum < 4 || ageNum > 15) {
      toast({ title: "나이는 4~15 사이로 입력해주세요!", variant: "destructive" });
      return;
    }
    registerMutation.mutate({ name: name.trim(), age: ageNum });
  };

  const handleDeletePlayer = (playerId: number) => {
    if (window.confirm("정말 삭제하시겠습니까? 모든 학습 기록이 삭제됩니다.")) {
      deleteMutation.mutate(playerId);
    }
  };

  const handleEditSave = (id: number) => {
    if (!editName.trim()) return;
    editMutation.mutate({ id, name: editName.trim() });
  };

  const previewLevel = age ? getLevelForAge(parseInt(age) || 7) : null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-chart-3" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-chart-2 to-chart-3 bg-clip-text text-transparent">
              수학 히어로
            </h1>
            <Sparkles className="w-8 h-8 text-chart-3" />
          </div>
          <p className="text-lg text-muted-foreground">
            재미있는 수학 모험을 시작해볼까요?
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {step === "select" ? (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {players && players.length > 0 && (
                <Card>
                  <CardContent className="p-5">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Star className="w-5 h-5 text-chart-3" />
                      다시 온 친구들
                    </h2>
                    <div className="space-y-2">
                      {players.map((player) => (
                        <motion.div
                          key={player.id}
                          whileTap={{ scale: 0.98 }}
                        >
                          {editingId === player.id ? (
                            <div className="flex items-center gap-2 p-2 border rounded-md">
                              <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleEditSave(player.id);
                                  if (e.key === "Escape") setEditingId(null);
                                }}
                                className="flex-1"
                                autoFocus
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditSave(player.id)}
                                disabled={editMutation.isPending}
                              >
                                <Check className="w-4 h-4 text-chart-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setEditingId(null)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="lg"
                                className="flex-1 justify-between gap-2"
                                onClick={() => router.push(`/game/${player.id}`)}
                              >
                                <span className="flex items-center gap-3">
                                  <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                                    {player.name[0]}
                                  </span>
                                  <span>
                                    <span className="font-semibold">{player.name}</span>
                                    <span className="text-muted-foreground text-sm ml-2">
                                      Lv.{player.level}
                                    </span>
                                  </span>
                                </span>
                                <Play className="w-5 h-5 text-primary" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditingId(player.id);
                                  setEditName(player.name);
                                }}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeletePlayer(player.id)}
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardContent className="p-5">
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={() => setStep("register")}
                  >
                    <User className="w-5 h-5 mr-2" />
                    새로운 친구 등록하기
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </CardContent>
              </Card>

              {playersLoading && (
                <div className="text-center text-muted-foreground py-8">
                  불러오는 중...
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="register"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card>
                <CardContent className="p-6 space-y-6">
                  <div className="text-center">
                    <h2 className="text-xl font-bold mb-1">새 친구 등록</h2>
                    <p className="text-sm text-muted-foreground">이름과 나이를 알려주세요!</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-base flex items-center gap-2">
                        <User className="w-4 h-4 text-primary" />
                        이름
                      </Label>
                      <Input
                        id="name"
                        placeholder="이름을 입력하세요"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="age" className="text-base flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        만 나이
                      </Label>
                      <Input
                        id="age"
                        type="number"
                        placeholder="만 나이를 입력하세요"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        min={4}
                        max={15}
                      />
                    </div>

                    {previewLevel && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="bg-primary/5 border border-primary/10 rounded-md p-4 text-center"
                      >
                        <p className="text-sm text-muted-foreground mb-1">시작 레벨</p>
                        <p className="text-2xl font-bold text-primary">Lv.{previewLevel}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {getLevelDescription(previewLevel)}
                        </p>
                      </motion.div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setStep("select")}
                    >
                      뒤로
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleRegister}
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "등록 중..." : "시작하기!"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
