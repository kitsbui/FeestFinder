/**
 * Compiles the Claude Design screens into React.
 *
 *   festfinder-frontend/pages/<surface>/template.html  →  src/screens/<surface>/view.tsx
 *                                                          src/screens/<surface>/pseudo.css
 *                                                          src/screens/<surface>/head.tsx
 *   festfinder-frontend/pages/<surface>/logic.js       →  src/screens/<surface>/logic.js
 *   festfinder-frontend/pages/<surface>/data.js        →  src/screens/<surface>/data.js
 *   festfinder-frontend/pages/<surface>/shell.html     →  src/screens/<surface>/props.ts
 *
 * The design runtime (ui/support.js) interprets these templates in the browser with
 * `new Function`. This does the same translation ahead of time, following the runtime's
 * rules exactly — its expression language, its whitespace rule, the `sc-interp` span
 * around interpolated text, how it parses style strings and pseudo-class styles — so the
 * DOM it renders is the DOM the runtime rendered, with nothing evaluated at runtime.
 *
 * The designs stay the source of truth: edit the template, run `npm run compile`.
 */
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseDocument } from 'htmlparser2';
import type { ChildNode, Element } from 'domhandler';

const ROOT = resolve(import.meta.dirname, '..');
const SOURCE = resolve(ROOT, '../festfinder-frontend');
const OUT = join(ROOT, 'src/screens');
const SURFACES = { web: 'w', app: 'a', organizer: 'o', admin: 'd' } as const;
type Surface = keyof typeof SURFACES;

// ---- the runtime's expression language ------------------------------------------
//
// Mirrors resolve() in ui/support.js: parentheses, ===/!==/==/!=, a leading !, the
// literals true/false/null/undefined, numbers and quoted strings, and paths made of
// .name, .0 and [expr] steps that give undefined as soon as a step is missing.

const IDENT_RE = /^[A-Za-z_$][A-Za-z0-9_$]*/;
const NUMBER_RE = /^-?\d+(\.\d+)?$/;

function parensWrapWhole(e: string): boolean {
  let depth = 0;
  for (let i = 0; i < e.length - 1; i++) {
    if (e[i] === '(') depth++;
    else if (e[i] === ')') {
      depth--;
      if (depth === 0) return false;
    }
  }
  return true;
}

function findTopLevelEquality(e: string): { index: number; op: string } | null {
  let depth = 0;
  for (let i = 0; i < e.length; i++) {
    const c = e[i];
    if (c === '[' || c === '(') depth++;
    else if (c === ']' || c === ')') depth--;
    else if (depth === 0 && (c === '=' || c === '!') && e[i + 1] === '=') {
      if (i > 0 && (e[i - 1] === '=' || e[i - 1] === '!')) continue;
      if (!e.slice(0, i).trim()) continue;
      return { index: i, op: e[i + 2] === '=' ? c + '==' : c + '=' };
    }
  }
  return null;
}

/** One template expression as a JavaScript expression reading from scope `s`. */
function expr(src: string, s: string): string {
  const e = String(src).trim();
  if (!e) return 'undefined';
  if (e[0] === '(' && e[e.length - 1] === ')' && parensWrapWhole(e)) return expr(e.slice(1, -1), s);
  const eq = findTopLevelEquality(e);
  if (eq) return `(${expr(e.slice(0, eq.index), s)} ${eq.op} ${expr(e.slice(eq.index + eq.op.length), s)})`;
  if (e[0] === '!') return `!(${expr(e.slice(1), s)})`;
  if (e === 'true' || e === 'false' || e === 'null' || e === 'undefined') return e;
  if (NUMBER_RE.test(e)) return `(${e})`;
  if (e.length >= 2 && (e[0] === '"' || e[0] === "'") && e[e.length - 1] === e[0]) return JSON.stringify(e.slice(1, -1));
  return path(e, s);
}

