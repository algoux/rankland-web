<template>
  <Head>
    <title>{{ pageTitle }}</title>
  </Head>
  <div class="mt-32 text-center text-xl" data-id="not-found-page">
    404 Not Found · 你来到了榜单荒地
  </div>
</template>

<script lang="ts">
import { Vue } from 'vue-class-component';
import { formatTitle } from '@/app/title-format';

export default class NotFound extends Vue {
  pageTitle = formatTitle('Not Found');
}
</script>
