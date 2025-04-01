import { notFound } from "@/lib/Shared/infrastructure/hono/middlewares/notFound";
import { onError } from "@/lib/Shared/infrastructure/hono/middlewares/onError";
import { Hono } from "hono";

export const createRouter = () => {
  return new Hono().basePath("/api/v1/");
};

export const createApp = () => {
  const app = createRouter();

  app.notFound(notFound);
  app.onError(onError);

  return app;
};
