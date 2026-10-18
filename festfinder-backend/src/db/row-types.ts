import type { Queryable } from './index.ts';

/*
 * The tables' rows as TypeScript, read from the database the migrations made (npm run rows writes
 * src/db/rows.ts; test/rows.test.ts fails when a migration changed a table and the file was not
 * written again). The API's queries name these instead of `any`: `one<Row<'events'>>(…)` for
 * `select *`, `Pick<Row<'events'>, 'slug' | 'title'>` for a few columns (docs/TECH_DEBT.md, item 22).
 */

/** What a JSON column holds, where the code reads into it; any other JSON column is `unknown`. */
const JSON_TYPES: Record<string, string> = {
  'organizers.bio': 'Localized', 'organizers.links': 'Record<string, string>',
  'artists.bio': 'Localized', 'artists.links': 'Record<string, string>',
  'events.description': 'Localized',
  'notifications.title': 'Localized', 'notifications.body': 'Localized',
};

/** Column types as the database layer hands them over (db/index.ts: int8 and numeric as numbers, dates as strings). */
const SCALAR: Record<string, string> = {
  text: 'string', varchar: 'string', bpchar: 'string', citext: 'string', uuid: 'string', inet: 'string', name: 'string',
  tsvector: 'string', time: 'string', timetz: 'string', interval: 'string', date: 'string',
  int2: 'number', int4: 'number', int8: 'number', float4: 'number', float8: 'number', numeric: 'number', oid: 'number',
  bool: 'boolean', timestamptz: 'Date', timestamp: 'Date', bytea: 'Buffer', json: 'unknown', jsonb: 'unknown',
};

const tsType = (table: string, column: string, udt: string): string => {
  const own = JSON_TYPES[`${table}.${column}`];
  if (own) return own;
  if (udt.startsWith('_')) {
    const el = SCALAR[udt.slice(1)] ?? 'string';
    return /^\w+$/.test(el) ? `${el}[]` : `(${el})[]`;
  }
  // A type of the schema's own (an enum, a domain) arrives as its text.
  return SCALAR[udt] ?? 'string';
};

/** The source of src/db/rows.ts for the database as it is. */
export async function rowTypes(q: Queryable): Promise<string> {
  const { rows } = await q.query<{ table_name: string; column_name: string; udt_name: string; is_nullable: 'YES' | 'NO' }>(
    `select c.table_name, c.column_name, c.udt_name, c.is_nullable
       from information_schema.columns c join information_schema.tables t using (table_schema, table_name)
      where c.table_schema = 'public' and t.table_type = 'BASE TABLE'
      order by c.table_name, c.ordinal_position`);
  const tables = new Map<string, string[]>();
  for (const r of rows) {
    if (r.table_name === 'schema_migrations') continue;
    const type = tsType(r.table_name, r.column_name, r.udt_name);
    const line = `    ${r.column_name}: ${type}${r.is_nullable === 'YES' && type !== 'unknown' ? ' | null' : ''};`;
    tables.set(r.table_name, [...(tables.get(r.table_name) ?? []), line]);
  }
  const body = [...tables].map(([name, cols]) => `  ${name}: {\n${cols.join('\n')}\n  };`).join('\n');
  return `// Written by \`npm run rows\` (src/db/row-types.ts) from the migrations: do not edit by hand.
import type { Localized } from '../lib/i18n.ts';

/** Every table's row, by table name. */
export interface Rows {
${body}
}

/** A table's row: \`one<Row<'events'>>(q, 'select * from events where id = $1', [id])\`. */
export type Row<T extends keyof Rows> = Rows[T];
`;
}
