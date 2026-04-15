import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface ChartData {
  name: string;
  clicks: number;
}

type DateRange = "7d" | "30d" | "all";

const DATE_FILTERS: { label: string; value: DateRange }[] = [
  { label: "7 Days", value: "7d" },
  { label: "30 Days", value: "30d" },
  { label: "All Time", value: "all" },
];

const ClicksChart = ({ refreshSignal }: { refreshSignal: number }) => {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<DateRange>("all");
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);

      let query = supabase
        .from("links")
        .select("short_code, clicks_count, utm_campaign, created_at")
        .eq("user_id", user.id)
        .order("clicks_count", { ascending: false })
        .limit(10);

      if (range !== "all") {
        const days = range === "7d" ? 7 : 30;
        const since = new Date();
        since.setDate(since.getDate() - days);
        query = query.gte("created_at", since.toISOString());
      }

      const { data: links } = await query;

      if (links) {
        setData(
          links.map((l) => ({
            name: l.utm_campaign || l.short_code,
            clicks: l.clicks_count,
          }))
        );
      }
      setLoading(false);
    };
    fetchData();
  }, [user, refreshSignal, range]);

  const chartContent = loading ? (
    <div className="h-64 flex items-center justify-center">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  ) : data.length === 0 ? (
    <div className="h-64 flex flex-col items-center justify-center gap-3">
      <BarChart3 className="h-10 w-10 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">No links found for this period</p>
    </div>
  ) : (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: -12 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={{ stroke: "hsl(var(--border))" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            }}
            cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
          />
          <Bar dataKey="clicks" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-foreground">Clicks by Link</h2>
        <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
          {DATE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setRange(f.value)}
              className={cn(
                "px-2.5 py-1 text-[11px] font-medium rounded transition-colors",
                range === f.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      {chartContent}
    </div>
  );
};

export default ClicksChart;
