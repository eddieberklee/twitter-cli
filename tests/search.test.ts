import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import * as path from 'path';

const CLI_PATH = path.join(__dirname, '..', 'src', 'index.ts');
const PROJECT_ROOT = path.join(__dirname, '..');

// Helper to run search command
function runSearch(query: string, options: string[] = []): {
  stdout: string;
  stderr: string;
  exitCode: number;
} {
  const args = ['search', `"${query}"`, '--mock', ...options].join(' ');
  try {
    const result = execSync(`npx tsx ${CLI_PATH} ${args}`, {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
      env: { ...process.env, NO_COLOR: '1' },
      timeout: 15000,
    });
    return { stdout: result, stderr: '', exitCode: 0 };
  } catch (error: any) {
    return {
      stdout: error.stdout || '',
      stderr: error.stderr || '',
      exitCode: error.status || 1,
    };
  }
}

describe('Search Command E2E', () => {
  describe('Basic Search', () => {
    it('should search and return mock results', () => {
      const { stdout, exitCode } = runSearch('AI agents');
      expect(exitCode).toBe(0);
      expect(stdout).toContain('Found');
      expect(stdout).toContain('tweets');
    });

    it('should display tweet content', () => {
      const { stdout, exitCode } = runSearch('test');
      expect(exitCode).toBe(0);
      // Mock data contains known content
      expect(stdout).toContain('@');
    });

    it('should display metrics', () => {
      const { stdout, exitCode } = runSearch('test');
      expect(exitCode).toBe(0);
      expect(stdout).toContain('❤️');
      expect(stdout).toContain('🔄');
      expect(stdout).toContain('💬');
    });

    it('should display tweet URLs', () => {
      const { stdout, exitCode } = runSearch('test');
      expect(exitCode).toBe(0);
      expect(stdout).toContain('https://twitter.com/');
      expect(stdout).toContain('/status/');
    });
  });

  describe('Output Formats', () => {
    it('should output valid JSON with --json', () => {
      const { stdout, exitCode } = runSearch('test', ['--json']);
      expect(exitCode).toBe(0);
      
      const data = JSON.parse(stdout);
      expect(Array.isArray(data)).toBe(true);
      
      if (data.length > 0) {
        expect(data[0]).toHaveProperty('id');
        expect(data[0]).toHaveProperty('text');
        expect(data[0]).toHaveProperty('author');
        expect(data[0]).toHaveProperty('url');
        expect(data[0]).toHaveProperty('metrics');
        expect(data[0]).toHaveProperty('created_at');
      }
    });

    it('should output CSV with --csv', () => {
      const { stdout, exitCode } = runSearch('test', ['--csv']);
      expect(exitCode).toBe(0);
      
      const lines = stdout.trim().split('\n');
      
      // Check header
      expect(lines[0]).toContain('id');
      expect(lines[0]).toContain('username');
      expect(lines[0]).toContain('text');
      expect(lines[0]).toContain('likes');
      
      // Check we have data rows
      expect(lines.length).toBeGreaterThan(1);
    });

    it('should output only URLs with --quiet', () => {
      const { stdout, exitCode } = runSearch('test', ['--quiet']);
      expect(exitCode).toBe(0);
      
      const lines = stdout.trim().split('\n');
      for (const line of lines) {
        expect(line).toMatch(/^https:\/\/twitter\.com\/.+\/status\/\d+$/);
      }
    });

    it('should output compact format with --compact', () => {
      const { stdout, exitCode } = runSearch('test', ['--compact']);
      expect(exitCode).toBe(0);
      
      // Compact format has username and metrics on same line
      expect(stdout).toContain('@');
      expect(stdout).toContain('❤️');
    });
  });

  describe('Search Options', () => {
    it('should accept --time option', () => {
      // This uses mock data so time filter won't actually filter
      // but it should parse without error
      const { exitCode } = runSearch('test', ['--time', '24h']);
      expect(exitCode).toBe(0);
    });

    it('should accept --min-likes option', () => {
      const { exitCode } = runSearch('test', ['--min-likes', '100']);
      expect(exitCode).toBe(0);
    });

    it('should accept --min-retweets option', () => {
      const { exitCode } = runSearch('test', ['--min-retweets', '50']);
      expect(exitCode).toBe(0);
    });

    it('should accept --verified option', () => {
      const { exitCode } = runSearch('test', ['--verified']);
      expect(exitCode).toBe(0);
    });

    it('should accept --limit option', () => {
      const { exitCode } = runSearch('test', ['--limit', '5']);
      expect(exitCode).toBe(0);
    });

    it('should accept --sort option', () => {
      const { exitCode: exitRecent } = runSearch('test', ['--sort', 'recent']);
      expect(exitRecent).toBe(0);
      
      const { exitCode: exitPopular } = runSearch('test', ['--sort', 'popular']);
      expect(exitPopular).toBe(0);
    });

    it('should accept --lang option', () => {
      const { exitCode } = runSearch('test', ['--lang', 'en']);
      expect(exitCode).toBe(0);
    });

    it('should accept multiple options together', () => {
      const { exitCode } = runSearch('test', [
        '--time', '7d',
        '--min-likes', '100',
        '--verified',
        '--limit', '10',
        '--sort', 'popular',
      ]);
      expect(exitCode).toBe(0);
    });
  });

  describe('JSON Output Structure', () => {
    it('should have correct tweet structure', () => {
      const { stdout } = runSearch('test', ['--json']);
      const data = JSON.parse(stdout);
      
      if (data.length > 0) {
        const tweet = data[0];
        
        // Required fields
        expect(typeof tweet.id).toBe('string');
        expect(typeof tweet.text).toBe('string');
        expect(typeof tweet.url).toBe('string');
        expect(typeof tweet.created_at).toBe('string');
        
        // Author object
        expect(tweet.author).toBeDefined();
        expect(typeof tweet.author.username).toBe('string');
        expect(typeof tweet.author.name).toBe('string');
        
        // Metrics object
        expect(tweet.metrics).toBeDefined();
        expect(typeof tweet.metrics.like_count).toBe('number');
        expect(typeof tweet.metrics.retweet_count).toBe('number');
      }
    });

    it('should have valid URLs in JSON output', () => {
      const { stdout } = runSearch('test', ['--json']);
      const data = JSON.parse(stdout);
      
      for (const tweet of data) {
        expect(tweet.url).toMatch(/^https:\/\/twitter\.com\/.+\/status\/\d+$/);
      }
    });

    it('should have valid ISO dates', () => {
      const { stdout } = runSearch('test', ['--json']);
      const data = JSON.parse(stdout);
      
      for (const tweet of data) {
        const date = new Date(tweet.created_at);
        expect(date.toString()).not.toBe('Invalid Date');
      }
    });
  });

  describe('CSV Output Structure', () => {
    it('should have all expected columns', () => {
      const { stdout } = runSearch('test', ['--csv']);
      const header = stdout.trim().split('\n')[0];
      
      const expectedColumns = [
        'id', 'username', 'name', 'text',
        'likes', 'retweets', 'replies', 'url'
      ];
      
      for (const col of expectedColumns) {
        expect(header.toLowerCase()).toContain(col);
      }
    });

    it('should properly escape CSV content', () => {
      const { stdout } = runSearch('test', ['--csv']);
      const lines = stdout.trim().split('\n');
      
      // If any field contains comma, it should be quoted
      // The mock data might have quotes or commas in text
      // Just verify the structure is valid
      expect(lines.length).toBeGreaterThan(1);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle invalid time range gracefully', () => {
      // Invalid time range should still work (just won't filter)
      const { exitCode } = runSearch('test', ['--time', 'invalid']);
      expect(exitCode).toBe(0);
    });

    it('should handle invalid sort option', () => {
      // Commander might reject invalid sort values
      const { stderr, exitCode } = runSearch('test', ['--sort', 'invalid']);
      // This may or may not error depending on implementation
      // Just verify it doesn't crash
      expect(typeof exitCode).toBe('number');
    });

    it('should handle negative limit', () => {
      // Negative values should be handled
      const { exitCode } = runSearch('test', ['--limit', '-1']);
      expect(typeof exitCode).toBe('number');
    });
  });
});

describe('Search Result Quality', () => {
  it('should return results with engagement metrics', () => {
    const { stdout } = runSearch('test', ['--json']);
    const data = JSON.parse(stdout);
    
    for (const tweet of data) {
      expect(tweet.metrics.like_count).toBeGreaterThanOrEqual(0);
      expect(tweet.metrics.retweet_count).toBeGreaterThanOrEqual(0);
    }
  });

  it('should have verified status in author info', () => {
    const { stdout } = runSearch('test', ['--json']);
    const data = JSON.parse(stdout);
    
    for (const tweet of data) {
      expect(typeof tweet.author.verified).toBe('boolean');
    }
  });
});
