import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { tmpdir } from 'os';

// Get test paths
function getTestPaths() {
  const testHome = path.join(tmpdir(), 'twitter-cli-config-test-' + process.pid);
  const testConfigDir = path.join(testHome, '.twitter-cli');
  const testConfigFile = path.join(testConfigDir, 'config.json');
  return { testHome, testConfigDir, testConfigFile };
}

const paths = getTestPaths();

// Mock os.homedir to return our test directory
vi.mock('os', async () => {
  const actual = await vi.importActual('os') as object;
  const p = await import('path');
  const { tmpdir } = actual as { tmpdir: () => string };
  return {
    ...actual,
    homedir: () => p.join(tmpdir(), 'twitter-cli-config-test-' + process.pid),
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
    if (fs.existsSync(paths.testHome)) {
      fs.rmSync(paths.testHome, { recursive: true });
    }
    // Clear environment variable
    delete process.env.TWITTER_BEARER_TOKEN;
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(paths.testHome)) {
      fs.rmSync(paths.testHome, { recursive: true });
    }
    delete process.env.TWITTER_BEARER_TOKEN;
  });

  describe('ensureConfigDir', () => {
    it('should create config directory if it does not exist', () => {
      expect(fs.existsSync(paths.testConfigDir)).toBe(false);
      ensureConfigDir();
      expect(fs.existsSync(paths.testConfigDir)).toBe(true);
    });

    it('should not fail if directory already exists', () => {
      fs.mkdirSync(paths.testConfigDir, { recursive: true });
      expect(() => ensureConfigDir()).not.toThrow();
    });
  });

  describe('getConfigPath', () => {
    it('should return path to config file', () => {
      const configPath = getConfigPath();
      expect(configPath).toBe(paths.testConfigFile);
    });
  });

  describe('getConfigDir', () => {
    it('should return config directory path', () => {
      const configDir = getConfigDir();
      expect(configDir).toBe(paths.testConfigDir);
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
      fs.mkdirSync(paths.testConfigDir, { recursive: true });
      fs.writeFileSync(
        paths.testConfigFile,
        JSON.stringify({ bearerToken: 'test-token', defaultLimit: 20 })
      );

      const config = loadConfig();
      expect(config.bearerToken).toBe('test-token');
      expect(config.defaultLimit).toBe(20);
      // Should still have defaults for unset values
      expect(config.cacheEnabled).toBe(true);
    });

    it('should return default config for invalid JSON', () => {
      fs.mkdirSync(paths.testConfigDir, { recursive: true });
      fs.writeFileSync(paths.testConfigFile, 'invalid json {{{');

      const config = loadConfig();
      expect(config.cacheEnabled).toBe(true);
    });
  });

  describe('saveConfig', () => {
    it('should save config to file', () => {
      const config = { bearerToken: 'test', defaultLimit: 15 };
      saveConfig(config);

      const content = fs.readFileSync(paths.testConfigFile, 'utf-8');
      const parsed = JSON.parse(content);
      expect(parsed.bearerToken).toBe('test');
      expect(parsed.defaultLimit).toBe(15);
    });

    it('should create config directory if needed', () => {
      expect(fs.existsSync(paths.testConfigDir)).toBe(false);
      saveConfig({ bearerToken: 'test' });
      expect(fs.existsSync(paths.testConfigDir)).toBe(true);
    });

    it('should pretty print JSON with 2-space indent', () => {
      saveConfig({ bearerToken: 'test', defaultLimit: 10 });
      const content = fs.readFileSync(paths.testConfigFile, 'utf-8');
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
