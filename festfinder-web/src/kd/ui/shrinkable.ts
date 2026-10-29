/**
 * Every column may shrink below the size it asks for, so a row never pushes past its box (the cells
 * clip; kd.css turns rows into cards below 640px): `110px` becomes `minmax(0,110px)`, and
 * `minmax(160px,2fr)` becomes `minmax(0,2fr)`.
 */
export const shrinkable = (cols: string) =>
  cols.replace(/minmax\(\s*[^,()]+,/g, 'minmax(0,').replace(/(^|\s)(\d+(?:\.\d+)?(?:px|rem))(?=\s|$)/g, '$1minmax(0,$2)');
