import { Hono } from "hono";
import { logger } from "hono/logger";
import { notFound } from "@/lib/Shared/infrastructure/hono/middlewares/notFound";
import { onError } from "@/lib/Shared/infrastructure/hono/middlewares/onError";
import { servicesMiddleware } from "@/lib/Shared/infrastructure/hono/middlewares/servicesMiddleware";
import { authMiddleware } from "./middlewares/authMiddleware";

export const createRouter = () => {
  return new Hono().basePath("/api/v1/");
};

export const createApp = () => {
  const app = createRouter();

  app.notFound(notFound);
  app.onError(onError);

  app.use("*", servicesMiddleware);
  app.use("*", authMiddleware);

  app.use(logger());

  return app;
};
