<script setup lang="ts">
import { ref } from 'vue';
import { Modal } from '@algoux/standard-ranklist-renderer-component-vue';
import qqGroupImg from '@/assets/rankland_qqgroup.jpg';

const visible = ref(false);
</script>

<template>
  <Modal
    :open="visible"
    title="联系我们"
    :width="420"
    root-class-name="srk-general-modal-root"
    @close="visible = false"
    @update:open="visible = $event"
  >
    <div>
      <p>
        如需请求榜单收录或贡献数据，欢迎提交
        <a href="https://github.com/algoux/srk-collection/issues/new" target="_blank" rel="noopener noreferrer">
          Issue
        </a>
      </p>
      <p>
        亦可通过邮件联系我们：<a href="mailto:algoux.org@gmail.com">algoux.org@gmail.com</a>
      </p>
      <p>或加入讨论群：</p>
      <img :src="qqGroupImg" class="w-full" alt="RankLand QQ group" />
    </div>
  </Modal>
  <span class="cursor-pointer" @click="visible = true">
    <slot />
  </span>
</template>
