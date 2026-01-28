import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Tweet } from '../types/index.js';

// Mock the config module
vi.mock('../lib/config.js', () => ({
  getConfigValue: vi.fn((key: string) => {
    if (key === 'bearerToken') return 'test-token';
    return undefined;
  }),
  loadConfig: vi.fn(() => ({ cacheEnabled: false })),
}));

// Mock the cache module
vi.mock('../lib/cache.js', () => ({
  getCache: vi.fn(() => undefined),
  setCache: vi.fn(),
}));

// Import mock data generator
import {
  generateMockTweets,
  generateMockReplies,
  generateMockUserTweets,
} from '../lib/mock-data.js';

describe('Mock Data Generation', () => {
  describe('generateMockTweets', () => {
    it('should return an array of tweets', () => {
      const tweets = generateMockTweets('AI agents', 5);
      
      expect(Array.isArray(tweets)).toBe(true);
      expect(tweets.length).toBeGreaterThan(0);
      expect(tweets.length).toBeLessThanOrEqual(5);
    });

    it('should have valid tweet structure', () => {
      const tweets = generateMockTweets('test', 3);
      
      for (const tweet of tweets) {
        expect(tweet).toHaveProperty('id');
        expect(tweet).toHaveProperty('text');
        expect(tweet).toHaveProperty('author');
        expect(tweet).toHaveProperty('created_at');
        expect(tweet).toHaveProperty('metrics');
        expect(tweet).toHaveProperty('url');
      }
    });

    it('should have valid author structure', () => {
      const tweets = generateMockTweets('test', 3);
      
      for (const tweet of tweets) {
        expect(tweet.author).toHaveProperty('id');
        expect(tweet.author).toHaveProperty('username');
        expect(tweet.author).toHaveProperty('name');
        expect(typeof tweet.author.verified).toBe('boolean');
      }
    });

    it('should have valid metrics structure', () => {
      const tweets = generateMockTweets('test', 3);
      
      for (const tweet of tweets) {
        expect(typeof tweet.metrics.likes).toBe('number');
        expect(typeof tweet.metrics.retweets).toBe('number');
        expect(typeof tweet.metrics.replies).toBe('number');
        expect(typeof tweet.metrics.views).toBe('number');
      }
    });

    it('should have valid URLs', () => {
      const tweets = generateMockTweets('test', 3);
      
      for (const tweet of tweets) {
        expect(tweet.url).toMatch(/^https:\/\/twitter\.com\/.+\/status\/\d+$/);
      }
    });

    it('should have valid dates', () => {
      const tweets = generateMockTweets('test', 3);
      
      for (const tweet of tweets) {
        expect(tweet.created_at).toBeInstanceOf(Date);
        expect(tweet.created_at.getTime()).toBeLessThanOrEqual(Date.now());
      }
    });

    it('should be sorted by likes (popular first)', () => {
      const tweets = generateMockTweets('test', 5);
      
      for (let i = 1; i < tweets.length; i++) {
        expect(tweets[i - 1].metrics.likes).toBeGreaterThanOrEqual(tweets[i].metrics.likes);
      }
    });

    it('should respect limit parameter', () => {
      const tweets1 = generateMockTweets('test', 1);
      const tweets3 = generateMockTweets('test', 3);
      
      expect(tweets1.length).toBeLessThanOrEqual(1);
      expect(tweets3.length).toBeLessThanOrEqual(3);
    });

    it('should generate deterministic results for same query', () => {
      const tweets1 = generateMockTweets('same query', 3);
      const tweets2 = generateMockTweets('same query', 3);
      
      // Same query should produce tweets from same authors (seed-based)
      expect(tweets1[0].author.username).toBe(tweets2[0].author.username);
    });
  });

  describe('generateMockReplies', () => {
    it('should return an array of reply tweets', () => {
      const replies = generateMockReplies('123456789', 5);
      
      expect(Array.isArray(replies)).toBe(true);
      expect(replies.length).toBeGreaterThan(0);
    });

    it('should include in_reply_to_id referencing parent tweet', () => {
      const parentId = '123456789';
      const replies = generateMockReplies(parentId, 3);
      
      for (const reply of replies) {
        expect(reply.in_reply_to_id).toBe(parentId);
      }
    });

    it('should be sorted by likes', () => {
      const replies = generateMockReplies('123', 3);
      
      for (let i = 1; i < replies.length; i++) {
        expect(replies[i - 1].metrics.likes).toBeGreaterThanOrEqual(replies[i].metrics.likes);
      }
    });
  });

  describe('generateMockUserTweets', () => {
    it('should return tweets from the specified user', () => {
      const tweets = generateMockUserTweets('elonmusk', 5);
      
      expect(Array.isArray(tweets)).toBe(true);
      for (const tweet of tweets) {
        expect(tweet.author.username).toBe('elonmusk');
      }
    });

    it('should handle unknown usernames', () => {
      const tweets = generateMockUserTweets('unknownuser123', 3);
      
      expect(Array.isArray(tweets)).toBe(true);
      expect(tweets.length).toBeGreaterThan(0);
      expect(tweets[0].author.username).toBe('unknownuser123');
    });

    it('should be sorted by likes', () => {
      const tweets = generateMockUserTweets('sama', 5);
      
      for (let i = 1; i < tweets.length; i++) {
        expect(tweets[i - 1].metrics.likes).toBeGreaterThanOrEqual(tweets[i].metrics.likes);
      }
    });

    it('should have valid tweet structure', () => {
      const tweets = generateMockUserTweets('karpathy', 3);
      
      for (const tweet of tweets) {
        expect(tweet).toHaveProperty('id');
        expect(tweet).toHaveProperty('text');
        expect(tweet).toHaveProperty('author');
        expect(tweet).toHaveProperty('url');
        expect(tweet).toHaveProperty('metrics');
      }
    });
  });
});

describe('Tweet URL Format', () => {
  it('should generate correct Twitter URLs', () => {
    const tweets = generateMockTweets('test', 3);
    
    for (const tweet of tweets) {
      const expectedPattern = `https://twitter.com/${tweet.author.username}/status/${tweet.id}`;
      expect(tweet.url).toBe(expectedPattern);
    }
  });
});

describe('Tweet Metrics Validity', () => {
  it('should have realistic engagement numbers', () => {
    const tweets = generateMockTweets('test', 5);
    
    for (const tweet of tweets) {
      expect(tweet.metrics.likes).toBeGreaterThanOrEqual(0);
      expect(tweet.metrics.retweets).toBeGreaterThanOrEqual(0);
      expect(tweet.metrics.replies).toBeGreaterThanOrEqual(0);
      expect(tweet.metrics.views).toBeGreaterThanOrEqual(0);
      // Views should generally be higher than likes
      expect(tweet.metrics.views).toBeGreaterThanOrEqual(tweet.metrics.likes);
    }
  });
});
