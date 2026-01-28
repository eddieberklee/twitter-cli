import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatNumber,
  formatRelativeTime,
  formatTweet,
  formatTweetCompact,
  formatJson,
  formatCsv,
  formatQuiet,
  formatTweets,
  formatMetrics,
  wrapText,
  truncate,
  getVerificationBadge,
} from '../lib/format.js';
import type { Tweet } from '../types/index.js';

// Create a mock tweet for testing
function createMockTweet(overrides: Partial<Tweet> = {}): Tweet {
  return {
    id: '123456789',
    text: 'Test tweet content',
    author: {
      id: '1',
      username: 'testuser',
      name: 'Test User',
      verified: true,
      followers_count: 10000,
    },
    created_at: new Date(),
    metrics: {
      likes: 1000,
      retweets: 500,
      replies: 100,
      views: 50000,
    },
    url: 'https://twitter.com/testuser/status/123456789',
    ...overrides,
  };
}

describe('formatNumber', () => {
  it('should format small numbers as-is', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(1)).toBe('1');
    expect(formatNumber(999)).toBe('999');
  });

  it('should format thousands with K suffix', () => {
    expect(formatNumber(1000)).toBe('1K');
    expect(formatNumber(1500)).toBe('1.5K');
    expect(formatNumber(10000)).toBe('10K');
  });

  it('should format millions with M suffix', () => {
    expect(formatNumber(1000000)).toBe('1M');
    expect(formatNumber(1500000)).toBe('1.5M');
    expect(formatNumber(10000000)).toBe('10M');
  });

  it('should remove trailing .0', () => {
    expect(formatNumber(1000)).toBe('1K');
    expect(formatNumber(2000)).toBe('2K');
    expect(formatNumber(1000000)).toBe('1M');
  });
});

describe('formatRelativeTime', () => {
  it('should format just now', () => {
    const now = new Date();
    expect(formatRelativeTime(now)).toBe('just now');
  });

  it('should format minutes ago', () => {
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
    expect(formatRelativeTime(tenMinsAgo)).toBe('10m ago');
  });

  it('should format hours ago', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    expect(formatRelativeTime(twoHoursAgo)).toBe('2h ago');
  });

  it('should format days ago', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(twoDaysAgo)).toBe('2d ago');
  });
});

describe('wrapText', () => {
  it('should not wrap short text', () => {
    expect(wrapText('short', 50)).toBe('short');
  });

  it('should wrap long text at word boundaries', () => {
    const longText = 'This is a very long sentence that needs to be wrapped';
    const wrapped = wrapText(longText, 20);
    const lines = wrapped.split('\n');
    for (const line of lines) {
      expect(line.length).toBeLessThanOrEqual(20);
    }
  });

  it('should preserve newlines', () => {
    const text = 'Line 1\nLine 2';
    expect(wrapText(text, 50)).toBe('Line 1\nLine 2');
  });
});

describe('truncate', () => {
  it('should not truncate short text', () => {
    expect(truncate('short', 10)).toBe('short');
  });

  it('should truncate long text with ellipsis', () => {
    expect(truncate('This is a long text', 10)).toBe('This is...');
  });
});

describe('getVerificationBadge', () => {
  it('should return empty for non-verified users', () => {
    expect(getVerificationBadge(false)).toBe('');
  });

  it('should return badge for verified users', () => {
    expect(getVerificationBadge(true)).toContain('✓');
  });
});

describe('formatMetrics', () => {
  it('should format metrics with emoji', () => {
    const metrics = { likes: 1000, retweets: 500, replies: 100, views: 50000 };
    const result = formatMetrics(metrics);
    
    expect(result).toContain('❤️');
    expect(result).toContain('1K');
    expect(result).toContain('🔄');
    expect(result).toContain('500');
    expect(result).toContain('💬');
    expect(result).toContain('100');
  });

  it('should include views when present', () => {
    const metrics = { likes: 100, retweets: 50, replies: 10, views: 10000 };
    const result = formatMetrics(metrics);
    expect(result).toContain('👁️');
    expect(result).toContain('10K');
  });

  it('should format compact metrics', () => {
    const metrics = { likes: 1000, retweets: 500, replies: 100, views: 50000 };
    const result = formatMetrics(metrics, true);
    expect(result).toContain('❤️');
    expect(result).toContain('🔄');
    // Compact mode doesn't include replies and views
    expect(result).not.toContain('💬');
  });
});

