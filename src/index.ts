#!/usr/bin/env node
import { Command } from 'commander';
import { createSearchCommand, createRepliesCommand, createUserCommand, createConfigCommand, createCacheCommand } from './commands/index.js';
const program = new Command().name('twitter-cli').description('A fast, beautiful CLI for searching Twitter').version('1.0.0');
program.addCommand(createSearchCommand());
program.addCommand(createRepliesCommand());
program.addCommand(createUserCommand());
program.addCommand(createConfigCommand());
program.addCommand(createCacheCommand());
program.action(() => program.help());
program.parseAsync(process.argv).catch((e) => { console.error(e instanceof Error ? e.message : 'Error'); process.exit(1); });
