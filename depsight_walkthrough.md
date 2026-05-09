# Depsight — Full Project Walkthrough

> Understanding everything from scratch: what you're building, what's done, and how it all connects.

---

## 🧠 The Big Picture: What Problem Are You Solving?

Imagine you're working on a big Node.js project. You run `npm install` and suddenly you have **847 packages** in `node_modules/`. You didn't install 847 things — you installed maybe 10. But those 10 each depend on other things, which depend on other things, and so on.

Now you hit a problem:
- "Why the hell is `lodash` here? I never installed it!"
- "Why do I have 3 different versions of `react`?"
- "Are any of my dependencies broken or deprecated?"

**That's what depsight solves.** It's a detective tool for your dependencies.

You're building 3 commands:

| Command | What it does | Analogy |
|---|---|---|
| `depsight lodash` | "Who brought lodash here? Trace the chain back to root" | 🔍 A detective tracing a suspect |
| `depsight duplicates` | "Which packages have multiple versions installed?" | 📦 Finding duplicate items in a warehouse |
| `depsight doctor` | "Full health check — what's broken, what's wasteful, how to fix it" | 🩺 A doctor doing a full body checkup |

---

## 📁 What You Have Right Now (3 Files)

### File 1: `package.json` — Your project's identity card

```
depsight/
├── package.json     ← THIS FILE
├── tsconfig.json
└── src/
    └── cli.ts
```

**What it does:** Tells npm everything about your project.

**Key parts explained:**

```json
{
  "name": "depsight",            // Your tool's name on npm
  
  "bin": {
    "depsight": "./dist/cli.js"  // ⭐ THE MAGIC LINE
  },
  
  "dependencies": {
    "commander": "^14.0.3",      // Routes CLI commands (like Express routes HTTP)
    "picocolors": "^1.1.1",      // Makes terminal text colorful
    "semver": "^7.7.4",          // Compares versions (is 4.17.21 > 4.17.15?)
    "yaml": "^2.8.4"             // Reads pnpm-lock.yaml files
  }
}
```

**The `bin` field is the most important line.** Here's what it means:

```
Without bin:  User runs → node dist/cli.js doctor
With bin:     User runs → depsight doctor
```

It tells npm: "When someone types `depsight` in their terminal, execute `./dist/cli.js`". That's how CLI tools like `eslint`, `prettier`, `vite` all work — they all have a `bin` field.

---

### File 2: `tsconfig.json` — TypeScript compiler settings

**What it does:** You write TypeScript in `src/`, and `tsc` compiles it to JavaScript in `dist/`.

```
src/cli.ts  →→→  tsc  →→→  dist/cli.js
(you write)    (compiler)   (node runs)
```

Key settings:
- `rootDir: "./src"` — your source code lives here
- `outDir: "./dist"` — compiled JS goes here
- `module: "commonjs"` — output format Node.js understands

---

### File 3: `src/cli.ts` — The entry point (your ONLY code file)

This is the **front door** of your application. When someone types `depsight`, this file runs.

```typescript
#!/usr/bin/env node          // ← "Hey OS, use Node.js to run me"

import { Command } from 'commander';

const program = new Command();

program
  .name('depsight')
  .description('Dependency debugging CLI for modern JavaScript projects')
  .version('0.1.0');
```

**What's happening:** You're using `commander` library to set up a command router. Think of it like this:

```
Express (web):    app.get('/users', handler)     → routes HTTP requests
Commander (CLI):  program.command('doctor', fn)  → routes terminal commands
```

Then you register 3 commands, all currently stubs:

```typescript
// Command 1: depsight <package>
// e.g., "depsight lodash" → traces why lodash is installed
program.argument('[package]', '...')
  .action((packageName) => {
    console.log('Why command coming soon...');  // ← placeholder
  });

// Command 2: depsight duplicates
program.command('duplicates')
  .action(() => {
    console.log('Duplicates command coming soon...');  // ← placeholder
  });

// Command 3: depsight doctor  
program.command('doctor')
  .action(() => {
    console.log('Doctor command coming soon...');  // ← placeholder
  });

program.parse();  // ← "Okay commander, read what the user typed and route it"
```

**Right now, all 3 commands just print "coming soon".** The skeleton is there, but there's no brain behind it yet.

