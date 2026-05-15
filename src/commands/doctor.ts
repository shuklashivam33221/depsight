import pc from 'picocolors';
import { loadLockfile } from '../core/lockfile';
import { buildGraph, findReversePaths } from '../core/graph';

export function doctorCommand(): void {
  try {
    // Step 1: Load and build
    const lockfileData = loadLockfile(process.cwd());
    const graph = buildGraph(lockfileData);

    console.log('');
    console.log(`  ${pc.bold('🩺 Dependency Health Report')}`);
    console.log(`  ${pc.dim('─'.repeat(40))}`);
    console.log('');

    let issues = 0;

    // ===== CHECK 1: Basic Stats =====
    const totalPackages = graph.nodes.size - 1; // minus root
    const directCount = Object.keys(lockfileData.rootDependencies).length;
    const indirectCount = totalPackages - directCount;

    console.log(`  ${pc.bold('📊 Overview')}`);
    console.log(`    Total packages:    ${pc.cyan(String(totalPackages))}`);
    console.log(`    Direct dependencies: ${pc.green(String(directCount))}`);
    console.log(`    Indirect (transitive): ${pc.yellow(String(indirectCount))}`);
    console.log('');

    // ===== CHECK 2: Deprecated Packages =====
    const deprecated: string[] = [];
    for (const [path, node] of graph.nodes.entries()) {
      if (path === '') continue;
      if (node.deprecated) {
        deprecated.push(`${node.name}@${node.version}`);
      }
    }

    if (deprecated.length > 0) {
      issues += deprecated.length;
      console.log(`  ${pc.bold(pc.red('🚨 Deprecated Packages'))}`);
      for (const dep of deprecated) {
        console.log(`    ${pc.red('✗')} ${dep}`);
      }
      console.log('');
    } else {
      console.log(`  ${pc.green('✓')} No deprecated packages found.`);
      console.log('');
    }

    // ===== CHECK 3: Duplicates =====
    const nameToVersions = new Map<string, Set<string>>();
    for (const [path, node] of graph.nodes.entries()) {
      if (path === '') continue;
      if (!nameToVersions.has(node.name)) {
        nameToVersions.set(node.name, new Set());
      }
      nameToVersions.get(node.name)!.add(node.version);
    }

    const duplicates: string[] = [];
    for (const [name, versions] of nameToVersions.entries()) {
      if (versions.size > 1) {
        duplicates.push(`${name} (${versions.size} versions)`);
      }
    }

    if (duplicates.length > 0) {
      issues += duplicates.length;
      console.log(`  ${pc.bold(pc.yellow('📦 Duplicate Packages'))}`);
      for (const dup of duplicates) {
        console.log(`    ${pc.yellow('!')} ${dup}`);
      }
      console.log(`    ${pc.dim('💡 Run')} ${pc.cyan('npm dedupe')} ${pc.dim('to fix.')}`);
      console.log('');
    } else {
      console.log(`  ${pc.green('✓')} No duplicate packages found.`);
      console.log('');
    }

    // ===== CHECK 4: Deep Chains =====
    const deepPackages: string[] = [];
    for (const [path, node] of graph.nodes.entries()) {
      if (path === '') continue;
      const paths = findReversePaths(graph, node.name);
      for (const p of paths) {
        if (p.length > 4) {
          deepPackages.push(`${node.name} (${p.length - 1} levels deep)`);
          break;
        }
      }
    }

    if (deepPackages.length > 0) {
      console.log(`  ${pc.bold(pc.yellow('📏 Deep Dependencies'))}`);
      for (const deep of deepPackages) {
        console.log(`    ${pc.yellow('!')} ${deep}`);
      }
      console.log(`    ${pc.dim('💡 Deep deps are harder to control and update.')}`);
      console.log('');
    } else {
      console.log(`  ${pc.green('✓')} No deeply nested dependencies.`);
      console.log('');
    }

    // ===== FINAL VERDICT =====
    console.log(`  ${pc.dim('─'.repeat(40))}`);
    if (issues === 0) {
      console.log(`  ${pc.bold(pc.green('✅ Your dependencies are healthy!'))}`);
    } else {
      console.log(
        `  ${pc.bold(pc.yellow(`⚠️  Found ${issues} issue(s) to review.`))}`
      );
    }
    console.log('');
  } catch (error: any) {
    console.error(pc.red(`  ✗ Error: ${error.message}`));
  }
}
