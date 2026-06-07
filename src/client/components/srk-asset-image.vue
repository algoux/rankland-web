<template>
  <img
    ref="image"
    :data-id="dataId"
    :src="src"
    :alt="alt"
    :class="imgClass"
    :style="imageStyle"
    @error="handleError"
  >
</template>

<script lang="ts">
import { defineComponent, nextTick, type PropType } from 'vue';

export default defineComponent({
  name: 'SrkAssetImage',
  props: {
    src: {
      type: String,
      required: true,
    },
    alt: {
      type: String,
      default: '',
    },
    dataId: {
      type: String,
      default: '',
    },
    imgClass: {
      type: [String, Array, Object] as PropType<string | string[] | Record<string, boolean>>,
      default: '',
    },
  },
  data() {
    return {
      hidden: false,
    };
  },
  computed: {
    imageStyle(): Record<string, string> {
      return this.hidden ? { display: 'none' } : {};
    },
  },
  watch: {
    src() {
      this.hidden = false;
      void nextTick(() => {
        this.hideIfBroken();
      });
    },
  },
  mounted() {
    this.hideIfBroken();
  },
  methods: {
    handleError() {
      this.hidden = true;
    },
    hideIfBroken() {
      const image = this.$refs.image as HTMLImageElement | undefined;
      if (image?.complete && image.naturalWidth === 0) {
        this.hidden = true;
      }
    },
  },
});
</script>