function path(e: string, s: string): string {
  const head = e.match(IDENT_RE);
  if (!head) return 'undefined';
  let out = `${s}[${JSON.stringify(head[0])}]`;
  let i = head[0].length;
  while (i < e.length) {
    if (e[i] === '.') {
      const m = e.slice(i + 1).match(IDENT_RE) || e.slice(i + 1).match(/^\d+/);
      if (!m) return 'undefined';
      out += `?.[${JSON.stringify(m[0])}]`;
      i += 1 + m[0].length;
    } else if (e[i] === '[') {
      let depth = 1;
      let j = i + 1;
      while (j < e.length && depth > 0) {
        if (e[j] === '[') depth++;
        else if (e[j] === ']') {
          depth--;
          if (depth === 0) break;
        }
        j++;
      }
      if (depth !== 0) return 'undefined';
      out += `?.[${expr(e.slice(i + 1, j), s)}]`;
      i = j + 1;
    } else {
      return 'undefined';
    }
  }
  return out;
}

/** An attribute value, as compileAttr() in the runtime treats it. */
function attr(raw: string, s: string): { code: string; whole: boolean; literal: boolean } {
  const whole = raw.match(/^\s*\{\{([\s\S]+?)\}\}\s*$/);
  if (whole) return { code: expr(whole[1], s), whole: true, literal: false };
  if (raw.includes('{{')) {
    const parts = raw.split(/\{\{([\s\S]+?)\}\}/g);
    const code = parts.map((p, i) => (i & 1 ? `(${expr(p, s)} ?? "")` : JSON.stringify(p))).join(' + ');
    return { code: `(${code})`, whole: false, literal: false };
  }
  return { code: JSON.stringify(raw), whole: false, literal: true };
}

// ---- style strings --------------------------------------------------------------

/** kebab → camel, with React's lower-case spelling of the -ms- prefix (same CSS either way). */
const camel = (prop: string) => prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase()).replace(/^Ms(?=[A-Z])/, 'ms');

/** cssToObj() from the runtime: split on ';', then on the first ':'. */
function cssToObj(css: string): Record<string, string> {
  const o: Record<string, string> = {};
  for (const decl of css.split(';')) {
    const i = decl.indexOf(':');
    if (i < 0) continue;
    const prop = decl.slice(0, i).trim();
    o[prop.startsWith('--') ? prop : camel(prop)] = decl.slice(i + 1).trim();
  }
  return o;
}

/** importantify() from the runtime: every declaration of a :hover/:active rule wins. */
function importantify(css: string): string {
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const decls: string[] = [];
  let start = 0;
  let depth = 0;
  let quote = '';
  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    if (quote) {
      if (c === '\\') i++;
      else if (c === quote) quote = '';
    } else if (c === "'" || c === '"') quote = c;
    else if (c === '(') depth++;
    else if (c === ')') depth = Math.max(0, depth - 1);
    else if (c === ';' && depth === 0) {
      decls.push(css.slice(start, i));
      start = i + 1;
    }
  }
  decls.push(css.slice(start));
  return decls.map((d) => d.trim()).filter(Boolean).map((d) => (/!\s*important$/i.test(d) ? d : d + ' !important')).join(';');
}

// ---- attribute names ------------------------------------------------------------

const EVENT_MAP: Record<string, string> = {
  onclick: 'onClick', onchange: 'onChange', oninput: 'onInput', onsubmit: 'onSubmit', onkeydown: 'onKeyDown',
  onkeyup: 'onKeyUp', onkeypress: 'onKeyPress', onmousedown: 'onMouseDown', onmouseup: 'onMouseUp',
  onmouseenter: 'onMouseEnter', onmouseleave: 'onMouseLeave', onfocus: 'onFocus', onblur: 'onBlur',
  ondoubleclick: 'onDoubleClick', oncontextmenu: 'onContextMenu', onmousemove: 'onMouseMove',
  onmouseover: 'onMouseOver', onmouseout: 'onMouseOut', onpointerdown: 'onPointerDown', onpointerup: 'onPointerUp',
  onpointermove: 'onPointerMove', onpointerenter: 'onPointerEnter', onpointerleave: 'onPointerLeave',
  onpointercancel: 'onPointerCancel', onpointerover: 'onPointerOver', onpointerout: 'onPointerOut',
  ontouchstart: 'onTouchStart', ontouchend: 'onTouchEnd', ontouchmove: 'onTouchMove', ontouchcancel: 'onTouchCancel',
  ondragstart: 'onDragStart', ondragend: 'onDragEnd', ondragenter: 'onDragEnter', ondragleave: 'onDragLeave',
  ondragover: 'onDragOver', onanimationstart: 'onAnimationStart', onanimationend: 'onAnimationEnd',
  onanimationiteration: 'onAnimationIteration', ontransitionend: 'onTransitionEnd',
};