describe('formatTweet', () => {
  it('should format a tweet with all components', () => {
    const tweet = createMockTweet();
    const result = formatTweet(tweet, { noColor: true });
    
    expect(result).toContain('@testuser');
    expect(result).toContain('Test tweet content');
    expect(result).toContain('https://twitter.com/testuser/status/123456789');
  });

  it('should include metrics', () => {
    const tweet = createMockTweet();
    const result = formatTweet(tweet, { noColor: true });
    
    expect(result).toContain('❤️');
    expect(result).toContain('🔄');
    expect(result).toContain('💬');
  });

  it('should include divider lines', () => {
    const tweet = createMockTweet();
    const result = formatTweet(tweet, { noColor: true });
    expect(result).toContain('━');
  });
});

describe('formatTweetCompact', () => {
  it('should format compact tweets', () => {
    const tweet = createMockTweet({ text: 'A '.repeat(100) }); // Long text
    const result = formatTweetCompact(tweet, { noColor: true });
    
    expect(result).toContain('@testuser');
    expect(result).toContain('...');  // Should truncate
  });
});

describe('formatJson', () => {
  it('should return valid JSON', () => {
    const tweets = [createMockTweet()];
    const result = formatJson(tweets);
    
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it('should include all tweet properties', () => {
    const tweets = [createMockTweet()];
    const result = formatJson(tweets);
    const parsed = JSON.parse(result);
    
    expect(parsed[0]).toHaveProperty('id');
    expect(parsed[0]).toHaveProperty('text');
    expect(parsed[0]).toHaveProperty('author');
    expect(parsed[0]).toHaveProperty('metrics');
    expect(parsed[0]).toHaveProperty('url');
    expect(parsed[0]).toHaveProperty('created_at');
  });
});

describe('formatCsv', () => {
  it('should have header row', () => {
    const tweets = [createMockTweet()];
    const result = formatCsv(tweets);
    const lines = result.split('\n');
    
    expect(lines[0]).toContain('id');
    expect(lines[0]).toContain('username');
    expect(lines[0]).toContain('text');
    expect(lines[0]).toContain('likes');
  });

  it('should have data rows', () => {
    const tweets = [createMockTweet()];
    const result = formatCsv(tweets);
    const lines = result.split('\n');
    
    expect(lines.length).toBeGreaterThan(1);
    expect(lines[1]).toContain('testuser');
  });

  it('should escape special characters', () => {
    const tweet = createMockTweet({ text: 'Test, with "quotes"' });
    const result = formatCsv([tweet]);
    
    // Should have doubled quotes for escaping
    expect(result).toContain('""');
  });
});

describe('formatQuiet', () => {
  it('should return only URLs', () => {
    const tweets = [
      createMockTweet(),
      createMockTweet({ id: '987654321', url: 'https://twitter.com/testuser/status/987654321' })
    ];
    const result = formatQuiet(tweets);
    const lines = result.split('\n');
    
    expect(lines.length).toBe(2);
    for (const line of lines) {
      expect(line).toMatch(/^https:\/\/twitter\.com\/.+\/status\/\d+$/);
    }
  });
});

describe('formatTweets', () => {
  it('should format as JSON when json option is true', () => {
    const tweets = [createMockTweet()];
    const result = formatTweets(tweets, { json: true });
    
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it('should format as CSV when csv option is true', () => {
    const tweets = [createMockTweet()];
    const result = formatTweets(tweets, { csv: true });
    
    expect(result).toContain('id,');
  });

  it('should format as URLs when quiet option is true', () => {
    const tweets = [createMockTweet()];
    const result = formatTweets(tweets, { quiet: true });
    
    expect(result).toMatch(/^https:\/\/twitter\.com\//);
  });

  it('should format as rich text by default', () => {
    const tweets = [createMockTweet()];
    const result = formatTweets(tweets, { noColor: true });
    
    expect(result).toContain('━');
    expect(result).toContain('@testuser');
  });

  it('should format compact when compact option is true', () => {
    const tweets = [createMockTweet()];
    const result = formatTweets(tweets, { compact: true, noColor: true });
    
    expect(result).toContain('@testuser');
    expect(result).not.toContain('━━━━━');  // No full dividers in compact
  });
});
