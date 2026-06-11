<template>
  <div
    ref="containerEl"
    class="srk-playground-container"
    :class="{ 'is-resizing': isResizing }"
    :style="{ height: `${remainingHeight}px` }"
    data-id="srk-playground-container"
  >
    <div
      ref="editorEl"
      class="srk-playground-editor"
      :style="editorPaneStyle"
      data-id="srk-playground-editor"
    />
    <button
      class="srk-playground-resizer"
      type="button"
      role="separator"
      aria-label="调整编辑器宽度"
      aria-orientation="vertical"
      :aria-valuenow="editorWidth"
      :aria-valuemin="EDITOR_MIN_WIDTH"
      :aria-valuemax="editorMaxWidth"
      data-id="srk-playground-resizer"
      @mousedown="startResize"
      @keydown="handleResizeKeydown"
    />
    <div class="srk-playground-preview">
      <a
        class="absolute right-4 top-4 inline-flex items-center gap-1 text-sm text-primary hover:underline"
        href="https://srk.algoux.org/zh/"
        target="_blank"
        rel="noopener"
      >
        <CircleHelp :size="16" />
        srk 文档
      </a>
      <div v-if="!ready" class="pt-10">
        <p v-if="initializationError" class="mt-16 text-center text-sm text-destructive" data-id="playground-editor-error">
          {{ initializationError }}
        </p>
        <Loading v-else />
      </div>
      <h3 v-else-if="!parsedCode.valid" class="mt-16 text-center text-lg font-semibold tracking-normal" data-id="playground-invalid">
        Input valid srk JSON and press
        <span class="rounded bg-primary/10 px-1.5 py-0.5 text-primary">Ctrl/Cmd + S</span>
        to preview
      </h3>
      <div
        v-else
        class="mt-8 mb-8"
        data-id="playground-preview"
        :data-row-count="String(parsedCode.data?.rows.length || 0)"
      >
        <StyledRanklist :data="parsedCode.data" name="playground" show-filter />
      </div>
    </div>

    <Modal
      :open="showWelcome"
      title="欢迎来到演练场！"
      :width="600"
      root-class-name="srk-general-modal-root"
      @close="dismissWelcome"
      @update:open="handleWelcomeOpenChange"
    >
      <div class="playground-welcome-content" data-id="playground-welcome">
        <p>你可以调试标准榜单格式（srk）数据并实时预览效果，推荐使用桌面端设备。</p>
        <p>如果你是 OJ 开发者、Ranklist 贡献者或对此感兴趣，演练场可以帮助你直观地了解 srk 的字段及其作用。</p>
        <p>需要参考 srk 文档？请点击右上角的帮助入口。</p>
        <div class="playground-welcome-actions">
          <Button @click="dismissWelcome">OK</Button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import type { IDisposable, editor as MonacoEditorNamespace } from 'monaco-editor/esm/vs/editor/editor.api';
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { CircleHelp } from 'lucide-vue-next';
import { Modal } from '@algoux/standard-ranklist-renderer-component-vue';
import { Button } from '@/components/ui/button';
import Loading from '@/components/common/Loading.vue';
import StyledRanklist from '@/components/ranklist/StyledRanklist.vue';
import { LocalStorageKey } from '@/app/local-storage-key.config';
import { createDefaultPlaygroundCode, parsePlaygroundCode } from './playground-code';
import srkPkg from '@algoux/standard-ranklist/package.json';
import srkSchema from '@algoux/standard-ranklist/schema.json';
import editorWorkerUrl from 'monaco-editor/esm/vs/editor/editor.worker?worker&url';
import jsonWorkerUrl from 'monaco-editor/esm/vs/language/json/json.worker?worker&url';

type MonacoApi = typeof import('monaco-editor/esm/vs/editor/editor.api');
type JsonDefaultsModule = {
  jsonDefaults?: {
    setDiagnosticsOptions: (options: unknown) => void;
  };
  default?: {
    jsonDefaults?: {
      setDiagnosticsOptions: (options: unknown) => void;
    };
  };
};

const editorEl = ref<HTMLElement | null>(null);
const containerEl = ref<HTMLElement | null>(null);
const code = ref(createDefaultPlaygroundCode());
const ready = ref(false);
const initializationError = ref('');
const showWelcome = ref(false);
const remainingHeight = ref(640);
const editorWidth = ref(500);
const isResizing = ref(false);

const EDITOR_MIN_WIDTH = 320;
const PREVIEW_MIN_WIDTH = 360;
const DEFAULT_EDITOR_WIDTH = 500;
const RESIZER_WIDTH = 7;

