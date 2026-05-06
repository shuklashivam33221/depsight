# dep-why V1 — Phase-Wise Implementation Plan

> **Goal**: Build a dependency debugging CLI with 3 commands: `dep-why <package>`, `dep-why duplicates`, `dep-why doctor`

---

## Phase 1: Project Scaffolding & CLI Skeleton

### What You'll Learn
- How CLI tools work under the hood (the `bin` field, shebang lines)
- How `commander.js` routes commands
- How npm knows to make your code executable

### What You'll Build
- `package.json` with proper `bin` config
- `tsconfig.json` for TypeScript CLI projects
- `src/cli.ts` — entry point with commander setup (3 command stubs)
- Verify it works: `node dist/cli.js --help`

### Key Concepts
- **`bin` field in package.json**: This tells npm "when someone types `dep-why`, run this JS file"
- **Shebang line** (`#!/usr/bin/env node`): First line in CLI entry file, tells the OS to use Node.js to execute it
- **Commander.js pattern**: You register commands, each with a description and action handler

### Files
```
dep-why/
├── package.json
├── tsconfig.json
└── src/
    └── cli.ts
```

### Done When
- `node dist/cli.js --help` shows your 3 commands
- `node dist/cli.js doctor` prints "Doctor command coming soon"

---

## Phase 2: Lockfile Detection & Parsing

