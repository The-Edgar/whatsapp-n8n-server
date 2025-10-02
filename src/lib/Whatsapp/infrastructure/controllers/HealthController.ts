import type { Context } from "hono";
import type { Controller } from "@/lib/Shared/infrastructure/controllers/Controller";
import * as HttpStatusCodes from "@/lib/Shared/common/HttpStatusCodes";

export class HealthController implements Controller {
  async run(c: Context): Promise<Response> {
    return c.json(
      {
        status: "ok",
        service: "whatsapp-n8n-server",
        timestamp: new Date().toISOString(),
      },
      HttpStatusCodes.OK,
    );
  }
}
