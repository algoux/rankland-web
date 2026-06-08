<template>
  <section class="rankland-playground-page" data-id="playground-page">
    <Head>
      <title>{{ pageTitle }}</title>
      <meta property="og:title" :content="pageTitle" />
    </Head>
    <ClientOnly>
      <PlaygroundEditor />
    </ClientOnly>
  </section>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { View, RenderMethod, RenderMethodKind } from 'bwcx-client-vue3';
import ClientOnly from '@/components/common/ClientOnly.vue';
import { formatTitle } from '@/app/title-format';
import PlaygroundEditor from './PlaygroundEditor.vue';

@View('/playground')
@RenderMethod(RenderMethodKind.CSR)
@Options({
  components: {
    ClientOnly,
    PlaygroundEditor,
  },
})
export default class Playground extends Vue {
  pageTitle = formatTitle('Playground');
}
</script>
