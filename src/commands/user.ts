import { Command } from 'commander';
import { getUserTweets, isDemoMode } from '../lib/api';
import { formatTweets, printError, printInfo, printDemoBanner } from '../lib/formatter';
import { OutputOptions } from '../types';
export function createUserCommand(): Command {
  return new Command('user').description("Get user's tweets").argument('<username>', 'Username')
    .option('-n, --limit <n>', 'Limit').option('--json', 'JSON').option('--csv', 'CSV').option('-q, --quiet', 'URLs only').option('--no-color', 'No colors')
    .action(async (username: string, opts) => {
      try {
        const u = username.replace(/^@/, '');
        if (!/^[a-zA-Z0-9_]{1,15}$/.test(u)) { printError('Invalid username.'); process.exit(1); }
        if (isDemoMode() && !opts.json && !opts.csv && !opts.quiet) printDemoBanner();
        const oo: OutputOptions = { json: opts.json, csv: opts.csv, quiet: opts.quiet, noColor: opts.noColor };
        const res = await getUserTweets(u, opts.limit ? +opts.limit : 10);
        if (res.data.length === 0) { if (!opts.json && !opts.csv) printInfo(`No tweets for @${u}.`); else if (opts.json) console.log('[]'); process.exit(0); }
        if (!opts.json && !opts.csv && !opts.quiet) console.log(`\n📱 @${u}\n`);
        console.log(formatTweets(res.data, oo));
        if (!opts.json && !opts.csv && !opts.quiet && res.fromCache) { console.log(''); printInfo('From cache'); }
      } catch (e) { printError(e instanceof Error ? e.message : 'Error'); process.exit(1); }
    });
}
