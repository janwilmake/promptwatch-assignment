import { parse } from "csv-parse/sync";
import { z } from "zod";
import { router, publicProcedure } from "../trpc.js";
import { validateAndParseCsvRows } from "../lib/csv-validation.js";

export const uploadRouter = router({
  upload: publicProcedure
    .input(z.object({ content: z.string(), filename: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const raw: Record<string, string>[] = parse(input.content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      const { valid, invalid } = validateAndParseCsvRows(raw);

      let inserted = 0;
      if (valid.length > 0) {
        const result = await ctx.prisma.urlRecord.createMany({ data: valid, skipDuplicates: true });
        inserted = result.count;
      }

      return {
        filename: input.filename,
        rowCount: inserted,
        duplicates: valid.length - inserted,
        skipped: invalid.length,
        errors: invalid,
      };
    }),
});
