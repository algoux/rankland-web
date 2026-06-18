<template>
  <div
    ref="containerEl"
    class="srk-playground-container"
    :class="{ 'is-resizing': isResizing }"
    :style="{ height: `${remainingHeight}px` }"
    data-id="srk-playground-container"
    @dragenter="handleFileDragEnter"
    @dragover="handleFileDragOver"
    @dragleave="handleFileDragLeave"
    @drop="handleFileDrop"
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
        Input valid srk JSON to preview
      </h3>
      <div
        v-else
        class="mt-8 mb-8"
        data-id="playground-preview"
        :data-row-count="String(parsedCode.data?.rows.length || 0)"
        :data-ranklist-id="ranklistId || ''"
      >
        <StyledRanklist
          :data="parsedCode.data"
          name="playground"
          :id="ranklistId || undefined"
          :show-progress="false"
          show-filter
        />
      </div>
    </div>

    <div
      v-if="isFileDragActive"
      class="srk-playground-drop-overlay"
      data-id="playground-drop-overlay"
      role="status"
      aria-live="polite"
    >
      <div class="srk-playground-drop-panel">
        <FileUp class="srk-playground-drop-icon" :size="40" />
        <p class="srk-playground-drop-title">拖放 srk 文件</p>
        <p class="srk-playground-drop-text">释放后自动导入编辑器</p>
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
import { computed, markRaw, nextTick, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';
import { CircleHelp, FileUp } from 'lucide-vue-next';
import { toast } from 'vue-sonner';
import { Modal } from '@algoux/standard-ranklist-renderer-component-vue';
import { Button } from '@/components/ui/button';
import Loading from '@/components/common/Loading.vue';
import StyledRanklist from '@/components/ranklist/StyledRanklist.vue';
import { LocalStorageKey } from '@/app/local-storage-key.config';
import {
  createDefaultPlaygroundCode,
  isLargePlaygroundDocument,
  loadPlaygroundInitialCode,
  parsePlaygroundCode,
  shouldUseFastFullDocumentPaste,
} from './playground-code';
import type { PlaygroundCodeResult } from './playground-code';
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

const props = defineProps<{
  sourceUrl?: string;
  ranklistId?: string;
}>();

const editorEl = ref<HTMLElement | null>(null);
const containerEl = ref<HTMLElement | null>(null);
const code = ref(createDefaultPlaygroundCode());
const parsedCode = shallowRef<PlaygroundCodeResult>(createPreviewCodeResult(code.value));
const ready = ref(false);
const initializationError = ref('');
const showWelcome = ref(false);
const remainingHeight = ref(640);
const editorWidth = ref(500);
const isMobileEditorLayout = ref(false);
const isResizing = ref(false);
const isFileDragActive = ref(false);
const fileDragDepth = ref(0);

const EDITOR_MIN_WIDTH = 320;
const PREVIEW_MIN_WIDTH = 360;
const DEFAULT_EDITOR_WIDTH = 500;
const RESIZER_WIDTH = 7;
const INVALID_SRK_FILE_MESSAGE = '不是有效的 srk 文件';
const SOURCE_LOAD_FAILED_MESSAGE = '无法加载 srk 文件，已回退到默认示例';

let monacoApi: MonacoApi | null = null;
let editor: MonacoEditorNamespace.IStandaloneCodeEditor | null = null;
let changeSubscription: IDisposable | null = null;
let resizeObserver: ResizeObserver | null = null;
let themeObserver: MutationObserver | null = null;
let changeTimer: number | undefined;
let previewTimer: number | undefined;
let settingEditorCode = false;
let dragStartX = 0;
let dragStartEditorWidth = DEFAULT_EDITOR_WIDTH;

const editorMaxWidth = computed(() => getEditorMaxWidth());
const editorPaneStyle = computed(() => ({
  width: isMobileEditorLayout.value ? '100%' : `${editorWidth.value}px`,
}));

onMounted(async () => {
  updateEditorLayoutMode();
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
  await initializeEditorCode();
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
  if (previewTimer !== undefined) {
    window.clearTimeout(previewTimer);
  }
  document.removeEventListener('paste', handleEditorPasteCapture, true);
  editorEl.value?.removeEventListener('paste', handleEditorPasteCapture, true);
  changeSubscription?.dispose();
  editor?.dispose();
});

async function initializeEditorCode() {
  const result = await loadPlaygroundInitialCode({
    sourceUrl: props.sourceUrl,
  });
  code.value = result.code;
  parsedCode.value = createPreviewCodeResult(result.code);
  if (result.error) {
    console.error('[Playground] failed to load srk source:', result.error);
    toast.error(SOURCE_LOAD_FAILED_MESSAGE);
  }
}

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
    autoIndent: 'none',
    autoIndentOnPaste: false,
    bracketPairColorization: { enabled: false },
    folding: false,
    fontSize: 13,
    formatOnPaste: false,
    largeFileOptimizations: true,
    matchBrackets: 'never',
    minimap: { enabled: true },
    occurrencesHighlight: 'off',
    scrollBeyondLastLine: false,
    selectOnLineNumbers: true,
    selectionHighlight: false,
    wordBasedSuggestions: 'off',
  });
  document.addEventListener('paste', handleEditorPasteCapture, true);
  editorEl.value.addEventListener('paste', handleEditorPasteCapture, true);
  changeSubscription = editor.onDidChangeModelContent(scheduleCodeSync);

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
  const nextWidth = Number.isFinite(storedWidth) && storedWidth > 0 ? Math.round(storedWidth) : DEFAULT_EDITOR_WIDTH;
  editorWidth.value = isMobileEditorLayout.value ? nextWidth : clampEditorWidth(nextWidth);
}

