/**
 * Setup wizard for Twitter CLI
 */

import { Command } from 'commander';
import * as readline from 'readline';
import { loadConfig, saveConfig, getConfigPath } from '../lib/config.js';
import { validateToken, getTokenSource } from '../lib/twitter.js';
import { printSuccess, printError, printWarning, createSpinner } from '../lib/format.js';
import pc from 'picocolors';

const DEVELOPER_PORTAL_URL = 'https://developer.twitter.com/en/portal/projects-and-apps';

/**
 * Prompt for input with optional masking
 */
function prompt(question: string, mask: boolean = false): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    if (mask && process.stdin.isTTY) {
      // For masked input, we need to handle it character by character
      const stdin = process.stdin;
      const stdout = process.stdout;
      
      stdout.write(question);
      
      let input = '';
      stdin.setRawMode(true);
      stdin.resume();
      stdin.setEncoding('utf8');
      
      const onData = (char: string) => {
        const code = char.charCodeAt(0);
        
        if (code === 13 || code === 10) { // Enter
          stdin.setRawMode(false);
          stdin.removeListener('data', onData);
          stdout.write('\n');
          rl.close();
          resolve(input);
        } else if (code === 127 || code === 8) { // Backspace
          if (input.length > 0) {
            input = input.slice(0, -1);
            stdout.write('\b \b');
          }
        } else if (code === 3) { // Ctrl+C
          stdin.setRawMode(false);
          stdin.removeListener('data', onData);
          stdout.write('\n');
          rl.close();
          process.exit(0);
        } else if (code >= 32) { // Printable characters
          input += char;
          stdout.write('•');
        }
      };
      
      stdin.on('data', onData);
    } else {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    }
  });
}

/**
 * Opens a URL in the default browser
 */
async function openBrowser(url: string): Promise<boolean> {
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    const platform = process.platform;
    let command: string;
    
    if (platform === 'darwin') {
      command = `open "${url}"`;
    } else if (platform === 'win32') {
      command = `start "" "${url}"`;
    } else {
      // Linux - try xdg-open, then fallback options
      command = `xdg-open "${url}" 2>/dev/null || sensible-browser "${url}" 2>/dev/null || x-www-browser "${url}" 2>/dev/null`;
    }
    
    await execAsync(command);
    return true;
  } catch {
    return false;
  }
}

/**
 * Print the setup header
 */
function printHeader(): void {
  console.log('');
  console.log(pc.cyan('┌─────────────────────────────────────────────────────┐'));
  console.log(pc.cyan('│') + pc.bold(pc.cyan('  Twitter CLI Setup                                  ')) + pc.cyan('│'));
  console.log(pc.cyan('└─────────────────────────────────────────────────────┘'));
  console.log('');
}

/**
 * Print instructions for getting a bearer token
 */
function printInstructions(): void {
  console.log('To search Twitter, you need a Bearer Token from the Twitter API.');
  console.log('');
  console.log(pc.bold('Step 1: Get your Bearer Token'));
  console.log(pc.dim('─────────────────────────────'));
  console.log('');
}

/**
 * Print the steps to get a token
 */
function printSteps(): void {
  console.log(pc.dim('1. Create a Project (or use existing)'));
  console.log(pc.dim('2. Create an App inside the project'));
  console.log(pc.dim('3. Go to "Keys and Tokens" tab'));
  console.log(pc.dim('4. Generate "Bearer Token" under "Authentication Tokens"'));
  console.log(pc.dim('5. Copy the token'));
  console.log('');
}

