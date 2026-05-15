import pc from 'picocolors';
import { loadLockfile } from '../core/lockfile';
import { buildGraph } from '../core/graph';

export function duplicatesCommand(): void {
  try {
    // Step 1: Load the lockfile
    const lockfileData = loadLockfile(process.cwd());

    // Step 2: Build the graph (we need the nodes)
    const graph = buildGraph(lockfileData);

    // Step 3: Group all packages by name
    // Example: "qs" → [{ version: "6.11", path: "..." }, { version: "6.9", path: "..." }]
    const nameToVersions = new Map<string, { version: string; path: string }[]>();

    for (const [path, node] of graph.nodes.entries()) {
      if (path === '') continue; // Skip the root project

      if (!nameToVersions.has(node.name)) {
        nameToVersions.set(node.name, []);
      }
      nameToVersions.get(node.name)!.push({
        version: node.version,
        path
      });
    }

    // Step 4: Filter to only packages with multiple DIFFERENT versions
    const duplicates = new Map<string, { version: string; path: string }[]>();

    for (const [name, entries] of nameToVersions.entries()) {
      const uniqueVersions = new Set(entries.map(e => e.version));
      if (uniqueVersions.size > 1) {
        duplicates.set(name, entries);
      }
    }

    // Step 5: Display results
    console.log('');
    console.log(`  ${pc.bold('📦 Duplicate Analysis')}`);
    console.log('');

    if (duplicates.size === 0) {
      console.log(
        pc.green('  ✓ No duplicate packages found! Your dependency tree is clean.')
      );
      console.log('');
      return;
    }

    console.log(
      `  Found ${pc.red(String(duplicates.size))} package(s) with multiple versions:`
    );
    console.log('');

    for (const [name, entries] of duplicates.entries()) {
      console.log(`  ${pc.bold(pc.yellow(name))}`);
      for (const entry of entries) {
        const cleanPath = entry.path.replace('node_modules/', '');
        console.log(
          `    ${pc.dim('•')} ${entry.version} ${pc.dim(`(${cleanPath})`)}`
        );
      }
      console.log('');
    }

    // Summary with actionable tip
    const totalExtra = Array.from(duplicates.values())
      .reduce((sum, entries) => sum + entries.length - 1, 0);

    console.log(
      `  ${pc.dim('💡 Tip:')} ${totalExtra} extra version(s) could potentially be deduplicated.`
    );
    console.log(
      `  ${pc.dim('   Run')} ${pc.cyan('npm dedupe')} ${pc.dim('to try automatic deduplication.')}`
    );
    console.log('');
  } catch (error: any) {
    console.error(pc.red(`  ✗ Error: ${error.message}`));
  }
}
