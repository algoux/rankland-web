const fs = require('fs').promises;
const path = require('path');

async function listUploadFiles(baseDir, dir = baseDir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  let fileNames = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      fileNames = fileNames.concat(await listUploadFiles(baseDir, fullPath));
      continue;
    }

    if (entry.name.endsWith('.map')) {
      continue;
    }

    fileNames.push(path.relative(baseDir, fullPath));
  }

  return fileNames;
}

module.exports = {
  listUploadFiles,
};
