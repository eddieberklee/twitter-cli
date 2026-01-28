import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { tmpdir } from 'os';

// Create a unique test directory for each test run
const TEST_HOME = path.join(tmpdir(), `twitter-cli-cache-test-${Date.now()}`);
const TEST_CONFIG_DIR = path.join(TEST_HOME, '.twitter-cli');

// Mock the config module to use test directory
vi.mock('../lib/config.js', () => ({
  getConfigDir: () => TEST_CONFIG_DIR,
  loadConfig: () => ({ cacheEnabled: true, cacheTtlMinutes: 5 }),
}));

// Import after mocking
import { getCache, setCache, deleteCache, clearCache } from '../lib/cache.js';

describe('cache', () => {
  beforeEach(() => {
    // Create test directory
    if (!fs.existsSync(TEST_CONFIG_DIR)) {
      fs.mkdirSync(TEST_CONFIG_DIR, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(TEST_HOME)) {
      fs.rmSync(TEST_HOME, { recursive: true });
    }
    // Clear memory cache between tests by clearing and reloading
    clearCache();
  });

  describe('setCache and getCache', () => {
    it('should store and retrieve data', () => {
      const testData = { foo: 'bar', num: 42 };
      setCache('test-key', testData);
      
      const result = getCache<typeof testData>('test-key');
      expect(result).toEqual(testData);
    });

    it('should return undefined for non-existent key', () => {
      const result = getCache('non-existent');
      expect(result).toBeUndefined();
    });

    it('should store different types of data', () => {
      setCache('string', 'hello');
      setCache('number', 123);
      setCache('array', [1, 2, 3]);
      setCache('object', { nested: { value: true } });

      expect(getCache<string>('string')).toBe('hello');
      expect(getCache<number>('number')).toBe(123);
      expect(getCache<number[]>('array')).toEqual([1, 2, 3]);
      expect(getCache<object>('object')).toEqual({ nested: { value: true } });
    });
  });

  describe('deleteCache', () => {
    it('should remove specific cache entry', () => {
      setCache('key1', 'value1');
      setCache('key2', 'value2');
      
      deleteCache('key1');
      
      expect(getCache('key1')).toBeUndefined();
      expect(getCache('key2')).toBe('value2');
    });

    it('should not throw when deleting non-existent key', () => {
      expect(() => deleteCache('non-existent')).not.toThrow();
    });
  });

  describe('clearCache', () => {
    it('should remove all cached entries', () => {
      setCache('key1', 'value1');
      setCache('key2', 'value2');
      setCache('key3', 'value3');

      clearCache();
      
      expect(getCache('key1')).toBeUndefined();
      expect(getCache('key2')).toBeUndefined();
      expect(getCache('key3')).toBeUndefined();
    });
  });

  describe('cache key handling', () => {
    it('should handle special characters in keys', () => {
      const specialKey = 'search:{"query":"AI agents","options":{}}';
      setCache(specialKey, { result: 'data' });
      
      expect(getCache(specialKey)).toEqual({ result: 'data' });
    });

    it('should differentiate between similar keys', () => {
      setCache('key1', 'value1');
      setCache('key2', 'value2');
      setCache('KEY1', 'VALUE1'); // Case-sensitive

      expect(getCache('key1')).toBe('value1');
      expect(getCache('key2')).toBe('value2');
      expect(getCache('KEY1')).toBe('VALUE1');
    });
  });
});
