import { notFound } from "@/lib/Shared/infrastructure/hono/middlewares/notFound";
import { onError } from "@/lib/Shared/infrastructure/hono/middlewares/onError";
import { servicesMiddleware } from "@/lib/Shared/infrastructure/hono/middlewares/servicesMiddleware";
import { Hono } from "hono";
import { logger } from "hono/logger";

export const createRouter = () => {
  return new Hono().basePath("/api/v1/");
};

export const createApp = () => {
  const app = createRouter();

  app.notFound(notFound);
  app.onError(onError);

  app.use("*", servicesMiddleware);

  app.use(logger());

  return app;
};
