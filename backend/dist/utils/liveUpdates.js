"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.liveUpdates = exports.liveUpdateBroker = void 0;
const events_1 = require("events");
const ioredis_1 = __importDefault(require("ioredis"));
class LiveUpdateBroker extends events_1.EventEmitter {
    constructor() {
        super();
        this.publisher = null;
        this.subscriber = null;
        this.channelPrefix = 'pos-live-updates';
        this.setMaxListeners(50);
    }
    configureRedis(redisUrl) {
        if (!redisUrl || this.publisher || this.subscriber) {
            return;
        }
        this.publisher = new ioredis_1.default(redisUrl, { lazyConnect: true });
        this.subscriber = new ioredis_1.default(redisUrl, { lazyConnect: true });
        this.subscriber.on('message', (_channel, message) => {
            try {
                const payload = JSON.parse(message);
                this.emit(payload.tenantId, payload);
            }
            catch (error) {
                console.error('[LiveUpdates] Failed to parse message from Redis', error);
            }
        });
    }
    async subscribeToTenant(tenantId) {
        var _a, _b;
        if (!this.subscriber) {
            return;
        }
        const channel = `${this.channelPrefix}:${tenantId}`;
        if (!((_b = (_a = this.subscriber.subscriptions) === null || _a === void 0 ? void 0 : _a.includes) === null || _b === void 0 ? void 0 : _b.call(_a, channel))) {
            await this.subscriber.subscribe(channel);
        }
    }
    async publish(payload, useRedis) {
        const channel = `${this.channelPrefix}:${payload.tenantId}`;
        if (useRedis && this.publisher) {
            try {
                await this.publisher.publish(channel, JSON.stringify(payload));
            }
            catch (error) {
                console.error('[LiveUpdates] Failed to publish via Redis', error);
            }
        }
        this.emit(payload.tenantId, payload);
    }
}
exports.liveUpdateBroker = new LiveUpdateBroker();
exports.liveUpdates = {
    configure(redisUrl) {
        exports.liveUpdateBroker.configureRedis(redisUrl);
    },
    async publish(tenantId, event, data, useRedis) {
        const payload = {
            tenantId,
            event,
            data,
            timestamp: new Date().toISOString(),
        };
        if (useRedis) {
            await exports.liveUpdateBroker.subscribeToTenant(tenantId);
        }
        await exports.liveUpdateBroker.publish(payload, useRedis);
    },
    on(tenantId, listener) {
        exports.liveUpdateBroker.on(tenantId, listener);
        return () => exports.liveUpdateBroker.off(tenantId, listener);
    },
};
//# sourceMappingURL=liveUpdates.js.map