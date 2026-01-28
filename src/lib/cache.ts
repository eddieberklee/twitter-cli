/**
 * Simple file-based cache for Twitter CLI
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { getConfigDir, loadConfig } from './config.js';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheStore {
  [key: string]: CacheEntry<unknown>;
}

let memoryCache: CacheStore = {};
let cacheLoaded = false;

function getCacheFile(): string {
  return join(getConfigDir(), 'cache.json');
}

function loadCacheFromDisk(): void {
  if (cacheLoaded) return;
  try {
    const cacheFile = getCacheFile();
    if (existsSync(cacheFile)) {
      memoryCache = JSON.parse(readFileSync(cacheFile, 'utf-8'));
    }
  } catch {
    memoryCache = {};
  }
  cacheLoaded = true;
}

function saveCacheToDisk(): void {
  try {
    const configDir = getConfigDir();
    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true });
    }
    writeFileSync(getCacheFile(), JSON.stringify(memoryCache, null, 2), 'utf-8');
  } catch {
    // Ignore write errors
  }
}

function getCacheTtl(): number {
  const config = loadConfig();
  return (config.cacheTtlMinutes || 15) * 60 * 1000;
}

function isCacheEnabled(): boolean {
  const config = loadConfig();
  return config.cacheEnabled !== false;
}

export function getCache<T>(key: string): T | undefined {
  if (!isCacheEnabled()) return undefined;
  loadCacheFromDisk();
  const entry = memoryCache[key] as CacheEntry<T> | undefined;
  if (!entry) return undefined;
  if (Date.now() - entry.timestamp > entry.ttl) {
    delete memoryCache[key];
    return undefined;
  }
  return entry.data;
}

export function setCache<T>(key: string, data: T, ttl?: number): void {
  if (!isCacheEnabled()) return;
  loadCacheFromDisk();
  memoryCache[key] = { data, timestamp: Date.now(), ttl: ttl || getCacheTtl() };
  saveCacheToDisk();
}

export function deleteCache(key: string): void {
  loadCacheFromDisk();
  delete memoryCache[key];
  saveCacheToDisk();
}

export function clearCache(): void {
  memoryCache = {};
  cacheLoaded = true;
  saveCacheToDisk();
}
