import chalk from 'chalk';
// @ts-ignore - chalk@4 types work with ESM
import { Tweet, OutputOptions } from '../types/index.js';
export function formatNumber(n: number): string { if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M'; if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K'; return n.toString(); }
export function formatRelativeTime(d: Date): string { const m = Math.floor((Date.now() - d.getTime()) / 60000), h = Math.floor(m / 60), dy = Math.floor(h / 24); if (dy > 0) return `${dy}d ago`; if (h > 0) return `${h}h ago`; if (m > 0) return `${m}m ago`; return 'just now'; }
function wrap(t: string, w: number): string { const words = t.split(' '), lines: string[] = []; let l = ''; for (const word of words) { if (l.length + word.length + 1 <= w) l += (l ? ' ' : '') + word; else { if (l) lines.push(l); l = word; } } if (l) lines.push(l); return lines.join('\n'); }
export function formatTweet(t: Tweet, o: OutputOptions = {}): string {
  const c = o.noColor ? { bold: (s: string) => s, cyan: (s: string) => s, gray: (s: string) => s, yellow: (s: string) => s, blue: (s: string) => s, dim: (s: string) => s } : chalk;
  const div = '━'.repeat(56), badge = t.author.verified ? ' ✓' : '';
  const hdr = c.bold(`@${t.author.username}`) + c.cyan(badge) + c.gray(` • ${formatRelativeTime(t.created_at)}`);
  const met = [c.yellow(`❤️  ${formatNumber(t.metrics.likes)}`), c.blue(`🔄 ${formatNumber(t.metrics.retweets)}`), c.gray(`💬 ${formatNumber(t.metrics.replies)}`), c.dim(`👁️  ${formatNumber(t.metrics.views)}`)].join('  ');
  return [div, hdr, div, wrap(t.text, 54), '', met, '', c.dim(`🔗 ${t.url}`), div].join('\n');
}
export function formatJson(ts: Tweet[]): string { return JSON.stringify(ts, null, 2); }
export function formatCsv(ts: Tweet[]): string { const esc = (s: string) => s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s; return ['id,username,text,likes,retweets,replies,views,created_at,url', ...ts.map(t => [t.id, t.author.username, esc(t.text.replace(/\n/g, ' ')), t.metrics.likes, t.metrics.retweets, t.metrics.replies, t.metrics.views, t.created_at.toISOString(), t.url].join(','))].join('\n'); }
export function formatQuiet(ts: Tweet[]): string { return ts.map(t => t.url).join('\n'); }
export function formatTweets(ts: Tweet[], o: OutputOptions = {}): string { if (o.json) return formatJson(ts); if (o.csv) return formatCsv(ts); if (o.quiet) return formatQuiet(ts); return ts.map(t => formatTweet(t, o)).join('\n\n'); }
export function printSuccess(m: string): void { console.log(chalk.green('✓ ') + m); }
export function printError(m: string): void { console.error(chalk.red('✗ ') + m); }
export function printWarning(m: string): void { console.log(chalk.yellow('⚠ ') + m); }
export function printInfo(m: string): void { console.log(chalk.blue('ℹ ') + m); }
export function printDemoBanner(): void { console.log(chalk.yellow.bold('\n📋 DEMO MODE')); console.log(chalk.yellow('No API credentials. Showing sample data.')); console.log(chalk.dim('Run `twitter-cli config` to set up.\n')); }
