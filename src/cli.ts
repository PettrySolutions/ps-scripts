#!/usr/bin/env node

import { Command } from 'commander';
import { importMapping } from './tools/import-mapping';

const program = new Command();

program
  .name('ztc')
  .description('Modular CLI tools for various utilities')
  .version('0.1.0');

program
  .command('import-mapping')
  .description('Analyze import patterns in JavaScript/TypeScript repositories')
  .argument('<configPath>', 'Path to the configuration JSON file')
  .action(async (configPath: string) => {
    await importMapping(configPath);
  });

program.parse(process.argv);
