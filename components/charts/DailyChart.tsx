"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { DailyChartData } from "@/db/schema";
import { getChartColor } from "@/lib/chartColors";

export default function DailyChart({ playerId }: { playerId: number }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const colors = useMemo(() => ({
    primary: getChartColor("--primary"),
    chart4: getChartColor("--chart-4"),
  }), []);

  const { data, isLoading } = useQuery<DailyChartData[]>({
    queryKey: ["daily-stats", playerId, year, month],
    queryFn: () =>
      fetch(`/api/players/${playerId}/daily-stats?year=${year}&month=${month}`).then((r) =>
        r.json()
      ),
  });

  const prevMonth = () => {
    if (month === 1) {
      setYear(year - 1);
      setMonth(12);
    } else {
      setMonth(month - 1);
    }
  };

  const nextMonth = () => {
    if (month === 12) {
      setYear(year + 1);
      setMonth(1);
    } else {
      setMonth(month + 1);
    }
  };

  const chartData = (data || []).map((d) => ({
    ...d,
    day: parseInt(d.date.split("-")[2]),
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={prevMonth}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="font-semibold text-sm">
          {year}년 {month}월
        </span>
        <Button variant="ghost" size="icon" onClick={nextMonth}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
          불러오는 중...
        </div>
      ) : chartData.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
          이 달에는 학습 기록이 없어요.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <XAxis dataKey="day" fontSize={12} />
            <YAxis fontSize={12} allowDecimals={false} />
            <Tooltip
              formatter={(value, name) => [
                value,
                name === "totalAttempted" ? "풀은 문제" : "정답",
              ]}
              labelFormatter={(label) => `${month}월 ${label}일`}
            />
            <Legend
              formatter={(value) =>
                value === "totalAttempted" ? "풀은 문제" : "정답"
              }
            />
            <Bar dataKey="totalAttempted" fill={colors.primary} radius={[2, 2, 0, 0]} />
            <Bar dataKey="totalCorrect" fill={colors.chart4} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
