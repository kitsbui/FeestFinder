import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, normalize } from 'node:path';

/** Where uploaded images live: local disk in development, object storage in production. */
export interface Storage {
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