export function createSetupCommand(): Command {
  return new Command('setup')
    .description('Interactive setup wizard for Twitter API credentials')
    .option('--no-browser', 'Do not open browser automatically')
    .option('--skip-validation', 'Skip token validation')
    .action(async (opts) => {
      printHeader();
      
      // Check if already configured
      const source = getTokenSource();
      if (source !== 'none') {
        if (source === 'env') {
          console.log(pc.yellow('ℹ') + ' Token found in TWITTER_BEARER_TOKEN environment variable.');
          console.log('');
          
          const spinner = createSpinner('Validating current token');
          const result = await validateToken();
          
          if (result.valid) {
            spinner.stop(true, 'Token is valid!');
            console.log('');
            console.log('Your environment variable is already configured correctly.');
            console.log(pc.dim('To use a different token, unset the env var first:'));
            console.log(pc.dim('  unset TWITTER_BEARER_TOKEN'));
            console.log('');
            return;
          } else {
            spinner.stop(false, 'Token validation failed');
            printError(result.error || 'Invalid token');
            console.log('');
            console.log(pc.dim('The TWITTER_BEARER_TOKEN environment variable contains an invalid token.'));
            console.log(pc.dim('Please update it or unset it to configure via config file.'));
            console.log('');
            return;
          }
        } else {
          console.log(pc.yellow('ℹ') + ' Existing configuration found.');
          console.log('');
          const answer = await prompt('Do you want to reconfigure? (y/N): ');
          if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
            console.log('');
            console.log('Setup cancelled. Your existing configuration is unchanged.');
            console.log('');
            return;
          }
          console.log('');
        }
      }

      printInstructions();

      // Try to open browser
      if (opts.browser !== false) {
        console.log('Opening Twitter Developer Portal...');
        const opened = await openBrowser(DEVELOPER_PORTAL_URL);
        console.log('');
        
        if (!opened) {
          console.log(pc.yellow('Could not open browser automatically.'));
        }
      }
      
      console.log('If it didn\'t open, go to:');
      console.log(pc.cyan(DEVELOPER_PORTAL_URL));
      console.log('');
      
      printSteps();
      
      console.log(pc.bold('Step 2: Paste your Bearer Token'));
      console.log(pc.dim('─────────────────────────────'));
      console.log('');
      
      const token = await prompt('? Bearer Token: ', true);
      
      if (!token) {
        console.log('');
        printWarning('No token entered. Setup cancelled.');
        console.log('');
        console.log('Run `twitter-cli setup` again when you have your token.');
        console.log('');
        return;
      }
      
      console.log('');
      
      // Validate the token
      if (!opts.skipValidation) {
        const spinner = createSpinner('Validating token');
        const result = await validateToken(token);
        
        if (!result.valid) {
          spinner.stop(false, 'Token validation failed');
          console.log('');
          printError(result.error || 'Invalid token');
          console.log('');
          console.log('Please check that you copied the entire Bearer Token.');
          console.log(pc.dim('Hint: Bearer tokens are typically long strings starting with "AAAA..."'));
          console.log('');
          console.log('Run `twitter-cli setup` to try again.');
          console.log('');
          process.exit(1);
        }
        
        spinner.stop(true, `Token is valid!${result.appName ? ` Connected as ${result.appName}` : ''}`);
      }
      
      // Save the token
      const config = loadConfig();
      config.bearerToken = token;
      saveConfig(config);
      
      console.log('');
      printSuccess(`Configuration saved to ${getConfigPath()}`);
      console.log('');
      
      // Success message
      console.log(pc.green('You\'re all set! Try:'));
      console.log(`  ${pc.cyan('twitter-cli search "AI agents" --limit 5')}`);
      console.log('');
    });
}

/**
 * Print the "no token" message for other commands
 */
export function printNoTokenMessage(): void {
  console.log('');
  printWarning('No Twitter API token configured.');
  console.log('');
  console.log('  Run setup wizard:  ' + pc.cyan('twitter-cli setup'));
  console.log('  Or set directly:   ' + pc.dim('twitter-cli config set bearerToken <token>'));
  console.log('  Or use env var:    ' + pc.dim('export TWITTER_BEARER_TOKEN=<token>'));
  console.log('');
  console.log('  Get a token at: ' + pc.cyan(DEVELOPER_PORTAL_URL));
  console.log('');
}
