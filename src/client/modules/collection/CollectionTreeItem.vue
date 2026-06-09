<template>
  <li
    class="srk-collection-menu-node"
    :class="nodeClass"
    :data-collection-key="item.uniqueKey"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @focusout="handleFocusOut"
  >
    <button
      v-if="isDirectory"
      type="button"
      class="srk-collection-menu-title srk-collection-menu-directory"
      :class="titleClass"
      :style="titleStyle"
      :data-id="menuItemId"
      :data-collection-key="item.uniqueKey"
      :aria-expanded="String(isOpen)"
      @click="handleDirectoryClick"
      @focus="handleFocus"
    >
      <span v-if="directoryIcon" class="srk-collection-menu-icon">
        <img :src="directoryIcon.src" :alt="directoryIcon.alt" />
      </span>
      <span class="srk-collection-menu-label">{{ item.name }}</span>
      <ChevronDown class="srk-collection-menu-arrow" :class="{ 'is-open': isOpen || popupMode }" />
    </button>

    <a
      v-else
      class="srk-collection-menu-title srk-collection-menu-leaf"
      :class="titleClass"
      :style="titleStyle"
      :href="itemUrl"
      :data-id="menuItemId"
      :data-collection-key="item.uniqueKey"
      @click.prevent="selectRanklist"
    >
      <span class="srk-collection-menu-label">{{ item.name }}</span>
    </a>

    <Transition
      :css="false"
      @before-enter="beforeSubmenuEnter"
      @enter="enterSubmenu"
      @after-enter="afterSubmenuEnter"
      @before-leave="beforeSubmenuLeave"
      @leave="leaveSubmenu"
      @after-leave="afterSubmenuLeave"
    >
      <ul
        v-if="childrenVisible"
        class="srk-collection-menu-sub"
        role="menu"
        :data-id="`collection-submenu-${item.uniqueKey}`"
      >
        <CollectionTreeItem
          v-for="child in item.children || []"
          :key="child.uniqueKey"
          :item="child"
          :collection-id="collectionId"
          :active-rank-id="activeRankId"
          :open-keys="openKeys"
          :theme-name="themeName"
          :collapsed="false"
          :level="level + 1"
          :popup-mode="popupMode"
          :active-popup-key="activePopupKey"
          @select="forwardSelect"
          @toggle="forwardToggle"
          @popup-open="forwardPopupOpen"
          @popup-close="forwardPopupClose"
        />
      </ul>
    </Transition>

    <div
      v-if="collapsedPopupVisible"
      class="srk-collection-menu-popup"
      :data-id="`collection-collapsed-popup-${item.uniqueKey}`"
      @mouseenter="cancelClosePopup"
      @mouseleave="closePopup"
      @pointerdown.stop
      @click.stop
    >
      <ul class="srk-collection-menu-popup-list" role="menu">
        <CollectionTreeItem
          v-for="child in item.children || []"
          :key="child.uniqueKey"
          :item="child"
          :collection-id="collectionId"
          :active-rank-id="activeRankId"
          :open-keys="openKeys"
          :theme-name="themeName"
          :collapsed="false"
          :level="0"
          popup-mode
          :active-popup-key="activePopupKey"
          @select="handlePopupSelect"
          @toggle="forwardToggle"
          @popup-open="forwardPopupOpen"
          @popup-close="forwardPopupClose"
        />
      </ul>
    </div>
  </li>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import { ChevronDown } from 'lucide-vue-next';
import { CollectionItemType, type IApiCollectionItem } from '@/services/ranklist-api';
import { ranklandRoutes } from '@/app/config';
import type { ThemeName } from '@/lib/theme';
import icpcLogoBlack from '@/assets/icpc_logo_black.png';
import icpcLogoWhite from '@/assets/icpc_logo_white.png';
import ccpcLogoBlack from '@/assets/ccpc_logo_black.png';
import ccpcLogoWhite from '@/assets/ccpc_logo_white.png';
import provincialLogoBlack from '@/assets/provincial_cpc_logo_black.png';
import provincialLogoWhite from '@/assets/provincial_cpc_logo_white.png';
import universityLogoBlack from '@/assets/university-level_cpc_logo_black.png';
import universityLogoWhite from '@/assets/university-level_cpc_logo_white.png';
import ucupLogoBlack from '@/assets/ucup_logo_black.png';
import ucupLogoWhite from '@/assets/ucup_logo_white.png';