function updateEditorWidthAfterResize() {
  updateEditorLayoutMode();
  if (isMobileEditorLayout.value) {
    layoutEditor();
    return;
  }
  editorWidth.value = clampEditorWidth(editorWidth.value);
  layoutEditor();
}

function updateEditorLayoutMode() {
  isMobileEditorLayout.value = isMobileLayout();
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

function handleEditorPasteCapture(event: ClipboardEvent) {
  if (!editor) {
    return;
  }
  if (!isPasteEventForEditor(event)) {
    return;
  }

  const pastedText = event.clipboardData?.getData('text/plain') || '';
  if (!shouldUseFastFullDocumentPaste({
    isCurrentDocumentLarge: isCurrentEditorDocumentLarge(),
    isFullDocumentSelection: isFullEditorSelection(),
    pastedText,
  })) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  replaceEditorModelWithoutUndo(pastedText);
}

function isPasteEventForEditor(event: ClipboardEvent) {
  const target = event.target;
  if (target instanceof Node && editorEl.value?.contains(target)) {
    return true;
  }

  return editor?.hasTextFocus() || false;
}

function isFullEditorSelection() {
  const model = editor?.getModel();
  const selections = editor?.getSelections();
  if (!model || !selections?.length) {
    return false;
  }

  const lastLineNumber = model.getLineCount();
  const lastColumn = model.getLineMaxColumn(lastLineNumber);

  return selections.some((selection) => (
    selection.startLineNumber <= 1
    && selection.startColumn <= 1
    && selection.endLineNumber >= lastLineNumber
    && selection.endColumn >= lastColumn
  ));
}

function isCurrentEditorDocumentLarge() {
  const model = editor?.getModel();
  if (!model) {
    return false;
  }

  return isLargePlaygroundDocument({
    characterCount: model.getValueLength(),
    lineCount: model.getLineCount(),
  });
}

function replaceEditorModelWithoutUndo(nextCode: string) {
  const model = editor?.getModel();
  if (!model) {
    setEditorCode(nextCode);
    return;
  }

  if (changeTimer !== undefined) {
    window.clearTimeout(changeTimer);
    changeTimer = undefined;
  }

  settingEditorCode = true;
  try {
    model.setValue(nextCode);
    editor?.setPosition({ lineNumber: 1, column: 1 });
    editor?.setScrollTop(0);
    editor?.setScrollLeft(0);
  } finally {
    settingEditorCode = false;
  }

  applyEditorCode(nextCode);
  editor?.focus();
}

function scheduleCodeSync() {
  if (settingEditorCode) {
    return;
  }
  if (changeTimer !== undefined) {
    window.clearTimeout(changeTimer);
  }
  changeTimer = window.setTimeout(syncEditorCode, 250);
}

function syncEditorCode() {
  changeTimer = undefined;
  if (!editor) {
    return;
  }

  const nextCode = editor.getValue() || '';
  applyEditorCode(nextCode);
}

function setEditorCode(nextCode: string) {
  if (changeTimer !== undefined) {
    window.clearTimeout(changeTimer);
    changeTimer = undefined;
  }

  if (editor && editor.getValue() !== nextCode) {
    settingEditorCode = true;
    try {
      editor.setValue(nextCode);
    } finally {
      settingEditorCode = false;
    }
  }
  applyEditorCode(nextCode);
  editor?.focus();
}

function applyEditorCode(nextCode: string) {
  code.value = nextCode;
  if (previewTimer !== undefined) {
    window.clearTimeout(previewTimer);
  }

  previewTimer = window.setTimeout(() => {
    previewTimer = undefined;
    parsedCode.value = createPreviewCodeResult(nextCode);
  }, 0);
}

function createPreviewCodeResult(nextCode: string): PlaygroundCodeResult {
  const result = parsePlaygroundCode(nextCode);
  if (!result.valid || !result.data) {
    return result;
  }
  return {
    valid: true,
    data: markRaw(result.data),
  };
}

function hasDraggedFiles(event: DragEvent) {
  return Array.from(event.dataTransfer?.types || []).includes('Files');
}

function acceptFileDrag(event: DragEvent) {
  if (!hasDraggedFiles(event)) {
    return false;
  }

  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy';
  }
  return true;
}

