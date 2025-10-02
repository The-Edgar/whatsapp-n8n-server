import { serve } from "@hono/node-server";
import { env } from "@/lib/Shared/infrastructure/config/env";
import { createApp } from "@/lib/Shared/infrastructure/hono/createApp";
import { registerRoutes } from "@/lib/Shared/infrastructure/routes/registerRoutes";
import { initializeClient } from "@/lib/Whatsapp/infrastructure/WhatsappClient";

const app = createApp();

registerRoutes(app);

// Only initialize WhatsApp client if not in test mode
if (env?.NODE_ENV !== "test") {
  console.log("WhatsApp client initialization started");
  initializeClient();
}

// Only start server if not in test mode (tests will start their own server)
if (env?.NODE_ENV !== "test") {
  serve(
    {
      fetch: app.fetch,
      port: Number(env?.PORT),
    },
    (_info) => {
      env?.NODE_ENV === "development" &&
        console.log(`Server is running on http://localhost:${_info.port}`);
    },
  );
}

export { app };
