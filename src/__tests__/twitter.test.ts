import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  TwitterApiError,
  RateLimitError,
  getMockSearchResults,
} from '../lib/twitter.js';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock the config module
vi.mock('../lib/config.js', () => ({
  getBearerToken: vi.fn(() => 'test-token'),
  hasBearerToken: vi.fn(() => true),
  loadConfig: () => ({}),
}));

// Mock the cache module
vi.mock('../lib/cache.js', () => ({
  get: vi.fn(() => null),
  set: vi.fn(),
}));

// Mock rate limit module
vi.mock('../lib/rate-limit.js', () => ({
  canMakeRequest: vi.fn(() => true),
  getTimeUntilReset: vi.fn(() => null),
  updateRateLimit: vi.fn(),
  formatTimeUntilReset: vi.fn((s) => `${s}s`),
  parseRateLimitHeaders: vi.fn(() => null),
}));

describe('Twitter API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  describe('TwitterApiError', () => {
    it('should have correct name', () => {
      const error = new TwitterApiError('test');
      expect(error.name).toBe('TwitterApiError');
    });

    it('should include status code', () => {
      const error = new TwitterApiError('test', 404);
      expect(error.statusCode).toBe(404);
    });

    it('should include API errors', () => {
      const errors = [{ title: 'Not Found', detail: 'Tweet not found' }];
      const error = new TwitterApiError('test', 404, errors);
      expect(error.errors).toEqual(errors);
    });
  });

  describe('RateLimitError', () => {
    it('should have correct name', () => {
      const error = new RateLimitError(60);
      expect(error.name).toBe('RateLimitError');
    });

    it('should include reset seconds', () => {
      const error = new RateLimitError(120);
      expect(error.resetSeconds).toBe(120);
    });

    it('should format message with time', () => {
      const error = new RateLimitError(60);
      expect(error.message).toContain('Rate limit');
    });
  });

  describe('getMockSearchResults', () => {
    it('should return mock tweets and users', () => {
      const { tweets, users } = getMockSearchResults();

      expect(tweets).toBeInstanceOf(Array);
      expect(tweets.length).toBeGreaterThan(0);
      expect(users).toBeInstanceOf(Map);
      expect(users.size).toBeGreaterThan(0);
    });

    it('should have valid tweet structure', () => {
      const { tweets } = getMockSearchResults();

      for (const tweet of tweets) {
        expect(tweet).toHaveProperty('id');
        expect(tweet).toHaveProperty('text');
        expect(tweet).toHaveProperty('author_id');
        expect(tweet).toHaveProperty('created_at');
        expect(tweet).toHaveProperty('public_metrics');
      }
    });

    it('should have valid user structure', () => {
      const { users } = getMockSearchResults();

      for (const user of users.values()) {
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('name');
        expect(user).toHaveProperty('username');
      }
    });

    it('should link tweets to users', () => {
      const { tweets, users } = getMockSearchResults();

      for (const tweet of tweets) {
        const author = users.get(tweet.author_id);
        expect(author).toBeDefined();
      }
    });

    it('should have realistic metrics', () => {
      const { tweets } = getMockSearchResults();

      for (const tweet of tweets) {
        expect(tweet.public_metrics?.like_count).toBeGreaterThan(0);
        expect(tweet.public_metrics?.retweet_count).toBeGreaterThan(0);
        expect(tweet.public_metrics?.reply_count).toBeGreaterThan(0);
      }
    });

    it('should have valid ISO date strings', () => {
      const { tweets } = getMockSearchResults();

      for (const tweet of tweets) {
        const date = new Date(tweet.created_at);
        expect(date.toString()).not.toBe('Invalid Date');
        // Should be recent (within last 24 hours for mock data)
        expect(Date.now() - date.getTime()).toBeLessThan(24 * 60 * 60 * 1000);
      }
    });
  });

  describe('searchTweets', () => {
    it('should build correct API URL with query', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: () => Promise.resolve({ data: [], meta: { result_count: 0 } }),
      });

      // Import dynamically to avoid cached module
      const { searchTweets } = await import('../lib/twitter.js');
      await searchTweets('AI agents');

      expect(mockFetch).toHaveBeenCalled();
      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('query=');
      expect(url).toContain('AI');
    });

    it('should apply time filter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: () => Promise.resolve({ data: [], meta: { result_count: 0 } }),
      });

      const { searchTweets } = await import('../lib/twitter.js');
      await searchTweets('test', { time: '24h' });

      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('start_time=');
    });

    it('should apply min_likes filter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: () => Promise.resolve({ data: [], meta: { result_count: 0 } }),
      });

      const { searchTweets } = await import('../lib/twitter.js');
      await searchTweets('test', { minLikes: 100 });

      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('min_faves');
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: new Headers(),
        text: () => Promise.resolve('{"errors":[{"title":"Unauthorized"}]}'),
      });

      const { searchTweets } = await import('../lib/twitter.js');

      await expect(searchTweets('test')).rejects.toThrow(TwitterApiError);
    });
  });

  describe('rate limiting behavior', () => {
    it('should handle 429 response', async () => {
      const headers = new Headers();
      headers.set('x-rate-limit-reset', String(Math.floor(Date.now() / 1000) + 900));

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        headers,
        text: () => Promise.resolve(''),
      });

      const { searchTweets } = await import('../lib/twitter.js');

      await expect(searchTweets('test')).rejects.toThrow(RateLimitError);
    });
  });
});

describe('API Response Mapping', () => {
  it('should map users to tweets correctly', () => {
    const { tweets, users } = getMockSearchResults();

    // Every tweet should have a corresponding user
    tweets.forEach((tweet) => {
      const user = users.get(tweet.author_id);
      expect(user).toBeDefined();
      expect(user?.username).toBeDefined();
    });
  });
});
