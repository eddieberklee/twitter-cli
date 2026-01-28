import { Command } from 'commander';
import { getReplies, isDemoMode } from '../lib/api.js';
import { formatTweets, printError, printInfo, printDemoBanner } from '../lib/format.js';
import { OutputOptions } from '../types/index.js';
export function createRepliesCommand(): Command {
  return new Command('replies').description('Get top replies').argument('<tweet_id>', 'Tweet ID')
    .option('-n, --limit <n>', 'Limit').option('--json', 'JSON').option('--csv', 'CSV').option('-q, --quiet', 'URLs only').option('--no-color', 'No colors')
    .action(async (tweetId: string, opts) => {
      try {
        if (!/^\d+$/.test(tweetId)) { printError('Invalid tweet ID.'); process.exit(1); }
        if (isDemoMode() && !opts.json && !opts.csv && !opts.quiet) printDemoBanner();
        const oo: OutputOptions = { json: opts.json, csv: opts.csv, quiet: opts.quiet, noColor: opts.noColor };
        const res = await getReplies(tweetId, opts.limit ? +opts.limit : 10);
        if (res.data.length === 0) { if (!opts.json && !opts.csv) printInfo('No replies.'); else if (opts.json) console.log('[]'); process.exit(0); }
        console.log(formatTweets(res.data, oo));
        if (!opts.json && !opts.csv && !opts.quiet && res.fromCache) { console.log(''); printInfo('From cache'); }
      } catch (e) { printError(e instanceof Error ? e.message : 'Error'); process.exit(1); }
    });
}
