import { BaseType, InParam } from 'bwcx-client-vue';

export class LiveRPO {
  @InParam()
  @BaseType(String)
  public id: string;
}
