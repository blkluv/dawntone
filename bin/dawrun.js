#!/usr/bin/env node
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import peg from 'pegjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const grammarPath = join(__dirname, '..', 'daw_language_grammar.pegjs');
const grammar = fs.readFileSync(grammarPath, 'utf8');
const parser = peg.generate(grammar);

function printUsage() {
  console.log(`Usage: dawrun parse <file>`);
}

async function main() {
  const [cmd, filePath] = process.argv.slice(2);
  if (!cmd || cmd === '-h' || cmd === '--help') {
    printUsage();
    return;
  }

  if (cmd !== 'parse') {
    console.error(`Unknown command: ${cmd}`);
    printUsage();
    process.exit(1);
  }

  if (!filePath) {
    console.error('No input file specified.');
    printUsage();
    process.exit(1);
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const ast = parser.parse(content);
    console.log(JSON.stringify(ast, null, 2));
  } catch (err) {
    console.error('Parse failed:', err.message);
    process.exit(1);
  }
}

main();

