/**
 * The handful of helpers compiled views call. Each one reproduces what the design runtime
 * (festfinder-frontend/ui/support.js) did at the same point, so the rendered DOM matches.
 */
import { createElement, Fragment, isValidElement, type CSSProperties, type ReactNode } from 'react';

type Scope = Record<string, any>;

/**
 * An interpolated value in text. Like walkText(): elements and arrays render as they are,
 * null, undefined and booleans render nothing, and anything else is wrapped in the
 * `sc-interp` span the runtime used.
 */
export function interp(v: unknown): ReactNode {
  if (v === undefined || v === null || typeof v === 'boolean') return null;
  if (isValidElement(v) || Array.isArray(v)) return createElement(Fragment, null, v as ReactNode);
  return createElement('span', { className: 'sc-interp' }, String(v));
}

/** `<sc-for list>` renders nothing for a list that is not an array. */
export function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

/**
 * The scope inside one `<sc-for>` iteration: everything outside, plus the item under its
 * `as` name and `$index`. A prototype link instead of a copy, so each iteration is O(1).
 */
export function scope(parent: Scope, as: string, item: unknown, index: number): Scope {
  const s = Object.create(parent) as Scope;
  s[as] = item;
  s.$index = index;
  return s;
}

const styles = new Map<string, CSSProperties>();

/** cssToObj() from the runtime, cached per distinct string. */
export function css(text: string): CSSProperties {
  let o = styles.get(text);
  if (!o) {
    const out: Record<string, string> = {};
    for (const decl of text.split(';')) {
      const i = decl.indexOf(':');
      if (i < 0) continue;
      const prop = decl.slice(0, i).trim();
      out[prop.startsWith('--') ? prop : prop.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase()).replace(/^Ms(?=[A-Z])/, 'ms')] = decl.slice(i + 1).trim();
    }
    o = out as CSSProperties;
    if (styles.size > 5000) styles.clear();
    styles.set(text, o);
  }
  return o;
}

/** A whole `style="{{ x }}"` binding: a string is parsed, anything else passes through. */
export function styleOf(v: unknown): CSSProperties | undefined {
  return typeof v === 'string' ? css(v) : (v as CSSProperties | undefined);
}

/** `value` and `checked` never go undefined, so inputs stay controlled. */
export function orDefault<T>(v: T | undefined, fallback: T): T {
  return v === undefined ? fallback : v;
}
