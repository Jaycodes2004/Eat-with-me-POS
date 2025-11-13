import { EventEmitter } from 'events';
import Redis from 'ioredis';

export interface LiveUpdatePayload {
  tenantId: string;
  event: string;
  data: unknown;
  timestamp: string;
}

class LiveUpdateBroker extends EventEmitter {
  private publisher: Redis | null = null;
  private subscriber: Redis | null = null;
  private channelPrefix = 'pos-live-updates';

  constructor() {
    super();
    this.setMaxListeners(50);
  }

  configureRedis(redisUrl?: string) {
    if (!redisUrl || this.publisher || this.subscriber) {
      return;
    }

    this.publisher = new Redis(redisUrl, { lazyConnect: true });
    this.subscriber = new Redis(redisUrl, { lazyConnect: true });

    this.subscriber.on('message', (_channel, message) => {
      try {
        const payload: LiveUpdatePayload = JSON.parse(message);
        this.emit(payload.tenantId, payload);
      } catch (error) {
        console.error('[LiveUpdates] Failed to parse message from Redis', error);
      }
    });
  }

  async subscribeToTenant(tenantId: string) {
    if (!this.subscriber) {
      return;
    }
    const channel = `${this.channelPrefix}:${tenantId}`;
    if (!(this.subscriber as any).subscriptions?.includes?.(channel)) {
      await this.subscriber.subscribe(channel);
    }
  }

  async publish(payload: LiveUpdatePayload, useRedis: boolean) {
    const channel = `${this.channelPrefix}:${payload.tenantId}`;

    if (useRedis && this.publisher) {
      try {
        await this.publisher.publish(channel, JSON.stringify(payload));
      } catch (error) {
        console.error('[LiveUpdates] Failed to publish via Redis', error);
      }
    }

    this.emit(payload.tenantId, payload);
  }
}

export const liveUpdateBroker = new LiveUpdateBroker();

export const liveUpdates = {
  configure(redisUrl?: string) {
    liveUpdateBroker.configureRedis(redisUrl);
  },
  async publish(tenantId: string, event: string, data: unknown, useRedis: boolean) {
    const payload: LiveUpdatePayload = {
      tenantId,
      event,
      data,
      timestamp: new Date().toISOString(),
    };
    if (useRedis) {
      await liveUpdateBroker.subscribeToTenant(tenantId);
    }
    await liveUpdateBroker.publish(payload, useRedis);
  },
  on(tenantId: string, listener: (payload: LiveUpdatePayload) => void) {
    liveUpdateBroker.on(tenantId, listener);
    return () => liveUpdateBroker.off(tenantId, listener);
  },
};
