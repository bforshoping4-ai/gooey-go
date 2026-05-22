import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { UAParser } from "npm:ua-parser-js@1.0.37";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { short_code } = await req.json();
    if (!short_code || typeof short_code !== "string") {
      return new Response(JSON.stringify({ error: "short_code required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: link, error } = await supabase
      .from("links")
      .select("*")
      .eq("short_code", short_code)
      .maybeSingle();

    if (error || !link) {
      return new Response(JSON.stringify({ error: "not_found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build final URL with UTM
    let finalUrl = link.original_url;
    try {
      const u = new URL(link.original_url);
      const utm: [string, string | null][] = [
        ["utm_source", link.utm_source],
        ["utm_medium", link.utm_medium],
        ["utm_campaign", link.utm_campaign],
        ["utm_term", link.utm_term],
        ["utm_content", link.utm_content],
      ];
      utm.forEach(([k, v]) => v && u.searchParams.set(k, v));
      finalUrl = u.toString();
    } catch (_) {
      // fall back to original
    }

    // Extract metadata
    const ua = req.headers.get("user-agent") || "";
    const referrer = req.headers.get("referer") || null;
    const country =
      req.headers.get("cf-ipcountry") ||
      req.headers.get("x-vercel-ip-country") ||
      null;
    const city =
      req.headers.get("cf-ipcity") ||
      req.headers.get("x-vercel-ip-city") ||
      null;

    const parser = new UAParser(ua);
    const result = parser.getResult();
    const deviceType = result.device.type || "desktop"; // mobile/tablet/desktop
    const browser = result.browser.name || null;
    const os = result.os.name || null;

    // Fire-and-forget logging (don't block redirect)
    const logPromise = Promise.all([
      supabase.from("clicks").insert({
        link_id: link.id,
        ip_country: country,
        ip_city: city,
        device_type: deviceType,
        browser,
        os,
        referrer,
        user_agent: ua.slice(0, 500),
      }),
      supabase.rpc("increment_clicks", { p_short_code: short_code }),
    ]);

    // Wait briefly so we don't lose the write, but cap it
    await Promise.race([
      logPromise,
      new Promise((r) => setTimeout(r, 800)),
    ]);

    return new Response(JSON.stringify({ final_url: finalUrl }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[track-click] error:", e);
    return new Response(JSON.stringify({ error: "internal_error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
