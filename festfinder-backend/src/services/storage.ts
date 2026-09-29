import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, normalize } from 'node:path';
import type { Queryable } from '../db/index.ts';

/**
 * Where uploaded images live: Supabase Storage (over S3) when it is configured, otherwise the
 * Supabase database itself. Local disk is for the embedded test database only.
 */
export interface Storage {
  /** Short name for the startup log and /health. */
  readonly kind: 's3' | 'database' | 'disk' | 'memory';
  put(key: string, data: Buffer, mime: string): Promise<string>;
  get(key: string): Promise<Buffer | null>;
}

export interface S3Config {
  bucket: string;
  region: string;
  endpoint: string | null;
  accessKeyId: string;
  secretAccessKey: string;
  publicBaseUrl: string | null;
}

export class LocalStorage implements Storage {
  readonly kind = 'disk';
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

/**
 * S3-compatible object storage: AWS S3, Cloudflare R2, Backblaze B2, MinIO.
 *
 * This is what production should use — local disk does not survive a second instance
 * or a container restart. The client is imported only when a bucket is configured, so
 * development and tests never load it.
 */
export class S3Storage implements Storage {
  readonly kind = 's3';
  private readonly cfg: S3Config;
  private client: any = null;

  constructor(cfg: S3Config) {
    this.cfg = cfg;
  }

  private async s3() {
    if (!this.client) {
      const { S3Client } = await import('@aws-sdk/client-s3');
      this.client = new S3Client({
        region: this.cfg.region,
        endpoint: this.cfg.endpoint ?? undefined,
        forcePathStyle: !!this.cfg.endpoint,
        credentials: { accessKeyId: this.cfg.accessKeyId, secretAccessKey: this.cfg.secretAccessKey },
      });
    }
    return this.client;
  }

  async put(key: string, data: Buffer, mime: string): Promise<string> {
    const { PutObjectCommand } = await import('@aws-sdk/client-s3');
    const client = await this.s3();
    await client.send(new PutObjectCommand({
      Bucket: this.cfg.bucket,
      Key: key,
      Body: data,
      ContentType: mime,
      // Uploads are content-addressed (sha256 in the key), so they never change.
      CacheControl: 'public, max-age=31536000, immutable',
    }));
    const base = this.cfg.publicBaseUrl?.replace(/\/$/, '');
    return base ? `${base}/${key}` : `${this.cfg.endpoint ?? `https://${this.cfg.bucket}.s3.${this.cfg.region}.amazonaws.com`}/${key}`;
  }

  async get(key: string): Promise<Buffer | null> {
    const { GetObjectCommand } = await import('@aws-sdk/client-s3');
    const client = await this.s3();
    try {
      const out = await client.send(new GetObjectCommand({ Bucket: this.cfg.bucket, Key: key }));
      const chunks: Buffer[] = [];
      for await (const chunk of out.Body as AsyncIterable<Uint8Array>) chunks.push(Buffer.from(chunk));
      return Buffer.concat(chunks);
    } catch (e) {
      if ((e as { name?: string }).name === 'NoSuchKey') return null;
      throw e;
    }
  }
}

/**
 * Images kept in the database, in `stored_files`, when no object storage is configured. Every
 * instance reads the same rows, so an upload survives a cold start and shows up everywhere
 * at once. The URL is a path on this API, the same on every deployment that shares the
 * database; keys are content hashes, so a row never changes.
 */
export class DbStorage implements Storage {
  readonly kind = 'database';
  private readonly db: Queryable;

  constructor(db: Queryable) {
    this.db = db;
  }

  async put(key: string, data: Buffer, mime: string): Promise<string> {
    await this.db.query(
      `insert into stored_files (key, mime, bytes, data) values ($1, $2, $3, $4) on conflict (key) do nothing`,
      [key, mime, data.length, data]);
    return `/files/${key}`;
  }

  async get(key: string): Promise<Buffer | null> {
    const { rows } = await this.db.query<{ data: Uint8Array }>('select data from stored_files where key = $1', [key]);
    return rows[0] ? Buffer.from(rows[0].data) : null;
  }
}

export class MemoryStorage implements Storage {
  readonly kind = 'memory';
  readonly files = new Map<string, Buffer>();
  async put(key: string, data: Buffer) {
    this.files.set(key, data);
    return `http://test.local/files/${key}`;
  }
  async get(key: string) {
    return this.files.get(key) ?? null;
  }
}
