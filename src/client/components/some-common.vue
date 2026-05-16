<template>
  <div class="some-common-container">
    <div>Common Component</div>
    <pre>someProp: {{ someProp }}</pre>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'SomeCommon',
  props: {
    someProp: {
      type: Number,
      required: true,
    },
  },
});
</script>

<style lang="less" scoped>
.some-common-container {
  border: 1px solid #ccc;
  margin: 20px;
  padding: 8px;
}
</style>
