const path = require('path');
const fs = require('fs');
const NbClientVueRouteGenerator = require('bwcx-client-vue/generators/route').default;

const generatedOutputPaths = [
  path.join(__dirname, '../src/client/router/routes.ts'),
  path.join(__dirname, '../src/client/router/types.d.ts'),
  path.join(__dirname, '../src/common/router/client-routes.ts'),
];

function normalizeGeneratedFiles() {
  generatedOutputPaths.forEach((filePath) => {
    const content = fs.readFileSync(filePath, 'utf8');
    const normalizedContent = content.replace(/\n{2,}$/, '\n');
    if (normalizedContent !== content) {
      fs.writeFileSync(filePath, normalizedContent);
    }
  });
}

const gen = new NbClientVueRouteGenerator({
  vueMajorVersion: '3',
  clientDir: path.join(__dirname, '../src/client'),
  commonDir: path.join(__dirname, '../src/common'),
  outClientRouterPath: path.join(__dirname, '../src/client/router/routes.ts'),
  outClientRouterTypesPath: path.join(__dirname, '../src/client/router/types.d.ts'),
  outCommonRouterPath: path.join(__dirname, '../src/common/router/client-routes.ts'),
  scanGlobs: [
    'modules/**/*.view.vue',
    'modules/**/*.view.tsx',
    '!modules/e2e/**/*.view.vue',
    '!modules/e2e/**/*.view.tsx',
  ],
  codegenMode: 'reference',
});

const generate = gen.generate.bind(gen);
gen.generate = () => {
  generate();
  normalizeGeneratedFiles();
};

gen.fullGenerate();

if (process.argv.includes('--watch')) {
  gen.watch();
}
