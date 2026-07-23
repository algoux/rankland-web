import { Inject, Provide } from 'bwcx-core';
import { length as hasLength } from 'class-validator';
import RedisConfig from '@server/configs/redis/redis.config';
import { RedisClientId, RedisSubscriberClientId } from '@server/container-ids';
import type { ContestCommittedWatermark } from './contest-event-watermark';
import type { ContestEventCacheControl } from './contest-event-cache-control';
export type { ContestEventCacheControl } from './contest-event-cache-control';

const CONTEST_EVENT_NOTIFICATION_SCHEMA_VERSION = 1;
const CONTEST_EVENT_NOTIFICATION_MAX_BYTES = 4 * 1024;
const CONTEST_EVENT_CACHE_CONTROL_SCHEMA_VERSION = 1;
const CONTEST_EVENT_CACHE_CONTROL_MAX_BYTES = 4 * 1024;
const CONTEST_EVENT_NOTIFICATION_ERROR_LOG_INTERVAL_MS = 30_000;
const MYSQL_BIGINT_UNSIGNED_MAX = 18_446_744_073_709_551_615n;
const ENVELOPE_KEYS = ['schemaVersion', 'contestId', 'uk', 'latestEventId', 'streamRevision'] as const;
const DELETE_CONTROL_ENVELOPE_KEYS = ['schemaVersion', 'type', 'contestId', 'uk'] as const;
const METADATA_CONTROL_ENVELOPE_KEYS = ['schemaVersion', 'type', 'contestId', 'uk', 'visibilityFingerprint'] as const;

export const CONTEST_EVENT_NOTIFICATION_PUBLISH_TIMEOUT_MS = 500;

export interface RedisPublisherPort {
  status: string;
  publish: (channel: string, message: string) => Promise<number>;
}

export interface RedisSubscriberPort {
  status: string;
  connect: () => Promise<unknown>;
  subscribe: (...channels: string[]) => Promise<number>;
  disconnect: (reconnect: boolean) => void;
  on: (event: string, listener: (...args: any[]) => void) => unknown;
  removeListener: (event: string, listener: (...args: any[]) => void) => unknown;
}

export type ContestEventNotificationPublishResult =
  | { status: 'published'; receiverCount: number }
  | { status: 'skipped'; reason: 'not-ready' }
  | { status: 'failed'; reason: 'timeout' }
  | { status: 'failed'; reason: 'error'; errorClass: string };

export type ContestEventNotificationRedisState =
  | 'idle'
  | 'connecting'
  | 'subscribing'
  | 'subscribed'
  | 'degraded'
  | 'stopping'
  | 'stopped';

export interface ContestEventNotificationRedisCallbacks {
  onWatermark: (watermark: ContestCommittedWatermark) => void | Promise<void>;
  onControl?: (control: ContestEventCacheControl) => void | Promise<void>;
  onSubscribed: () => void | Promise<void>;
}

interface ContestEventNotificationEnvelopeV1 {
  schemaVersion: 1;
  contestId: string;
  uk: string;
  latestEventId: number;
  streamRevision: number;
}

interface ContestEventCacheDeleteControlEnvelopeV1 {
  schemaVersion: 1;
  type: 'delete';
  contestId: string;
  uk: string;
}

interface ContestEventCacheMetadataControlEnvelopeV1 {
  schemaVersion: 1;
  type: 'metadata';
  contestId: string;
  uk: string;
  visibilityFingerprint: string;
}

type ContestEventCacheControlEnvelopeV1 =
  | ContestEventCacheDeleteControlEnvelopeV1
  | ContestEventCacheMetadataControlEnvelopeV1;

interface FailureLogState {
  degraded: boolean;
  lastLogAt?: number;
  suppressedCount: number;
}

export type ContestEventNotificationEnvelopeParseResult =
  | { ok: true; watermark: ContestCommittedWatermark }
  | { ok: false; reason: 'too-large' | 'invalid-json' | 'invalid-envelope' };

export type ContestEventCacheControlEnvelopeParseResult =
  | { ok: true; control: ContestEventCacheControl }
  | { ok: false; reason: 'too-large' | 'invalid-json' | 'invalid-envelope' };

@Provide()
export default class ContestEventNotificationRedisAdapter {
  private readonly channel: string;
  private readonly controlChannel: string;
  private state: ContestEventNotificationRedisState = 'idle';
  private callbacks?: ContestEventNotificationRedisCallbacks;
  private started = false;
  private terminal = false;
  private generation = 0;
  private readonly publisherFailures = createFailureLogState();
  private readonly controlPublisherFailures = createFailureLogState();
  private readonly subscriberFailures = createFailureLogState();
  private readonly invalidMessages = createFailureLogState();
  private readonly invalidControlMessages = createFailureLogState();

