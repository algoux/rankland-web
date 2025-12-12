import { Inject, Provide } from 'bwcx-core';
import { Namespace, Server } from 'socket.io';
import type http from 'http';
import type { DefaultEventsMap } from 'socket.io/dist/typed-events';
import {
  rankland_live_contest_common,
  rankland_live_contest_producer,
  rankland_live_contest_client,
} from '@common/proto/rankland_live_contest';
import LiveContestService from '../live-contest/live-contest.service';
import LogicException from '@server/exceptions/logic.exception';
import { errCodeConfigs } from '@server/err-code-configs';
import { ErrCode } from '@common/enums/err-code.enum';

@Provide()
export default class SocketIOServer {
  public constructor(@Inject() private readonly liveContestService: LiveContestService) {}

  public io: Server;
  public producerNsp: Namespace<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>;
  public clientNsp: Namespace<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>;

  public init(server: http.Server) {
    this.io = new Server(server, {
      path: '/rankland_web/socket.io',
    });
    this.mount();
  }

  public mount() {
    this.producerMount();
    this.clientMount();
  }

  public producerMount() {
    this.producerNsp = this.io.of('/producer');
    this.producerNsp.use((socket, next) => {
      const token = socket.handshake.auth.token;
      if (!token || token !== process.env.AUTH_TOKEN) {
        const e = new Error('Invalid authorization info');
        // @ts-ignore
        e.data = {
          success: false,
          code: ErrCode.InvalidAuthInfo,
          msg: errCodeConfigs[ErrCode.InvalidAuthInfo],
        };
        next(e);
      }
      next();
    });
    this.producerNsp.on('connection', (socket) => {
      const { id: producerId, alias } = socket.handshake.auth;
      console.log('Producer connected', producerId, alias);
      socket.join(`${alias}`);

      socket.on('ProducerEvent', async (data, callback) => {
        try {
          const batchData = rankland_live_contest_producer.BatchProducerEvent.decode(data);
          for (const req of batchData.events) {
            console.log('ProducerEvent req:', req);
            try {
              await this.liveContestService.handleProducerEvent(alias, req);
            } catch (e) {
              console.error('ProducerEvent failed:', e);
              if (e.name === 'MongoServerError' && e.errorResponse?.code === 11000) {
                continue;
              }
              throw e;
            }
          }
          const bytes = rankland_live_contest_client.BatchClientEvent.encode({ events: batchData.events }).finish();
          this.clientNsp.to(`${alias}`).emit('ClientEvents', bytes);
          callback({
            success: true,
          });
        } catch (e) {
          console.error('ProducerEvent failed:', e);
          callback(this.handleError(e));
        }
      });
    });
  }

  public clientMount() {
    this.clientNsp = this.io.of('/client');
    this.clientNsp.on('connection', async (socket) => {
      const { id: clientId, alias, lastEventId } = socket.handshake.auth;
      console.log('Client connected', clientId, alias);
      socket.join(`${alias}`);

      // Push all events (from last event id) to client when connected
      const events = await this.liveContestService.getAllEventsAsClientEvents(alias);
      const bytes = rankland_live_contest_client.BatchClientEvent.encode({ events }).finish();
      socket.emit('InitClientEvents', bytes);
      socket.emit('InitClientEventsDone');
      console.log('InitClientEvents ok', events.length, bytes.length);
    });
  }

  private handleError(e: any) {
    if (e instanceof LogicException) {
      return {
        success: false,
        code: e.code,
        msg: errCodeConfigs[e.code],
      };
    }
    return {
      success: false,
    };
  }
}
