/**
 * The query keys that keep /?city=<slug> off that city's cached page (next.config.ts): the search
 * and a style, which the home page's dashboard asks the API for in the browser (owner, 2026-11-06).
 */
export const LIST_KEYS = ['q', 'style'] as const;
