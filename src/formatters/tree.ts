import pc from 'picocolors';
import { DependencyGraph } from '../core/graph';

// Takes the reverse paths and renders them as a pretty tree
export function renderReversePaths(
  paths: string[][],
  graph: DependencyGraph
): string {
  const lines: string[] = [];

  for (const reversePath of paths) {
    for (let i = 0; i < reversePath.length; i++) {
      const nodePath = reversePath[i];
      const node = graph.nodes.get(nodePath);
      
      // 1. Build the indent: each level deeper gets more spacing
      const indent = i > 0 ? '   '.repeat(i - 1) + '└─ ' : '';

      // 2. Determine the text to show
      let content = '';
      if (nodePath === '') {
        content = pc.green('root project');
      } else {
        const label = node ? `${node.name}@${node.version}` : nodePath;
        // Color the first item (the target) differently
        content = i === 0 ? pc.bold(pc.cyan(label)) : label;
      }

      // 3. Push the finished line
      lines.push('  ' + indent + content);
    }
    // Add an empty line between different paths for readability
    lines.push('');
  }

  return lines.join('\n');
}
