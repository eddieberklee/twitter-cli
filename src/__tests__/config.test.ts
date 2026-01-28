import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { tmpdir } from 'os';

// Create a unique test directory for each test run
const TEST_HOME = path.join(tmpdir(), `twitter-cli-config-test-${Date.now()}`);
const TEST_CONFIG_DIR = path.join(TEST_HOME, '.twitter-cli');
const TEST_CONFIG_FILE = path.join(TEST_CONFIG_DIR, 'config.json');

// Mock os.homedir to return our test directory
vi.mock('os', async () => {
  const actual = await vi.importActual('os');
  return {
    ...actual,
    homedir: () => TEST_HOME,
  };
});

// Import after mocking
import {
  ensureConfigDir,
  getConfigPath,
  getConfigDir,
  loadConfig,
  saveConfig,
  getConfigValue,
  setConfigValue,
  getBearerToken,
  hasBearerToken,
  isConfigured,
} from '../lib/config.js';

describe('config', () => {
  beforeEach(() => {
    // Clean up any existing test directory
    if (fs.existsSync(TEST_HOME)) {
      fs.rmSync(TEST_HOME, { recursive: true });
    }
    // Clear environment variable
    delete process.env.TWITTER_BEARER_TOKEN;
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(TEST_HOME)) {
      fs.rmSync(TEST_HOME, { recursive: true });
    }
    delete process.env.TWITTER_BEARER_TOKEN;
  });

  describe('ensureConfigDir', () => {
    it('should create config directory if it does not exist', () => {
      expect(fs.existsSync(TEST_CONFIG_DIR)).toBe(false);
      ensureConfigDir();
      expect(fs.existsSync(TEST_CONFIG_DIR)).toBe(true);
    });

    it('should not fail if directory already exists', () => {
      fs.mkdirSync(TEST_CONFIG_DIR, { recursive: true });
      expect(() => ensureConfigDir()).not.toThrow();
    });
  });

  describe('getConfigPath', () => {
    it('should return path to config file', () => {
      const configPath = getConfigPath();
      expect(configPath).toBe(TEST_CONFIG_FILE);
    });
  });

  describe('getConfigDir', () => {
    it('should return config directory path', () => {
      const configDir = getConfigDir();
      expect(configDir).toBe(TEST_CONFIG_DIR);
    });
  });

  describe('loadConfig', () => {
    it('should return default config when config file does not exist', () => {
      const config = loadConfig();
      // Should have default values
      expect(config.cacheEnabled).toBe(true);
      expect(config.cacheTtlMinutes).toBe(15);
      expect(config.defaultLimit).toBe(10);
    });

    it('should load existing config and merge with defaults', () => {
      fs.mkdirSync(TEST_CONFIG_DIR, { recursive: true });
      fs.writeFileSync(
        TEST_CONFIG_FILE,
        JSON.stringify({ bearerToken: 'test-token', defaultLimit: 20 })
      );

      const config = loadConfig();
      expect(config.bearerToken).toBe('test-token');
      expect(config.defaultLimit).toBe(20);
      // Should still have defaults for unset values
      expect(config.cacheEnabled).toBe(true);
    });

    it('should return default config for invalid JSON', () => {
      fs.mkdirSync(TEST_CONFIG_DIR, { recursive: true });
      fs.writeFileSync(TEST_CONFIG_FILE, 'invalid json {{{');

      const config = loadConfig();
      expect(config.cacheEnabled).toBe(true);
    });
  });

  describe('saveConfig', () => {
    it('should save config to file', () => {
      const config = { bearerToken: 'test', defaultLimit: 15 };
      saveConfig(config);

      const content = fs.readFileSync(TEST_CONFIG_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      expect(parsed.bearerToken).toBe('test');
      expect(parsed.defaultLimit).toBe(15);
    });

    it('should create config directory if needed', () => {
      expect(fs.existsSync(TEST_CONFIG_DIR)).toBe(false);
      saveConfig({ bearerToken: 'test' });
      expect(fs.existsSync(TEST_CONFIG_DIR)).toBe(true);
    });

    it('should pretty print JSON with 2-space indent', () => {
      saveConfig({ bearerToken: 'test', defaultLimit: 10 });
      const content = fs.readFileSync(TEST_CONFIG_FILE, 'utf-8');
      expect(content).toContain('\n  '); // Indented
    });
  });

  describe('getConfigValue', () => {
    it('should get specific config value', () => {
      saveConfig({ bearerToken: 'my-token', defaultLimit: 25 });

      expect(getConfigValue('bearerToken')).toBe('my-token');
      expect(getConfigValue('defaultLimit')).toBe(25);
    });

    it('should return default for unset values', () => {
      saveConfig({});
      expect(getConfigValue('cacheEnabled')).toBe(true);
    });
  });

  describe('setConfigValue', () => {
    it('should set config values', () => {
      setConfigValue('bearerToken', 'new-token');
      expect(loadConfig().bearerToken).toBe('new-token');
    });

    it('should preserve existing config values', () => {
      saveConfig({ bearerToken: 'token1', defaultLimit: 10 });
      setConfigValue('cacheTtlMinutes', 30);

      const config = loadConfig();
      expect(config.bearerToken).toBe('token1');
      expect(config.defaultLimit).toBe(10);
      expect(config.cacheTtlMinutes).toBe(30);
    });
  });

  describe('getBearerToken', () => {
    it('should prefer environment variable over config file', () => {
      saveConfig({ bearerToken: 'file-token' });
      process.env.TWITTER_BEARER_TOKEN = 'env-token';

      expect(getBearerToken()).toBe('env-token');
    });

    it('should fall back to config file when env not set', () => {
      saveConfig({ bearerToken: 'file-token' });

      expect(getBearerToken()).toBe('file-token');
    });

    it('should return undefined when no token configured', () => {
      expect(getBearerToken()).toBeUndefined();
    });
  });

  describe('hasBearerToken', () => {
    it('should return true when token is configured', () => {
      saveConfig({ bearerToken: 'test' });
      expect(hasBearerToken()).toBe(true);
    });

    it('should return true when env token is set', () => {
      process.env.TWITTER_BEARER_TOKEN = 'env-token';
      expect(hasBearerToken()).toBe(true);
    });

    it('should return false when no token', () => {
      expect(hasBearerToken()).toBe(false);
    });
  });

  describe('isConfigured', () => {
    it('should return true when token is set', () => {
      saveConfig({ bearerToken: 'test' });
      expect(isConfigured()).toBe(true);
    });

    it('should return false when no token', () => {
      expect(isConfigured()).toBe(false);
    });
  });
});
