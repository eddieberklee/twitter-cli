import { Command } from 'commander';
import { clearCache } from '../lib/cache';
import { printSuccess, printInfo } from '../lib/formatter';
export function createCacheCommand(): Command {
  const cmd = new Command('cache').description('Manage cache').action(() => {
    console.log('\n📦 Cache\n\nCommands:\n   twitter-cli cache clear\n');
  });
  cmd.command('clear').description('Clear cache').action(() => { clearCache(); printSuccess('Cache cleared'); });
  return cmd;
}
