import dotenv from "dotenv";
dotenv.config();

import { createApp } from "./app";
import { liveUpdates } from "./utils/liveUpdates";

const PORT = process.env.PORT || 4002;

(async () => {
  // Redis optional
  if (process.env.REDIS_URL) {
    liveUpdates.configure(process.env.REDIS_URL);
  }

  const app = await createApp();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})();
