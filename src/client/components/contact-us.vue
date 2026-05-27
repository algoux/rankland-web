<template>
  <span class="contact-us">
    <button
      data-id="contact-us-trigger"
      class="contact-us-trigger"
      type="button"
      @click="openDialog"
    >
      <slot>联系我们</slot>
    </button>

    <a-modal
      v-model:open="open"
      title="联系我们"
      wrap-class-name="contact-us-modal-wrap"
      :footer="null"
      :destroy-on-close="true"
    >
      <template #closeIcon>
        <span
          data-id="contact-us-close"
          class="contact-us-close"
          aria-label="关闭联系我们弹窗"
        >
          ×
        </span>
      </template>

      <div
        data-id="contact-us-dialog"
        class="contact-us-body"
      >
        <p>
          联系邮箱：
          <a data-id="contact-us-email" href="mailto:algoux.org@gmail.com">algoux.org@gmail.com</a>
        </p>
        <p>或加入讨论群：</p>
        <img data-id="contact-us-qq-image" class="w-full" :src="qqGroupImg" alt="RankLand QQ group">
      </div>
    </a-modal>
  </span>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import qqGroupImg from '@client/assets/rankland_qqgroup.jpg';

export default defineComponent({
  name: 'ContactUs',
  data() {
    return {
      open: false,
      qqGroupImg,
    };
  },
  methods: {
    openDialog() {
      this.open = true;
    },
  },
});
</script>

<style lang="less" scoped>
.contact-us {
  display: inline;
}

.contact-us-trigger {
  display: inline;
  padding: 0;
  color: var(--rankland-link-color);
  font: inherit;
  text-align: inherit;
  text-decoration: none;
  background: transparent;
  border: 0;
  cursor: pointer;
}

.contact-us-trigger:hover {
  color: var(--rankland-link-hover-color);
}

.contact-us-close {
  line-height: inherit;
}

.contact-us-body p {
  margin: 0 0 12px;
  line-height: 1.7;
}

.contact-us-body img {
  display: block;
  width: 100%;
  max-width: 460px;
  margin: 0 auto;
  border-radius: 4px;
}
</style>
