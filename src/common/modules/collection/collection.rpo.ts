import { BaseType, InParam } from 'bwcx-client-vue';

export class CollectionRPO {
  @InParam()
  @BaseType(String)
  public id: string;
}
