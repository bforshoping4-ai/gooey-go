import { useState, useCallback } from "react";
import { Link2, Sparkles, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateShortCode, buildUtmUrl, type UTMLinkData } from "@/lib/url-utils";
import { toast } from "sonner";

const INITIAL_FORM: UTMLinkData = {
  originalUrl: "",
  customAlias: "",
  utmSource: "",
  utmMedium: "",
  utmCampaign: "",
  utmTerm: "",
  utmContent: "",
};

const UTM_FIELDS: { key: keyof UTMLinkData; label: string; placeholder: string }[] = [
  { key: "utmSource", label: "Source", placeholder: "e.g. google, newsletter" },
  { key: "utmMedium", label: "Medium", placeholder: "e.g. cpc, email, social" },
  { key: "utmCampaign", label: "Campaign", placeholder: "e.g. summer_sale" },
  { key: "utmTerm", label: "Term", placeholder: "e.g. running+shoes" },
  { key: "utmContent", label: "Content", placeholder: "e.g. banner_v2" },
];

const LinkBuilderForm = () => {
  const [form, setForm] = useState<UTMLinkData>(INITIAL_FORM);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [shortCode, setShortCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showUtm, setShowUtm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  console.log("[LinkBuilderForm] Render state:", { form, generatedLink, shortCode, showUtm });

  const updateField = useCallback((key: keyof UTMLinkData, value: string) => {
    console.log(`[LinkBuilderForm] Updating field: ${key} =`, value);
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const validate = (): boolean => {
    console.log("[LinkBuilderForm] Validating form...");
    const newErrors: Record<string, string> = {};

    if (!form.originalUrl.trim()) {
      newErrors.originalUrl = "URL is required";
    } else {
      try {
        new URL(form.originalUrl);
      } catch {
        newErrors.originalUrl = "Enter a valid URL (e.g. https://example.com)";
      }
    }

    if (form.customAlias && !/^[a-zA-Z0-9_-]+$/.test(form.customAlias)) {
      newErrors.customAlias = "Only letters, numbers, hyphens, and underscores";
    }

    setErrors(newErrors);
    console.log("[LinkBuilderForm] Validation result:", Object.keys(newErrors).length === 0 ? "PASS" : newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGenerate = () => {
    console.log("[LinkBuilderForm] Generate button clicked");

    if (!validate()) return;

    try {
      const utmUrl = buildUtmUrl(form);
      const code = form.customAlias.trim() || generateShortCode();

      console.log("[LinkBuilderForm] Generated short code:", code);
      console.log("[LinkBuilderForm] UTM URL:", utmUrl);

      setGeneratedLink(utmUrl);
      setShortCode(code);
      setCopied(false);

      toast.success("Link generated successfully!");
      console.log("[LinkBuilderForm] Link generation complete");
    } catch (err) {
      console.error("[LinkBuilderForm] Error generating link:", err);
      toast.error("Failed to generate link. Check your URL.");
    }
  };

  const handleCopy = async () => {
    if (!generatedLink || !shortCode) return;
    const textToCopy = `short.link/${shortCode}`;
    console.log("[LinkBuilderForm] Copying to clipboard:", textToCopy);

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("[LinkBuilderForm] Clipboard copy failed:", err);
      toast.error("Failed to copy");
    }
  };

  const handleReset = () => {
    console.log("[LinkBuilderForm] Resetting form");
    setForm(INITIAL_FORM);
    setGeneratedLink(null);
    setShortCode(null);
    setCopied(false);
    setErrors({});
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      {/* URL Input */}
      <div className="space-y-2">
        <Label htmlFor="originalUrl" className="text-sm font-medium text-foreground">
          Destination URL
        </Label>
        <div className="relative">
          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="originalUrl"
            placeholder="https://example.com/my-long-url"
            value={form.originalUrl}
            onChange={(e) => updateField("originalUrl", e.target.value)}
            className="pl-10 h-11 bg-background border-input rounded-lg text-sm"
          />
        </div>
        {errors.originalUrl && (
          <p className="text-sm text-destructive">{errors.originalUrl}</p>
        )}
      </div>

      {/* Custom Alias */}
      <div className="space-y-2">
        <Label htmlFor="customAlias" className="text-sm font-medium text-foreground">
          Custom Alias <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">short.link/</span>
          <Input
            id="customAlias"
            placeholder="my-custom-alias"
            value={form.customAlias}
            onChange={(e) => updateField("customAlias", e.target.value)}
            className="h-11 bg-background border-input rounded-lg text-sm"
          />
        </div>
        {errors.customAlias && (
          <p className="text-sm text-destructive">{errors.customAlias}</p>
        )}
      </div>

      {/* UTM Toggle */}
      <button
        type="button"
        onClick={() => {
          console.log("[LinkBuilderForm] Toggling UTM section:", !showUtm);
          setShowUtm(!showUtm);
        }}
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        {showUtm ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        UTM Parameters
      </button>

      {/* UTM Fields */}
      {showUtm && (
        <div className="space-y-4 rounded-lg border border-border bg-surface-elevated p-4">
          {UTM_FIELDS.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <Label htmlFor={field.key} className="text-sm font-medium text-foreground">
                {field.label}
              </Label>
              <Input
                id={field.key}
                placeholder={field.placeholder}
                value={form[field.key]}
                onChange={(e) => updateField(field.key, e.target.value)}
                className="h-10 bg-background border-input rounded-lg text-sm"
              />
            </div>
          ))}
        </div>
      )}

      {/* Generate Button */}
      <Button
        onClick={handleGenerate}
        className="w-full h-11 rounded-lg font-medium text-sm"
        size="lg"
      >
        <Sparkles className="h-4 w-4 mr-2" />
        Generate Short Link
      </Button>

      {/* Result */}
      {generatedLink && shortCode && (
        <div className="rounded-lg border border-border bg-surface-elevated p-4 space-y-3">
          <p className="text-xs text-muted-foreground">Your shortened link</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm font-medium text-foreground bg-background rounded-md px-3 py-2 border border-input truncate">
              short.link/{shortCode}
            </code>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopy}
              className="shrink-0 h-9 w-9 rounded-lg"
            >
              {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground truncate">
            → {generatedLink}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Create another link
          </Button>
        </div>
      )}
    </div>
  );
};

export default LinkBuilderForm;
