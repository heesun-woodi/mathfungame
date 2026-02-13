"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { LevelStats } from "@/db/schema";
import { getChartColor } from "@/lib/chartColors";

export default function LevelChart({ playerId }: { playerId: number }) {
  const colors = useMemo(() => ({
    chart1: getChartColor("--chart-1"),
    chart2: getChartColor("--chart-2"),
    chart4: getChartColor("--chart-4"),
  }), []);

  const { data, isLoading } = useQuery<LevelStats[]>({
    queryKey: ["level-stats", playerId],
    queryFn: () =>
      fetch(`/api/players/${playerId}/level-stats`).then((r) => r.json()),
  });

  const chartData = (data || []).map((d) => ({
    ...d,
    label: `Lv.${d.level}`,
  }));

  const getBarColor = (accuracy: number) => {
    if (accuracy >= 80) return colors.chart4;
    if (accuracy >= 50) return colors.chart2;
    return colors.chart1;
  };

  if (isLoading) {
    return (
      <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
        불러오는 중...
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
        아직 학습 기록이 없어요.
      </div>
    );
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData}>
          <XAxis dataKey="label" fontSize={11} />
          <YAxis fontSize={12} allowDecimals={false} />
          <Tooltip
            formatter={(value, name) => [
              value,
              name === "totalAttempted" ? "풀은 문제" : name,
            ]}
          />
          <Bar dataKey="totalAttempted" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={index} fill={getBarColor(entry.accuracy)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: colors.chart4 }} />
          80%+
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: colors.chart2 }} />
          50-79%
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: colors.chart1 }} />
          50% 미만
        </span>
      </div>
    </div>
  );
}
