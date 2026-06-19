import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const RedirectPage = () => {
  const { shortCode } = useParams<{ shortCode: string }>();
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!shortCode) {
      console.error("[RedirectPage] No short_code in URL params");
      setNotFound(true);
      return;
    }

    const handleRedirect = async () => {
      console.log("[RedirectPage] Looking up short_code:", shortCode);

      const { data, error } = await supabase
        .from("links")
        .select("*")
        .eq("short_code", shortCode)
        .maybeSingle();

      if (error) {
        console.error("[RedirectPage] DB query error:", error);
        setNotFound(true);
        return;
      }

      if (!data) {
        console.warn("[RedirectPage] No link found for short_code:", shortCode);
        setNotFound(true);
        return;
      }

      console.log("[RedirectPage] Link found:", data);

      // Build destination URL with UTM params
      let finalUrl: string;
      try {
        const url = new URL(data.original_url);
        const utmParams: [string, string | null][] = [
          ["utm_source", data.utm_source],
          ["utm_medium", data.utm_medium],
          ["utm_campaign", data.utm_campaign],
          ["utm_term", data.utm_term],
          ["utm_content", data.utm_content],
        ];

        utmParams.forEach(([key, value]) => {
          if (value) {
            url.searchParams.set(key, value);
          }
        });

        finalUrl = url.toString();
      } catch {
        console.error("[RedirectPage] Invalid original_url in DB:", data.original_url);
        setNotFound(true);
        return;
      }

      console.log("[RedirectPage] Final redirect URL:", finalUrl);

      // Increment clicks (fire-and-forget)
      supabase.rpc("increment_clicks", { p_short_code: shortCode }).then(({ error: rpcError }) => {
        if (rpcError) {
          console.error("[RedirectPage] Failed to increment clicks:", rpcError);
        }
      });

      // Redirect
      window.location.href = finalUrl;
    };

    handleRedirect();
  }, [shortCode]);

  if (notFound) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <h1 className="text-5xl font-bold text-foreground">404</h1>
          <p className="text-lg text-muted-foreground">This short link doesn't exist.</p>
          <a href="/" className="inline-block mt-4 text-sm text-primary hover:underline">
            ← Back to LinkJoy
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
        <p className="text-sm text-muted-foreground">Redirecting…</p>
      </div>
    </div>
  );
};

export default RedirectPage;
