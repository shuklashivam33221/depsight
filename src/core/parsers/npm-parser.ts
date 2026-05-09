// src/core/parsers/npm-parser.ts

import { PackageNode, LockfileData } from '../../types';

// This describes what the raw package-lock.json looks like
// (we need this so TypeScript knows what to expect)
interface NpmLockfileEntry {
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  resolved?: string;
  integrity?: string;
  dev?: boolean;
  deprecated?: string;
}

interface NpmLockfile {
  name: string;
  version: string;
  lockfileVersion: number;
  packages: Record<string, NpmLockfileEntry>;
}

export function parseNpmLockfile(content: string): LockfileData {
  // Step 1: Parse the JSON string into an object
  const data: NpmLockfile = JSON.parse(content);

  // Step 2: Create an empty Map to hold our cleaned packages
  const packages = new Map<string, PackageNode>();

  // Step 3: Get the root project entry (the "" key)
  const rootEntry = data.packages[''];
  if (!rootEntry) {
    throw new Error('Invalid package-lock.json: missing root package ""');
  }

  // Step 4: Collect what the root project directly depends on
  const rootDependencies: Record<string, string> = {
    ...rootEntry.dependencies,
    ...rootEntry.devDependencies
  };

  // Step 5: Loop through every package and convert it to a PackageNode
  for (const [path, entry] of Object.entries(data.packages)) {
    // Skip the root project itself (empty string key)
    if (path === '') continue;

    // Extract the package name from the path
    // "node_modules/commander"        → "commander"
    // "node_modules/@types/node"      → "@types/node"
    const name = path.replace('node_modules/', '');

    // Create our clean PackageNode and store it
    packages.set(path, {
      name,
      version: entry.version || '0.0.0',
      dependencies: entry.dependencies || {},
      path,
      deprecated: entry.deprecated,
      dev: entry.dev
    });
  }

  // Step 6: Return the final structured data
  return {
    format: 'npm',
    packages,
    rootDependencies
  };
}
