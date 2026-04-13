import { useEffect, useState, useCallback } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Link = Tables<"links">;

interface LinksTableProps {
  refreshSignal?: number;
}

const LinksTable = ({ refreshSignal }: LinksTableProps) => {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  console.log("[LinksTable] Render state:", { count: links.length, loading, refreshSignal });

  const fetchLinks = useCallback(async () => {
    console.log("[LinksTable] Fetching links from database...");
    setLoading(true);

    const { data, error } = await supabase
      .from("links")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[LinksTable] Fetch error:", error);
      toast.error("Failed to load links.");
      setLoading(false);
      return;
    }

    console.log("[LinksTable] Fetched links:", data?.length);
    setLinks(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks, refreshSignal]);

  const handleCopy = async (shortCode: string, linkId: string) => {
    const url = `${window.location.origin}/${shortCode}`;
    console.log("[LinksTable] Copying:", url);

    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(linkId);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("[LinksTable] Copy failed:", err);
      toast.error("Failed to copy");
    }
  };

  const truncateUrl = (url: string, max = 40): string => {
    if (url.length <= max) return url;
    return url.slice(0, max) + "…";
  };

  if (loading) {
    return (
      <div className="w-full py-12 text-center">
        <p className="text-sm text-muted-foreground">Loading links…</p>
      </div>
    );
  }

  if (links.length === 0) {
    return (
      <div className="w-full py-12 text-center">
        <p className="text-sm text-muted-foreground">No links yet. Create your first one above!</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h2 className="text-sm font-semibold text-foreground mb-3">Recent Links</h2>
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-medium text-muted-foreground">Original URL</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">Short Link</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">Campaign</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground text-right">Clicks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {links.map((link) => (
              <TableRow key={link.id} className="group">
                <TableCell className="max-w-[200px]">
                  <a
                    href={link.original_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-foreground hover:text-primary transition-colors flex items-center gap-1.5 truncate"
                    title={link.original_url}
                  >
                    <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                    <span className="truncate">{truncateUrl(link.original_url)}</span>
                  </a>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <code className="text-sm text-foreground font-medium">
                      /{link.short_code}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleCopy(link.short_code, link.id)}
                    >
                      {copiedId === link.id ? (
                        <Check className="h-3 w-3 text-success" />
                      ) : (
                        <Copy className="h-3 w-3 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  {link.utm_campaign ? (
                    <Badge variant="secondary" className="text-xs font-normal">
                      {link.utm_campaign}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-sm font-medium text-foreground tabular-nums">
                    {link.clicks_count}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default LinksTable;
