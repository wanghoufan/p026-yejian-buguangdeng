#!/usr/bin/env node
'use strict';
/* global Buffer, __dirname */

/**
 * 生成 assets/color-wheel.png（HSV 色盘贴图）。
 *
 * 规格（PLAN V1.1 §8 / T039）：
 * - 512 × 512 RGBA；
 * - H（色相）绕圆心 0–360° 环绕；
 * - S（饱和度）圆心 0 → 边缘 1（因此圆心自然为白色）；
 * - V（明度）固定 1；
 * - 圆外透明，边缘 1px 抗锯齿。
 *
 * 零依赖：PNG 由 node:zlib 手工编码，不引入 pngjs/canvas 等（Expo Go 也不需要它）。
 * 用法：npm run assets:wheel
 */

const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const SIZE = 512;
const OUT_FILE = path.join(__dirname, '..', 'assets', 'color-wheel.png');

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([length, body, crc]);
}

/** h: 0–360, s: 0–1, v: 0–1 → 0–255 整数 RGB */
function hsvToRgb(h, s, v) {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

/** 计算某点的 RGBA（圆外为全透明，边缘 1px 抗锯齿）。 */
function samplePixel(x, y, center, radius) {
  const dx = x + 0.5 - center;
  const dy = y + 0.5 - center;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist >= radius + 0.5) return [0, 0, 0, 0];

  let hue = (Math.atan2(dy, dx) * 180) / Math.PI;
  if (hue < 0) hue += 360;
  const sat = Math.min(1, dist / radius);
  const [r, g, b] = hsvToRgb(hue, sat, 1);
  const alpha = dist <= radius - 0.5 ? 255 : Math.round((radius + 0.5 - dist) * 255);
  return [r, g, b, alpha];
}

/**
 * 生成原始扫描线：每行 1 字节 filter type + RGBA。
 * 行过滤器用 Sub（左像素差分）：径向渐变的水平差分接近 0，
 * 体积从 ~456KB 降到 ~39KB，且完全无损。
 */
function buildRawPixels() {
  const stride = SIZE * 4;
  const pixels = Buffer.alloc(SIZE * stride);
  const center = SIZE / 2;
  const radius = SIZE / 2;

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const [r, g, b, a] = samplePixel(x, y, center, radius);
      const offset = y * stride + x * 4;
      pixels[offset] = r;
      pixels[offset + 1] = g;
      pixels[offset + 2] = b;
      pixels[offset + 3] = a;
    }
  }

  const raw = Buffer.alloc(SIZE * (stride + 1));
  let offset = 0;
  for (let y = 0; y < SIZE; y++) {
    raw[offset++] = 1; // filter type: Sub
    const row = y * stride;
    for (let i = 0; i < stride; i++) {
      const left = i >= 4 ? pixels[row + i - 4] : 0;
      raw[offset++] = (pixels[row + i] - left) & 0xff;
    }
  }
  return raw;
}

function encodePng(rawPixels) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(SIZE, 0);
  ihdr.writeUInt32BE(SIZE, 4);
  ihdr.writeUInt8(8, 8); // bit depth
  ihdr.writeUInt8(6, 9); // color type: RGBA
  ihdr.writeUInt8(0, 10); // compression: deflate
  ihdr.writeUInt8(0, 11); // filter: adaptive
  ihdr.writeUInt8(0, 12); // interlace: none

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(rawPixels, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function main() {
  const png = encodePng(buildRawPixels());
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, png);
  process.stdout.write(
    `color-wheel.png written: ${path.relative(process.cwd(), OUT_FILE)} ` +
      `${SIZE}x${SIZE} RGBA, ${png.length} bytes\n`,
  );
}

main();
