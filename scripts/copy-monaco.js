import { cp } from 'fs/promises';
import { existsSync } from 'fs';

const src = 'node_modules/monaco-editor/min/vs';
const dest = 'public/vs';

async function main() {
  try {
    if (existsSync(src)) {
      await cp(src, dest, { recursive: true });
      console.log('Monaco assets copied to', dest);
    } else {
      console.error('Monaco editor not installed.');
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('Failed to copy Monaco assets:', err);
    process.exitCode = 1;
  }
}

main();
