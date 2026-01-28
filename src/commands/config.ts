import { Command } from 'commander';
import * as readline from 'readline';
import { loadConfig, saveConfig, getConfigPath, isConfigured } from '../lib/config.js';
import { printSuccess, printError, printInfo, printWarning } from '../lib/format.js';
function prompt(q: string): Promise<string> { const rl = readline.createInterface({ input: process.stdin, output: process.stdout }); return new Promise(r => rl.question(q, a => { rl.close(); r(a.trim()); })); }
export function createConfigCommand(): Command {
  const cmd = new Command('config').description('Manage config').action(() => {
    const c = loadConfig(); console.log('\n🔧 Twitter CLI Config\n');
    if (isConfigured()) { printSuccess('API configured'); const t = c.bearerToken || ''; console.log(`   Token: ${t.slice(0, 10)}...${t.slice(-4)}`); } else { printWarning('No API credentials'); }
    console.log(`\n📁 ${getConfigPath()}\n\nSettings:\n   Cache: ${c.cacheEnabled}\n   TTL: ${c.cacheTtlMinutes}min\n   Limit: ${c.defaultLimit}\n\nUse: twitter-cli config set <key> <value>\n`);
  });
  cmd.command('set').description('Set value').argument('<key>').argument('<value>').action((k: string, v: string) => {
    const c = loadConfig();
    if (k === 'TWITTER_BEARER_TOKEN' || k === 'bearerToken') { c.bearerToken = v; printSuccess('Token saved'); }
    else if (k === 'cacheEnabled') { c.cacheEnabled = v === 'true'; printSuccess(`Cache ${c.cacheEnabled ? 'on' : 'off'}`); }
    else if (k === 'cacheTtlMinutes') { c.cacheTtlMinutes = +v; printSuccess(`TTL: ${v}min`); }
    else if (k === 'defaultLimit') { c.defaultLimit = +v; printSuccess(`Limit: ${v}`); }
    else { printError(`Unknown: ${k}`); process.exit(1); }
    saveConfig(c);
  });
  cmd.command('get').description('Get value').argument('<key>').action((k: string) => {
    const c = loadConfig();
    if (k === 'bearerToken' || k === 'TWITTER_BEARER_TOKEN') console.log(c.bearerToken ? `${c.bearerToken.slice(0,10)}...` : '(not set)');
    else if (k === 'cacheEnabled') console.log(c.cacheEnabled);
    else if (k === 'cacheTtlMinutes') console.log(c.cacheTtlMinutes);
    else if (k === 'defaultLimit') console.log(c.defaultLimit);
    else { printError(`Unknown: ${k}`); process.exit(1); }
  });
  cmd.command('init').description('Setup').action(async () => {
    console.log('\n🔧 Setup\n\nGet token: https://developer.twitter.com/en/portal/dashboard\n');
    const t = await prompt('Bearer Token (Enter to skip): ');
    if (t) { const c = loadConfig(); c.bearerToken = t; saveConfig(c); printSuccess('Saved!'); } else { printInfo('Skipped.'); }
    console.log('');
  });
  return cmd;
}

export function createCacheCommand(): Command {
  const cmd = new Command('cache').description('Manage cache').action(() => {
    const c = loadConfig();
    console.log('\n📦 Cache Status\n');
    console.log(`   Enabled: ${c.cacheEnabled !== false ? 'yes' : 'no'}`);
    console.log(`   TTL: ${c.cacheTtlMinutes || 15} minutes`);
    console.log('\nUse: twitter-cli cache clear\n');
  });
  cmd.command('clear').description('Clear cache').action(() => {
    const { clearCache } = require('../lib/cache.js');
    clearCache();
    printSuccess('Cache cleared');
  });
  return cmd;
}

export function createRateLimitCommand(): Command {
  return new Command('rate-limit').description('Show rate limits').action(() => {
    console.log('\n📊 Twitter API Rate Limits\n');
    console.log('   Search: 180 req / 15 min');
    console.log('   User tweets: 900 req / 15 min');
    console.log('   User lookup: 900 req / 15 min');
    console.log('\nRate limit info shown after API calls.\n');
  });
}