const DIRECTORY_ICONS: Record<string, { light: string; dark: string; alt: string }> = {
  'dir-icpc': { light: icpcLogoBlack, dark: icpcLogoWhite, alt: 'ICPC' },
  'dir-ccpc': { light: ccpcLogoBlack, dark: ccpcLogoWhite, alt: 'CCPC' },
  'dir-provincial': { light: provincialLogoBlack, dark: provincialLogoWhite, alt: 'Provincial CPC' },
  'dir-university-level': { light: universityLogoBlack, dark: universityLogoWhite, alt: 'University Level CPC' },
  'dir-ucup': { light: ucupLogoBlack, dark: ucupLogoWhite, alt: 'Universal Cup' },
};

@Options({
  name: 'CollectionTreeItem',
  components: {
    ChevronDown,
  },
})
export default class CollectionTreeItem extends Vue {
  @Prop({ required: true }) item!: IApiCollectionItem;
  @Prop({ required: true }) collectionId!: string;
  @Prop() activeRankId?: string;
  @Prop({ default: () => [] }) openKeys!: string[];
  @Prop({ default: 'light' }) themeName!: ThemeName;
  @Prop({ default: false }) collapsed!: boolean;
  @Prop({ default: 0 }) level!: number;
  @Prop({ default: false }) popupMode!: boolean;
  @Prop({ default: '' }) activePopupKey!: string;

  private closeTimer: number | undefined;
  private submenuTransitionTimer: number | undefined;
  private removeSubmenuTransitionEnd: (() => void) | undefined;

  get isDirectory() {
    return this.item.type === CollectionItemType.Directory;
  }

  get isOpen() {
    return this.openKeys.includes(this.item.uniqueKey);
  }

  get hasActiveDescendant(): boolean {
    return Boolean(this.activeRankId && this.containsRanklist(this.item, this.activeRankId));
  }

  get isActive() {
    return !this.isDirectory && this.item.uniqueKey === this.activeRankId;
  }

  get isHighlightedDirectory() {
    return this.isDirectory && this.hasActiveDescendant;
  }

  get isRootCollapsedDirectory() {
    return this.collapsed && this.level === 0 && this.isDirectory && !this.popupMode;
  }

  get menuItemId() {
    return `collection-menu-item-${this.item.uniqueKey}`;
  }

  get itemUrl() {
    return ranklandRoutes.formatUrl('Collection', {
      id: this.collectionId,
      rankId: this.item.uniqueKey,
    });
  }

  get titleStyle() {
    return {
      '--srk-collection-menu-indent': `${24 + this.level * 24}px`,
    };
  }

  get nodeClass() {
    return {
      'is-directory': this.isDirectory,
      'is-leaf': !this.isDirectory,
      'is-open': this.isOpen,
      'is-active': this.isActive,
      'is-active-ancestor': this.hasActiveDescendant,
      'is-popup-mode': this.popupMode,
    };
  }

  get titleClass() {
    return {
      'is-open': this.isDirectory && (this.isOpen || this.popupMode),
      'is-active-ancestor': this.isHighlightedDirectory,
      'is-active': this.isActive,
      'is-root-level': this.level === 0 && !this.popupMode,
      'is-root-collapsed': this.isRootCollapsedDirectory,
    };
  }

  get directoryIcon() {
    const icon = DIRECTORY_ICONS[this.item.uniqueKey];
    if (!icon) {
      return undefined;
    }
    return {
      src: this.themeName === 'dark' ? icon.dark : icon.light,
      alt: icon.alt,
    };
  }

  get childrenVisible() {
    return this.isDirectory && !this.collapsed && (this.isOpen || this.popupMode);
  }

  get collapsedPopupVisible() {
    return this.isRootCollapsedDirectory && this.activePopupKey === this.item.uniqueKey;
  }

  handleDirectoryClick() {
    if (this.isRootCollapsedDirectory) {
      this.openPopup();
      return;
    }
    this.$emit('toggle', this.item.uniqueKey);
  }

  selectRanklist() {
    this.$emit('select', this.item.uniqueKey);
  }

  handlePopupSelect(key: string) {
    this.closePopup();
    this.$emit('select', key);
  }

  forwardSelect(key: string) {
    this.$emit('select', key);
  }

  forwardToggle(key: string) {
    this.$emit('toggle', key);
  }

  forwardPopupOpen(key: string) {
    this.$emit('popup-open', key);
  }

  forwardPopupClose(key: string) {
    this.$emit('popup-close', key);
  }

  handleMouseEnter() {
    if (!this.isRootCollapsedDirectory) {
      return;
    }
    this.cancelClosePopup();
    this.openPopup();
  }

