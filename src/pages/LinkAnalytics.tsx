import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Download, Loader2, Link2 } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type LinkRow = Tables<"links">;
type ClickRow = Tables<"clicks">;

const DEVICE_COLORS = ["hsl(var(--primary))", "#34d399", "#fbbf24", "#94a3b8"];

const LinkAnalytics = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [link, setLink] = useState<LinkRow | null>(null);
  const [clicks, setClicks] = useState<ClickRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !user) return;
    const load = async () => {
      setLoading(true);
      const [{ data: linkData, error: e1 }, { data: clicksData, error: e2 }] =
        await Promise.all([
          supabase.from("links").select("*").eq("id", id).maybeSingle(),
          supabase
            .from("clicks")
            .select("*")
            .eq("link_id", id)
            .order("clicked_at", { ascending: false })
            .limit(5000),
        ]);

      if (e1 || !linkData) {
        toast.error("Link not found.");
        navigate("/dashboard");
        return;
      }
      if (e2) {
        console.error("[LinkAnalytics] clicks error:", e2);
      }
      setLink(linkData);
      setClicks(clicksData ?? []);
      setLoading(false);
    };
    load();
  }, [id, user, navigate]);

  const stats = useMemo(() => {
    const now = Date.now();
    const dayMs = 86400000;
    const today = clicks.filter((c) => now - new Date(c.clicked_at).getTime() < dayMs).length;
    const week = clicks.filter((c) => now - new Date(c.clicked_at).getTime() < 7 * dayMs).length;
    return { total: clicks.length, today, week };
  }, [clicks]);

  const timeline = useMemo(() => {
    const buckets = new Map<string, number>();
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      buckets.set(key, 0);
    }
    clicks.forEach((c) => {
      const key = new Date(c.clicked_at).toISOString().slice(0, 10);
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
    });
    return Array.from(buckets.entries()).map(([date, count]) => ({
      date: date.slice(5),
      count,
    }));
  }, [clicks]);

  const devices = useMemo(() => {
    const map = new Map<string, number>();
    clicks.forEach((c) => {
      const k = c.device_type || "desktop";
      map.set(k, (map.get(k) ?? 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [clicks]);

  const topCountries = useMemo(() => {
    const map = new Map<string, number>();
    clicks.forEach((c) => {
      const k = c.ip_country || "Unknown";
      map.set(k, (map.get(k) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));
  }, [clicks]);

  const topBrowsers = useMemo(() => {
    const map = new Map<string, number>();
    clicks.forEach((c) => {
      const k = c.browser || "Unknown";
      map.set(k, (map.get(k) ?? 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [clicks]);

  const topReferrers = useMemo(() => {
    const map = new Map<string, number>();
    clicks.forEach((c) => {
      let key = "Direct";
      if (c.referrer) {
        try {
          key = new URL(c.referrer).hostname;
        } catch {
          key = c.referrer;
        }
      }
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [clicks]);

  const handleExport = () => {
    if (!clicks.length) {
      toast.error("No clicks to export.");
      return;
    }
    const csv = Papa.unparse(
      clicks.map((c) => ({
        clicked_at: c.clicked_at,
        country: c.ip_country || "",
        city: c.ip_city || "",
        device: c.device_type || "",
        browser: c.browser || "",
        os: c.os || "",
        referrer: c.referrer || "",
      }))
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clicks-${link?.short_code ?? "export"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported.");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!link) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
            <Link2 className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-foreground text-sm tracking-tight">Sniplink</span>
        </div>
      </header>

      <main className="flex-1 px-4 sm:px-6 py-8">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <Button variant="ghost" size="sm" asChild className="-ml-2 text-xs text-muted-foreground hover:text-foreground gap-1.5">
                <Link to="/dashboard">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to dashboard
                </Link>
              </Button>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                /{link.short_code}
              </h1>
              <p className="text-sm text-muted-foreground truncate max-w-xl">
                → {link.original_url}
              </p>
            </div>
            <Button onClick={handleExport} variant="outline" size="sm" className="rounded-lg gap-1.5">
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Total clicks" value={stats.total} />
            <StatCard label="This week" value={stats.week} />
            <StatCard label="Today" value={stats.today} />
          </div>

          {/* Timeline */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-sm font-medium text-foreground mb-4">Clicks over time (last 30 days)</h2>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeline} margin={{ top: 4, right: 4, bottom: 4, left: -12 }}>
                  <defs>
                    <linearGradient id="clickGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#clickGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Grid: devices + countries */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-sm font-medium text-foreground mb-4">Devices</h2>
              {devices.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
              ) : (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={devices} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={2}>
                        {devices.map((_, i) => (
                          <Cell key={i} fill={DEVICE_COLORS[i % DEVICE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
              <div className="flex flex-wrap gap-3 justify-center mt-2 text-xs">
                {devices.map((d, i) => (
                  <span key={d.name} className="flex items-center gap-1.5 text-muted-foreground capitalize">
                    <span className="h-2 w-2 rounded-full" style={{ background: DEVICE_COLORS[i % DEVICE_COLORS.length] }} />
                    {d.name} ({d.value})
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-sm font-medium text-foreground mb-4">Top countries</h2>
              {topCountries.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
              ) : (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topCountries} layout="vertical" margin={{ left: 8, right: 8 }}>
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={50} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                        cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
                      />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} maxBarSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Lists: browsers + referrers */}
          <div className="grid md:grid-cols-2 gap-4">
            <ListCard title="Top browsers" rows={topBrowsers} />
            <ListCard title="Top referrers" rows={topReferrers} />
          </div>
        </div>
      </main>
    </div>
  );
};

const StatCard = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-lg border border-border bg-card p-4">
    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
    <p className="text-2xl font-bold text-foreground mt-1 tabular-nums">{value}</p>
  </div>
);

const ListCard = ({ title, rows }: { title: string; rows: [string, number][] }) => (
  <div className="rounded-lg border border-border bg-card p-6">
    <h2 className="text-sm font-medium text-foreground mb-3">{title}</h2>
    {rows.length === 0 ? (
      <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
    ) : (
      <ul className="space-y-2">
        {rows.map(([name, value]) => (
          <li key={name} className="flex items-center justify-between text-sm">
            <span className="text-foreground truncate">{name}</span>
            <span className="text-muted-foreground tabular-nums">{value}</span>
          </li>
        ))}
      </ul>
    )}
  </div>
);

export default LinkAnalytics;
