const SAME_ORIGIN_WORKER_ASSET_RE = /^assets\/(?:rank-time-data\.worker|editor\.worker|json\.worker)-[^/]+\.js$/;

function normalizeAssetPath(fileName) {
  return fileName.replace(/^\/+/, '').replace(/\\/g, '/');
}

function isSameOriginWorkerAsset(fileName) {
  return SAME_ORIGIN_WORKER_ASSET_RE.test(normalizeAssetPath(fileName));
}

function toSameOriginWorkerAssetUrl(fileName) {
  return `/dist/${normalizeAssetPath(fileName)}`;
}

module.exports = {
  isSameOriginWorkerAsset,
  toSameOriginWorkerAssetUrl,
};
