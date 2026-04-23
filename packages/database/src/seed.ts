import { prisma } from "./client";

(async () => {
  try {
    const count = await prisma.urlRecord.count();
    console.log(`UrlRecord table ready (${count} rows).`);
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
