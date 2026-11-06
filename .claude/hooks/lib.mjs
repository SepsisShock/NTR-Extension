import { readFileSync } from 'node:fs';

export const input = JSON.parse(readFileSync(0, 'utf8'));
export const dir = process.env.CLAUDE_PROJECT_DIR || input.cwd;
