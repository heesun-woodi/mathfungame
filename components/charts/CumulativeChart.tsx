"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { DailyChartData } from "@/db/schema";
import { getChartColor } from "@/lib/chartColors";

export default function CumulativeChart({ playerId }: { playerId: number }) {
  const color = useMemo(() => getChartColor("--primary"), []);

  const { data, isLoading } = useQuery<DailyChartData[]>({
    queryKey: ["cumulative-stats", playerId],
    queryFn: () =>
      fetch(`/api/players/${playerId}/cumulative-stats`).then((r) => r.json()),
  });

  const chartData = (data || []).map((d) => ({
    ...d,
    shortDate: d.date.slice(5),
  }));

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
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={chartData}>
        <XAxis dataKey="shortDate" fontSize={11} />
        <YAxis fontSize={12} allowDecimals={false} />
        <Tooltip
          formatter={(value, name) => [
            value,
            name === "totalAttempted" ? "누적 문제 수" : "누적 정답률(%)",
          ]}
          labelFormatter={(label) => `날짜: ${label}`}
        />
        <Area
          type="monotone"
          dataKey="totalAttempted"
          stroke={color}
          fill={color}
          fillOpacity={0.15}
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
