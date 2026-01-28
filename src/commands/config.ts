import { Command } from 'commander';
import * as readline from 'readline';
import { loadConfig, saveConfig, getConfigPath, isConfigured, getBearerToken } from '../lib/config.js';
import { validateToken, getTokenSource } from '../lib/twitter.js';
import { printSuccess, printError, printInfo, printWarning, createSpinner } from '../lib/format.js';
import pc from 'picocolors';

function prompt(q: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(r => rl.question(q, a => { rl.close(); r(a.trim()); }));
}

export function createConfigCommand(): Command {
  const cmd = new Command('config').description('Manage configuration').action(() => {
    const c = loadConfig();
    console.log('\n🔧 Twitter CLI Config\n');
    
    if (isConfigured()) {
      const source = getTokenSource();
      printSuccess('API configured');
      
      if (source === 'env') {
        console.log('   Source: TWITTER_BEARER_TOKEN environment variable');
        const t = process.env.TWITTER_BEARER_TOKEN || '';
        console.log(`   Token: ${t.slice(0, 10)}...${t.slice(-4)}`);
      } else {
        console.log('   Source: Config file');
        const t = c.bearerToken || '';
        console.log(`   Token: ${t.slice(0, 10)}...${t.slice(-4)}`);
      }
    } else {
      printWarning('No API credentials');
      console.log('');
      console.log('   Run: ' + pc.cyan('twitter-cli setup'));
    }
    
    console.log(`\n📁 ${getConfigPath()}\n`);
    console.log('Settings:');
    console.log(`   Cache: ${c.cacheEnabled !== false ? 'enabled' : 'disabled'}`);
    console.log(`   TTL: ${c.cacheTtlMinutes || 15} minutes`);
    console.log(`   Default limit: ${c.defaultLimit || 10}`);
    console.log('\nCommands:');
    console.log('   twitter-cli config set <key> <value>');
    console.log('   twitter-cli config get <key>');
    console.log('   twitter-cli config validate');
    console.log('');
  });

  cmd.command('set')
    .description('Set a configuration value')
    .argument('<key>', 'Config key (bearerToken, cacheEnabled, cacheTtlMinutes, defaultLimit)')
    .argument('<value>', 'Value to set')
    .option('--validate', 'Validate bearer token before saving')
    .action(async (k: string, v: string, opts) => {
      const c = loadConfig();
      
      if (k === 'TWITTER_BEARER_TOKEN' || k === 'bearerToken' || k === 'bearer_token') {
        // Check if env var is set
        if (process.env.TWITTER_BEARER_TOKEN) {
          printWarning('TWITTER_BEARER_TOKEN environment variable is set.');
          console.log(pc.dim('The env var takes precedence over config file.'));
          console.log(pc.dim('Unset it first: unset TWITTER_BEARER_TOKEN'));
          console.log('');
        }
        
        if (opts.validate) {
          const spinner = createSpinner('Validating token');
          const result = await validateToken(v);
          
          if (!result.valid) {
            spinner.stop(false, 'Token validation failed');
            printError(result.error || 'Invalid token');
            process.exit(1);
          }
          
          spinner.stop(true, 'Token is valid!');
        }
        
        c.bearerToken = v;
        printSuccess('Bearer token saved');
      } else if (k === 'cacheEnabled') {
        c.cacheEnabled = v === 'true';
        printSuccess(`Cache ${c.cacheEnabled ? 'enabled' : 'disabled'}`);
      } else if (k === 'cacheTtlMinutes') {
        c.cacheTtlMinutes = +v;
        printSuccess(`Cache TTL: ${v} minutes`);
      } else if (k === 'defaultLimit') {
        c.defaultLimit = +v;
        printSuccess(`Default limit: ${v}`);
      } else {
        printError(`Unknown key: ${k}`);
        console.log(pc.dim('Valid keys: bearerToken, cacheEnabled, cacheTtlMinutes, defaultLimit'));
        process.exit(1);
      }
      
      saveConfig(c);
    });

  cmd.command('get')
    .description('Get a configuration value')
    .argument('<key>', 'Config key')
    .action((k: string) => {
      const c = loadConfig();
      
      if (k === 'bearerToken' || k === 'TWITTER_BEARER_TOKEN' || k === 'bearer_token') {
        const token = getBearerToken();
        if (token) {
          const source = getTokenSource();
          console.log(`${token.slice(0, 10)}...${token.slice(-4)} (from ${source === 'env' ? 'env var' : 'config'})`);
        } else {
          console.log('(not set)');
        }
      } else if (k === 'cacheEnabled') {
        console.log(c.cacheEnabled !== false);
      } else if (k === 'cacheTtlMinutes') {
        console.log(c.cacheTtlMinutes || 15);
      } else if (k === 'defaultLimit') {
        console.log(c.defaultLimit || 10);
      } else {
        printError(`Unknown key: ${k}`);
        process.exit(1);
      }
    });

  cmd.command('validate')
    .description('Validate the current bearer token')
    .action(async () => {
      const token = getBearerToken();
      
      if (!token) {
        printError('No bearer token configured.');
        console.log('');
        console.log('Run: ' + pc.cyan('twitter-cli setup'));
        console.log('');
        process.exit(1);
      }
      
      const source = getTokenSource();
      console.log('');
      printInfo(`Token source: ${source === 'env' ? 'TWITTER_BEARER_TOKEN environment variable' : 'Config file'}`);
      console.log('');
      
      const spinner = createSpinner('Validating token');
      const result = await validateToken(token);
      
      if (result.valid) {
        spinner.stop(true, 'Token is valid!');
        if (result.appName) {
          console.log(pc.dim(`   Connected as: ${result.appName}`));
        }
        console.log('');
      } else {
        spinner.stop(false, 'Token validation failed');
        console.log('');
        printError(result.error || 'Invalid token');
        console.log('');
        console.log('Run ' + pc.cyan('twitter-cli setup') + ' to configure a new token.');
        console.log('');
        process.exit(1);
      }
    });

  cmd.command('init')
    .description('Interactive setup (alias for `twitter-cli setup`)')
    .action(async () => {
      console.log(pc.dim('Redirecting to setup wizard...'));
      console.log('');
      // Import and run setup
      const { createSetupCommand } = await import('./setup.js');
      const setupCmd = createSetupCommand();
      await setupCmd.parseAsync(['node', 'setup'], { from: 'user' });
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

  cmd.command('clear')
    .description('Clear the cache')
    .action(async () => {
      const { clearCache } = await import('../lib/cache.js');
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