### What You'll Learn
- How `package-lock.json` v2/v3 structure works (it's a flat map, not a tree!)
- How `pnpm-lock.yaml` differs from npm's lockfile
- How to design a **parser abstraction** that works for multiple formats

### What You'll Build
- `src/core/lockfile.ts` — detect which lockfile exists, read & parse it
- `src/core/parsers/npm-parser.ts` — parse `package-lock.json` into a normalized format
- `src/core/parsers/pnpm-parser.ts` — parse `pnpm-lock.yaml` into same normalized format
- `src/types.ts` — shared types for the normalized package data

### Key Concepts

**package-lock.json v3 structure:**
```json
{
  "packages": {
    "": { "dependencies": { "express": "^4.18.0" } },
    "node_modules/express": { "version": "4.18.2", "dependencies": { "body-parser": "1.20.1" } },
    "node_modules/body-parser": { "version": "1.20.1" }
  }
}
```
- The key `""` = your root project
- Every other key is a `node_modules/...` path
- This flat map IS the resolved dependency tree

**Your normalized format should look like:**
```typescript
interface PackageNode {
  name: string;
  version: string;
  dependencies: Record<string, string>;  // name -> version range
  path: string;                           // where it lives in node_modules
  deprecated?: string;
  dev?: boolean;
}
```

### Files
```
src/
├── types.ts
└── core/
    ├── lockfile.ts
    └── parsers/
        ├── npm-parser.ts
        └── pnpm-parser.ts
```

### Done When
- You can run a test that reads a real `package-lock.json` and prints all parsed packages
- Same works for `pnpm-lock.yaml` (if available)

---

## Phase 3: Dependency Graph Builder

### What You'll Learn
- **Graph data structures** — adjacency list representation
- **Forward vs reverse edges** — this is the key insight for the whole tool
- **Graph traversal** — BFS/DFS to find paths from any node to root
- Why this is a DAG (Directed Acyclic Graph), not a tree

### What You'll Build
- `src/core/graph.ts` — build the dependency graph with both forward AND reverse edges
- Reverse path finder: given a package, trace ALL paths back to root project

### Key Concepts

**Why reverse edges matter:**
```
Normal (forward):  root → express → body-parser → bytes
Reverse:           bytes → body-parser → express → root
```
When a developer asks "why is `bytes` here?", you need REVERSE traversal.

**Graph representation:**
```typescript
interface DependencyGraph {
  // Forward: "who does this package depend on?"
  forward: Map<string, Set<string>>;    // "express@4.18.2" → ["body-parser@1.20.1", ...]
  
  // Reverse: "who depends on this package?"  
  reverse: Map<string, Set<string>>;    // "body-parser@1.20.1" → ["express@4.18.2"]
  
  // Metadata for each node
  nodes: Map<string, PackageNode>;
}
```

**Path finding algorithm (BFS from target to root):**
```
1. Start at target package
2. Follow reverse edges
3. Record the path at each step
4. Stop when you reach root
5. You may find MULTIPLE paths (package used by multiple chains)
```

### Files
```
src/
└── core/
    └── graph.ts
```

### Done When
- You can build a graph from parsed lockfile data
- Given a package name, you can find all reverse paths to root
- Test: `findReversePaths("body-parser")` returns `[["body-parser@1.20.1", "express@4.18.2", "root"]]`

---

## Phase 4: Command 1 — `dep-why <package>`

### What You'll Learn
- How to format tree output in terminal (the `├─`, `└─`, `│` characters)
- How to add color strategically (not just "make it colorful")
- How to write human-readable explanations from graph data

### What You'll Build
- `src/commands/why.ts` — the why command handler
- `src/formatters/tree.ts` — tree rendering with box-drawing characters
- `src/formatters/human.ts` — generate English explanations

### Target Output
```
dep-why lodash

  lodash — found 2 versions

  lodash@4.17.21
  └─ root project (direct dependency)

  lodash@3.10.1
  └─ webpack-plugin-legacy@2.1.0
     └─ old-utils@1.4.2
        └─ lodash@3.10.1

  💡 lodash@3.10.1 exists because old-utils (used by webpack-plugin-legacy)
     depends on it. This is an older major version — lodash@4.17.21 is already
     installed elsewhere. Consider upgrading webpack-plugin-legacy.
```

### Files
```
src/
├── commands/
│   └── why.ts
└── formatters/
    ├── tree.ts
    └── human.ts
```

### Done When
- `node dist/cli.js express` shows reverse tree for express in your own project
- Output has colors, tree lines, and at least one human-readable explanation

---

## Phase 5: Command 2 — `dep-why duplicates`

### What You'll Learn
- How to analyze a graph for duplicate nodes (group-by + filter)
- How to classify severity (major version conflict vs patch difference)
- Semver comparison using the `semver` library

### What You'll Build
- `src/analyzers/duplicates.ts` — find all packages with multiple versions
- `src/commands/duplicates.ts` — the duplicates command handler
- Severity classification: 🔴 major conflict, 🟡 minor, 🟢 patch

### Target Output
```
dep-why duplicates

  ╭───────────────────────────────────────────╮
  │   dep-why · Duplicate Package Analysis    │
  ╰───────────────────────────────────────────╯

  Found 4 packages with multiple versions

  🔴 react — 3 versions (major conflict)
     18.3.1  ← root project
     17.0.2  ← old-dashboard@2.1.0
     16.14.0 ← analytics-sdk@1.4.2

  🟡 lodash — 2 versions (minor difference)
     4.17.21 ← root project
     4.17.15 ← legacy-utils@1.0.0
     ✓ Resolvable with: npm dedupe

  Summary: 1 critical · 1 warning · 2 clean
  Run dep-why doctor for full diagnosis.
```

### Files
```
src/
├── analyzers/
│   └── duplicates.ts
└── commands/
    └── duplicates.ts
```

### Done When
- `node dist/cli.js duplicates` shows real duplicate packages in your project
- Duplicates are categorized by severity
- Fixable ones show suggestions

---

## Phase 6: Command 3 — `dep-why doctor`

### What You'll Learn
- How to compose multiple analyzers into a single report
- How to generate actionable fix suggestions (the hardest design challenge)
- How to design "opinionated" diagnostic output

### What You'll Build
- `src/analyzers/deprecated.ts` — check for deprecated packages (via registry or lockfile metadata)
- `src/analyzers/conflicts.ts` — peer dependency and version conflict detection
- `src/analyzers/suggestions.ts` — generate fix recommendations
- `src/commands/doctor.ts` — the doctor command handler
- `src/formatters/report.ts` — health report formatting

### Target Output
```
dep-why doctor

  ╭──────────────────────────────────────────────╮
  │        dep-why · Dependency Health Report     │
  ╰──────────────────────────────────────────────╯

  Scanned 847 packages in 1.2s

  🔴 Critical
     react has 3 conflicting versions (18.3.1, 17.0.2, 16.14.0)
     └─ 17.0.2  ← old-dashboard@2.1.0
     └─ 16.14.0 ← analytics-sdk@1.4.2
     ✓ Fix: Upgrade old-dashboard to >=5.0
     ✓ Fix: Replace analytics-sdk with @analytics/core

  🟡 Warning
     5 packages have duplicate versions (~2.4MB wasted)
     └─ Run dep-why duplicates for details
     ✓ Fix: npm dedupe may resolve 3 of them

     2 deprecated packages found
     └─ request@2.88.2 ← legacy-auth@1.0.0
     ✓ Fix: Replace legacy-auth with passport@0.7

  🟢 Passed
     ✓ No circular dependencies
     ✓ No peer dependency conflicts

  ─────────────────────────────────────────────
  Summary: 1 critical · 2 warnings · 2 passed
```

### Files
```
src/
├── analyzers/
│   ├── deprecated.ts
│   ├── conflicts.ts
│   └── suggestions.ts
├── commands/
│   └── doctor.ts
└── formatters/
    └── report.ts
```

### Done When
- `node dist/cli.js doctor` runs all analyzers and produces the unified report
- Fix suggestions are present for each issue
- Report has clear pass/fail summary

---

## Phase 7: Polish & Ship

### What You'll Do
- Write a compelling README with real output screenshots
- Test on 2-3 real open-source projects (Next.js, Express, etc.)
- Publish to npm
- Set up `npx dep-why` to work without install

---

## Final File Structure

```
dep-why/
├── package.json
├── tsconfig.json
├── README.md
├── src/
│   ├── cli.ts                    # Entry point, commander setup
│   ├── types.ts                  # Shared type definitions
│   ├── core/
│   │   ├── lockfile.ts           # Lockfile detection & loading
│   │   ├── graph.ts              # Dependency graph (forward + reverse)
│   │   └── parsers/
│   │       ├── npm-parser.ts     # package-lock.json parser
│   │       └── pnpm-parser.ts    # pnpm-lock.yaml parser
│   ├── analyzers/
│   │   ├── duplicates.ts         # Multi-version detection
│   │   ├── deprecated.ts         # Deprecated package detection
│   │   ├── conflicts.ts          # Version conflict analysis
│   │   └── suggestions.ts        # Fix recommendation engine
│   ├── commands/
│   │   ├── why.ts                # dep-why <package>
│   │   ├── duplicates.ts         # dep-why duplicates
│   │   └── doctor.ts             # dep-why doctor
│   └── formatters/
│       ├── tree.ts               # Tree rendering (├─ └─ │)
│       ├── human.ts              # Human-readable explanations
│       └── report.ts             # Doctor report formatting
└── dist/                         # Compiled output
```

---

## What You'll Learn Overall

| Concept | Where |
|---|---|
| **Graph data structures** | Phase 3 — adjacency lists, DAGs |
| **Graph algorithms** | Phase 3 & 4 — BFS/DFS, reverse traversal, path finding |
| **Parser design** | Phase 2 — abstraction over multiple lockfile formats |
| **CLI architecture** | Phase 1 — command routing, argument parsing |
| **Semver semantics** | Phase 5 — major/minor/patch comparison, range resolution |
| **Terminal UX** | Phase 4-6 — colors, box drawing, tree rendering |
| **Product thinking** | Phase 6 — diagnosis > visualization, actionable output |
