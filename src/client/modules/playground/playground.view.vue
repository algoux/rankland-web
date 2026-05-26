<template>
  <main data-id="playground-page" class="playground-page">
    <Head>
      <title>{{ pageTitle }}</title>
      <meta property="og:title" :content="pageTitle">
      <link rel="canonical" href="/playground">
    </Head>

    <section class="playground-toolbar">
      <div data-id="playground-hydrated" class="playground-hydrated">{{ hydrated ? 'hydrated' : 'csr' }}</div>
      <h1>Playground</h1>
      <a
        data-id="playground-docs-link"
        href="https://srk.algoux.org/zh/"
        target="_blank"
        rel="noreferrer"
      >
        srk 文档
      </a>
    </section>

    <section class="playground-layout">
      <div class="playground-editor-pane">
        <div data-id="playground-editor-ready" class="playground-editor-ready">
          {{ editorReady ? 'ready' : editorLoadingStage }}
        </div>
        <div
          data-id="playground-editor"
          class="playground-editor"
          data-editor-language="json"
          data-editor-diagnostics="srk-schema"
          :data-editor-theme="editorTheme"
          :style="{ height: `${remainingHeight}px` }"
        >
          <VueMonacoEditor
            v-model:value="draftSource"
            language="json"
            path="playground.srk.json"
            :theme="editorTheme"
            :height="`${remainingHeight}px`"
            :options="monacoEditorOptions"
            @beforeMount="handleMonacoBeforeMount"
            @mount="handleMonacoMount"
            @change="handleMonacoChange"
          >
            <template #default>
              <div class="playground-editor-loading">
                {{ editorLoadingStage }}
              </div>
            </template>
            <template #failure>
              <div data-id="playground-editor-error" class="playground-editor-loading">
                Failed to load Monaco editor
              </div>
            </template>
          </VueMonacoEditor>
        </div>
        <a-button
          data-id="playground-preview-action"
          class="playground-preview-action"
          type="primary"
          @click="previewSource"
        >
          Preview
        </a-button>
      </div>

      <div class="playground-preview-pane">
        <div v-if="editorErrorMessage" data-id="playground-editor-error" class="playground-state playground-state-error">
          <h3>Failed to load Monaco editor</h3>
          <pre>{{ editorErrorMessage }}</pre>
        </div>

        <div v-else-if="!editorReady" data-id="playground-editor-loading" class="playground-state">
          <h3>Loading editor...</h3>
        </div>

        <div v-else-if="parseState.kind === 'invalid'" data-id="playground-invalid-json" class="playground-state">
          <h3>
            Input valid srk JSON and press
            <a-tag color="blue" class="playground-shortcut-tag">Ctrl/Cmd + S</a-tag>
            to preview
          </h3>
        </div>

        <section v-else data-id="playground-preview" class="playground-preview">
          <div class="playground-preview-meta">
            Rows: <span data-id="playground-row-count">{{ rowCount }}</span>
          </div>
          <RanklandRanklist :ranklist="parseState.data" name="playground" show-header show-filter />
        </section>
      </div>
    </section>

    <a-modal
      v-if="welcomeVisible"
      v-model:open="welcomeVisible"
      :closable="false"
      :keyboard="false"
      :mask-closable="false"
      :destroy-on-close="true"
      width="600px"
    >
      <div data-id="playground-welcome-modal" class="playground-welcome-modal">
        <h2>欢迎来到演练场！</h2>
        <p>你可以调试标准榜单格式（srk）数据并实时预览效果，推荐使用桌面端设备。</p>
        <p>如果你是 OJ 开发者、Ranklist 贡献者或对此感兴趣，演练场可以帮助你直观地了解 srk 的字段及其作用。</p>
        <p>需要参考 srk 文档？请点击页面中的 srk 文档入口。</p>
      </div>
      <template #footer>
        <a-button data-id="playground-welcome-ok" type="primary" @click="confirmWelcome">
          OK
        </a-button>
      </template>
    </a-modal>
  </main>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { routeView } from 'bwcx-client-vue3';
