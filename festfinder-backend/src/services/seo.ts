/*
 * What search engines and AI assistants read on each public page: its title and description,
 * language versions, link-preview tags, one block of structured data, and its facts (an
 * answer first, then the details). The Next front renders the page from GET /seo/*; crawlers
 * also get the same facts as Markdown, llms.txt and the sitemap.
 */
export type { ArtistSeo, BlogSeo, CollectionSeo, DirectorySeo, EventSeo, OrganizerSeo, PageSeo, ProjectSeo } from './seo/shared.ts';
export * from './seo/event.ts';
export * from './seo/organizer.ts';
export * from './seo/collection.ts';
export * from './seo/artist.ts';
export * from './seo/directory.ts';
export * from './seo/blog.ts';
export * from './seo/text.ts';
export * from './seo/crawlers.ts';