let monacoApi: MonacoApi | null = null;
let editor: MonacoEditorNamespace.IStandaloneCodeEditor | null = null;
let changeSubscription: IDisposable | null = null;
let resizeObserver: ResizeObserver | null = null;
let themeObserver: MutationObserver | null = null;
let changeTimer: number | undefined;
let dragStartX = 0;
let dragStartEditorWidth = DEFAULT_EDITOR_WIDTH;

const parsedCode = computed(() => parsePlaygroundCode(code.value));
const editorMaxWidth = computed(() => getEditorMaxWidth());
const editorPaneStyle = computed(() => ({
  width: `${editorWidth.value}px`,
}));

onMounted(async () => {
  updateRemainingHeight();
  restoreEditorWidth();
  window.addEventListener('resize', updateRemainingHeight);
  window.addEventListener('resize', updateEditorWidthAfterResize);
  resizeObserver = new ResizeObserver(updateRemainingHeight);
  resizeObserver.observe(document.body);
  if (containerEl.value) {
    resizeObserver.observe(containerEl.value);
  }

  await nextTick();
  await mountEditor().catch((error) => {
    console.error('[Playground] failed to initialize Monaco:', error);
    initializationError.value = error instanceof Error ? error.message : 'Failed to initialize playground editor';
  });
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateRemainingHeight);
  window.removeEventListener('resize', updateEditorWidthAfterResize);
  window.removeEventListener('mousemove', resizeEditor);
  window.removeEventListener('mouseup', stopResize);
  resizeObserver?.disconnect();
  themeObserver?.disconnect();
  if (changeTimer !== undefined) {
    window.clearTimeout(changeTimer);
  }
  changeSubscription?.dispose();
  editor?.dispose();
});

async function mountEditor() {
  if (!editorEl.value) {
    return;
  }

  const [monaco, jsonContribution] = await Promise.all([
    import('monaco-editor/esm/vs/editor/editor.api'),
    import('monaco-editor/esm/vs/language/json/monaco.contribution'),
  ]);
  const windowWithMonaco = window as typeof window & {
    MonacoEnvironment?: {
      getWorker: (_workerId: string, label: string) => Worker;
    };
  };

  windowWithMonaco.MonacoEnvironment = {
    getWorker(_workerId, label) {
      return new Worker(label === 'json' ? jsonWorkerUrl : editorWorkerUrl);
    },
  };

  monacoApi = monaco;
  const jsonDefaultsModule = jsonContribution as unknown as JsonDefaultsModule;
  const jsonDefaults = jsonDefaultsModule.jsonDefaults || jsonDefaultsModule.default?.jsonDefaults;
  if (!jsonDefaults) {
    throw new Error('Monaco JSON language defaults are unavailable');
  }

  jsonDefaults.setDiagnosticsOptions({
    validate: true,
    allowComments: false,
    schemas: [
      {
        uri: `https://unpkg.com/@algoux/standard-ranklist@${srkPkg.version}/schema.json`,
        fileMatch: ['*'],
        schema: srkSchema,
      },
    ],
  });

  editor = monaco.editor.create(editorEl.value, {
    value: code.value,
    language: 'json',
    theme: currentEditorTheme(),
    automaticLayout: true,
    fontSize: 13,
    minimap: { enabled: true },
    scrollBeyondLastLine: false,
    selectOnLineNumbers: true,
  });
  changeSubscription = editor.onDidChangeModelContent(scheduleCodeSync);
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, syncEditorCode);

  themeObserver = new MutationObserver(() => {
    monacoApi?.editor.setTheme(currentEditorTheme());
  });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

  ready.value = true;
  editor.focus();
  showWelcome.value = window.localStorage.getItem(LocalStorageKey.PlaygroundWelcomeMessageRead) !== 'true';
}

function updateRemainingHeight() {
  const headerHeight = document.querySelector('header')?.getBoundingClientRect().height || 0;
  remainingHeight.value = Math.max(480, document.body.clientHeight - headerHeight);
}

function restoreEditorWidth() {
  const storedWidth = Number(window.localStorage.getItem(LocalStorageKey.PlaygroundEditorWidth));
  editorWidth.value = clampEditorWidth(Number.isFinite(storedWidth) && storedWidth > 0 ? storedWidth : DEFAULT_EDITOR_WIDTH);
}

function updateEditorWidthAfterResize() {
  editorWidth.value = clampEditorWidth(editorWidth.value);
  layoutEditor();
}

function startResize(event: MouseEvent) {
  if (isMobileLayout()) {
    return;
  }
  isResizing.value = true;
  dragStartX = event.clientX;
  dragStartEditorWidth = editorWidth.value;
  window.addEventListener('mousemove', resizeEditor);
  window.addEventListener('mouseup', stopResize, { once: true });
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
  event.preventDefault();
}

