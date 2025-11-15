import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { liveUpdates } from './utils/liveUpdates';

const PORT = process.env.PORT || 4000;

if (process.env.REDIS_URL) {
  liveUpdates.configure(process.env.REDIS_URL);
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
