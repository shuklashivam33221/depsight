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

// this NpmLockfileEntry is for one package 

interface NpmLockfile {
  name: string;
  version: string;
  lockfileVersion: number;
  packages: Record<string, NpmLockfileEntry>;
}

// this is for npmlockfile means it will look like this 

// {
//   "name": "depsight",            // <-- NpmLockfile describes this
//   "version": "0.1.0",           // <-- NpmLockfile describes this
//   "lockfileVersion": 3,         // <-- NpmLockfile describes this
//   "packages": {                 // <-- This is the giant collection
//      "node_modules/lodash": { ... }, // <-- This is one NpmLockfileEntry
//      "node_modules/express": { ... } // <-- This is another NpmLockfileEntry
//   }
// }

export function parseNpmLockfile(content: string): LockfileData {
  // Step 1: Parse the JSON string into an object the content file will come from lockfile.ts 
  const data: NpmLockfile = JSON.parse(content);

  // Step 2: Create an empty Map to hold our cleaned packages {path, packageNode} this is the format
  const packages = new Map<string, PackageNode>();

  // Step 3: Get the root project entry (the "" key) in package-lock.json these are the apckages we have downloaded or these are root folders in the package-lock.json the root dependencies are written inside package => "" so we are checking if data.packages have some package with this and if this do not exist ie rootEntry is empty then we will return error""
  const rootEntry = data.packages[''];
  if (!rootEntry) {
    throw new Error('Invalid package-lock.json: missing root package ""');
  }

  // Step 4: Collect what the root project directly depends on
//   {
//   "commander": "^14.0.3",
//   "picocolors": "^1.1.1",
//   "@types/node": "^25.6.0",
//   "typescript": "^6.0.3"
//   } will look like this after spread operator worked 
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
