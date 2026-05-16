<template>
  <div>
    <h2>This is the Home Page.</h2>
    <p>SSR/CSR asyncData fetched by ApiClient:</p>
    <pre>{{ JSON.stringify({ homeState }) }}</pre>
    <client-only>
      <h4>&lt;client-only&gt;This area will only be rendered in the browser&lt;/client-only&gt;</h4>
    </client-only>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useHead } from '@vueuse/head';
import { useContext } from 'vite-ssr/vue';
import { routeView, RenderMethodKind } from 'bwcx-client-vue3';
import type { DemoGetRespDTO } from '@common/modules/demo/demo.dto';
import type { AsyncDataOptions } from '@client/typings';

const Home = defineComponent({
  name: 'Home',
  props: {
    homeState: {
      type: Object,
      required: false,
    },
  },
  setup() {
    const { isClient, url, initialState } = useContext();
    isClient && console.log('Homepage setup', { url, initialState });

    useHead({
      title: 'Home',
      meta: [
        { name: 'description', content: 'This should be moved to head' },
      ],
    });

    return {
      initialState,
    };
  },
  computed: {
    list(): DemoGetRespDTO['list'] | undefined {
      return (this.homeState as DemoGetRespDTO | undefined)?.list;
    },
  },
  async asyncData({ apiClient }: AsyncDataOptions) {
    const res = await apiClient.demoGet({
      id: 42,
      page: 9,
    });
    return {
      homeState: res,
    };
  },
});

export default routeView(Home, '/', undefined, undefined, {
  renderMethod: RenderMethodKind.SSR,
});
</script>

<style lang="less" scoped>
.test {
  color: #333;
}
pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
