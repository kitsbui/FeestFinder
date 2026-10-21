---
name: blog-content-from-documents
description: "When the owner sends a document for the FeestFinder blog, do everything end to end with the feestfinder-blog-content skill: research, bilingual VI/EN, sources, licensed pictures, oEmbed-checked tracks, top SEO/AIO, a content pack, tests. Don't ask."
metadata:
  node_type: memory
  type: feedback
  originSessionId: 9b63e02e-d2b2-44b9-b74b-5f4e8630b535
  modified: 2026-10-20T10:00:54.253Z
---

The owner (2026-10-20) wants to only send a document; everything else is mine: infer and write accurate content in natural Vietnamese and English (terms stay English), cite reputable sources with links, find suitable licensed pictures and insert them, optimise every post for SEO and AIO, bilingual throughout.

**Why:** the owner said "Ghi nhớ điều này để sau này tôi chỉ cần gửi tài liệu thôi, còn lại bạn tự làm hoàn toàn theo yêu cầu này."

**How to apply:** follow `.claude/skills/feestfinder-blog-content/SKILL.md` (its scripts search YouTube and Wikimedia Commons and check links). Posts live in the database (admins edit them in /console/blog); I write them as content packs in `festfinder-backend/src/content/blog`, imported by the `importBlogContent` job, which never writes over an admin's edit. Never invent a URL, video id, year or nationality; correct the document where it is wrong and say so in the report. Packs so far: `edm-genres` (2026-10-20) and `dj-skills` (2026-10-21, "Học DJ từ số 0": pillar + 16 lessons). A document that asks for its own tables, `draft` status or PLACEHOLDER images gets mapped onto `blog_posts`, review and real Commons pictures instead, said in the report. Body URLs must encode parentheses (%28/%29) or the link parser cuts them; rekordbox's /support/manual/ page is gone (use /support/faq/). Production's /sitemap.xml is the web's route (festfinder-web/src/app/sitemap.xml/route.ts, rendered on request, CDN 15 min) reading the API's `GET /seo/sitemap`; Vercel served the old metadata sitemap.ts as a file fixed at build time (its revalidate never ran), so never go back to a metadata sitemap (PRs #35, #36, 2026-10-21). See [[growth-plan-2026-10-20]].