function resizeEditor(event: MouseEvent) {
  if (!isResizing.value) {
    return;
  }
  editorWidth.value = clampEditorWidth(dragStartEditorWidth + event.clientX - dragStartX);
  layoutEditor();
}

function stopResize() {
  if (!isResizing.value) {
    return;
  }
  isResizing.value = false;
  window.removeEventListener('mousemove', resizeEditor);
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
  persistEditorWidth();
}

function handleResizeKeydown(event: KeyboardEvent) {
  if (isMobileLayout()) {
    return;
  }

  const step = event.shiftKey ? 80 : 20;
  if (event.key === 'ArrowLeft') {
    editorWidth.value = clampEditorWidth(editorWidth.value - step);
  } else if (event.key === 'ArrowRight') {
    editorWidth.value = clampEditorWidth(editorWidth.value + step);
  } else if (event.key === 'Home') {
    editorWidth.value = EDITOR_MIN_WIDTH;
  } else if (event.key === 'End') {
    editorWidth.value = editorMaxWidth.value;
  } else {
    return;
  }

  event.preventDefault();
  layoutEditor();
  persistEditorWidth();
}

function persistEditorWidth() {
  window.localStorage.setItem(LocalStorageKey.PlaygroundEditorWidth, String(Math.round(editorWidth.value)));
}

function clampEditorWidth(width: number) {
  return Math.min(Math.max(Math.round(width), EDITOR_MIN_WIDTH), getEditorMaxWidth());
}

function getEditorMaxWidth() {
  const containerWidth = containerEl.value?.clientWidth || window.innerWidth;
  return Math.max(EDITOR_MIN_WIDTH, containerWidth - PREVIEW_MIN_WIDTH - RESIZER_WIDTH);
}

function layoutEditor() {
  window.requestAnimationFrame(() => {
    editor?.layout();
  });
}

function isMobileLayout() {
  return window.matchMedia('(max-width: 768px)').matches;
}

function scheduleCodeSync() {
  if (changeTimer !== undefined) {
    window.clearTimeout(changeTimer);
  }
  changeTimer = window.setTimeout(syncEditorCode, 250);
}

function syncEditorCode() {
  if (!editor) {
    return;
  }
  code.value = editor.getValue() || '';
}

function currentEditorTheme() {
  return document.documentElement.classList.contains('dark') ? 'vs-dark' : 'vs-light';
}

function dismissWelcome() {
  window.localStorage.setItem(LocalStorageKey.PlaygroundWelcomeMessageRead, 'true');
  showWelcome.value = false;
}

function handleWelcomeOpenChange(open: boolean) {
  if (open) {
    showWelcome.value = true;
    return;
  }
  dismissWelcome();
}
</script>

<style scoped>
.srk-playground-container {
  display: flex;
  min-height: 480px;
  overflow: hidden;
  border-top: 1px solid hsl(var(--border));
  background: hsl(var(--background));
}

.srk-playground-editor {
  flex: 0 0 auto;
  min-width: 320px;
  height: 100%;
}

.srk-playground-resizer {
  position: relative;
  z-index: 2;
  width: 7px;
  flex: 0 0 7px;
  border: 0;
  background: transparent;
  cursor: col-resize;
}

.srk-playground-resizer::before {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 1px;
  background: hsl(var(--border));
  content: '';
  transform: translateX(-50%);
  transition: width 0.16s, background-color 0.16s;
}

.srk-playground-resizer:hover,
.srk-playground-resizer:focus-visible,
.srk-playground-container.is-resizing .srk-playground-resizer {
  outline: 0;
}

.srk-playground-resizer:hover::before,
.srk-playground-resizer:focus-visible::before,
.srk-playground-container.is-resizing .srk-playground-resizer::before {
  width: 3px;
  background: rgb(var(--rankland-primary-rgb));
}

.srk-playground-preview {
  position: relative;
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  padding: 0 1rem 1rem;
}

.playground-welcome-content p {
  margin: 0 0 0.75rem;
  line-height: 1.7;
}

.playground-welcome-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

@media (max-width: 768px) {
  .srk-playground-container {
    flex-direction: column;
    height: auto !important;
    min-height: 720px;
  }

  .srk-playground-editor {
    width: 100%;
    min-width: 0;
    height: 360px;
    flex-basis: auto;
  }

  .srk-playground-resizer {
    width: 100%;
    height: 7px;
    flex: 0 0 7px;
    cursor: default;
  }

  .srk-playground-resizer::before {
    top: 50%;
    right: 0;
    bottom: auto;
    left: 0;
    width: auto;
    height: 1px;
    transform: translateY(-50%);
  }

  .srk-playground-resizer:hover::before,
  .srk-playground-resizer:focus-visible::before,
  .srk-playground-container.is-resizing .srk-playground-resizer::before {
    width: auto;
    height: 3px;
  }
}
</style>
