const path = require('path');
const COS = require('cos-nodejs-sdk-v5');
const { listUploadFiles } = require('./upload-cos-lib.cjs');

const REMOTE_PATH = process.env.COS_BASE_PATH || 'rankland/dist/';
const baseDir = path.join(__dirname, '../dist/client');

async function main() {
  if (!process.env.COS_SECRET_ID || !process.env.COS_SECRET_KEY || !process.env.COS_BUCKET || !process.env.COS_REGION) {
    throw new Error('COS_SECRET_ID, COS_SECRET_KEY, COS_BUCKET, COS_REGION must be set');
  }

  const cos = new COS({
    SecretId: process.env.COS_SECRET_ID,
    SecretKey: process.env.COS_SECRET_KEY,
    Domain: process.env.COS_DOMAIN,
  });
  const files = await listUploadFiles(baseDir);
  const indexFileIndex = files.indexOf('index.html');
  if (indexFileIndex > -1) {
    files.push(files.splice(indexFileIndex, 1)[0]);
  }

  for (const file of files) {
    const remotePath = `${REMOTE_PATH}${file}`;
    console.log(`Uploading ${file} -> ${remotePath}`);
    await cos.uploadFile({
      Bucket: process.env.COS_BUCKET,
      Region: process.env.COS_REGION,
      Key: remotePath,
      FilePath: path.join(baseDir, file),
    });
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
