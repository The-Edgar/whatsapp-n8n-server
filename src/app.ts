import { env } from "@/lib/Shared/infrastructure/config/env";
import { createApp } from "@/lib/Shared/infrastructure/hono/createApp";
import { serve } from "@hono/node-server";

const app = createApp();

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

export { app };
