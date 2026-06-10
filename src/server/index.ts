/* eslint-disable @typescript-eslint/no-require-imports */
import 'reflect-metadata';

const isProd = process.env.NODE_ENV === 'production';
const moduleAlias = require('module-alias');

moduleAlias.addAlias('@server', __dirname);
moduleAlias.addAlias('@common', require('path').join(__dirname, '../common'));

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
import { RedisClientId } from './container-ids';

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
    limits: {
      fileSize: 8 * 1024 * 1024,
    },
  };

  private pageRenderer: IPageRenderer;
  private redisClient: Redis;

  public constructor() {
    super();
    this.container.bind(BwcxClientVueClientRoutesMapId).toConstantValue(clientRoutesMap);
  }

  protected async beforeWire() {
    const redisConfig = getDependency<RedisConfig>(RedisConfig, this.container);
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
    this.redisClient.on('error', (error) => {
      console.warn('[Redis] client error:', error);
    });
    void this.redisClient.connect().catch((error) => {
      console.warn('[Redis] initial connection failed, SSR cache will be skipped until Redis recovers:', error);
    });
    if (!this.container.isBound(RedisClientId)) {
      this.container.bind(RedisClientId).toConstantValue(this.redisClient);
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

    const typeOrmClient = getDependency<TypeOrmClient>(TypeOrmClient, this.container);
    await typeOrmClient.init();
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

  protected async beforeExit() {
    await this.pageRenderer?.destory?.();
    await this.redisClient?.quit().catch((error) => {
      console.warn('[Redis] quit failed:', error);
    });
  }
}

const app = new OurApp();
app.scan();
app.bootstrap().then(async () => {
  await app.startManually(async () => {
    const httpServer = http.createServer(app.instance.callback());
    const listenPromise = new Promise((resolve, _reject) => {
      httpServer.listen(app.port, app.hostname, () => {
        resolve(true);
      });
    });
    await listenPromise;
  });
});
