/**
 * Configuration management for Twitter CLI
 */

import { homedir } from 'os';
import { join } from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import type { Config } from '../types/index.js';

const CONFIG_DIR = join(homedir(), '.twitter-cli');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

const DEFAULT_CONFIG: Config = {
  cacheEnabled: true,
  cacheTtlMinutes: 15,
  defaultLimit: 10,
};

export function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function getConfigPath(): string {
  return CONFIG_FILE;
}

export function getConfigDir(): string {
  return CONFIG_DIR;
}

export function loadConfig(): Config {
  ensureConfigDir();
  if (!existsSync(CONFIG_FILE)) {
    return { ...DEFAULT_CONFIG };
  }
  try {
    const content = readFileSync(CONFIG_FILE, 'utf-8');
    return { ...DEFAULT_CONFIG, ...JSON.parse(content) };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveConfig(config: Config): void {
  ensureConfigDir();
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

export function getConfigValue<K extends keyof Config>(key: K): Config[K] {
  return loadConfig()[key];
}

export function setConfigValue<K extends keyof Config>(key: K, value: Config[K]): void {
  const config = loadConfig();
  config[key] = value;
  saveConfig(config);
}

export function getBearerToken(): string | undefined {
  if (process.env.TWITTER_BEARER_TOKEN) {
    return process.env.TWITTER_BEARER_TOKEN;
  }
  return loadConfig().bearerToken;
}

export function hasBearerToken(): boolean {
  return !!getBearerToken();
}

export function isConfigured(): boolean {
  return hasBearerToken();
}
