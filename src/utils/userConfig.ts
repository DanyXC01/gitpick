import fs from 'fs/promises';
import path from 'path';
import { CONFIG_FILE, DEFAULT_CONFIG } from '../config.js';
import type { UserConfig, SearchParams } from '../types/index.js';

/**
 * Load user configuration from file
 */
export async function loadUserConfig(): Promise<UserConfig> {
  try {
    const configPath = path.join(process.cwd(), CONFIG_FILE);
    const data = await fs.readFile(configPath, 'utf-8');
    const userConfig: Partial<UserConfig> = JSON.parse(data);

    return {
      ...DEFAULT_CONFIG,
      ...userConfig
    };
  } catch (error) {
    // Config file doesn't exist or is invalid, return defaults
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * Save user configuration to file
 */
export async function saveUserConfig(config: UserConfig): Promise<boolean> {
  try {
    const configPath = path.join(process.cwd(), CONFIG_FILE);
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error('Failed to save config:', (error as Error).message);
    return false;
  }
}

/**
 * Update specific config values
 */
export async function updateUserConfig(
  updates: Partial<UserConfig>
): Promise<boolean> {
  const currentConfig = await loadUserConfig();
  const newConfig: UserConfig = {
    ...currentConfig,
    ...updates
  };
  return await saveUserConfig(newConfig);
}

/**
 * Add to search history
 */
export async function addToHistory(searchParams: SearchParams): Promise<void> {
  const config = await loadUserConfig();
  const history = config.searchHistory || [];

  // Add new search with timestamp
  history.unshift({
    ...searchParams,
    timestamp: Date.now()
  });

  // Keep only last 10 searches
  config.searchHistory = history.slice(0, 10);

  await saveUserConfig(config);
}

/**
 * Get search history
 */
export async function getSearchHistory(): Promise<SearchParams[]> {
  const config = await loadUserConfig();
  return config.searchHistory || [];
}
