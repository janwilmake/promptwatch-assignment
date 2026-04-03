import { z } from "zod";
import { router, publicProcedure } from "../trpc.js";

export const urlsRouter = router({
  list: publicProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
        sortBy: z
          .enum([
            "lastUpdated",
            "visibilityScore",
            "citationsCount",
            "mentionsCount",
            "createdAt"
          ])
          .default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
        search: z.string().optional(),
        aiModel: z.string().optional(),
        sentiment: z.enum(["positive", "negative", "neutral"]).optional()
      })
    )
    .query(async ({ input, ctx }) => {
      const { page, pageSize, sortBy, sortOrder, search, aiModel, sentiment } =
        input;

      const where = {
        ...(search && {
          OR: [
            { url: { contains: search, mode: "insensitive" as const } },
            { title: { contains: search, mode: "insensitive" as const } }
          ]
        }),
        ...(aiModel && { aiModelMentioned: aiModel }),
        ...(sentiment && { sentiment })
      };

      const [rows, total] = await Promise.all([
        ctx.prisma.urlRecord.findMany({
          where,
          orderBy: { [sortBy]: sortOrder },
          skip: (page - 1) * pageSize,
          take: pageSize
        }),
        ctx.prisma.urlRecord.count({ where })
      ]);

      return { rows, total, page, pageSize };
    }),

  byDomain: publicProcedure.query(async ({ ctx }) => {
    const records = await ctx.prisma.urlRecord.findMany({
      select: { url: true }
    });

    const counts: Record<string, number> = {};
    for (const { url } of records) {
      try {
        const domain = new URL(url).hostname.replace(/^www\./, "");
        counts[domain] = (counts[domain] ?? 0) + 1;
      } catch {
        // skip malformed URLs
      }
    }

    return Object.entries(counts)
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count);
  }),

  export: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        sentiment: z.enum(["positive", "negative", "neutral"]).optional(),
        aiModel: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { search, sentiment, aiModel } = input;

      const where = {
        ...(search && {
          OR: [
            { url: { contains: search, mode: "insensitive" as const } },
            { title: { contains: search, mode: "insensitive" as const } },
          ],
        }),
        ...(aiModel && { aiModelMentioned: aiModel }),
        ...(sentiment && { sentiment }),
      };

      const rows = await ctx.prisma.urlRecord.findMany({
        where,
        orderBy: { createdAt: "desc" },
      });

      const escape = (s: string) => `"${String(s).replace(/"/g, '""')}"`;

      const headers = [
        "url",
        "title",
        "ai_model_mentioned",
        "citations_count",
        "sentiment",
        "visibility_score",
        "competitor_mentioned",
        "query_category",
        "last_updated",
        "traffic_estimate",
        "domain_authority",
        "mentions_count",
        "position_in_response",
        "response_type",
        "geographic_region",
      ];

      const lines = [
        headers.join(","),
        ...rows.map((r) =>
          [
            escape(r.url),
            escape(r.title),
            escape(r.aiModelMentioned),
            r.citationsCount,
            r.sentiment,
            r.visibilityScore,
            escape(r.competitorMentioned),
            escape(r.queryCategory),
            r.lastUpdated.toISOString().slice(0, 10),
            r.trafficEstimate,
            r.domainAuthority,
            r.mentionsCount,
            r.positionInResponse,
            escape(r.responseType),
            escape(r.geographicRegion),
          ].join(",")
        ),
      ];

      return { csv: lines.join("\n"), count: rows.length };
    }),

  byDate: publicProcedure.query(async ({ ctx }) => {
    const records = await ctx.prisma.urlRecord.findMany({
      select: { lastUpdated: true },
      orderBy: { lastUpdated: "asc" }
    });

    const counts: Record<string, number> = {};
    for (const { lastUpdated } of records) {
      const date = lastUpdated.toISOString().slice(0, 10);
      counts[date] = (counts[date] ?? 0) + 1;
    }

    return Object.entries(counts).map(([date, count]) => ({ date, count }));
  })
});
