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
});

const { data: env, error } = ZodEnvSchema.safeParse(process.env);

if (error) {
  console.error("Invalid env:");
  console.error(JSON.stringify(error.flatten().fieldErrors, null, 2));

  process.exit(1);
}

export { env };
