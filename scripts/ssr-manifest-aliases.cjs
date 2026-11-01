const fs = require('node:fs');
const path = require('node:path');

function normalizeSsrManifest(manifest, bundle = {}) {
  const result = Object.fromEntries(Object.entries(manifest).map(([id, files]) => [id, [...files]]));
  for (const [id, files] of Object.entries(manifest)) {
    const match = id.match(/^(.+\.vue)\?vue(?:&|$)/);
    if (match) result[match[1]] = [...new Set([...(result[match[1]] || []), ...files])];
  }
  const chunks = Object.values(bundle).filter(entry => entry.type === 'chunk');
  for (const [id, files] of Object.entries(result)) {
    if (!id.endsWith('.vue')) continue;
    const assets = new Set();
    const visited = new Set();
    const visit = (fileName, prefix) => {
      if (visited.has(fileName)) return;
      visited.add(fileName);
      const chunk = bundle[fileName];
      if (!chunk || chunk.type !== 'chunk') return;
      // Dynamic imports (e.g. G2) stay demand-loaded.
      for (const dependency of chunk.imports || []) visit(dependency, prefix);
      // Preserve dependency-before-component cascade order, like module loading.
      for (const css of chunk.viteMetadata?.importedCss || []) assets.add(prefix + css);
    };
    for (const url of files) {
      assets.add(url);
      const chunk = chunks.find(entry => url === entry.fileName || url.endsWith('/' + entry.fileName));
      if (chunk) visit(chunk.fileName, url.slice(0, url.length - chunk.fileName.length));
    }
    result[id] = [...assets];
  }
  return result;
}

function ssrManifestAliases() {
  return {
    name: 'rankland-ssr-manifest-aliases',
    apply: 'build',
    writeBundle(output, bundle) {
      const asset = bundle['ssr-manifest.json'];
      if (!asset || asset.type !== 'asset') return;
      const normalized = normalizeSsrManifest(JSON.parse(String(asset.source)), bundle);
      asset.source = JSON.stringify(normalized, null, 2);
      fs.writeFileSync(path.join(output.dir, asset.fileName), asset.source);
    },
  };
}

module.exports = { normalizeSsrManifest, ssrManifestAliases };
