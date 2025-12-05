#!/usr/bin/env node
// Wrapper script to run dev-server.js with bun
import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

// Try to find bun
const bunPaths = [
  process.env.BUN_PATH,
  join(process.env.HOME || process.env.USERPROFILE || '', '.bun/bin/bun'),
  '/usr/local/bin/bun',
  '/opt/homebrew/bin/bun',
].filter(Boolean);

let bunPath = 'bun';
for (const path of bunPaths) {
  if (path && existsSync(path)) {
    bunPath = path;
    break;
  }
}

// Spawn bun with dev-server.js
const proc = spawn(bunPath, ['dev-server.js'], {
  stdio: 'inherit',
  shell: false,
});

proc.on('exit', (code) => {
  process.exit(code || 0);
});

