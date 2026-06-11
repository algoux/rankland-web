const fs = require('fs').promises;
const path = require('path');
const { isSameOriginWorkerAsset } = require('./worker-assets.cjs');

function shouldUploadDistFile(fileName) {
  if (fileName.endsWith('.map')) {
    return false;
  }
  return !isSameOriginWorkerAsset(fileName);
}

async function listUploadFiles(baseDir, dir = baseDir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  let fileNames = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      fileNames = fileNames.concat(await listUploadFiles(baseDir, fullPath));
      continue;
    }

    const fileName = path.relative(baseDir, fullPath).replace(/\\/g, '/');
    if (!shouldUploadDistFile(fileName)) {
      continue;
    }

    fileNames.push(fileName);
  }

  return fileNames;
}

module.exports = {
  listUploadFiles,
  shouldUploadDistFile,
};
