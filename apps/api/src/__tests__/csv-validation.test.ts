import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  validateAndParseCsvRows,
  isValidUrl,
  sanitizeString,
} from "../lib/csv-validation.js";

const validRow = {
  url: "https://example.com/page",
  title: "Example Page",
  ai_model_mentioned: "GPT-4",
  citations_count: "3",
  sentiment: "positive",
  visibility_score: "82.5",
  competitor_mentioned: "Competitor A",
  query_category: "research",
  last_updated: "2024-01-15",
  traffic_estimate: "12000",
  domain_authority: "72",
  mentions_count: "5",
  position_in_response: "1",
  response_type: "answer",
  geographic_region: "US",
};

describe("isValidUrl", () => {
  it("accepts http and https URLs", () => {
    assert.equal(isValidUrl("https://example.com"), true);
    assert.equal(isValidUrl("http://foo.bar/baz"), true);
  });

  it("rejects non-http protocols", () => {
    assert.equal(isValidUrl("ftp://example.com"), false);
    assert.equal(isValidUrl("javascript:alert(1)"), false);
  });

  it("rejects malformed strings", () => {
    assert.equal(isValidUrl("not-a-url"), false);
    assert.equal(isValidUrl(""), false);
  });
});

describe("sanitizeString", () => {
  it("trims surrounding whitespace", () => {
    assert.equal(sanitizeString("  hello  "), "hello");
  });

  it("returns empty string for undefined", () => {
    assert.equal(sanitizeString(undefined), "");
  });
});

describe("validateAndParseCsvRows", () => {
  it("parses a valid row correctly", () => {
    const { valid, invalid } = validateAndParseCsvRows([validRow]);
    assert.equal(valid.length, 1);
    assert.equal(invalid.length, 0);
    assert.equal(valid[0].url, "https://example.com/page");
    assert.equal(valid[0].citationsCount, 3);
    assert.equal(valid[0].visibilityScore, 82.5);
    assert.equal(valid[0].sentiment, "positive");
  });

  it("rejects a row with missing url", () => {
    const { valid, invalid } = validateAndParseCsvRows([{ ...validRow, url: "" }]);
    assert.equal(valid.length, 0);
    assert.equal(invalid.length, 1);
    assert.ok(invalid[0].reason.includes("missing url"));
  });

  it("rejects a row with invalid url", () => {
    const { valid, invalid } = validateAndParseCsvRows([{ ...validRow, url: "not-a-url" }]);
    assert.equal(valid.length, 0);
    assert.equal(invalid.length, 1);
    assert.ok(invalid[0].reason.includes("invalid url"));
  });

  it("rejects a row with non-numeric citations_count", () => {
    const { valid, invalid } = validateAndParseCsvRows([
      { ...validRow, citations_count: "abc" },
    ]);
    assert.equal(valid.length, 0);
    assert.equal(invalid.length, 1);
    assert.ok(invalid[0].reason.includes("citations_count"));
  });

  it("rejects a row with invalid date", () => {
    const { valid, invalid } = validateAndParseCsvRows([
      { ...validRow, last_updated: "not-a-date" },
    ]);
    assert.equal(valid.length, 0);
    assert.equal(invalid.length, 1);
    assert.ok(invalid[0].reason.includes("last_updated"));
  });

  it("defaults unknown sentiment to neutral", () => {
    const { valid } = validateAndParseCsvRows([{ ...validRow, sentiment: "unknown" }]);
    assert.equal(valid.length, 1);
    assert.equal(valid[0].sentiment, "neutral");
  });

  it("collects multiple errors per row", () => {
    const { invalid } = validateAndParseCsvRows([
      { ...validRow, url: "", citations_count: "bad" },
    ]);
    assert.equal(invalid.length, 1);
    assert.ok(invalid[0].reason.includes("missing url"));
    assert.ok(invalid[0].reason.includes("citations_count"));
  });

  it("reports correct row numbers for invalid rows", () => {
    const { invalid } = validateAndParseCsvRows([
      validRow,
      { ...validRow, url: "" },
      validRow,
      { ...validRow, title: "" },
    ]);
    assert.equal(invalid.length, 2);
    assert.equal(invalid[0].row, 2);
    assert.equal(invalid[1].row, 4);
  });

  it("handles an empty array", () => {
    const { valid, invalid } = validateAndParseCsvRows([]);
    assert.equal(valid.length, 0);
    assert.equal(invalid.length, 0);
  });
});
