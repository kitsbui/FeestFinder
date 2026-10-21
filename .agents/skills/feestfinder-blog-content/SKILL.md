---
name: feestfinder-blog-content
description: Turn a document the owner sends (a handoff, notes, a knowledge base, an outline) into FeestFinder blog posts, end to end and without asking: research, accurate bilingual VI/EN writing, verified sources, licensed pictures, YouTube tracks checked through oEmbed, top SEO/AIO, a content pack in the repo, tests. Use whenever the owner shares a document for the blog, or asks for blog/guide content about music styles, news, playlists, DJ skills, clubs or cafés.
---

# Blog content from a document

The owner's standing request (2026-10-20): "I only send the document; you do everything else."
Do it fully: no questions back unless the document contradicts itself on something that matters.

## Where posts live (decided 2026-10-20)

- **The database is the source of truth.** Posts are rows in `blog_posts` / `blog_tracks` (migration 060), so the two admins edit them in the Console (`/console/blog` → "Sửa bài" → `/blog/<slug>/edit`) and the site reads them without a deploy.
- **The repository holds the content packs** I write from documents: `festfinder-backend/src/content/blog/<pack>/` (one `.ts` file per post, `media.ts` for pictures and link helpers, `index.ts` for the pack), listed in `src/content/blog/index.ts` (`PACKS`).
- The `importBlogContent` job (every 10 minutes; "Nhập bài biên tập" in the Console runs it now) adds new posts as `in_review` and tells every admin; it updates a post with a pack's newer words **only until someone edits it** (`edited_at`), and never deletes. So: never rename a post's `key`; fix a live post in the Console, or in the pack only if nobody edited it.

## Steps

1. **Read the document** and list the posts it implies (pillars, then clusters). Fix what is wrong in it (an artist in the wrong genre, a track that does not exist under that name, a schema type that does not exist) and say so in the final report.
2. **Research** with WebSearch and the scripts in `scripts/` (run with `python3`, they only read public pages):
   - `yt.py <queries.json>`: YouTube search results with channel and badges. Prefer, in order: the artist's "Official Artist Channel", "<Artist> - Topic" (label-delivered), the original label's channel (Verified). Never fan re-uploads. Then validate every pick with `yt.oembed(id)` (an answer means it can be embedded) and keep `author_name` as the channel.
   - `commons.py <queries.json>`: Wikimedia Commons files with licence and author. Take only free licences (CC BY, CC BY-SA, CC0, public domain), landscape ≥ 1200 px for a cover. Use the 1600 px thumbnail URL without its `utm_` query, and credit it: author linked to the file page, licence, "Wikimedia Commons" (`credit` / `figure` in `media.ts`).
   - `check_urls.py < urls.txt`: every cited link must answer 200. `wiki_titles.py`: Wikipedia titles exist and are not redirected elsewhere; for an artist without a page use their official YouTube channel (from oEmbed `author_url`).
   - Never invent a URL, a video id, a year, a nationality or a quote. Leave a year out when unsure.
3. **Write** each post in Vietnamese and English (`PackPost`, `services/blog-content.ts`), natural language in each; terms stay in English (BPM, kick, bassline, drop, build-up, breakdown, four-on-the-floor, sub-bass, wobble, reese, supersaw, arpeggio, groove, sidechain, B2B…). For a genre guide:
   - Title ≤ 60 characters with the main keyword ("Techno là gì? …" / "What is techno? …"); excerpt 140–170 characters (it is the meta description).
   - Body opens with a bold definition answering "X là gì?" in 40–60 words; then: how it sounds (kick & drums, bass, melody & harmony, arrangement, mix & master), history, one or two credited pictures, a table of 5 artists (country, why listen, profile link), a table of sub-genres (difference, BPM, an example), a comparison table with the nearest genre, "how to recognise it" as a numbered list, where to hear it in Asia linking `/?style=<key>` (`nights()`), and "read next" linking 3 other guides (`guide()`).
   - `facts` (5–6 quick facts), `faq` (5 questions people search, answers that stand alone), `sources` (4–5, verified), `tracks` (5 YouTube videos with a one-line `note` each for a genre guide; a lesson needs none), `styles` (keys of `lib/styles.ts`), `cover` with its credit, `parent` for a cluster under its pillar.
   - Body marks the page draws (`web/blog/body.tsx`): `##`/`###`, `-` and `1.` lists, `>` quotes, `**bold**`, `[text](url)`, tables, `![alt](https://… "caption · credit")` on its own line. Nothing else; never HTML.
4. **SEO/AIO** comes from the page and `services/seo/blog.ts`: BlogPosting with citation, DefinedTerm for a guide's genre, FAQPage, ItemList of MusicRecording, HowTo for a lesson whose steps are `### Bước n: …` / `### Step n: …` headings (its tools the list under `## Bạn cần chuẩn bị` / `## What you need`), a DefinedTermSet for a glossary's tables headed `Thuật ngữ` / `Term`, BreadcrumbList with the parent, hreflang VI/EN, sitemap, `llms.txt`, `/blog/<slug>.md`. Keep the content shaped for it (definition first, facts, questions, sources).
5. **Test**: `node --test test/blog-content.test.ts` checks every pack post (both languages, lengths, 5 questions, sources, credited pictures, five tracks for a genre guide, internal links that exist); add the pack to `PACKS`, then `npm run typecheck`, `npm test`, `npm run lint`. Look at one post in the preview (`/blog/<slug>` and `?lang=en`) after "Nhập bài biên tập".
6. **Report** to the owner in Vietnamese: the posts made, what was corrected from the document, what was left out and why (an unverifiable link, a missing licence), and that the posts wait in `/console/blog` for an admin to publish.
