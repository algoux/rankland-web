const VUE_DEVELOPMENT_PROPERTIES = new Set(['__VUE_HMR_RUNTIME__', '__vnode', '__vueParentComponent']);

// Inspect executable property access, not strings/comments or sourcesContent in
// source maps. Minification preserves these externally visible Vue properties.
function findVueDevelopmentProperties(ast) {
  const found = new Set();
  const pending = [ast];
  while (pending.length > 0) {
    const node = pending.pop();
    if (node.type === 'MemberExpression') {
      const property = node.computed
        ? (node.property.type === 'Literal' ? node.property.value : undefined)
        : node.property.name;
      if (VUE_DEVELOPMENT_PROPERTIES.has(property)) {
        found.add(property);
      }
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) {
        for (const child of value) {
          if (child && typeof child.type === 'string') pending.push(child);
        }
      } else if (value && typeof value.type === 'string') {
        pending.push(value);
      }
    }
  }
  return [...found].sort();
}

function productionClientGuard() {
  return {
    name: 'rankland-production-client-guard',
    apply: 'build',
    enforce: 'post',
    configResolved(config) {
      if (!config.isProduction || config.define['process.env.NODE_ENV'] !== JSON.stringify('production')) {
        throw new Error(
          'RankLand builds require NODE_ENV=production before vite-ssr resolves Vite config. Use npm run build:client; --mode production alone is insufficient.',
        );
      }
    },
    generateBundle(_options, bundle) {
      for (const output of Object.values(bundle)) {
        if (output.type !== 'chunk') continue;
        const properties = findVueDevelopmentProperties(this.parse(output.code));
        if (properties.length > 0) {
          this.error(`Vue development runtime found in ${output.fileName}: ${properties.join(', ')}`);
        }
      }
    },
  };
}

module.exports = { productionClientGuard };
