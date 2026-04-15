import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ChartData {
  name: string;
  clicks: number;
}

const ClicksChart = ({ refreshSignal }: { refreshSignal: number }) => {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      const { data: links } = await supabase
        .from("links")
        .select("short_code, clicks_count, utm_campaign")
        .eq("user_id", user.id)
        .order("clicks_count", { ascending: false })
        .limit(10);

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
  }, [user, refreshSignal]);

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 h-64 flex items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 h-64 flex flex-col items-center justify-center gap-3">
        <BarChart3 className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Create your first link to see analytics</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h2 className="text-sm font-medium text-foreground mb-4">Clicks by Link</h2>
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
    </div>
  );
};

export default ClicksChart;
