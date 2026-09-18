import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, normalize } from 'node:path';

/** Where uploaded images live. Swap for an S3/R2 implementation in production. */
export interface Storage {
  put(key: string, data: Buffer, mime: string): Promise<string>;
  get(key: string): Promise<Buffer | null>;
}

export class LocalStorage implements Storage {
  private readonly dir: string;
  private readonly publicBaseUrl: string;

  constructor(dir: string, publicBaseUrl: string) {
    this.dir = dir;
    this.publicBaseUrl = publicBaseUrl.replace(/\/$/, '');
  }

  private path(key: string): string {
    const safe = normalize(key).replace(/^(\.\.[/\\])+/, '');
    if (safe.includes('..')) throw new Error('invalid storage key');
    return join(this.dir, safe);
  }

  async put(key: string, data: Buffer): Promise<string> {
    const p = this.path(key);
    await mkdir(join(p, '..'), { recursive: true });
    await writeFile(p, data);
    return `${this.publicBaseUrl}/files/${key}`;
  }

  async get(key: string): Promise<Buffer | null> {
    try {
      return await readFile(this.path(key));
    } catch {
      return null;
    }
  }
}

export class MemoryStorage implements Storage {
  readonly files = new Map<string, Buffer>();
  async put(key: string, data: Buffer) {
    this.files.set(key, data);
    return `http://test.local/files/${key}`;
  }
  async get(key: string) {
    return this.files.get(key) ?? null;
  }
}
