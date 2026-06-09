import { Contract, Data, Get } from 'bwcx-ljsm';
import { Inject } from 'bwcx-core';
import { ApiController } from '@server/decorators';

@ApiController()
export default class MiscController {
  @Get()
  @Contract(null, null)
  async checkHealth(): Promise<void> {
  }
}