  private readonly readyListener = () => this.handleReady();
  private readonly messageListener = (channel: string, message: string) => {
    this.handleMessage(channel, message);
  };
  private readonly errorListener = (error: unknown) => this.handleConnectionFailure('error', error);
  private readonly closeListener = () => this.handleConnectionClosed();
  private readonly endListener = () => this.handleConnectionFailure('end');

  public constructor(
    @Inject(RedisClientId)
    private readonly publisher: RedisPublisherPort,
    @Inject(RedisSubscriberClientId)
    private readonly subscriber: RedisSubscriberPort,
    @Inject(RedisConfig)
    config: RedisConfig,
  ) {
    this.channel = buildContestEventNotificationChannel(config.namespace);
    this.controlChannel = buildContestEventCacheControlChannel(config.namespace);
  }

  public getState(): ContestEventNotificationRedisState {
    return this.state;
  }

  public start(callbacks: ContestEventNotificationRedisCallbacks): Promise<void> {
    if (this.started || this.terminal) {
      return Promise.resolve();
    }
    this.started = true;
    this.callbacks = callbacks;
    this.attachListeners();
    this.transitionTo('connecting');

    if (this.subscriber.status === 'ready') {
      this.handleReady();
    } else if (this.subscriber.status === 'wait' || this.subscriber.status === 'end') {
      this.connectInBackground();
    }
    return Promise.resolve();
  }

  public async publish(watermark: ContestCommittedWatermark): Promise<ContestEventNotificationPublishResult> {
    return this.publishEnvelope(
      this.channel,
      () => serializeContestEventNotificationEnvelope(watermark),
      this.publisherFailures,
      'contest_event_notification',
    );
  }

  public async publishControl(control: ContestEventCacheControl): Promise<ContestEventNotificationPublishResult> {
    return this.publishEnvelope(
      this.controlChannel,
      () => serializeContestEventCacheControlEnvelope(control),
      this.controlPublisherFailures,
      'contest_event_cache_control',
    );
  }

  private async publishEnvelope(
    channel: string,
    serialize: () => string,
    failures: FailureLogState,
    logPrefix: 'contest_event_notification' | 'contest_event_cache_control',
  ): Promise<ContestEventNotificationPublishResult> {
    if (this.publisher.status !== 'ready') {
      const result = { status: 'skipped', reason: 'not-ready' } as const;
      this.logFailure(failures, `${logPrefix}.publish_failed`, {
        channel,
        reason: result.reason,
        publisherStatus: this.publisher.status,
      });
      return result;
    }

    let message: string;
    try {
      message = serialize();
    } catch (error) {
      const result = {
        status: 'failed',
        reason: 'error',
        errorClass: getErrorClass(error),
      } as const;
      this.logFailure(failures, `${logPrefix}.publish_failed`, {
        channel,
        reason: result.reason,
        errorClass: result.errorClass,
      });
      return result;
    }

    let timeout: NodeJS.Timeout | undefined;
    const publishResult = Promise.resolve()
      .then(() => this.publisher.publish(channel, message))
      .then<ContestEventNotificationPublishResult, ContestEventNotificationPublishResult>(
        (receiverCount) => ({ status: 'published', receiverCount }),
        (error) => ({ status: 'failed', reason: 'error', errorClass: getErrorClass(error) }),
      );
    const timeoutResult = new Promise<ContestEventNotificationPublishResult>((resolve) => {
      timeout = setTimeout(() => {
        resolve({ status: 'failed', reason: 'timeout' });
      }, CONTEST_EVENT_NOTIFICATION_PUBLISH_TIMEOUT_MS);
      timeout.unref?.();
    });

    let result: ContestEventNotificationPublishResult;
    try {
      result = await Promise.race([publishResult, timeoutResult]);
    } finally {
      if (timeout) {
        clearTimeout(timeout);
      }
    }
    if (result.status === 'published') {
      this.logRecovery(failures, `${logPrefix}.publish_recovered`, {
        channel,
        receiverCount: result.receiverCount,
      });
    } else {
      this.logFailure(failures, `${logPrefix}.publish_failed`, {
        channel,
        reason: result.reason,
        ...('errorClass' in result ? { errorClass: result.errorClass } : {}),
      });
    }
    return result;
  }

