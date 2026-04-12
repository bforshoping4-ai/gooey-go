import { nanoid } from "nanoid";

export const generateShortCode = (length: number = 7): string => {
  console.log("[generateShortCode] Generating random short code with length:", length);
  const code = nanoid(length);
  console.log("[generateShortCode] Generated code:", code);
  return code;
};

export interface UTMLinkData {
  originalUrl: string;
  customAlias: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm: string;
  utmContent: string;
}

export const buildUtmUrl = (data: UTMLinkData): string => {
  console.log("[buildUtmUrl] Building UTM URL with data:", data);

  let url: URL;
  try {
    url = new URL(data.originalUrl);
  } catch {
    console.error("[buildUtmUrl] Invalid URL provided:", data.originalUrl);
    throw new Error("Invalid URL");
  }

  const utmParams: [string, string][] = [
    ["utm_source", data.utmSource],
    ["utm_medium", data.utmMedium],
    ["utm_campaign", data.utmCampaign],
    ["utm_term", data.utmTerm],
    ["utm_content", data.utmContent],
  ];

  utmParams.forEach(([key, value]) => {
    if (value.trim()) {
      url.searchParams.set(key, value.trim());
      console.log(`[buildUtmUrl] Added param: ${key}=${value.trim()}`);
    }
  });

  const finalUrl = url.toString();
  console.log("[buildUtmUrl] Final URL:", finalUrl);
  return finalUrl;
};
