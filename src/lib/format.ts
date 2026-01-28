/**
 * Enhanced output formatting for Twitter CLI
 */

import pc from 'picocolors';
import type { Tweet, OutputOptions } from '../types/index.js';

let colorsEnabled = true;

export function setColorsEnabled(enabled: boolean): void {
  colorsEnabled = enabled;
}

function useColors(): boolean {
  if (!colorsEnabled) return false;
  if (process.env.NO_COLOR) return false;
  return true;
}

function c(fn: (text: string) => string, text: string): string {
  return useColors() ? fn(text) : text;
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num.toString();
}

export function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function wrapText(text: string, maxWidth: number): string {
  const lines: string[] = [];
  const paragraphs = text.split('\n');

  for (const paragraph of paragraphs) {
    if (paragraph.length <= maxWidth) { lines.push(paragraph); continue; }
    const words = paragraph.split(' ');
    let currentLine = '';
    for (const word of words) {
      if (word.length > maxWidth) {
        if (currentLine) { lines.push(currentLine); currentLine = ''; }
        for (let i = 0; i < word.length; i += maxWidth) lines.push(word.slice(i, i + maxWidth));
        continue;
      }
      if (currentLine.length + word.length + 1 <= maxWidth) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
  }
  return lines.join('\n');
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

export function divider(width: number = 56, heavy: boolean = false): string {
  return c(pc.dim, (heavy ? '━' : '─').repeat(width));
}

function getEngagementColor(likes: number): (text: string) => string {
  if (likes >= 10000) return pc.green;
  if (likes >= 1000) return pc.cyan;
  if (likes >= 100) return pc.blue;
  return pc.dim;
}

export function getVerificationBadge(verified: boolean): string {
  if (!verified) return '';
  return useColors() ? pc.blue(' ✓') : ' ✓';
}

export function formatMetrics(metrics: Tweet['metrics'], compact: boolean = false): string {
  const likesColor = getEngagementColor(metrics.likes);
  if (compact) {
    return [c(likesColor, `❤️ ${formatNumber(metrics.likes)}`), c(pc.dim, `🔄 ${formatNumber(metrics.retweets)}`)].join('  ');
  }
  const parts = [
    c(likesColor, `❤️  ${formatNumber(metrics.likes).padEnd(6)}`),
    c(pc.dim, `🔄 ${formatNumber(metrics.retweets).padEnd(6)}`),
    c(pc.dim, `💬 ${formatNumber(metrics.replies).padEnd(6)}`),
  ];
  if (metrics.views > 0) parts.push(c(pc.dim, `👁️  ${formatNumber(metrics.views)}`));
  return parts.join('  ');
}

export function formatTweet(tweet: Tweet, options: OutputOptions = {}): string {
  if (options.noColor) setColorsEnabled(false);
  const width = 56;
  const lines: string[] = [];
  lines.push(divider(width, true));
  const badge = getVerificationBadge(tweet.author.verified);
  const timeAgo = formatRelativeTime(tweet.created_at);
  lines.push(`${c(pc.bold, `@${tweet.author.username}`)}${badge} ${c(pc.dim, '•')} ${c(pc.dim, timeAgo)}`);
  lines.push(divider(width));
  lines.push(wrapText(tweet.text, width - 2));
  lines.push('');
  lines.push(formatMetrics(tweet.metrics));
  lines.push('');
  lines.push(`🔗 ${c(pc.cyan, tweet.url)}`);
  lines.push(divider(width, true));
  if (options.noColor) setColorsEnabled(true);
  return lines.join('\n');
}

export function formatTweetCompact(tweet: Tweet, options: OutputOptions = {}): string {
  if (options.noColor) setColorsEnabled(false);
  const badge = getVerificationBadge(tweet.author.verified);
  const timeAgo = formatRelativeTime(tweet.created_at);
  const text = truncate(tweet.text.replace(/\n/g, ' ').trim(), 60);
  const metrics = formatMetrics(tweet.metrics, true);
  const result = [
    `${c(pc.bold, `@${tweet.author.username}`)}${badge} ${c(pc.dim, `(${timeAgo})`)} ${metrics}`,
    `  ${text}`,
    `  ${c(pc.dim, tweet.url)}`,
  ].join('\n');
  if (options.noColor) setColorsEnabled(true);
  return result;
}

export function formatQuiet(tweets: Tweet[]): string {
  return tweets.map(t => t.url).join('\n');
}

export function formatJson(tweets: Tweet[]): string {
  return JSON.stringify(tweets.map(t => ({
    id: t.id, text: t.text,
    author: { username: t.author.username, name: t.author.name, verified: t.author.verified },
    metrics: t.metrics, created_at: t.created_at.toISOString(), url: t.url,
  })), null, 2);
}

export function formatCsv(tweets: Tweet[]): string {
  const escapeCSV = (str: string): string => (str.includes(',') || str.includes('"') || str.includes('\n')) ? `"${str.replace(/"/g, '""')}"` : str;
  const headers = ['id', 'username', 'name', 'text', 'likes', 'retweets', 'replies', 'views', 'created_at', 'url'];
  const rows = tweets.map(t => [
    t.id, t.author.username, escapeCSV(t.author.name), escapeCSV(t.text.replace(/\n/g, ' ')),
    t.metrics.likes.toString(), t.metrics.retweets.toString(), t.metrics.replies.toString(), t.metrics.views.toString(),
    t.created_at.toISOString(), t.url,
  ].join(','));
  return [headers.join(','), ...rows].join('\n');
}

export function formatTweets(tweets: Tweet[], options: OutputOptions = {}): string {
  if (options.json) return formatJson(tweets);
  if (options.csv) return formatCsv(tweets);
  if (options.quiet) return formatQuiet(tweets);
  if (options.compact) return tweets.map(t => formatTweetCompact(t, options)).join('\n\n');
  return tweets.map(t => formatTweet(t, options)).join('\n\n');
}

export function printSuccess(message: string): void { console.log(c(pc.green, '✓ ') + message); }
export function printError(message: string): void { console.error(c(pc.red, '✗ ') + message); }
export function printWarning(message: string): void { console.log(c(pc.yellow, '⚠ ') + message); }
export function printInfo(message: string): void { console.log(c(pc.blue, 'ℹ ') + message); }
export function printDim(message: string): void { console.log(c(pc.dim, message)); }

export function printDemoBanner(): void {
  console.log('');
  console.log(c(pc.yellow, c(pc.bold, '📋 DEMO MODE')));
  console.log(c(pc.yellow, 'No API credentials configured. Showing sample data.'));
  console.log(c(pc.dim, 'Run `twitter-cli config init` to set up your Twitter API token.'));
  console.log('');
}

export function printWelcomeBanner(): void {
  console.log('');
  console.log(c(pc.cyan, c(pc.bold, '🐦 Welcome to Twitter CLI!')));
  console.log('');
  console.log('A fast command-line tool to search Twitter and display popular tweets.');
  console.log('');
  console.log(c(pc.bold, 'Quick Start:'));
  console.log(`  ${c(pc.green, '$')} twitter-cli search "AI agents"     ${c(pc.dim, '# Search for tweets')}`);
  console.log(`  ${c(pc.green, '$')} twitter-cli user @elonmusk         ${c(pc.dim, '# Get user tweets')}`);
  console.log(`  ${c(pc.green, '$')} twitter-cli replies 123456789      ${c(pc.dim, '# Get tweet replies')}`);
  console.log('');
  console.log(c(pc.bold, 'Setup:'));
  console.log(`  ${c(pc.green, '$')} twitter-cli config init            ${c(pc.dim, '# Interactive setup')}`);
  console.log('');
  console.log(`Run ${c(pc.cyan, 'twitter-cli --help')} for more options.`);
  console.log('');
}

export function printRateLimitWarning(remaining: number, limit: number, resetAt: Date): void {
  const resetIn = Math.max(0, Math.ceil((resetAt.getTime() - Date.now()) / 1000));
  const minutes = Math.floor(resetIn / 60);
  const seconds = resetIn % 60;
  if (remaining === 0) {
    console.log('');
    printError(`Rate limit exceeded! Resets in ${minutes}m ${seconds}s`);
    console.log(c(pc.dim, `  Reset time: ${resetAt.toLocaleTimeString()}`));
  } else if (remaining < 10) {
    console.log('');
    printWarning(`Rate limit low: ${remaining}/${limit} requests remaining`);
    console.log(c(pc.dim, `  Resets in ${minutes}m ${seconds}s`));
  } else {
    printDim(`Rate limit: ${remaining}/${limit} (resets in ${minutes}m ${seconds}s)`);
  }
}

export function printSearchHeader(query: string, count: number, options?: { fromCache?: boolean }): void {
  console.log('');
  console.log(c(pc.bold, `🔍 Search: "${query}"`));
  console.log(c(pc.dim, `Found ${count} tweet${count === 1 ? '' : 's'}${options?.fromCache ? ' (cached)' : ''}`));
  console.log('');
}

export function printUserHeader(username: string, count: number, options?: { fromCache?: boolean }): void {
  console.log('');
  console.log(c(pc.bold, `👤 @${username}`));
  console.log(c(pc.dim, `${count} recent tweet${count === 1 ? '' : 's'}${options?.fromCache ? ' (cached)' : ''}`));
  console.log('');
}

export function printRepliesHeader(tweetId: string, count: number, options?: { fromCache?: boolean }): void {
  console.log('');
  console.log(c(pc.bold, `💬 Replies to tweet ${tweetId}`));
  console.log(c(pc.dim, `${count} top repl${count === 1 ? 'y' : 'ies'}${options?.fromCache ? ' (cached)' : ''}`));
  console.log('');
}

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

export function createSpinner(message: string): { stop: (success?: boolean, finalMessage?: string) => void } {
  if (!process.stdout.isTTY || process.env.CI) {
    console.log(c(pc.dim, `${message}...`));
    return { stop: () => {} };
  }
  let frameIndex = 0;
  const interval = setInterval(() => {
    process.stdout.write(`\r${c(pc.cyan, SPINNER_FRAMES[frameIndex])} ${message}`);
    frameIndex = (frameIndex + 1) % SPINNER_FRAMES.length;
  }, 80);
  return {
    stop: (success = true, finalMessage?: string) => {
      clearInterval(interval);
      const icon = success ? c(pc.green, '✓') : c(pc.red, '✗');
      process.stdout.write(`\r${icon} ${finalMessage || message}\n`);
    }
  };
}