---

## 🔄 How It All Flows Together (The Full Pipeline)

Here's the complete flow of what depsight will do when it's finished:

```
User types: depsight lodash

     ┌─────────────────────────────────────────────────────┐
  1. │  cli.ts receives the command                        │
     │  commander routes "lodash" to the why command       │
     └──────────────────────┬──────────────────────────────┘
                            │
                            ▼
     ┌─────────────────────────────────────────────────────┐
  2. │  lockfile.ts detects: "is there a package-lock.json │
     │  or pnpm-lock.yaml in this directory?"              │
     │  → Finds package-lock.json, reads it                │
     └──────────────────────┬──────────────────────────────┘
                            │
                            ▼
     ┌─────────────────────────────────────────────────────┐
  3. │  npm-parser.ts parses the lockfile                   │
     │  Turns raw JSON into clean PackageNode objects       │
     │  → "express@4.18.2 depends on body-parser@1.20.1"  │
     └──────────────────────┬──────────────────────────────┘
                            │
                            ▼
     ┌─────────────────────────────────────────────────────┐
  4. │  graph.ts builds a dependency graph                  │
     │  Creates REVERSE edges so we can trace backwards     │
     │  → "body-parser is needed BY express"               │
     └──────────────────────┬──────────────────────────────┘
                            │
                            ▼
     ┌─────────────────────────────────────────────────────┐
  5. │  why.ts uses the graph to find ALL paths from        │
     │  "lodash" back to your root project                 │
     │  → lodash ← express ← root                         │
     └──────────────────────┬──────────────────────────────┘
                            │
                            ▼
     ┌─────────────────────────────────────────────────────┐
  6. │  tree.ts + human.ts format the output beautifully    │
     │  Box-drawing characters, colors, explanations       │
     └─────────────────────────────────────────────────────┘
```

**Right now, only step 1 exists.** Steps 2-6 are what we need to build.

---

## ✅ Done vs ⏳ Remaining

| Phase | Status | What It Is |
|---|---|---|
| **Phase 1**: CLI Skeleton | ✅ Done | `cli.ts` with 3 command stubs |
| **Phase 2**: Lockfile Parsing | ⏳ Not started | Read & parse `package-lock.json` / `pnpm-lock.yaml` |
| **Phase 3**: Graph Builder | ⏳ Not started | Build the dependency graph with reverse edges |
| **Phase 4**: `depsight <pkg>` | ⏳ Not started | Trace why a package is installed |
| **Phase 5**: `depsight duplicates` | ⏳ Not started | Find duplicate package versions |
| **Phase 6**: `depsight doctor` | ⏳ Not started | Full health report |
| **Phase 7**: Polish & Ship | ⏳ Not started | README, testing, npm publish |

### Files that exist:
```
depsight/
├── package.json        ✅ configured
├── tsconfig.json       ✅ configured
├── src/
│   └── cli.ts          ✅ command routing works
└── src/core/
    └── parsers/        📁 empty folder
```

### Files we still need to create:
```
src/
├── types.ts                     ← data shapes (PackageNode, etc.)
├── core/
│   ├── lockfile.ts              ← detect & read lockfile
│   ├── graph.ts                 ← build the dependency graph
│   └── parsers/
│       ├── npm-parser.ts        ← parse package-lock.json
│       └── pnpm-parser.ts       ← parse pnpm-lock.yaml
├── analyzers/
│   ├── duplicates.ts            ← find duplicate packages
│   ├── deprecated.ts            ← find deprecated packages
│   ├── conflicts.ts             ← find version conflicts
│   └── suggestions.ts           ← generate fix suggestions
├── commands/
│   ├── why.ts                   ← "depsight lodash" logic
│   ├── duplicates.ts            ← "depsight duplicates" logic
│   └── doctor.ts                ← "depsight doctor" logic
└── formatters/
    ├── tree.ts                  ← pretty tree output (├─ └─)
    ├── human.ts                 ← English explanations
    └── report.ts                ← doctor report layout
```

---

## 🎯 Next Step

**Phase 2: Lockfile Parsing** — teaching depsight to read the dependency data from `package-lock.json`. This is like giving your detective their case files.

Ready to start?
