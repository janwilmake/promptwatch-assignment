export type Sentiment = "positive" | "negative" | "neutral";

export interface ValidRow {
  url: string;
  title: string;
  aiModelMentioned: string;
  citationsCount: number;
  sentiment: Sentiment;
  visibilityScore: number;
  competitorMentioned: string;
  queryCategory: string;
  lastUpdated: Date;
  trafficEstimate: number;
  domainAuthority: number;
  mentionsCount: number;
  positionInResponse: number;
  responseType: string;
  geographicRegion: string;
}

export interface InvalidRow {
  row: number;
  reason: string;
}

export interface ValidationResult {
  valid: ValidRow[];
  invalid: InvalidRow[];
}

function toSentiment(s: string): Sentiment {
  const v = s.trim().toLowerCase();
  if (v === "positive" || v === "negative" || v === "neutral") return v;
  return "neutral";
}

function parseIntSafe(s: string): number | null {
  const n = parseInt(s?.trim() ?? "", 10);
  return isNaN(n) ? null : n;
}

function parseFloatSafe(s: string): number | null {
  const n = parseFloat(s?.trim() ?? "");
  return isNaN(n) ? null : n;
}

export function isValidUrl(s: string): boolean {
  try {
    const { protocol } = new URL(s.trim());
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

export function sanitizeString(s: string | undefined): string {
  return (s ?? "").trim();
}

export function validateAndParseCsvRows(
  raw: Record<string, string>[]
): ValidationResult {
  const valid: ValidRow[] = [];
  const invalid: InvalidRow[] = [];

  for (let i = 0; i < raw.length; i++) {
    const row = raw[i];
    const rowNum = i + 1;
    const errors: string[] = [];

    const url = sanitizeString(row.url);
    const title = sanitizeString(row.title);

    if (!url) {
      errors.push("missing url");
    } else if (!isValidUrl(url)) {
      errors.push(`invalid url: "${url}"`);
    }

    if (!title) errors.push("missing title");

    const citationsCount = parseIntSafe(row.citations_count);
    if (citationsCount === null || citationsCount < 0)
      errors.push("invalid citations_count");

    const visibilityScore = parseFloatSafe(row.visibility_score);
    if (visibilityScore === null) errors.push("invalid visibility_score");

    const lastUpdated = new Date(sanitizeString(row.last_updated));
    if (isNaN(lastUpdated.getTime())) errors.push("invalid last_updated date");

    const trafficEstimate = parseIntSafe(row.traffic_estimate);
    if (trafficEstimate === null) errors.push("invalid traffic_estimate");

    const domainAuthority = parseIntSafe(row.domain_authority);
    if (domainAuthority === null) errors.push("invalid domain_authority");

    const mentionsCount = parseIntSafe(row.mentions_count);
    if (mentionsCount === null) errors.push("invalid mentions_count");

    const positionInResponse = parseIntSafe(row.position_in_response);
    if (positionInResponse === null) errors.push("invalid position_in_response");

    if (errors.length > 0) {
      invalid.push({ row: rowNum, reason: errors.join("; ") });
      continue;
    }

    valid.push({
      url,
      title,
      aiModelMentioned: sanitizeString(row.ai_model_mentioned),
      citationsCount: citationsCount!,
      sentiment: toSentiment(row.sentiment ?? ""),
      visibilityScore: visibilityScore!,
      competitorMentioned: sanitizeString(row.competitor_mentioned),
      queryCategory: sanitizeString(row.query_category),
      lastUpdated,
      trafficEstimate: trafficEstimate!,
      domainAuthority: domainAuthority!,
      mentionsCount: mentionsCount!,
      positionInResponse: positionInResponse!,
      responseType: sanitizeString(row.response_type),
      geographicRegion: sanitizeString(row.geographic_region),
    });
  }

  return { valid, invalid };
}
