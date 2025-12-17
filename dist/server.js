"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app_1 = require("./app");
const liveUpdates_1 = require("./utils/liveUpdates");
const PORT = process.env.PORT || 4002;
(async () => {
    // Redis optional
    if (process.env.REDIS_URL) {
        liveUpdates_1.liveUpdates.configure(process.env.REDIS_URL);
    }
    const app = await (0, app_1.createApp)();
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
})();
//# sourceMappingURL=server.js.map