import { throttle } from 'lodash';
import demoRanklist from './assets/demo-ranklist.srk.json';
import RanklandRanklist from '@client/components/rankland-ranklist.vue';
import { formatTitle } from '@client/utils/title-format.util';
import { parsePlaygroundSrkSource, type PlaygroundSrkParseState } from './playground-srk';
import {
  configurePlaygroundMonacoLoader,
  VueMonacoEditor,
  type PlaygroundMonacoApi,
} from './playground-monaco-loader';
import { getPlaygroundJsonDiagnosticsOptions, getPlaygroundMonacoTheme } from './playground-monaco';

const defaultSource = `${JSON.stringify(demoRanklist, null, 2)}\n`;
const playgroundWelcomeStorageKey = 'PlaygroundWelcomeMessageRead';
const minEditorHeight = 360;
const editorHeightPadding = 48;

type MonacoEditor = PlaygroundMonacoApi['editor']['IStandaloneCodeEditor'];

const PlaygroundPage = defineComponent({
  name: 'Playground',
  components: {
    RanklandRanklist,
    VueMonacoEditor,
  },
  data() {
    return {
      hydrated: false,
      editorReady: false,
      editorLoadingStage: 'loading',
      editorErrorMessage: '',
      editorTheme: 'vs-light' as 'vs-light' | 'vs-dark',
      remainingHeight: 640,
      editor: undefined as MonacoEditor | undefined,
      resizeObserver: undefined as ResizeObserver | undefined,
      themeObserver: undefined as MutationObserver | undefined,
      resizeListener: undefined as (() => void) | undefined,
      syncEditorSource: undefined as ((value: string) => void) | undefined,
      welcomeVisible: false,
      draftSource: defaultSource,
      parseState: parsePlaygroundSrkSource(defaultSource) as PlaygroundSrkParseState,
    };
  },
  computed: {
    pageTitle(): string {
      return formatTitle('Playground');
    },
    rowCount(): number {
      if (this.parseState.kind !== 'valid') {
        return 0;
      }

      return Array.isArray(this.parseState.data.rows) ? this.parseState.data.rows.length : 0;
    },
    monacoEditorOptions(): Record<string, unknown> {
      return {
        selectOnLineNumbers: true,
        automaticLayout: true,
        minimap: {
          enabled: false,
        },
        scrollBeyondLastLine: false,
      };
    },
  },
  beforeMount() {
    configurePlaygroundMonacoLoader();
  },
  mounted() {
    this.hydrated = true;
    this.editorTheme = this.getCurrentEditorTheme();
    this.refreshRemainingHeight();
    this.setupRemainingHeightObservers();
    this.setupThemeObserver();
    this.syncEditorSource = throttle((value: string) => {
      this.draftSource = value || '';
    }, 250);
  },
  beforeUnmount() {
    this.resizeObserver?.disconnect();
    this.themeObserver?.disconnect();
    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
    }
    this.cleanupE2EHooks();
  },
  methods: {
    previewSource() {
      this.syncDraftSourceFromEditor();
      this.parseState = parsePlaygroundSrkSource(this.draftSource);
    },
    handleMonacoBeforeMount(monacoApi: PlaygroundMonacoApi) {
      this.editorLoadingStage = 'configuring';
      monacoApi.languages.json.jsonDefaults.setDiagnosticsOptions(getPlaygroundJsonDiagnosticsOptions());
    },
    handleMonacoMount(editor: MonacoEditor, monacoApi: PlaygroundMonacoApi) {
      this.editor = editor;
      this.editor.addCommand(
        monacoApi.KeyMod.CtrlCmd | monacoApi.KeyCode.KeyS,
        () => this.previewSource(),
      );
      this.editor.focus();
      this.editorReady = true;
      this.editorLoadingStage = 'ready';
      this.setupE2EHooks();
      this.restoreWelcomeModalState();
    },
    handleMonacoChange(value: string | undefined) {
      this.syncEditorSource?.(value || '');
    },
    setupE2EHooks() {
      if (process.env.RANKLAND_E2E_PROBE !== '1') {
        return;
      }

      const win = window as typeof window & {
        __ranklandPreviewPlaygroundSource?: (source: string) => void;
      };
      win.__ranklandPreviewPlaygroundSource = (source: string) => {
        this.draftSource = source;
        this.parseState = parsePlaygroundSrkSource(source);
      };
    },
    cleanupE2EHooks() {
      if (process.env.RANKLAND_E2E_PROBE !== '1') {
        return;
      }

      const win = window as typeof window & {
        __ranklandPreviewPlaygroundSource?: (source: string) => void;
      };
      delete win.__ranklandPreviewPlaygroundSource;
    },
    syncDraftSourceFromEditor() {
      if (this.editor) {
        this.draftSource = this.editor.getValue();
      }
    },
    setupRemainingHeightObservers() {
      const refreshRemainingHeight = throttle(() => this.refreshRemainingHeight(), 250);
      this.resizeListener = refreshRemainingHeight;
      window.addEventListener('resize', refreshRemainingHeight);
      if (window.ResizeObserver) {
        this.resizeObserver = new ResizeObserver(refreshRemainingHeight);
        this.resizeObserver.observe(document.body);
      }
    },
    refreshRemainingHeight() {
      const headerHeight = document.querySelector('.ant-layout-header')?.getBoundingClientRect().height || 0;
      const remainingHeight = document.body.clientHeight - headerHeight - editorHeightPadding;
      this.remainingHeight = Math.max(minEditorHeight, remainingHeight);
      this.editor?.layout();
    },
    setupThemeObserver() {
      this.themeObserver = new MutationObserver(() => this.applyEditorTheme());
      this.themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      });
    },
    getCurrentEditorTheme() {
      return getPlaygroundMonacoTheme(document.documentElement.classList.contains('dark'));
    },
    applyEditorTheme() {
      const nextTheme = this.getCurrentEditorTheme();
      this.editorTheme = nextTheme;
    },
    restoreWelcomeModalState() {
      if (window.localStorage.getItem(playgroundWelcomeStorageKey) !== 'true') {
        this.welcomeVisible = true;
      }
    },
    confirmWelcome() {
      window.localStorage.setItem(playgroundWelcomeStorageKey, 'true');
      this.welcomeVisible = false;
    },
  },
});