  public stop(): Promise<void> {
    if (this.terminal) {
      return Promise.resolve();
    }
    this.transitionTo('stopping');
    this.terminal = true;
    this.started = false;
    this.callbacks = undefined;
    this.generation += 1;
    this.detachListeners();
    try {
      this.subscriber.disconnect(false);
    } catch (_error) {
      // Shutdown is local and terminal even if the Redis client throws.
    }
    this.transitionTo('stopped');
    return Promise.resolve();
  }

  private attachListeners(): void {
    this.subscriber.on('ready', this.readyListener);
    this.subscriber.on('message', this.messageListener);
    this.subscriber.on('error', this.errorListener);
    this.subscriber.on('close', this.closeListener);
    this.subscriber.on('end', this.endListener);
  }

  private detachListeners(): void {
    this.subscriber.removeListener('ready', this.readyListener);
    this.subscriber.removeListener('message', this.messageListener);
    this.subscriber.removeListener('error', this.errorListener);
    this.subscriber.removeListener('close', this.closeListener);
    this.subscriber.removeListener('end', this.endListener);
  }

  private connectInBackground(): void {
    const connectGeneration = this.generation;
    let connecting: Promise<unknown>;
    try {
      connecting = this.subscriber.connect();
    } catch (error) {
      this.transitionTo('degraded');
      this.logSubscriberFailure('connect', error);
      return;
    }
    Promise.resolve(connecting).catch((error) => {
      if (this.isActive() && this.generation === connectGeneration && this.state === 'connecting') {
        this.transitionTo('degraded');
        this.logSubscriberFailure('connect', error);
      }
    });
  }

  private handleReady(): void {
    if (!this.isActive()) {
      return;
    }
    const generation = ++this.generation;
    this.transitionTo('subscribing');
    let subscribing: Promise<number>;
    try {
      subscribing = this.subscriber.subscribe(this.channel, this.controlChannel);
    } catch (error) {
      this.transitionTo('degraded');
      this.logSubscriberFailure('subscribe', error);
      return;
    }
    Promise.resolve(subscribing)
      .then((subscriptionCount) => {
        if (!this.isActive() || this.generation !== generation || this.state !== 'subscribing') {
          return;
        }
        if (!Number.isSafeInteger(subscriptionCount) || subscriptionCount < 2) {
          this.transitionTo('degraded');
          this.logSubscriberFailure('subscribe-ack', new RangeError('Invalid subscription count'));
          return;
        }
        this.transitionTo('subscribed');
        this.logRecovery(this.subscriberFailures, 'contest_event_notification.redis_recovered', { state: this.state });
        this.invokeCallback(() => this.callbacks?.onSubscribed());
      })
      .catch((error) => {
        if (this.isActive() && this.generation === generation && this.state === 'subscribing') {
          this.transitionTo('degraded');
          this.logSubscriberFailure('subscribe', error);
        }
      });
  }

  private handleConnectionFailure(operation: 'error' | 'end', error?: unknown): void {
    if (this.isActive()) {
      this.transitionTo('degraded');
      this.logSubscriberFailure(operation, error);
    }
  }

  private handleConnectionClosed(): void {
    if (!this.isActive() || this.subscriber.status === 'ready') {
      return;
    }
    this.transitionTo('degraded');
    this.logSubscriberFailure('close');
  }

  private handleMessage(channel: string, raw: string): void {
    if (!this.isActive() || this.state !== 'subscribed') {
      return;
    }
    if (channel === this.channel) {
      const parsed = parseContestEventNotificationEnvelope(raw);
      if (parsed.ok === false) {
        this.logFailure(this.invalidMessages, 'contest_event_notification.invalid_message', { reason: parsed.reason });
        return;
      }
      this.invokeCallback(() => this.callbacks?.onWatermark(parsed.watermark));
      return;
    }
    if (channel === this.controlChannel) {
      const parsed = parseContestEventCacheControlEnvelope(raw);
      if (parsed.ok === false) {
        this.logFailure(this.invalidControlMessages, 'contest_event_cache_control.invalid_message', {
          channel: this.controlChannel,
          reason: parsed.reason,
        });
        return;
      }
      this.invokeCallback(() => this.callbacks?.onControl?.(parsed.control));
    }
  }

  private invokeCallback(callback: () => unknown): void {
    Promise.resolve()
      .then(callback)
      .catch(() => undefined);
  }

  private isActive(): boolean {
    return this.started && !this.terminal;
  }

  private transitionTo(state: ContestEventNotificationRedisState): void {
    if (this.state === state) {
      return;
    }
    const previousState = this.state;
    this.state = state;
    this.safeInfo('contest_event_notification.redis_state', {
      channel: this.channel,
      previousState,
      state,
    });
  }

