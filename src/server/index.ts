/* eslint-disable @typescript-eslint/no-require-imports */
import 'reflect-metadata';

const isProd = process.env.NODE_ENV === 'production';
require('./register-module-aliases');

import { getDependency } from 'bwcx-core';
import type { IAppConfig, IAppWiredData } from 'bwcx-ljsm';
import { App } from 'bwcx-ljsm';
import BWCX_CONTAINER_KEY from 'bwcx-ljsm/container-key';
import { ApiClientGenerator } from 'bwcx-api-client/generator';
import http from 'http';
import path from 'path';
import favicon from 'koa-favicon';
import mount from 'koa-mount';
import koaStatic from 'koa-static';
import cors from '@koa/cors';
import Redis from 'ioredis';
import UtilityHeaderMiddleware from './middlewares/utility-header.middleware';
import LoggerMiddleware from './middlewares/logger.middleware';
import ContentNegotiationMiddleware from './middlewares/content-negotiation.middleware';
import ProtobufMiddleware from './middlewares/protobuf.middleware';
import SseMiddleware from './middlewares/sse.middleware';
import { chromeDevtoolsProbeMiddleware } from './middlewares/chrome-devtools-probe.middleware';
import DefaultResponseHandler from '@server/response-handlers/default.response-handler';
import { IPageRenderer } from './lib/page-renderer.interface';
import { BwcxClientVueClientRoutesMapId } from 'bwcx-client-vue/server';
import { clientRoutesMap } from '@common/router/client-routes';
import TypeOrmClient from './database/typeorm-client';
import RedisConfig from './configs/redis/redis.config';
import FileConfig, { DEFAULT_FS_FILE_BASE_URL, FileProviderKey } from './configs/file/file.config';
import { RedisClientId, RedisSubscriberClientId } from './container-ids';
import IdGeneratorService from './services/id-generator.service';
import ContestEventNotificationCoordinator from './modules/contest/contest-event-notification';
import { disposeApplicationResources } from './application-resource-disposal';
import { listenHttpServer } from './application-http-listener';

export default class OurApp extends App {
  protected baseDir = path.join(__dirname, '..');

  protected scanGlobs = [
    './server/**/*.(j|t)s',
    '!./server/**/*.d.ts',
    '!./server/**/__tests__/**',
    '!./server/**/*.test.(j|t)s',
    '!./server/**/*.spec.(j|t)s',
    './common/**/*.(j|t)s',
    '!./common/**/*.d.ts',
    '!./common/**/__tests__/**',
    '!./common/**/*.test.(j|t)s',
    '!./common/**/*.spec.(j|t)s',
    '!./common/api/**',
  ];

  public hostname = process.env.SERVER_HOST || '127.0.0.1';

  public port = parseInt(process.env.SERVER_PORT, 10) || 3000;

  protected exitTimeout = 5000;

  protected globalMiddlewares = [
    UtilityHeaderMiddleware,
    LoggerMiddleware,
    ContentNegotiationMiddleware,
    ProtobufMiddleware,
    SseMiddleware,
  ];

  protected responseHandler = DefaultResponseHandler;

  protected validation: IAppConfig['validation'] = isProd
    ? {
        skipRespValidation: true,
      }
    : {};

  protected bodyParserOptions: IAppConfig['bodyParserOptions'] = {
    formLimit: '5mb',
    jsonLimit: '5mb',
  };

  protected multerOptions: IAppConfig['multerOptions'] = {
    preservePath: true,
    limits: {
      fileSize: 8 * 1024 * 1024,
    },
  };

  private pageRenderer: IPageRenderer;
  private redisClient: Redis;
  private redisSubscriberClient: Redis;
  private typeOrmClient: TypeOrmClient;
  private idGeneratorService: IdGeneratorService;
  private notificationCoordinator: ContestEventNotificationCoordinator;
  private disposePromise?: Promise<void>;

  public constructor() {
    super();
    this.container.bind(BwcxClientVueClientRoutesMapId).toConstantValue(clientRoutesMap);
  }

