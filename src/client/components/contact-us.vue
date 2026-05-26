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

    <div
      v-if="open"
      data-id="contact-us-dialog"
      class="contact-us-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-us-title"
      @click.self="closeDialog"
    >
      <section class="contact-us-modal">
        <header class="contact-us-header">
          <h2 id="contact-us-title">联系我们</h2>
          <button
            data-id="contact-us-close"
            class="contact-us-close"
            type="button"
            aria-label="关闭联系我们弹窗"
            @click="closeDialog"
          >
            ×
          </button>
        </header>

        <div class="contact-us-body">
          <p>
            联系邮箱：
            <a data-id="contact-us-email" href="mailto:algoux.org@gmail.com">algoux.org@gmail.com</a>
          </p>
          <p>或加入讨论群：</p>
          <img data-id="contact-us-qq-image" :src="qqGroupImg" alt="RankLand QQ group">
        </div>
      </section>
    </div>
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
    closeDialog() {
      this.open = false;
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

.contact-us-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.45);
}

.contact-us-modal {
  width: min(520px, 100%);
  max-height: min(720px, calc(100vh - 48px));
  overflow: auto;
  color: #17202a;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 20px 60px rgba(16, 31, 54, 0.25);
}

.contact-us-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  border-bottom: 1px solid #e6e9ee;
}

.contact-us-header h2 {
  margin: 0;
  font-size: 18px;
  line-height: 1.4;
}

.contact-us-close {
  width: 32px;
  height: 32px;
  color: #596574;
  font-size: 24px;
  line-height: 1;
  background: transparent;
  border: 0;
  border-radius: 4px;
  cursor: pointer;
}

.contact-us-close:hover {
  color: #17202a;
  background: #f1f4f8;
}

.contact-us-body {
  padding: 20px;
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

@media (max-width: 560px) {
  .contact-us-overlay {
    align-items: flex-start;
    padding: 16px;
  }
}
</style>
