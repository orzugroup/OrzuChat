#!/usr/bin/env node
/**
 * Upload an APK to the Cloudflare R2 bucket `orzuchat`.
 *
 * Needs env:
 *   CLOUDFLARE_ACCOUNT_ID
 *   R2_ACCESS_KEY_ID
 *   R2_SECRET_ACCESS_KEY
 *
 *   node scripts/upload-apk-r2.mjs path\to\orzuchat.apk
 */

import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';

const file = process.argv[2];
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
const accessKey = process.env.R2_ACCESS_KEY_ID?.trim();
const secret = process.env.R2_SECRET_ACCESS_KEY?.trim();
const bucket = process.env.R2_BUCKET?.trim() || 'orzuchat';
const key = process.env.R2_OBJECT_KEY?.trim() || 'orzuchat.apk';

if (!file || !accountId || !accessKey || !secret) {
  console.error(`Usage:
  set CLOUDFLARE_ACCOUNT_ID=...
  set R2_ACCESS_KEY_ID=...
  set R2_SECRET_ACCESS_KEY=...
  node scripts/upload-apk-r2.mjs ${file || 'orzuchat.apk'}
`);
  process.exit(1);
}

const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3').catch(() => {
  console.error('Install once: npm install @aws-sdk/client-s3');
  process.exit(1);
});

const body = await readFile(file);
const client = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: accessKey, secretAccessKey: secret },
});

await client.send(
  new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: 'application/vnd.android.package-archive',
    ContentDisposition: `attachment; filename="${basename(file)}"`,
  }),
);

console.log(`OK — uploaded ${body.length} bytes to r2://${bucket}/${key}`);
