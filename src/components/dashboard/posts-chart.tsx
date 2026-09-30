"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export interface ChartDataPoint {
  date: string;
  label: string;
  count: number;
  posts: number;
  reach?: number;
  impressions?: number;
  clicks?: number;
  engagement?: number;
}

export function PostsChart({
  data,
  lastSync,
}: {
  data: ChartDataPoint[];
  lastSync?: string | null;
}) {
  const [metric, setMetric] = useState<"posts" | "engagement">("posts");

  const hasAnyActivity = data.some((d) => (d.posts ?? 0) > 0 || (d.engagement ?? 0) > 0);

  return (
    <div className="space-y-4">
      {/* Metric Selector Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setMetric("posts")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              metric === "posts"
                ? "bg-[#4338CA] text-white shadow-sm"
                : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
            }`}
          >
            Publications publiées
          </button>
          <button
            type="button"
            onClick={() => setMetric("engagement")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              metric === "engagement"
                ? "bg-[#4338CA] text-white shadow-sm"
                : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
            }`}
          >
            Interactions vérifiées
          </button>
        </div>

        <span className="text-[11px] text-muted-foreground font-medium">
          {lastSync ? `Synchronisé le ${lastSync}` : "Données vérifiées · Journal réel"}
        </span>
      </div>

      {!hasAnyActivity ? (
        <div className="flex h-52 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface-2/30 p-6 text-center">
          <p className="text-xs font-semibold text-foreground">
            Aucune publication enregistrée sur cette période
          </p>
          <p className="text-[11px] text-muted-foreground mt-1 max-w-sm">
            Les courbes de performances se traceront fidèlement à chaque publication effectuée ou programmée.
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={230}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="brandGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4338CA" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#4338CA" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border/60" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11 }}
              className="text-muted-foreground fill-current"
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11 }}
              className="text-muted-foreground fill-current"
              axisLine={false}
              tickLine={false}
              width={34}
            />
            <Tooltip
              cursor={{ stroke: "#6366F1", strokeWidth: 1, strokeDasharray: "2 2" }}
              contentStyle={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border)",
                borderRadius: "0.75rem",
                fontSize: "12px",
                color: "var(--foreground)",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
              }}
              labelFormatter={(label) => `Date : ${label}`}
              formatter={(val: any, name: any) => {
                if (name === "engagement") return [`${val} interaction(s)`, "Interactions réelles"];
                return [`${val} publication(s)`, "Posts diffusés"];
              }}
            />

            {metric === "posts" && (
              <Area
                type="monotone"
                dataKey="posts"
                name="posts"
                stroke="#4338CA"
                strokeWidth={2.5}
                fill="url(#brandGradient)"
                dot={{ r: 3, fill: "#4338CA" }}
                activeDot={{ r: 5, fill: "#4338CA" }}
              />
            )}

            {metric === "engagement" && (
              <Area
                type="monotone"
                dataKey="engagement"
                name="engagement"
                stroke="#10B981"
                strokeWidth={2.5}
                fill="url(#emeraldGradient)"
                dot={{ r: 3, fill: "#10B981" }}
                activeDot={{ r: 5, fill: "#10B981" }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
