import { useState } from "react";
import { Link } from "react-router-dom";
import { Link2, ArrowRight, Copy, Check, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { generateShortCode, isValidHttpUrl } from "@/lib/url-utils";
import { toast } from "sonner";

const ANON_LIMIT = 3;
const STORAGE_KEY = "linkjoy_anon_count";

const getAnonCount = (): number => {
  try { return parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10); }
  catch { return 0; }
};

const incrementAnonCount = () => {
  try { localStorage.setItem(STORAGE_KEY, String(getAnonCount() + 1)); }
  catch { /* noop */ }
};

const LandingPage = () => {
  const [url, setUrl] = useState("");
  const [shortCode, setShortCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [anonCount, setAnonCount] = useState(getAnonCount);
  const limitReached = anonCount >= ANON_LIMIT;

  console.log("[LandingPage] Rendering public landing page");

  const handleShorten = async () => {
    console.log("[LandingPage] Shorten clicked, url:", url);
    setError("");

    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    if (!isValidHttpUrl(url)) {
      setError("Enter a valid URL starting with http:// or https://");
      return;
    }

    setIsLoading(true);
    try {
      const code = generateShortCode();
      console.log("[LandingPage] Inserting anonymous link with code:", code);

      const { error: dbError } = await supabase.from("links").insert({
        original_url: url,
        short_code: code,
      });

      if (dbError) {
        console.error("[LandingPage] Insert error:", dbError);
        toast.error("Failed to shorten link. Please try again.");
        return;
      }

      incrementAnonCount();
      setAnonCount(getAnonCount());
      setShortCode(code);
      toast.success("Link shortened!");
      console.log("[LandingPage] Anonymous link created:", code);
    } catch (err) {
      console.error("[LandingPage] Error:", err);
      toast.error("Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!shortCode) return;
    const link = `${window.location.origin}/${shortCode}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleReset = () => {
    setUrl("");
    setShortCode(null);
    setCopied(false);
    setError("");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
              <Link2 className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground text-sm tracking-tight">LinkJoy</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="text-sm text-muted-foreground hover:text-foreground">
              <Link to="/auth">Login</Link>
            </Button>
            <Button size="sm" asChild className="text-sm rounded-lg h-9">
              <Link to="/auth">Sign Up</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary bg-primary-soft border border-primary/20 rounded-full px-3 py-1">
            ✦ UTM · Short Links · Analytics
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-[1.05]">
            The Minimalist UTM &<br />Link Shortener
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto">
            Create short, trackable URLs with UTM parameters. Simple, fast, and no clutter.
          </p>

          {/* Anonymous Shortener Form */}
          {limitReached && !shortCode ? (
            <div className="max-w-lg mx-auto">
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-6 text-center space-y-3">
                <p className="text-sm font-semibold text-foreground">
                  You've reached your free limit!
                </p>
                <p className="text-sm text-muted-foreground">
                  Create a free account to create unlimited links, track clicks, and use custom aliases.
                </p>
                <Button size="lg" asChild className="rounded-lg h-11 px-8 text-sm font-medium">
                  <Link to="/auth">
                    Create a free account
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>
          ) : !shortCode ? (
            <div className="max-w-lg mx-auto space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="https://example.com/my-long-url"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      setError("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleShorten()}
                    className="pl-10 h-12 bg-background border-input rounded-lg text-sm"
                  />
                </div>
                <Button
                  onClick={handleShorten}
                  disabled={isLoading}
                  className="h-12 px-6 rounded-lg font-medium text-sm shrink-0"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-1.5" />
                      Shorten
                    </>
                  )}
                </Button>
              </div>
              {error && <p className="text-sm text-destructive text-left">{error}</p>}
              <p className="text-xs text-muted-foreground">{ANON_LIMIT - anonCount} free link{ANON_LIMIT - anonCount !== 1 ? "s" : ""} remaining</p>
            </div>
          ) : (
            <div className="max-w-lg mx-auto space-y-4">
              {/* Result */}
              <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                <p className="text-xs text-muted-foreground">Your shortened link</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm font-medium text-foreground bg-background rounded-md px-3 py-2 border border-input truncate">
                    {window.location.origin}/{shortCode}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopy}
                    className="shrink-0 h-9 w-9 rounded-lg"
                  >
                    {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <button
                  onClick={handleReset}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Shorten another link
                </button>
              </div>

              {/* Upsell CTA */}
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-center space-y-2">
                <p className="text-sm font-semibold text-foreground">
                  {limitReached
                    ? "You've reached your free limit!"
                    : "Want to track clicks and add UTM parameters?"}
                </p>
                {limitReached && (
                  <p className="text-xs text-muted-foreground">
                    Create a free account to create unlimited links, track clicks, and use custom aliases.
                  </p>
                )}
                <Button size="sm" asChild className="rounded-lg h-9 text-sm">
                  <Link to="/auth">
                    Create a free account
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>© 2026 LinkJoy. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