  private logSubscriberFailure(operation: string, error?: unknown): void {
    this.logFailure(this.subscriberFailures, 'contest_event_notification.redis_failed', {
      operation,
      state: this.state,
      ...(error === undefined ? {} : { errorClass: getErrorClass(error) }),
    });
  }

  private logFailure(tracker: FailureLogState, event: string, details: Record<string, unknown>): void {
    tracker.degraded = true;
    const now = Date.now();
    if (tracker.lastLogAt !== undefined && now - tracker.lastLogAt < CONTEST_EVENT_NOTIFICATION_ERROR_LOG_INTERVAL_MS) {
      tracker.suppressedCount += 1;
      return;
    }
    this.safeWarn(event, {
      channel: this.channel,
      ...details,
      suppressedCount: tracker.suppressedCount,
    });
    tracker.lastLogAt = now;
    tracker.suppressedCount = 0;
  }

  private logRecovery(tracker: FailureLogState, event: string, details: Record<string, unknown>): void {
    if (!tracker.degraded) {
      return;
    }
    tracker.degraded = false;
    this.safeInfo(event, {
      channel: this.channel,
      ...details,
      suppressedCount: tracker.suppressedCount,
    });
    tracker.lastLogAt = undefined;
    tracker.suppressedCount = 0;
  }

  private safeInfo(event: string, details: Record<string, unknown>): void {
    try {
      console.info(event, details);
    } catch (_error) {
      // Logging cannot affect notification delivery.
    }
  }

  private safeWarn(event: string, details: Record<string, unknown>): void {
    try {
      console.warn(event, details);
    } catch (_error) {
      // Logging cannot affect notification delivery.
    }
  }
}

export function buildContestEventNotificationChannel(namespace: string): string {
  const normalized = namespace.trim();
  if (!normalized) {
    throw new Error('Redis namespace is required for contest event notifications');
  }
  return `${normalized}:contest-event-availability:v1`;
}

export function buildContestEventCacheControlChannel(namespace: string): string {
  const normalized = namespace.trim();
  if (!normalized) {
    throw new Error('Redis namespace is required for contest event read-cache control');
  }
  return `${normalized}:contest-event-read-cache-control:v1`;
}

export function serializeContestEventNotificationEnvelope(watermark: ContestCommittedWatermark): string {
  assertValidContestId(watermark.contestId);
  assertValidCanonicalUk(watermark.canonicalUk);
  assertSafeNonNegativeInteger(watermark.latestEventId, 'latestEventId');
  assertSafePositiveInteger(watermark.streamRevision, 'streamRevision');

  const envelope: ContestEventNotificationEnvelopeV1 = {
    schemaVersion: CONTEST_EVENT_NOTIFICATION_SCHEMA_VERSION,
    contestId: watermark.contestId,
    uk: watermark.canonicalUk,
    latestEventId: watermark.latestEventId,
    streamRevision: watermark.streamRevision,
  };
  return JSON.stringify(envelope);
}

