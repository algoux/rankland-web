import { Provide } from 'bwcx-core';

export interface ContestEventsAvailablePayload {
  uk: string;
  latestEventId: number;
  streamRevision: number;
}

type SseResponse = {
  write: (chunk: string) => boolean;
  end: () => void;
  on: (event: string, listener: () => void) => void;
  destroyed?: boolean;
  writableEnded?: boolean;
  writableFinished?: boolean;
};

@Provide()
export default class ContestSseHub {
  private readonly clients = new Map<string, Set<SseResponse>>();

  public addClient(uk: string, response: SseResponse, initialPayload?: ContestEventsAvailablePayload): void {
    let ukClients = this.clients.get(uk);
    if (!ukClients) {
      ukClients = new Set();
      this.clients.set(uk, ukClients);
    }
    ukClients.add(response);
    const removeClient = () => this.removeClient(uk, response);
    response.on('close', removeClient);
    response.on('error', removeClient);
    if (initialPayload) {
      this.writeEvent(uk, response, 'events-available', initialPayload);
    }
  }

  public notify(payload: ContestEventsAvailablePayload): void {
    const ukClients = this.clients.get(payload.uk);
    if (!ukClients) {
      return;
    }
    for (const response of ukClients) {
      this.writeEvent(payload.uk, response, 'events-available', payload);
    }
  }

  private writeEvent(
    uk: string,
    response: SseResponse,
    event: string,
    payload: ContestEventsAvailablePayload,
  ): void {
    const ok = this.writeRaw(response, `event: ${event}\n`) && this.writeRaw(response, `data: ${JSON.stringify(payload)}\n\n`);
    if (!ok) {
      this.removeClient(uk, response);
    }
  }

  private writeRaw(response: SseResponse, chunk: string): boolean {
    if (response.destroyed || response.writableEnded || response.writableFinished) {
      return false;
    }
    try {
      response.write(chunk);
      return true;
    } catch (e) {
      return false;
    }
  }

  private removeClient(uk: string, response: SseResponse): void {
    const ukClients = this.clients.get(uk);
    if (!ukClients) {
      return;
    }
    ukClients.delete(response);
    if (ukClients.size === 0) {
      this.clients.delete(uk);
    }
  }
}
