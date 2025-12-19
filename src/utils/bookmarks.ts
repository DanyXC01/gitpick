import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import type { RepoAnalysis } from '../types/index.js';

const BOOKMARKS_DIR = path.join(os.homedir(), '.gitpick-bookmarks');
const BOOKMARKS_FILE = path.join(BOOKMARKS_DIR, 'bookmarks.json');

export interface Bookmark {
  name: string;
  fullName: string;
  url: string;
  description: string;
  stars: number;
  language: string | null;
  savedAt: number;
  tags?: string[];
}

/**
 * Ensure bookmarks directory exists
 */
async function ensureBookmarksDir(): Promise<void> {
  try {
    await fs.mkdir(BOOKMARKS_DIR, { recursive: true });
  } catch (error) {
    // Directory already exists
  }
}

/**
 * Load bookmarks from file
 */
export async function loadBookmarks(): Promise<Bookmark[]> {
  await ensureBookmarksDir();

  try {
    const data = await fs.readFile(BOOKMARKS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

/**
 * Save bookmarks to file
 */
async function saveBookmarks(bookmarks: Bookmark[]): Promise<void> {
  await ensureBookmarksDir();
  await fs.writeFile(BOOKMARKS_FILE, JSON.stringify(bookmarks, null, 2));
}

/**
 * Add repository to bookmarks
 */
export async function addBookmark(
  analysis: RepoAnalysis,
  tags?: string[]
): Promise<void> {
  const bookmarks = await loadBookmarks();

  // Check if already bookmarked
  const exists = bookmarks.find(b => b.fullName === analysis.name);
  if (exists) {
    throw new Error('Repository already bookmarked');
  }

  const bookmark: Bookmark = {
    name: analysis.name.split('/')[1],
    fullName: analysis.name,
    url: analysis.url,
    description: analysis.description,
    stars: analysis.stars,
    language: analysis.language,
    savedAt: Date.now(),
    tags
  };

  bookmarks.push(bookmark);
  await saveBookmarks(bookmarks);
}

/**
 * Remove bookmark
 */
export async function removeBookmark(fullName: string): Promise<void> {
  const bookmarks = await loadBookmarks();
  const filtered = bookmarks.filter(b => b.fullName !== fullName);
  await saveBookmarks(filtered);
}

/**
 * Get bookmark by name (supports partial match)
 */
export async function getBookmark(nameOrFullName: string): Promise<Bookmark | null> {
  const bookmarks = await loadBookmarks();

  // Try exact match first
  let bookmark = bookmarks.find(b => b.fullName === nameOrFullName);

  // Try partial match
  if (!bookmark) {
    bookmark = bookmarks.find(b =>
      b.name === nameOrFullName ||
      b.fullName.endsWith(`/${nameOrFullName}`)
    );
  }

  return bookmark || null;
}

/**
 * Check if repository is bookmarked
 */
export async function isBookmarked(fullName: string): Promise<boolean> {
  const bookmarks = await loadBookmarks();
  return bookmarks.some(b => b.fullName === fullName);
}

/**
 * Get bookmarks count
 */
export async function getBookmarksCount(): Promise<number> {
  const bookmarks = await loadBookmarks();
  return bookmarks.length;
}
