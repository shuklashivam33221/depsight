import { describe, it, expect } from 'vitest';
import { parseNpmLockfile } from '../src/core/parsers/npm-parser';

describe('parseNpmLockfile', () => {
  // ===== HAPPY PATH =====

  it('should parse a valid lockfile with one dependency', () => {
    const mockLockfile = JSON.stringify({
      name: 'test-project',
      version: '1.0.0',
      lockfileVersion: 3,
      packages: {
        '': {
          name: 'test-project',
          version: '1.0.0',
          dependencies: {
            lodash: '^4.17.21',
          },
        },
        'node_modules/lodash': {
          version: '4.17.21',
          resolved: 'https://registry.npmjs.org/lodash/-/lodash-4.17.21.tgz',
          integrity: 'sha512-fake',
        },
      },
    });

    const result = parseNpmLockfile(mockLockfile);

    expect(result.format).toBe('npm');
    expect(result.rootDependencies).toEqual({ lodash: '^4.17.21' });
    expect(result.packages.size).toBe(1);

    const lodash = result.packages.get('node_modules/lodash');
    expect(lodash).toBeDefined();
    expect(lodash!.name).toBe('lodash');
    expect(lodash!.version).toBe('4.17.21');
  });

  it('should merge dependencies and devDependencies into rootDependencies', () => {
    const mockLockfile = JSON.stringify({
      name: 'test-project',
      version: '1.0.0',
      lockfileVersion: 3,
      packages: {
        '': {
          name: 'test-project',
          version: '1.0.0',
          dependencies: {
            express: '^4.18.0',
          },
          devDependencies: {
            vitest: '^1.0.0',
          },
        },
        'node_modules/express': {
          version: '4.18.2',
        },
        'node_modules/vitest': {
          version: '1.0.4',
          dev: true,
        },
      },
    });

    const result = parseNpmLockfile(mockLockfile);

    expect(result.rootDependencies).toEqual({
      express: '^4.18.0',
      vitest: '^1.0.0',
    });
  });

  it('should handle scoped package names like @types/node', () => {
    const mockLockfile = JSON.stringify({
      name: 'test-project',
      version: '1.0.0',
      lockfileVersion: 3,
      packages: {
        '': {
          name: 'test-project',
          version: '1.0.0',
          devDependencies: {
            '@types/node': '^20.0.0',
          },
        },
        'node_modules/@types/node': {
          version: '20.11.5',
          dev: true,
        },
      },
    });

    const result = parseNpmLockfile(mockLockfile);

    const typesNode = result.packages.get('node_modules/@types/node');
    expect(typesNode).toBeDefined();
    expect(typesNode!.name).toBe('@types/node');
    expect(typesNode!.dev).toBe(true);
  });

  it('should mark deprecated packages', () => {
    const mockLockfile = JSON.stringify({
      name: 'test-project',
      version: '1.0.0',
      lockfileVersion: 3,
      packages: {
        '': {
          name: 'test-project',
          version: '1.0.0',
          dependencies: {
            'old-lib': '^1.0.0',
          },
        },
        'node_modules/old-lib': {
          version: '1.2.3',
          deprecated: 'This package is no longer maintained.',
        },
      },
    });

    const result = parseNpmLockfile(mockLockfile);

    const oldLib = result.packages.get('node_modules/old-lib');
    expect(oldLib).toBeDefined();
    expect(oldLib!.deprecated).toBe('This package is no longer maintained.');
  });

  // ===== EDGE CASES =====

  it('should default version to 0.0.0 when version is missing', () => {
    const mockLockfile = JSON.stringify({
      name: 'test-project',
      version: '1.0.0',
      lockfileVersion: 3,
      packages: {
        '': {
          name: 'test-project',
          version: '1.0.0',
          dependencies: { 'no-version': '*' },
        },
        'node_modules/no-version': {},
      },
    });

    const result = parseNpmLockfile(mockLockfile);

    const pkg = result.packages.get('node_modules/no-version');
    expect(pkg!.version).toBe('0.0.0');
  });

  it('should default dependencies to empty object when missing', () => {
    const mockLockfile = JSON.stringify({
      name: 'test-project',
      version: '1.0.0',
      lockfileVersion: 3,
      packages: {
        '': {
          name: 'test-project',
          version: '1.0.0',
          dependencies: { 'leaf-pkg': '^1.0.0' },
        },
        'node_modules/leaf-pkg': {
          version: '1.0.0',
        },
      },
    });

    const result = parseNpmLockfile(mockLockfile);

    const pkg = result.packages.get('node_modules/leaf-pkg');
    expect(pkg!.dependencies).toEqual({});
  });

  it('should throw an error if root package is missing', () => {
    const mockLockfile = JSON.stringify({
      name: 'test-project',
      version: '1.0.0',
      lockfileVersion: 3,
      packages: {
        'node_modules/orphan': {
          version: '1.0.0',
        },
      },
    });

    expect(() => parseNpmLockfile(mockLockfile)).toThrow(
      'Invalid package-lock.json: missing root package ""'
    );
  });

  it('should not include the root entry in the packages Map', () => {
    const mockLockfile = JSON.stringify({
      name: 'test-project',
      version: '1.0.0',
      lockfileVersion: 3,
      packages: {
        '': {
          name: 'test-project',
          version: '1.0.0',
          dependencies: { a: '1.0.0' },
        },
        'node_modules/a': { version: '1.0.0' },
      },
    });

    const result = parseNpmLockfile(mockLockfile);

    // Root ("") should NOT be in the packages map
    expect(result.packages.has('')).toBe(false);
    // But the dependency should be
    expect(result.packages.has('node_modules/a')).toBe(true);
  });
});
