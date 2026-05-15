import pc from 'picocolors';
import { loadLockfile } from '../core/lockfile';
import { buildGraph, findReversePaths } from '../core/graph';
import { renderReversePaths } from '../formatters/tree';
import { generateExplanation } from '../formatters/human';

export function whyCommand(packageName: string): void {
  try {
    // Step 1: Load and parse the lockfile
    const lockfileData = loadLockfile(process.cwd());

    // Step 2: Build the dependency graph
    const graph = buildGraph(lockfileData);

    // Step 3: Find all reverse paths for this package
    const paths = findReversePaths(graph, packageName);

    // Step 4: Display results
    console.log('');

    if (paths.length === 0) {
      console.log(
        pc.red(`  ✗ Package "${packageName}" not found in dependencies.`)
      );
      console.log('');
      return;
    }

    // Count how many unique versions exist
    const versions = new Set(
      paths.map(p => {
        const node = graph.nodes.get(p[0]);
        return node ? node.version : 'unknown';
      })
    );

    console.log(
      `  ${pc.bold(packageName)} — found ${pc.cyan(String(versions.size))} version(s)`
    );
    console.log('');

    // Render the tree
    console.log(renderReversePaths(paths, graph));

    // Render the explanation
    console.log(generateExplanation(paths, graph, packageName));
    console.log('');
  } catch (error: any) {
    console.error(pc.red(`  ✗ Error: ${error.message}`));
  }
}
