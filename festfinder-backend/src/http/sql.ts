/** Collects positional parameters while a query is assembled. */
export class SqlParams {
  readonly values: unknown[] = [];
  p(value: unknown): string {
    this.values.push(value);
    return `$${this.values.length}`;
  }
}

/** Opaque offset cursors: good enough for feeds that re-sort as hype changes. */
export function encodeCursor(offset: number): string {
  return Buffer.from(String(offset)).toString('base64url');
}

export function decodeCursor(cursor: string | undefined): number {
  if (!cursor) return 0;
  const n = Number(Buffer.from(cursor, 'base64url').toString());
  return Number.isInteger(n) && n >= 0 ? n : 0;
}

export function page<T>(rows: T[], offset: number, limit: number): { items: T[]; nextCursor: string | null } {
  const more = rows.length > limit;
  return { items: more ? rows.slice(0, limit) : rows, nextCursor: more ? encodeCursor(offset + limit) : null };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (s: string) => UUID.test(s);
