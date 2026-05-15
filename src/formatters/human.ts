import { DependencyGraph } from '../core/graph';

// Generate human-readable explanations for the dependency chains
export function generateExplanation(
  paths: string[][],
  graph: DependencyGraph,
  packageName: string
): string {
  if (paths.length === 0) {
    return `  💡 "${packageName}" was not found in your dependencies.`;
  }

  const lines: string[] = [];

  for (const reversePath of paths) {
    const node = graph.nodes.get(reversePath[0]);
    const version = node ? node.version : 'unknown';

    if (reversePath.length === 2 && reversePath[1] === '') {
      // Direct dependency (only 1 step to root)
      lines.push(
        `  💡 ${packageName}@${version} is a direct dependency of your project.`
      );
    } else {
      // Indirect dependency — build a readable chain
      const chainNames = reversePath.map(p => {
        if (p === '') return 'your project';
        const n = graph.nodes.get(p);
        return n ? n.name : p;
      });
      // Reverse so it reads: "your project → X → Y → target"
      const readable = [...chainNames].reverse();
      lines.push(`  💡 ${readable.join(' → ')}`);
    }
  }

  return lines.join('\n');
}
