import { Command } from 'commander';
import { searchTweets, isDemoMode } from '../lib/api.js';
import { formatTweets, printError, printInfo, printDemoBanner } from '../lib/format.js';
import { SearchOptions, OutputOptions } from '../types/index.js';
export function createSearchCommand(): Command {
  return new Command('search').description('Search for tweets').argument('<query>', 'Search query')
    .option('-t, --time <range>', 'Time range (1h, 24h, 7d, 30d)').option('-l, --min-likes <n>', 'Min likes').option('-r, --min-retweets <n>', 'Min retweets')
    .option('-v, --verified', 'Verified only').option('-n, --limit <n>', 'Limit (default: 10)').option('-s, --sort <order>', 'Sort: recent, popular, relevant')
    .option('--lang <code>', 'Language').option('--json', 'JSON output').option('--csv', 'CSV output').option('-q, --quiet', 'URLs only').option('--no-color', 'No colors')
    .action(async (query: string, opts) => {
      try {
        if (isDemoMode() && !opts.json && !opts.csv && !opts.quiet) printDemoBanner();
        const so: SearchOptions = { query, time: opts.time, minLikes: opts.minLikes ? +opts.minLikes : undefined, minRetweets: opts.minRetweets ? +opts.minRetweets : undefined, verified: opts.verified, limit: opts.limit ? +opts.limit : 10, sort: opts.sort, lang: opts.lang };
        const oo: OutputOptions = { json: opts.json, csv: opts.csv, quiet: opts.quiet, noColor: opts.noColor };
        const res = await searchTweets(so);
        if (res.data.length === 0) { if (!opts.json && !opts.csv) printInfo('No tweets found.'); else if (opts.json) console.log('[]'); process.exit(0); }
        console.log(formatTweets(res.data, oo));
        if (!opts.json && !opts.csv && !opts.quiet) { console.log(''); if (res.fromCache) printInfo('From cache'); if (res.rateLimit) printInfo(`Rate limit: ${res.rateLimit.remaining}/${res.rateLimit.limit}`); }
      } catch (e) { printError(e instanceof Error ? e.message : 'Error'); process.exit(1); }
    });
}