/**
 * Names React wants spelled differently. The runtime passed these through as written and
 * React set them anyway (with a warning); spelling them React's way renders the same
 * attribute without the noise.
 */
const REACT_NAMES: Record<string, string> = {
  crossorigin: 'crossOrigin', tabindex: 'tabIndex', readonly: 'readOnly', maxlength: 'maxLength',
  autocomplete: 'autoComplete', autofocus: 'autoFocus', 'text-anchor': 'textAnchor', 'font-weight': 'fontWeight',
  'font-size': 'fontSize', 'font-family': 'fontFamily', 'stroke-width': 'strokeWidth', 'stroke-linecap': 'strokeLinecap',
  'stroke-linejoin': 'strokeLinejoin', 'fill-opacity': 'fillOpacity', 'stroke-opacity': 'strokeOpacity',
  'stop-color': 'stopColor', 'stop-opacity': 'stopOpacity', 'dominant-baseline': 'dominantBaseline',
};

function propName(name: string): string {
  if (name === 'class') return 'className';
  if (name === 'for') return 'htmlFor';
  if (name.startsWith('on')) return EVENT_MAP[name] || 'on' + name[2].toUpperCase() + name.slice(3);
  return REACT_NAMES[name] ?? name;
}

/** Attributes React types as numbers; a literal like rows="3" is written as {3}, same markup. */
const NUMERIC = new Set(['rows', 'cols', 'tabIndex', 'size', 'maxLength', 'minLength', 'span', 'colSpan', 'rowSpan', 'start']);

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);

// ---- template → JSX ---------------------------------------------------------------

interface Ctx {
  surface: Surface;
  pseudo: Map<string, string>;
  depth: number;
}

function isElement(n: ChildNode): n is Element {
  return n.type === 'tag' || n.type === 'script' || n.type === 'style';
}

function children(nodes: ChildNode[], s: string, ctx: Ctx): string {
  return nodes.map((n) => node(n, s, ctx)).filter((x): x is string => x !== null).join('');
}

function node(n: ChildNode, s: string, ctx: Ctx): string | null {
  if (n.type === 'text') return text((n as any).data as string, s);
  if (!isElement(n)) return null;
  const tag = n.name;
  if (tag === 'helmet') return null;
  if (tag === 'sc-if') return scIf(n, s, ctx);
  if (tag === 'sc-for') return scFor(n, s, ctx);
  return element(n, s, ctx);
}

/** walkText(): whitespace-only text without a space is dropped; bindings become sc-interp spans. */
function text(txt: string, s: string): string | null {
  if (!txt.includes('{{')) {
    if (!txt.trim() && !txt.includes(' ')) return null;
    return `{${JSON.stringify(txt)}}`;
  }
  const parts = txt.split(/\{\{([\s\S]+?)\}\}/g);
  return parts.map((p, i) => (i & 1 ? `{interp(${expr(p, s)})}` : p ? `{${JSON.stringify(p)}}` : '')).join('');
}

function scIf(el: Element, s: string, ctx: Ctx): string {
  const cond = attr(el.attribs.value ?? '', s).code;
  return `{${cond} ? <>${children(el.children, s, ctx)}</> : null}`;
}

function scFor(el: Element, s: string, ctx: Ctx): string {
  const list = attr(el.attribs.list ?? '', s).code;
  const as = el.attribs.as || 'item';
  ctx.depth++;
  const inner = `s${ctx.depth}`;
  const body = children(el.children, inner, ctx);
  ctx.depth--;
  return `{asArray(${list}).map((it${ctx.depth + 1}, i${ctx.depth + 1}) => { const ${inner} = scope(${s}, ${JSON.stringify(as)}, it${ctx.depth + 1}, i${ctx.depth + 1}); return <Fragment key={i${ctx.depth + 1}}>${body}</Fragment>; })}`;
}

