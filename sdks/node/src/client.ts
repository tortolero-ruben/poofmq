/**
 * poofMQ Node.js SDK client. Push/pop queue operations with optional client-side encryption.
 * Uses the OpenAPI-generated client and types as the single source of truth.
 */

import { Configuration } from "../generated/runtime.js";
import { QueueServiceApi } from "../generated/apis/QueueServiceApi.js";
import type {
  QueueServicePushBody,
  QueueServicePopBody,
  V1PayloadEnvelope,
  V1PushMessageResponse,
  V1PopMessageResponse,
  V1QueueMessage,
} from "../generated/models/index.js";
import { V1EncryptionMode } from "../generated/models/V1EncryptionMode.js";
import { encryptPayload } from "./encryption.js";

export type { V1PayloadEnvelope, V1PushMessageResponse, V1PopMessageResponse, V1QueueMessage };

export interface PoofmqClientOptions {
  baseUrl: string;
  /** API key or Bearer token for authenticated queues. Omit for sandbox/anonymous. */
  apiKey?: string;
}

export interface PushOptions {
  ttlSeconds?: number;
  availableAt?: Date;
  idempotencyKey?: string;
  /** If true and encryptionKey is set, encrypt payload client-side (zero-knowledge). */
  encrypt?: boolean;
  /** Secret for client-side encryption. Used when encrypt is true. */
  encryptionKey?: string;
}

export interface PopOptions {
  visibilityTimeoutSeconds?: number;
  waitTimeoutSeconds?: number;
  consumerId?: string;
}

export class PoofmqClient {
  private readonly api: QueueServiceApi;

  constructor(options: PoofmqClientOptions) {
    const { baseUrl, apiKey } = options;
    const headers: Record<string, string> = {};
    if (apiKey) {
      headers["Authorization"] = apiKey.startsWith("Bearer ") ? apiKey : `Bearer ${apiKey}`;
    }
    const config = new Configuration({
      basePath: baseUrl.replace(/\/+$/, ""),
      headers,
    });
    this.api = new QueueServiceApi(config);
  }

  /**
   * Push a message onto a queue. Supports plaintext and client-encrypted (zero-knowledge) flow.
   */
  async push(
    queueId: string,
    eventType: string,
    payload: object,
    options: PushOptions = {},
  ): Promise<V1PushMessageResponse> {
    let envelope: V1PayloadEnvelope;

    if (options.encrypt && options.encryptionKey) {
      const encrypted = encryptPayload(payload, options.encryptionKey);
      envelope = {
        eventType,
        payload: {},
        metadata: {},
        encryptionMode: V1EncryptionMode.ClientEncrypted,
        encryptionAlgorithm: encrypted.encryptionAlgorithm,
        encryptedPayload: encrypted.encryptedPayload,
        encryptionIv: encrypted.encryptionIv,
        encryptionAuthTag: encrypted.encryptionAuthTag,
      };
    } else {
      envelope = {
        eventType,
        payload,
        metadata: {},
        encryptionMode: V1EncryptionMode.Unencrypted,
      };
    }

    const body: QueueServicePushBody = {
      envelope,
      ttlSeconds: options.ttlSeconds,
      availableAt: options.availableAt,
      idempotencyKey: options.idempotencyKey,
    };

    return this.api.queueServicePush({ queueId, body });
  }

  /**
   * Pop a message from a queue. Returns null when the queue is empty.
   */
  async pop(queueId: string, options: PopOptions = {}): Promise<V1QueueMessage | null> {
    const body: QueueServicePopBody = {
      visibilityTimeoutSeconds: options.visibilityTimeoutSeconds,
      waitTimeoutSeconds: options.waitTimeoutSeconds,
      consumerId: options.consumerId,
    };

    const response: V1PopMessageResponse = await this.api.queueServicePop({ queueId, body });
    return response.message ?? null;
  }
}
