#!/usr/bin/env node

import { Command } from 'commander';
import { whyCommand } from './commands/why';

const program = new Command();

program
  .name('depsight')
  .description('Dependency debugging CLI for modern JavaScript projects')
  .version('0.1.0');

// Command 1: depsight <package> — Reverse dependency lookup
program
  .argument('[package]', 'Package name to trace')
  .action((packageName?: string) => {
    if (packageName && packageName !== 'duplicates' && packageName !== 'doctor') {
      whyCommand(packageName);
    }
  });

// Command 2: depsight duplicates
program
  .command('duplicates')
  .description('Find packages with multiple versions installed')
  .action(() => {
    console.log('\n  📦 Duplicate Analysis\n');
    console.log('  Duplicates command coming soon...\n');
  });

// Command 3: depsight doctor
program
  .command('doctor')
  .description('Run full dependency health check with fix suggestions')
  .action(() => {
    console.log('\n  🩺 Dependency Health Report\n');
    console.log('  Doctor command coming soon...\n');
  });

program.parse();
