<template>
  <Head>
    <title>Demo Detail</title>
  </Head>
  <h2>This is the Detail Page.</h2>

  <p>SSR/CSR asyncData props fetched by ApiClient:</p>
  <pre>{{ JSON.stringify({ list }) }}</pre>

  <p>Page param/query:</p>
  <pre>{{ JSON.stringify({ id, page, preview, arr }) }}</pre>

  <p>mounted only randomNumber: {{ shortenRandomNumber }}</p>

  <div class="pagination">
    Try awesome router: <a href="javascript:;" @click="goToRandomPage">Go to a random page!</a>
  </div>

  <SomeCommon :some-prop="1" />
</template>

<script lang="ts">
import { defineComponent, h } from 'vue';
import { routeView, RenderMethodKind } from 'bwcx-client-vue3';
import { DemoDetailRPO } from '@common/modules/demo/demo.rpo';
import type { AsyncDataOptions } from '@client/typings';
import type { DemoItem } from '@common/modules/demo/demo.dto';

const SomeCommon = defineComponent({
  name: 'SomeCommon',
  props: {
    someProp: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    return () => h('div', { class: 'some-common-container' }, [
      h('div', 'Common Component'),
      h('pre', `someProp: ${props.someProp}`),
    ]);
  },
});

const DemoDetail = defineComponent({
  name: 'DemoDetail',
  components: {
    SomeCommon,
  },
  props: {
    id: {
      type: [String, Number],
      required: true,
    },
    page: {
      type: Number,
      required: false,
    },
    preview: {
      type: Boolean,
      required: false,
    },
    arr: {
      type: Array,
      required: false,
    },
    list: {
      type: Array,
      required: false,
    },
  },
  data() {
    return {
      randomNumber: 0,
    };
  },
  computed: {
    shortenRandomNumber(): string {
      return this.randomNumber.toFixed(5);
    },
  },
  async asyncData({ apiClient, to }: AsyncDataOptions) {
    const res = await apiClient.demoGet({
      id: Number(to.params.id),
      page: 1,
    });
    return {
      list: res.list,
    };
  },
  mounted() {
    this.randomNumber = Math.random();
  },
  methods: {
    goToRandomPage() {
      const page = Math.floor(Math.random() * 1000) + 1;
      (this as any).$$router.to('DemoDetail').push({
        id: this.id,
        preview: this.preview,
        arr: this.arr,
        page,
      });
    },
  },
});

export default routeView(DemoDetail, '/demo/detail/:id', DemoDetailRPO, undefined, {
  renderMethod: RenderMethodKind.SSR,
});
</script>

<style lang="less" scoped>
pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}
.pagination {
  a {
    margin: 0 8px;
  }
}
</style>
