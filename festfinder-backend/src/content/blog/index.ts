/**
 * The blog's content packs: the team's editorial posts, written from the documents the owner sends
 * (the `feestfinder-blog-content` skill says how) and imported by the `importBlogContent` job
 * (services/blog-content.ts). Add a pack here; never remove one whose posts are live.
 */
import type { BlogPack } from '../../services/blog-content.ts';
import { djSkills } from './dj-skills/index.ts';
import { edmGenres } from './edm-genres/index.ts';

export const PACKS: BlogPack[] = [edmGenres, djSkills];
