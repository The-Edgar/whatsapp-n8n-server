import path from "node:path";
import { config } from "dotenv";
import { expand } from "dotenv-expand";
import { z } from "zod";

expand(
  config({
    path: path.resolve(
      process.cwd(),
      process.env.NODE_ENV === "test" ? ".env.test" : ".env",
    ),
  }),
);

const ZodEnvSchema = z.object({
  NODE_ENV: z.string().min(1).max(12).default("development"),
  PORT: z.string().min(1).max(5).default("9999"),
  API_KEY: z.string(),
  BROADCAST_DELAY_MS: z.string().min(1).max(5).default("1500"),
  N8N_WEBHOOK_URL_TEST: z.string().url().optional(),
  N8N_WEBHOOK_URL_PROD: z.string().url().optional(),
});

const { data: env, error } = ZodEnvSchema.safeParse(process.env);

if (error) {
  console.error("Invalid env:");
  console.error(JSON.stringify(error.flatten().fieldErrors, null, 2));

  process.exit(1);
}

/**
 * Get the appropriate webhook URL based on NODE_ENV
 * - test: uses N8N_WEBHOOK_URL_TEST
 * - production: uses N8N_WEBHOOK_URL_PROD
 * - development: uses N8N_WEBHOOK_URL_TEST (for safe testing)
 */
const n8nWebhookUrl =
  env.NODE_ENV === "production"
    ? env.N8N_WEBHOOK_URL_PROD
    : env.N8N_WEBHOOK_URL_TEST;

export { env, n8nWebhookUrl };
