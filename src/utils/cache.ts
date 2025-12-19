import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { CACHE_DIR, DEFAULT_CONFIG } from '../config.js';
import type { CacheData, CacheStats, SearchParams } from '../types/index.js';

/**
 * Create cache directory if it doesn't exist
 */
async function ensureCacheDir(): Promise<void> {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

/**
 * Generate cache key from search parameters
 */
function generateCacheKey(params: SearchParams): string {
  const normalized = JSON.stringify(params, Object.keys(params).sort());
  return crypto.createHash('md5').update(normalized).digest('hex');
}

/**
 * Get cached data if it exists and is not expired
 */
export async function getCache<T>(
  params: SearchParams,
  ttl: number = DEFAULT_CONFIG.cacheTTL
): Promise<T | null> {
  try {
    await ensureCacheDir();
    const key = generateCacheKey(params);
    const cachePath = path.join(CACHE_DIR, `${key}.json`);

    const data = await fs.readFile(cachePath, 'utf-8');
    const cached: CacheData<T> = JSON.parse(data);

    const age = Date.now() - cached.timestamp;

    if (age < ttl) {
      return cached.data;
    }

    // Cache expired, delete it
    await fs.unlink(cachePath).catch(() => {});
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Save data to cache
 */
export async function setCache<T>(
  params: SearchParams,
  data: T
): Promise<boolean> {
  try {
    await ensureCacheDir();
    const key = generateCacheKey(params);
    const cachePath = path.join(CACHE_DIR, `${key}.json`);

    const cacheData: CacheData<T> = {
      timestamp: Date.now(),
      params,
      data
    };

    await fs.writeFile(cachePath, JSON.stringify(cacheData, null, 2));
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Clear all cache
 */
export async function clearCache(): Promise<boolean> {
  try {
    const files = await fs.readdir(CACHE_DIR);
    await Promise.all(
      files.map(file => fs.unlink(path.join(CACHE_DIR, file)))
    );
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<CacheStats> {
  try {
    await ensureCacheDir();
    const files = await fs.readdir(CACHE_DIR);
    let totalSize = 0;

    for (const file of files) {
      const stats = await fs.stat(path.join(CACHE_DIR, file));
      totalSize += stats.size;
    }

    return {
      files: files.length,
      size: totalSize,
      sizeFormatted: formatBytes(totalSize)
    };
  } catch (error) {
    return {
      files: 0,
      size: 0,
      sizeFormatted: '0 B'
    };
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