function element(el: Element, s: string, ctx: Ctx): string {
  const tag = el.name;
  const props: string[] = [];
  const classes: string[] = [];
  for (const [name, value] of Object.entries(el.attribs)) {
    if (name === 'sc-name' || name === 'data-dc-tpl' || name === 'hint-size') continue;
    if (name.startsWith('style-')) {
      classes.push(pseudoClass(name.slice(6), value, ctx));
      continue;
    }
    const key = propName(name);
    const a = attr(value, s);
    let code = a.code;
    if (key === 'style') {
      // Custom properties (--ff-i…) are not in React's CSSProperties type: css() returns one.
      if (a.literal) code = /(^|;)\s*--/.test(value) ? `css(${JSON.stringify(value)})` : JSON.stringify(cssToObj(value));
      else if (a.whole) code = `styleOf(${a.code})`;
      else code = `css(${a.code})`;
    } else if (a.literal && NUMERIC.has(key) && /^-?\d+$/.test(value.trim())) {
      code = String(Number(value));
    } else if ((key === 'value' || key === 'checked') && a.whole) {
      code = `orDefault(${a.code}, ${key === 'checked' ? 'false' : '""'})`;
    }
    props.push(`${JSON.stringify(key)}: ${code}`);
  }
  if (classes.length) {
    const existing = props.findIndex((p) => p.startsWith('"className":'));
    const extra = JSON.stringify(classes.join(' '));
    if (existing >= 0) {
      const current = props[existing].slice('"className": '.length);
      props[existing] = `"className": [${current}, ${extra}].filter(Boolean).join(" ")`;
    } else {
      props.push(`"className": ${extra}`);
    }
  }
  const spread = props.length ? ` {...{${props.join(', ')}}}` : '';
  if (VOID.has(tag)) return `<${tag}${spread} />`;
  return `<${tag}${spread}>${children(el.children, s, ctx)}</${tag}>`;
}

/** createPseudoSheet(): one class per distinct pseudo + declarations. */
function pseudoClass(pseudo: string, css: string, ctx: Ctx): string {
  const k = pseudo + '|' + css;
  let cls = ctx.pseudo.get(k);
  if (!cls) {
    cls = `ff${SURFACES[ctx.surface]}-${ctx.pseudo.size.toString(36)}`;
    ctx.pseudo.set(k, cls);
  }
  return cls;
}

function pseudoCss(ctx: Ctx): string {
  const rules: string[] = [];
  for (const [k, cls] of ctx.pseudo) {
    const i = k.indexOf('|');
    const pseudo = k.slice(0, i);
    const css = k.slice(i + 1);
    const isElement = pseudo === 'before' || pseudo === 'after';
    rules.push(`.${cls}${isElement ? '::' : ':'}${pseudo}{${isElement ? css : importantify(css)}}`);
  }
  return rules.join('\n') + '\n';
}

// ---- <helmet> → head tags React 19 hoists -----------------------------------------

function head(helmet: Element | null, surface: Surface): string {
  if (!helmet) return 'export default function Head() { return null; }\n';
  const out: string[] = [];
  for (const n of helmet.children) {
    if (!isElement(n)) continue;
    if (n.name === 'link') {
      const a = n.attribs;
      const cross = a.crossorigin !== undefined ? ' crossOrigin=""' : '';
      if ((a.rel || '').split(/\s+/).includes('stylesheet')) {
        // precedence lets React hoist the sheet into <head>, load it before paint and
        // include it once however many screens ask for it.
        out.push(`<link rel="stylesheet" href=${JSON.stringify(a.href)} precedence="ff-${surface}"${cross} />`);
      } else {
        out.push(`<link rel=${JSON.stringify(a.rel)} href=${JSON.stringify(a.href)}${cross} />`);
      }
    } else if (n.name === 'style') {
      const css = n.children.map((c: any) => c.data ?? '').join('');
      out.push(`<style href="ff-${surface}-helmet" precedence="ff-${surface}">{${JSON.stringify(css)}}</style>`);
    }
    // The design-system bundle script declares no components, so it is left out.
  }
  return `// Generated by scripts/compile-screens.ts — do not edit.\nexport default function Head() {\n  return (\n    <>\n      ${out.join('\n      ')}\n    </>\n  );\n}\n`;
}

