import { BaseType, InParam } from 'bwcx-client-vue';

export class RanklistRPO {
  @InParam()
  @BaseType(String)
  public id: string;
}
