import * as fs from 'fs';
import * as path from 'path';
import { LockfileData } from '../types';
import { parseNpmLockfile } from './parsers/npm-parser';

// Detect which lockfile exists in the given directory and parse it projectDir is folder path
export function loadLockfile(projectDir : string): LockfileData {
    // Check for npm's lockfile
    const npmLockPath = path.join(projectDir, 'package-lock.json');
    // Check for pnpm's lockfile
    const pnpmLockPath = path.join(projectDir, 'pnpm-lock.yaml');

    if (fs.existsSync(npmLockPath)) {
    // Found package-lock.json — read it and parse it
    const content = fs.readFileSync(npmLockPath, 'utf-8');
    return parseNpmLockfile(content);
    }  else if (fs.existsSync(pnpmLockPath)) {
    // Found pnpm-lock.yaml — we'll implement this parser later
    throw new Error('pnpm lockfile support coming soon');
    }  else {
    throw new Error(
      'No lockfile found. Run "npm install" or "pnpm install" first.'
    );
    }
}