// ---- one surface ------------------------------------------------------------------

function compile(surface: Surface) {
  const dir = join(SOURCE, 'pages', surface);
  const out = join(OUT, surface);
  mkdirSync(out, { recursive: true });

  const template = readFileSync(join(dir, 'template.html'), 'utf8');
  const doc = parseDocument(template, {
    lowerCaseAttributeNames: false,
    lowerCaseTags: false,
    recognizeSelfClosing: true,
    decodeEntities: true,
  });
  const ctx: Ctx = { surface, pseudo: new Map(), depth: 0 };
  const helmet = (doc.children.find((n) => isElement(n) && n.name === 'helmet') as Element | undefined) ?? null;
  const body = children(doc.children, 's', ctx);

  const source = `festfinder-frontend/pages/${surface}/template.html`;
  writeFileSync(join(out, 'view.tsx'), `// Generated by scripts/compile-screens.ts from ${source} — do not edit.
import { Fragment } from 'react';
import { asArray, css, interp, orDefault, scope, styleOf } from '../../runtime/view';
import './pseudo.css';

type Scope = Record<string, any>;

export default function View({ s }: { s: Scope }) {
  return <>${body}</>;
}
`);
  writeFileSync(join(out, 'pseudo.css'), pseudoCss(ctx));
  writeFileSync(join(out, 'head.tsx'), head(helmet, surface));

  // The logic ran inside new Function(DCLogic, StreamableLogic, React) after the page's
  // data had loaded; as a factory it runs at the same moment, with the same names.
  const logic = readFileSync(join(dir, 'logic.js'), 'utf8');
  writeFileSync(join(out, 'logic.js'), `// Generated by scripts/compile-screens.ts from festfinder-frontend/pages/${surface}/logic.js — do not edit.
/* eslint-disable */
export default function createLogic(FF, React, DCLogic) {
  const StreamableLogic = DCLogic;
${logic}
  return (typeof Component !== "undefined" && Component) || undefined;
}
`);

  const data = readFileSync(join(dir, 'data.js'), 'utf8');
  writeFileSync(join(out, 'data.js'), `// Generated by scripts/compile-screens.ts from festfinder-frontend/pages/${surface}/data.js — do not edit.
/* eslint-disable */
export default function installData(FF) {
${data}
}
`);

  // The props the design declared, with the defaults the runtime rendered with.
  const shell = readFileSync(join(dir, 'shell.html'), 'utf8');
  const m = shell.match(/data-props="([^"]*)"/);
  const meta = m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&')) : {};
  const defaults: Record<string, unknown> = {};
  for (const [k, v] of Object.entries<any>(meta)) if (v && v.default !== undefined) defaults[k] = v.default;
  writeFileSync(join(out, 'props.ts'), `// Generated by scripts/compile-screens.ts — do not edit.
export const defaultProps: Record<string, unknown> = ${JSON.stringify(defaults, null, 2)};
`);

  return { pseudo: ctx.pseudo.size, bytes: body.length };
}

// ---- run --------------------------------------------------------------------------

rmSync(OUT, { recursive: true, force: true });
for (const surface of Object.keys(SURFACES) as Surface[]) {
  const r = compile(surface);
  console.log(`${surface.padEnd(10)} view ${(r.bytes / 1024).toFixed(0)} KB, ${r.pseudo} hover/active rules`);
}

// The icon fonts, the design-system sheet and the brand images the templates point at.
const PUBLIC_UI = join(ROOT, 'public/ui');
for (const folder of ['vendor', '_ds', 'assets']) {
  const from = join(SOURCE, 'ui', folder);
  // A mirror: an image removed from the designs must stop being served here too.
  rmSync(join(PUBLIC_UI, folder), { recursive: true, force: true });
  if (existsSync(from)) cpSync(from, join(PUBLIC_UI, folder), { recursive: true });
}