export default routeView(PlaygroundPage, '/playground');
</script>

<style lang="less" scoped>
.playground-page {
  box-sizing: border-box;
  min-height: 70vh;
  padding: 24px 16px;
}

.playground-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  max-width: 1280px;
  margin: 0 auto 16px;

  h1 {
    margin: 0;
    font-size: 24px;
  }
}

.playground-hydrated {
  color: #64748b;
  font-size: 12px;
}

.playground-layout {
  display: grid;
  grid-template-columns: minmax(320px, 500px) minmax(0, 1fr);
  gap: 16px;
  max-width: 1280px;
  margin: 0 auto;
}

.playground-editor-pane {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 8px;
}

.playground-editor-ready {
  color: #64748b;
  font-size: 12px;
}

.playground-editor {
  box-sizing: border-box;
  width: 100%;
  min-height: 360px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  overflow: hidden;
}

.playground-editor-loading {
  display: flex;
  height: 100%;
  min-height: 360px;
  align-items: center;
  justify-content: center;
  color: #64748b;
  font-size: 13px;
}

.playground-preview-action {
  align-self: flex-start;
}

.playground-preview-pane {
  min-width: 0;
  overflow-x: auto;
}

.playground-state {
  margin-top: 48px;
  text-align: center;

  h3 {
    line-height: 1.8;
  }

  pre {
    display: inline-block;
    max-width: 100%;
    margin: 12px 0 0;
    padding: 12px;
    border: 1px solid #fecaca;
    border-radius: 4px;
    color: #991b1b;
    background: #fef2f2;
    text-align: left;
    white-space: pre-wrap;
  }
}

.playground-shortcut-tag {
  margin: 0 4px;
}

.playground-preview-meta {
  margin-bottom: 8px;
  color: #64748b;
  font-size: 13px;
}

.playground-welcome-modal {
  h2 {
    margin: 0 0 24px;
    color: #17202a;
    font-size: 20px;
    line-height: 1.4;
  }

  p {
    margin: 0 0 12px;
    color: #344256;
    line-height: 1.7;
  }
}

@media (max-width: 900px) {
  .playground-layout {
    grid-template-columns: 1fr;
  }

  .playground-editor {
    height: 360px !important;
  }
}
</style>
