import { PackageNode, LockfileData } from '../types';

// ===== PART 1: The Blueprint =====

// This describes the shape of our dependency graph
export interface DependencyGraph {
  // Forward: "who does this package depend on?"
  // forward: If you look up express, it gives you a Set: {"body-parser", "cookie-parser"}
  forward: Map<string, Set<string>>;

  // Reverse: "who depends on this package?"
  // body-parser, it gives you a Set: {"express"}
  reverse: Map<string, Set<string>>;

  // The actual data for each package (same data from Phase 2)
  nodes: Map<string, PackageNode>;
}

// ===== PART 2: Build the Graph =====

export function buildGraph(lockfileData: LockfileData): DependencyGraph {
  const forward = new Map<string, Set<string>>();
  const reverse = new Map<string, Set<string>>();
  const nodes = new Map<string, PackageNode>(lockfileData.packages);

  // Add the root project as a node too
  // (so we can trace paths all the way back to "you")
  const rootNode: PackageNode = {
    name: 'root',
    version: '0.0.0',
    dependencies: lockfileData.rootDependencies,
    path: ''
  };
  nodes.set('', rootNode);

  // Step 1: Create empty connection lists for every package
  for (const pkgPath of nodes.keys()) {
    forward.set(pkgPath, new Set());
    reverse.set(pkgPath, new Set());
  }

  // Step 2: Walk through every package and draw the connections
  for (const [pkgPath, pkg] of nodes.entries()) {
    for (const depName of Object.keys(pkg.dependencies)) {
      // Find the actual installed package that matches this dependency
      const depPath = `node_modules/${depName}`;

      if (nodes.has(depPath)) {
        // Draw the FORWARD arrow: "I depend on you" non null assertion operator 
        forward.get(pkgPath)!.add(depPath);

        // Draw the REVERSE arrow: "You are needed by me"
        reverse.get(depPath)!.add(pkgPath);
      }
    }
  }

  return { forward, reverse, nodes };
}

// ===== PART 3: Trace Backwards (The "Why" Logic) =====

// Given a package name, find ALL paths back to root
export function findReversePaths(
  graph: DependencyGraph,
  packageName: string
): string[][] {
  // Step 1: Find all packages that match this name
  // (there might be multiple versions of the same package)
  const targetPaths: string[] = [];
  for (const [path, node] of graph.nodes.entries()) {
    if (node.name === packageName) {
      targetPaths.push(path);
    }
  }

  // If we didn't find the package at all, return empty
  if (targetPaths.length === 0) {
    return [];
  }

  // Step 2: For each matching package, trace backwards using BFS
  const allPaths: string[][] = [];

  for (const targetPath of targetPaths) {
    // BFS queue: each item is a "path so far" (list of nodes visited)
    const queue: string[][] = [[targetPath]];

    while (queue.length > 0) {
      const currentPath = queue.shift()!;
      const currentNode = currentPath[currentPath.length - 1];

      // If we reached root (""), save this complete path
      if (currentNode === '') {
        allPaths.push(currentPath);
        continue;
      }

      // Follow reverse edges: "who depends on me?"
      const parents = graph.reverse.get(currentNode);
      if (!parents || parents.size === 0) continue;

      for (const parent of parents) {
        // Avoid infinite loops (don't visit the same node twice)
        if (currentPath.includes(parent)) continue;
        queue.push([...currentPath, parent]);
      }
    }
  }

  return allPaths;
}
