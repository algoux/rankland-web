import { loader, VueMonacoEditor } from '@guolao/vue-monaco-editor';

export type PlaygroundMonacoApi = typeof import('monaco-editor');

type PlaygroundMonacoLoader = typeof loader & {
  default?: typeof loader;
};

export function configurePlaygroundMonacoLoader() {
  const monacoLoader = loader as PlaygroundMonacoLoader;
  const configurableLoader = typeof monacoLoader.config === 'function' ? monacoLoader : monacoLoader.default;

  configurableLoader?.config({
    paths: {
      vs: '/monaco-editor/vs',
    },
  });
}

export { VueMonacoEditor };
