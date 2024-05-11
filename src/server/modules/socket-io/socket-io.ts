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
        return next(new Error('Not authorized'));
      }
      next();
    });
    this.producerNsp.on('connection', (socket) => {
      const { producerId, alias } = socket.handshake.auth;
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
