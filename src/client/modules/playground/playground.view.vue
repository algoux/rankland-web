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
        <textarea
          v-model="draftSource"
          data-id="playground-editor"
          class="playground-editor"
          spellcheck="false"
          @keydown="handleEditorKeydown"
        />
        <button data-id="playground-preview-action" class="playground-preview-action" type="button" @click="previewSource">
          Preview
        </button>
      </div>

      <div class="playground-preview-pane">
        <div v-if="parseState.kind === 'invalid'" data-id="playground-invalid-json" class="playground-state">
          <h3>Input valid srk JSON and press Ctrl/Cmd + S to preview</h3>
          <pre>{{ parseState.message }}</pre>
        </div>

        <section v-else data-id="playground-preview" class="playground-preview">
          <div class="playground-preview-meta">
            Rows: <span data-id="playground-row-count">{{ rowCount }}</span>
          </div>
          <RanklandRanklist :ranklist="parseState.data" />
        </section>
      </div>
    </section>
  </main>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { routeView } from 'bwcx-client-vue3';
import demoRanklist from './assets/demo-ranklist.srk.json';
import RanklandRanklist from '@client/components/rankland-ranklist.vue';
import { formatTitle } from '@client/utils/title-format.util';
import { parsePlaygroundSrkSource, type PlaygroundSrkParseState } from './playground-srk';

const defaultSource = `${JSON.stringify(demoRanklist, null, 2)}\n`;

const PlaygroundPage = defineComponent({
  name: 'Playground',
  components: {
    RanklandRanklist,
  },
  data() {
    return {
      hydrated: false,
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
  },
  mounted() {
    this.hydrated = true;
  },
  methods: {
    previewSource() {
      this.parseState = parsePlaygroundSrkSource(this.draftSource);
    },
    handleEditorKeydown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        this.previewSource();
      }
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

.playground-editor {
  box-sizing: border-box;
  width: 100%;
  min-height: 640px;
  padding: 12px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
  font-size: 13px;
  line-height: 1.45;
  resize: vertical;
}

.playground-preview-action {
  align-self: flex-start;
  padding: 8px 16px;
  border: 1px solid #2368bf;
  border-radius: 4px;
  color: #fff;
  background: #2368bf;
  cursor: pointer;
}

.playground-preview-pane {
  min-width: 0;
  overflow-x: auto;
}

.playground-state {
  margin-top: 48px;
  text-align: center;

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

.playground-preview-meta {
  margin-bottom: 8px;
  color: #64748b;
  font-size: 13px;
}

@media (max-width: 900px) {
  .playground-layout {
    grid-template-columns: 1fr;
  }

  .playground-editor {
    min-height: 360px;
  }
}
</style>
