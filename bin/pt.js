#!/usr/bin/env node
// Launch the pt-tracker dev server from anywhere (`pnpm link --global` once,
// then `pt`). Resolves the repo root from this script's location so cwd
// doesn't matter.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
spawn('npm', ['start'], { cwd: root, stdio: 'inherit' });
