<template>
  <Head>
    <title>About</title>
  </Head>
  <h2>This is the About Page.</h2>
  <p>It's CSR only (defined in server ViewController)</p>
  <pre>env: {{ env }}</pre>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { routeView } from 'bwcx-client-vue3';

const About = defineComponent({
  name: 'About',
});

export default routeView(About, '/about');
</script>