  handleMouseLeave() {
    if (!this.isRootCollapsedDirectory) {
      return;
    }
    this.closeTimer = window.setTimeout(() => {
      this.closePopup();
    }, 120);
  }

  handleFocus() {
    if (this.isRootCollapsedDirectory) {
      this.openPopup();
    }
  }

  handleFocusOut(event: FocusEvent) {
    if (!this.isRootCollapsedDirectory) {
      return;
    }
    const currentTarget = event.currentTarget;
    const relatedTarget = event.relatedTarget;
    if (
      currentTarget instanceof Node
      && relatedTarget instanceof Node
      && currentTarget.contains(relatedTarget)
    ) {
      return;
    }
    this.handleMouseLeave();
  }

  cancelClosePopup() {
    if (this.closeTimer !== undefined) {
      window.clearTimeout(this.closeTimer);
      this.closeTimer = undefined;
    }
  }

  closePopup() {
    this.cancelClosePopup();
    this.$emit('popup-close', this.item.uniqueKey);
  }

  private openPopup() {
    this.cancelClosePopup();
    this.$emit('popup-open', this.item.uniqueKey);
  }

  beforeSubmenuEnter(element: Element) {
    const submenu = element as HTMLElement;
    this.clearSubmenuTransitionWait();
    submenu.style.height = '0px';
    submenu.style.opacity = '0';
  }

  enterSubmenu(element: Element, done: () => void) {
    const submenu = element as HTMLElement;
    void submenu.offsetHeight;
    this.waitForSubmenuHeightTransition(submenu, done);
    this.queueAnimationFrame(() => {
      submenu.style.height = `${submenu.scrollHeight}px`;
      submenu.style.opacity = '1';
    });
  }

  afterSubmenuEnter(element: Element) {
    const submenu = element as HTMLElement;
    this.clearSubmenuTransitionWait();
    submenu.style.height = '';
    submenu.style.opacity = '';
  }

  beforeSubmenuLeave(element: Element) {
    const submenu = element as HTMLElement;
    this.clearSubmenuTransitionWait();
    submenu.style.height = `${submenu.scrollHeight}px`;
    submenu.style.opacity = '1';
    // Force the browser to commit the starting height before transitioning to 0.
    void submenu.offsetHeight;
  }

  leaveSubmenu(element: Element, done: () => void) {
    const submenu = element as HTMLElement;
    this.waitForSubmenuHeightTransition(submenu, done);
    this.queueAnimationFrame(() => {
      submenu.style.height = '0px';
      submenu.style.opacity = '0';
    });
  }

  afterSubmenuLeave(element: Element) {
    const submenu = element as HTMLElement;
    this.clearSubmenuTransitionWait();
    submenu.style.height = '';
    submenu.style.opacity = '';
  }

  beforeUnmount() {
    this.cancelClosePopup();
    this.clearSubmenuTransitionWait();
  }

  private queueAnimationFrame(callback: () => void) {
    if (typeof window !== 'undefined' && window.requestAnimationFrame) {
      window.requestAnimationFrame(callback);
      return;
    }
    callback();
  }

  private waitForSubmenuHeightTransition(submenu: HTMLElement, done: () => void) {
    this.clearSubmenuTransitionWait();
    let finished = false;
    const finish = () => {
      if (finished) {
        return;
      }
      finished = true;
      this.clearSubmenuTransitionWait();
      done();
    };
    const handleTransitionEnd = (event: TransitionEvent) => {
      if (event.target === submenu && event.propertyName === 'height') {
        finish();
      }
    };

    submenu.addEventListener('transitionend', handleTransitionEnd);
    this.removeSubmenuTransitionEnd = () => {
      submenu.removeEventListener('transitionend', handleTransitionEnd);
    };
    this.submenuTransitionTimer = window.setTimeout(finish, 280);
  }

  private clearSubmenuTransitionWait() {
    if (this.submenuTransitionTimer !== undefined) {
      window.clearTimeout(this.submenuTransitionTimer);
      this.submenuTransitionTimer = undefined;
    }
    if (this.removeSubmenuTransitionEnd) {
      this.removeSubmenuTransitionEnd();
      this.removeSubmenuTransitionEnd = undefined;
    }
  }

  private containsRanklist(item: IApiCollectionItem, key: string): boolean {
    if (item.type !== CollectionItemType.Directory) {
      return item.uniqueKey === key;
    }
    return (item.children || []).some((child) => this.containsRanklist(child, key));
  }
}
</script>
