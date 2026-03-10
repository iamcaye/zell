import { gzipSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const budgetBytes = 40 * 1024;
const bundlePath = resolve('packages/core/dist/index.js');
const buffer = readFileSync(bundlePath);
const gzipBytes = gzipSync(buffer).byteLength;

if (gzipBytes > budgetBytes) {
  console.error(`Core bundle gzip size ${gzipBytes}B exceeds budget ${budgetBytes}B`);
  process.exit(1);
}

console.log(`Core bundle gzip size ${gzipBytes}B within budget ${budgetBytes}B`);
