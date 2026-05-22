import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const RedirectPage = () => {
  const { shortCode } = useParams<{ shortCode: string }>();
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!shortCode) {
      setNotFound(true);
      return;
    }

    const run = async () => {
      console.log("[RedirectPage] Invoking track-click for:", shortCode);
      const { data, error } = await supabase.functions.invoke("track-click", {
        body: { short_code: shortCode },
      });

      if (error || !data?.final_url) {
        console.error("[RedirectPage] track-click error:", error);
        setNotFound(true);
        return;
      }

      window.location.href = data.final_url;
    };

    run();
  }, [shortCode]);

  if (notFound) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <h1 className="text-5xl font-bold text-foreground">404</h1>
          <p className="text-lg text-muted-foreground">This short link doesn't exist.</p>
          <a href="/" className="inline-block mt-4 text-sm text-primary hover:underline">
            ← Back to Sniplink
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