function handleFileDragEnter(event: DragEvent) {
  if (!acceptFileDrag(event)) {
    return;
  }

  fileDragDepth.value += 1;
  isFileDragActive.value = true;
}

function handleFileDragOver(event: DragEvent) {
  acceptFileDrag(event);
}

function handleFileDragLeave(event: DragEvent) {
  if (!hasDraggedFiles(event)) {
    return;
  }

  event.preventDefault();
  fileDragDepth.value = Math.max(0, fileDragDepth.value - 1);
  if (fileDragDepth.value === 0) {
    isFileDragActive.value = false;
  }
}

async function handleFileDrop(event: DragEvent) {
  if (!acceptFileDrag(event)) {
    return;
  }

  fileDragDepth.value = 0;
  isFileDragActive.value = false;

  const file = event.dataTransfer?.files?.[0];
  if (!file) {
    return;
  }

  if (!isJsonFile(file)) {
    toast.error(INVALID_SRK_FILE_MESSAGE);
    return;
  }

  try {
    setEditorCode(await file.text());
  } catch (error) {
    console.error('[Playground] failed to read dropped file:', error);
  }
}

function isJsonFile(file: File) {
  return file.type === 'application/json' || file.name.toLowerCase().endsWith('.json');
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
  position: relative;
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
  padding: 0 1rem 1rem 0;
}

.srk-playground-drop-overlay {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(0 0 0 / 45%);
  backdrop-filter: blur(2px);
  pointer-events: none;
}

.srk-playground-drop-panel {
  display: flex;
  width: min(360px, calc(100% - 48px));
  min-height: 160px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px dashed rgb(var(--rankland-primary-rgb));
  border-radius: 8px;
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  box-shadow: 0 18px 48px rgb(0 0 0 / 26%);
}

.srk-playground-drop-icon {
  color: rgb(var(--rankland-primary-rgb));
}

.srk-playground-drop-title {
  margin: 8px 0 0;
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.4;
}

.srk-playground-drop-text {
  margin: 0;
  color: hsl(var(--muted-foreground));
  font-size: 0.875rem;
  line-height: 1.5;
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
    max-width: 100%;
    min-width: 0;
    height: 360px;
    flex: 0 0 360px;
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