  protected async beforeWire() {
    const redisConfig = getDependency<RedisConfig>(RedisConfig, this.container);
    const fileConfig = getDependency<FileConfig>(FileConfig, this.container);
    this.redisClient = new Redis({
      host: redisConfig.host,
      port: redisConfig.port,
      db: redisConfig.db,
      password: redisConfig.password || undefined,
      lazyConnect: true,
      connectTimeout: 500,
      commandTimeout: 200,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
    });
    this.redisSubscriberClient = new Redis({
      host: redisConfig.host,
      port: redisConfig.port,
      db: redisConfig.db,
      password: redisConfig.password || undefined,
      lazyConnect: true,
      connectTimeout: 500,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      autoResubscribe: false,
      autoResendUnfulfilledCommands: false,
      connectionName: `${redisConfig.namespace}:contest-event-notification:${process.pid}`,
    });
    this.redisClient.on('error', (error) => {
      console.warn('[Redis] client error:', error);
    });
    this.redisClient.connect().catch((error) => {
      console.warn('[Redis] initial connection failed, SSR cache will be skipped until Redis recovers:', error);
    });
    if (!this.container.isBound(RedisClientId)) {
      this.container.bind(RedisClientId).toConstantValue(this.redisClient);
    }
    if (!this.container.isBound(RedisSubscriberClientId)) {
      this.container.bind(RedisSubscriberClientId).toConstantValue(this.redisSubscriberClient);
    }

    // cors
    this.instance.use(cors());
    // favicon.ico
    this.instance.use(favicon(`${process.cwd()}/public/favicon.ico`));
    // root-level public files such as robots.txt
    this.instance.use(
      koaStatic(`${process.cwd()}/public/`, {
        index: false,
        maxage: 0,
        extensions: false,
      }),
    );
    if (fileConfig.provider === FileProviderKey.FS) {
      this.instance.use(
        mount(
          DEFAULT_FS_FILE_BASE_URL.replace(/\/+$/, ''),
          koaStatic(fileConfig.fs.basePath, {
            index: false,
            maxage: 0,
            extensions: false,
          }),
        ),
      );
    }
    // serve static files (remove it if use other way to serve static files like CDN)
    this.instance.use(
      mount(
        '/dist',
        koaStatic(`${process.cwd()}/dist/client/`, {
          index: false,
          maxage: 2592000000,
          extensions: false,
        }),
      ),
    );
    // Chrome DevTools probes this optional app-specific config on every page load.
    // Handle it before Vite dev middleware so a missing JSON file does not log a noisy SSR error.
    this.instance.use(chromeDevtoolsProbeMiddleware);

    // SSR
    this.pageRenderer = getDependency<IPageRenderer>(IPageRenderer, this.container);
    const renderMiddleware = await this.pageRenderer.init?.();
    if (renderMiddleware) {
      this.instance.use(renderMiddleware);
    }
  }

  protected async afterWire() {
    this.instance.on('error', (error, ctx) => {
      try {
        console.error('server error', error, ctx);
      } catch (e) {
        console.error(e);
      }
    });

    this.typeOrmClient = getDependency<TypeOrmClient>(TypeOrmClient, this.container);
    await this.typeOrmClient.init();
    this.idGeneratorService = getDependency<IdGeneratorService>(IdGeneratorService, this.container);
    await this.idGeneratorService.init();
    this.notificationCoordinator = getDependency<ContestEventNotificationCoordinator>(
      ContestEventNotificationCoordinator,
      this.container,
    );
    await this.notificationCoordinator.start();
  }

  protected async afterStart() {
    console.log(`🚀 A bwcx app is listening on http://${this.hostname}:${this.port}`);
    if (!isProd) {
      // generate api client
      const apiClientGenerator = new ApiClientGenerator(
        {
          outFilePath: path.join(this.baseDir, './common/api/api-client.ts'),
          prependImports: [],
          enableExtraReqOptions: true,
        },
        getDependency<IAppWiredData>(BWCX_CONTAINER_KEY.WiredData, this.container).router,
      );
      await apiClientGenerator.generate();
    }
  }

  public dispose(): Promise<void> {
    this.disposePromise ??= this.disposeResources();
    return this.disposePromise;
  }

  protected async beforeExit() {
    await this.dispose();
  }

  private async disposeResources(): Promise<void> {
    await disposeApplicationResources({
      stopNotifications: this.notificationCoordinator ? () => this.notificationCoordinator.stop() : undefined,
      disconnectSubscriber: this.redisSubscriberClient ? () => this.redisSubscriberClient.disconnect(false) : undefined,
      stopHttp: this.server ? () => this.stop() : undefined,
      closePageRenderer: this.pageRenderer?.destory ? () => this.pageRenderer.destory() : undefined,
      closeIdGenerator: this.idGeneratorService ? () => this.idGeneratorService.dispose() : undefined,
      closeTypeOrm: this.typeOrmClient ? () => this.typeOrmClient.destroy() : undefined,
      closeRedisCommand: this.redisClient ? () => this.redisClient.disconnect(false) : undefined,
      onError: (resource, error) => {
        console.warn(`[Shutdown] ${resource} close failed:`, error);
      },
    });
  }
}

const app = new OurApp();
app.scan();
app
  .bootstrap()
  .then(async () => {
    await app.startManually(async () => {
      const httpServer = http.createServer(app.instance.callback());
      app.server = httpServer;
      await listenHttpServer(httpServer, app.port, app.hostname);
    });
  })
  .catch(async (error: unknown) => {
    console.error('[Startup] application failed to start:', error);
    process.exitCode = 1;
    await app.dispose().catch((cleanupError: unknown) => {
      console.error('[Startup] resource cleanup failed:', cleanupError);
    });
    process.exit(1);
  });