export function parseContestEventNotificationEnvelope(raw: string): ContestEventNotificationEnvelopeParseResult {
  if (Buffer.byteLength(raw, 'utf8') > CONTEST_EVENT_NOTIFICATION_MAX_BYTES) {
    return { ok: false, reason: 'too-large' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (_error) {
    return { ok: false, reason: 'invalid-json' };
  }
  if (!isValidEnvelope(parsed)) {
    return { ok: false, reason: 'invalid-envelope' };
  }
  return {
    ok: true,
    watermark: {
      contestId: parsed.contestId,
      canonicalUk: parsed.uk,
      latestEventId: parsed.latestEventId,
      streamRevision: parsed.streamRevision,
    },
  };
}

export function serializeContestEventCacheControlEnvelope(control: ContestEventCacheControl): string {
  assertValidContestId(control.contestId);
  assertValidCanonicalUk(control.canonicalUk);

  let envelope: ContestEventCacheControlEnvelopeV1;
  if (control.type === 'delete') {
    envelope = {
      schemaVersion: CONTEST_EVENT_CACHE_CONTROL_SCHEMA_VERSION,
      type: 'delete',
      contestId: control.contestId,
      uk: control.canonicalUk,
    };
  } else {
    assertValidVisibilityFingerprint(control.visibilityFingerprint);
    envelope = {
      schemaVersion: CONTEST_EVENT_CACHE_CONTROL_SCHEMA_VERSION,
      type: 'metadata',
      contestId: control.contestId,
      uk: control.canonicalUk,
      visibilityFingerprint: control.visibilityFingerprint,
    };
  }
  const raw = JSON.stringify(envelope);
  if (Buffer.byteLength(raw, 'utf8') > CONTEST_EVENT_CACHE_CONTROL_MAX_BYTES) {
    throw new RangeError('contest event read-cache control envelope must not exceed 4096 bytes');
  }
  return raw;
}

export function parseContestEventCacheControlEnvelope(raw: string): ContestEventCacheControlEnvelopeParseResult {
  if (Buffer.byteLength(raw, 'utf8') > CONTEST_EVENT_CACHE_CONTROL_MAX_BYTES) {
    return { ok: false, reason: 'too-large' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (_error) {
    return { ok: false, reason: 'invalid-json' };
  }
  if (!isValidCacheControlEnvelope(parsed)) {
    return { ok: false, reason: 'invalid-envelope' };
  }
  if (parsed.type === 'delete') {
    return {
      ok: true,
      control: {
        type: 'delete',
        contestId: parsed.contestId,
        canonicalUk: parsed.uk,
      },
    };
  }
  return {
    ok: true,
    control: {
      type: 'metadata',
      contestId: parsed.contestId,
      canonicalUk: parsed.uk,
      visibilityFingerprint: parsed.visibilityFingerprint,
    },
  };
}

function isValidEnvelope(value: unknown): value is ContestEventNotificationEnvelopeV1 {
  if (!isRecord(value)) {
    return false;
  }
  const keys = Object.keys(value);
  if (keys.length !== ENVELOPE_KEYS.length || keys.some((key) => !ENVELOPE_KEYS.includes(key as any))) {
    return false;
  }
  return (
    value.schemaVersion === CONTEST_EVENT_NOTIFICATION_SCHEMA_VERSION &&
    isValidContestId(value.contestId) &&
    isValidCanonicalUk(value.uk) &&
    isSafeNonNegativeInteger(value.latestEventId) &&
    isSafePositiveInteger(value.streamRevision)
  );
}

function isValidCacheControlEnvelope(value: unknown): value is ContestEventCacheControlEnvelopeV1 {
  if (!isRecord(value)) {
    return false;
  }
  if (
    value.schemaVersion !== CONTEST_EVENT_CACHE_CONTROL_SCHEMA_VERSION ||
    !isValidContestId(value.contestId) ||
    !isValidCanonicalUk(value.uk)
  ) {
    return false;
  }
  if (value.type === 'delete') {
    return hasExactKeys(value, DELETE_CONTROL_ENVELOPE_KEYS);
  }
  return (
    value.type === 'metadata' &&
    hasExactKeys(value, METADATA_CONTROL_ENVELOPE_KEYS) &&
    isValidVisibilityFingerprint(value.visibilityFingerprint)
  );
}

function hasExactKeys(value: Record<string, unknown>, expectedKeys: readonly string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === expectedKeys.length && keys.every((key) => expectedKeys.includes(key));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isValidContestId(value: unknown): value is string {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) {
    return false;
  }
  try {
    return BigInt(value) <= MYSQL_BIGINT_UNSIGNED_MAX;
  } catch (_error) {
    return false;
  }
}

function assertValidContestId(value: unknown): asserts value is string {
  if (!isValidContestId(value)) {
    throw new RangeError('contestId must be a positive canonical BIGINT UNSIGNED decimal string');
  }
}

function isValidCanonicalUk(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && hasLength(value, 3, 64);
}

function assertValidCanonicalUk(value: unknown): asserts value is string {
  if (!isValidCanonicalUk(value)) {
    throw new RangeError('canonicalUk must be a non-blank string between 3 and 64 characters');
  }
}

function isValidVisibilityFingerprint(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function assertValidVisibilityFingerprint(value: unknown): asserts value is string {
  if (!isValidVisibilityFingerprint(value)) {
    throw new RangeError('visibilityFingerprint must be a non-blank string');
  }
}

function isSafeNonNegativeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}

function assertSafeNonNegativeInteger(value: unknown, name: string): asserts value is number {
  if (!isSafeNonNegativeInteger(value)) {
    throw new RangeError(`${name} must be a safe non-negative integer`);
  }
}

function isSafePositiveInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) > 0;
}

function assertSafePositiveInteger(value: unknown, name: string): asserts value is number {
  if (!isSafePositiveInteger(value)) {
    throw new RangeError(`${name} must be a safe positive integer`);
  }
}

function getErrorClass(error: unknown): string {
  return error instanceof Error ? error.name : typeof error;
}

function createFailureLogState(): FailureLogState {
  return { degraded: false, suppressedCount: 0 };
}
