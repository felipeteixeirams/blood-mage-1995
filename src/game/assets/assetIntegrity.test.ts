import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const SCAN_DIRS = ['src/assets', 'public/assets', 'public/fonts', 'public'];

const MAGIC_SIGNATURES: Record<string, number[]> = {
  '.png': [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  '.jpg': [0xff, 0xd8, 0xff],
  '.jpeg': [0xff, 0xd8, 0xff],
  '.webp': [0x52, 0x49, 0x46, 0x46],
  '.gif': [0x47, 0x49, 0x46, 0x38],
  '.woff2': [0x77, 0x4f, 0x46, 0x32],
};

function getAllBinaryFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['node_modules', 'dist', '.git'].includes(entry.name)) {
        results.push(...getAllBinaryFiles(fullPath));
      }
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (MAGIC_SIGNATURES[ext]) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

describe('Binary Asset Integrity Guardrail', () => {
  const binaryFiles = SCAN_DIRS.flatMap(getAllBinaryFiles);

  it('should find binary assets to validate', () => {
    expect(binaryFiles.length).toBeGreaterThan(10);
  });

  it('should have pure non-corrupted headers with no UTF-8 replacement chars', () => {
    const corruptedFiles: string[] = [];

    for (const file of binaryFiles) {
      const stat = fs.statSync(file);
      if (stat.size < 8) {
        corruptedFiles.push(`${file} (too small: ${stat.size} bytes)`);
        continue;
      }

      const buffer = Buffer.alloc(Math.min(stat.size, 64));
      const fd = fs.openSync(file, 'r');
      fs.readSync(fd, buffer, 0, buffer.length, 0);
      fs.closeSync(fd);

      // Check UTF-8 replacement byte sequence (EF BF BD)
      if (buffer[0] === 0xef && buffer[1] === 0xbf && buffer[2] === 0xbd) {
        corruptedFiles.push(`${file} (UTF-8 replacement detected)`);
        continue;
      }

      const ext = path.extname(file).toLowerCase();
      const expected = MAGIC_SIGNATURES[ext];
      if (expected) {
        let match = true;
        for (let i = 0; i < expected.length; i++) {
          if (buffer[i] !== expected[i]) {
            match = false;
            break;
          }
        }
        if (!match) {
          corruptedFiles.push(`${file} (invalid magic bytes for ${ext})`);
        }
      }
    }

    expect(corruptedFiles).toEqual([]);
  });

  it('should have valid PNG dimensions and headers for all PNG files', () => {
    const pngFiles = binaryFiles.filter(f => f.endsWith('.png'));

    for (const file of pngFiles) {
      const stat = fs.statSync(file);
      expect(stat.size).toBeGreaterThan(24);

      const buffer = Buffer.alloc(24);
      const fd = fs.openSync(file, 'r');
      fs.readSync(fd, buffer, 0, 24, 0);
      fs.closeSync(fd);

      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);

      expect(width).toBeGreaterThan(0);
      expect(height).toBeGreaterThan(0);
      expect(width).toBeLessThan(10000);
      expect(height).toBeLessThan(10000);
    }
  });
});
