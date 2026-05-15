import { describe, it, expect } from 'vitest';
import { buildGraph, findReversePaths } from '../src/core/graph';
import { LockfileData, PackageNode } from '../src/types';

// Helper to create a mock LockfileData
function createMockLockfile(
  packages: Map<string, PackageNode>,
  rootDeps: Record<string, string>
): LockfileData {
  return {
    format: 'npm',
    packages,
    rootDependencies: rootDeps,
  };
}

describe('buildGraph', () => {
  it('should create forward and reverse edges for a direct dependency', () => {
    const packages = new Map<string, PackageNode>();
    packages.set('node_modules/lodash', {
      name: 'lodash',
      version: '4.17.21',
      dependencies: {},
      path: 'node_modules/lodash',
    });

    const lockfile = createMockLockfile(packages, { lodash: '^4.17.21' });
    const graph = buildGraph(lockfile);

    // Forward: root → lodash
    const rootForward = graph.forward.get('')!;
    expect(rootForward.has('node_modules/lodash')).toBe(true);

    // Reverse: lodash → root
    const lodashReverse = graph.reverse.get('node_modules/lodash')!;
    expect(lodashReverse.has('')).toBe(true);
  });

  it('should handle transitive dependencies (A → B → C)', () => {
    const packages = new Map<string, PackageNode>();
    packages.set('node_modules/express', {
      name: 'express',
      version: '4.18.2',
      dependencies: { 'body-parser': '^1.20.0' },
      path: 'node_modules/express',
    });
    packages.set('node_modules/body-parser', {
      name: 'body-parser',
      version: '1.20.2',
      dependencies: {},
      path: 'node_modules/body-parser',
    });

    const lockfile = createMockLockfile(packages, { express: '^4.18.0' });
    const graph = buildGraph(lockfile);

    // root → express (forward)
    expect(graph.forward.get('')!.has('node_modules/express')).toBe(true);

    // express → body-parser (forward)
    expect(
      graph.forward.get('node_modules/express')!.has('node_modules/body-parser')
    ).toBe(true);

    // body-parser → express (reverse)
    expect(
      graph.reverse.get('node_modules/body-parser')!.has('node_modules/express')
    ).toBe(true);
  });

  it('should include a root node with path ""', () => {
    const packages = new Map<string, PackageNode>();
    const lockfile = createMockLockfile(packages, {});
    const graph = buildGraph(lockfile);

    const rootNode = graph.nodes.get('');
    expect(rootNode).toBeDefined();
    expect(rootNode!.name).toBe('root');
  });
});

describe('findReversePaths', () => {
  it('should find a direct dependency path (1 hop to root)', () => {
    const packages = new Map<string, PackageNode>();
    packages.set('node_modules/lodash', {
      name: 'lodash',
      version: '4.17.21',
      dependencies: {},
      path: 'node_modules/lodash',
    });

    const lockfile = createMockLockfile(packages, { lodash: '^4.17.21' });
    const graph = buildGraph(lockfile);
    const paths = findReversePaths(graph, 'lodash');

    expect(paths.length).toBe(1);
    expect(paths[0]).toEqual(['node_modules/lodash', '']);
  });

  it('should find a transitive dependency path (2 hops)', () => {
    const packages = new Map<string, PackageNode>();
    packages.set('node_modules/express', {
      name: 'express',
      version: '4.18.2',
      dependencies: { bytes: '^3.1.0' },
      path: 'node_modules/express',
    });
    packages.set('node_modules/bytes', {
      name: 'bytes',
      version: '3.1.2',
      dependencies: {},
      path: 'node_modules/bytes',
    });

    const lockfile = createMockLockfile(packages, { express: '^4.18.0' });
    const graph = buildGraph(lockfile);
    const paths = findReversePaths(graph, 'bytes');

    expect(paths.length).toBe(1);
    expect(paths[0]).toEqual([
      'node_modules/bytes',
      'node_modules/express',
      '',
    ]);
  });

  it('should return empty array for a package that does not exist', () => {
    const packages = new Map<string, PackageNode>();
    const lockfile = createMockLockfile(packages, {});
    const graph = buildGraph(lockfile);
    const paths = findReversePaths(graph, 'nonexistent');

    expect(paths).toEqual([]);
  });

  it('should handle packages with multiple parents', () => {
    const packages = new Map<string, PackageNode>();
    packages.set('node_modules/a', {
      name: 'a',
      version: '1.0.0',
      dependencies: { shared: '^1.0.0' },
      path: 'node_modules/a',
    });
    packages.set('node_modules/b', {
      name: 'b',
      version: '2.0.0',
      dependencies: { shared: '^1.0.0' },
      path: 'node_modules/b',
    });
    packages.set('node_modules/shared', {
      name: 'shared',
      version: '1.0.0',
      dependencies: {},
      path: 'node_modules/shared',
    });

    const lockfile = createMockLockfile(packages, {
      a: '^1.0.0',
      b: '^2.0.0',
    });
    const graph = buildGraph(lockfile);
    const paths = findReversePaths(graph, 'shared');

    // Should find 2 paths: shared→a→root and shared→b→root
    expect(paths.length).toBe(2);
  });
});
