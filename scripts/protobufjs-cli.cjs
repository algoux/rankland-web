const path = require('node:path');
const Module = require('node:module');

const command = process.argv[2];
if (command !== 'pbjs' && command !== 'pbts') {
  throw new Error('Usage: node scripts/protobufjs-cli.cjs <pbjs|pbts> [...args]');
}

// protobufjs 6 ships its CLI in the runtime package but assumes npm-style
// dependency hoisting. Prefer this project's explicitly pinned generator
// dependencies before loading the legacy CLI, so it never installs packages
// dynamically inside node_modules.
const utilPath = require.resolve('protobufjs/cli/util');
require(utilPath);
const utilModule = require.cache[utilPath];
if (!utilModule) {
  throw new Error('Failed to initialize protobufjs CLI utilities');
}
utilModule.paths.unshift(path.resolve(__dirname, '../node_modules'));

const pinnedGeneratorModules = new Map([
  ['escodegen', require.resolve('escodegen')],
  ['uglify-js', require.resolve('uglify-js')],
]);
const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function resolvePinnedGeneratorModule(request, parent, isMain, options) {
  if (parent?.filename.includes('/protobufjs/cli/') && pinnedGeneratorModules.has(request)) {
    return pinnedGeneratorModules.get(request);
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

const cli = require(`protobufjs/cli/${command}`);
const exitCode = cli.main(process.argv.slice(3));
if (typeof exitCode === 'number' && exitCode !== 0) {
  process.exitCode = exitCode;
}
