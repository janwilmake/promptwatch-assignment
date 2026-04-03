import { router } from "../trpc";
import { helloRouter } from "./hello";
import { uploadRouter } from "./upload.js";
import { urlsRouter } from "./urls.js";

export const appRouter = router({
  hello: helloRouter,
  upload: uploadRouter,
  urls: urlsRouter,
});

export type AppRouter = typeof appRouter;
