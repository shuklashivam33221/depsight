# 🔍 Depsight

**Dependency debugging CLI for modern JavaScript projects.**

> Ever wondered _"Why is this random package in my node_modules?"_ — Depsight tells you.

Depsight is a zero-config CLI tool that parses your lockfile, builds a dependency graph, and gives you instant answers about your project's dependency tree.

---

## ✨ Features

| Command | What it does |
|---|---|
| `depsight <package>` | Trace **why** any package is installed — shows the full dependency chain |
| `depsight duplicates` | Find packages with **multiple versions** causing bundle bloat |
| `depsight doctor` | Full **health checkup** — deprecated packages, duplicates, deep chains |

---

## 🚀 Quick Start

```bash
# Install globally
npm install -g depsight

# Or run without installing
npx depsight doctor
```

---

## 📸 Usage & Output

### 🎯 Trace a dependency

```bash
$ depsight commander
```
```
  commander — found 1 version(s)

  commander@14.0.3
  └─ root project

  💡 commander@14.0.3 is a direct dependency of your project.
```

### 🔗 Trace an indirect (transitive) dependency

```bash
$ depsight undici-types
```
```
  undici-types — found 1 version(s)

  undici-types@7.19.2
  └─ @types/node@25.6.0
     └─ root project

  💡 your project → @types/node → undici-types
```

### 📦 Find duplicates

```bash
$ depsight duplicates
```
```
  📦 Duplicate Analysis

  ✓ No duplicate packages found! Your dependency tree is clean.
```

### 🩺 Run a health check

```bash
$ depsight doctor
```
```
  🩺 Dependency Health Report
  ────────────────────────────────────────

  📊 Overview
    Total packages:      8
    Direct dependencies: 7
    Indirect (transitive): 1

  ✓ No deprecated packages found.

  ✓ No duplicate packages found.

  ✓ No deeply nested dependencies.

  ────────────────────────────────────────
  ✅ Your dependencies are healthy!
```

---

## 🏗️ How It Works

Depsight uses a **custom graph engine** under the hood:

```
package-lock.json
       │
       ▼
  ┌─────────────┐
  │  Parser      │  Reads & normalizes the lockfile
  └─────┬───────┘
        │
        ▼
  ┌─────────────┐
  │ Graph Engine │  Builds forward + reverse edges
  └─────┬───────┘
        │
        ▼
  ┌─────────────┐
  │ BFS Tracer   │  Traces any package back to root
  └─────┬───────┘
        │
        ▼
  ┌─────────────┐
  │ Formatter    │  Pretty trees + English explanations
  └─────────────┘
```

### Key Design Decisions

- **O(1) lookups** — All packages stored in a `Map` for instant access
- **Reverse edges** — Every dependency knows _who depends on it_, enabling backward tracing
- **BFS algorithm** — Finds the shortest path from any package back to your project root
- **Normalized data** — Raw lockfile data is cleaned into a standard `PackageNode` format

---

## 📁 Project Structure

```
src/
├── cli.ts                      # Entry point & command routing
├── types.ts                    # Core interfaces (PackageNode, LockfileData)
├── core/
│   ├── lockfile.ts             # File reader & format detector
│   ├── graph.ts                # Graph builder + BFS reverse tracer
│   └── parsers/
│       └── npm-parser.ts       # NPM lockfile → normalized data
├── commands/
│   ├── why.ts                  # "depsight <pkg>" handler
│   ├── duplicates.ts           # "depsight duplicates" handler
│   └── doctor.ts               # "depsight doctor" handler
└── formatters/
    ├── tree.ts                 # Box-drawing tree renderer
    └── human.ts                # English explanation generator
```

---

## 🛠️ Development

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/depsight.git
cd depsight

# Install dependencies
npm install

# Build
npm run build

# Run locally
node dist/cli.js doctor
```

---

## 🗺️ Roadmap

- [x] `depsight <package>` — Reverse dependency tracing
- [x] `depsight duplicates` — Duplicate version detection
- [x] `depsight doctor` — Full health report
- [ ] pnpm lockfile support
- [ ] Yarn lockfile support
- [ ] `--json` output flag for CI/CD pipelines
- [ ] Interactive mode with fuzzy search

---

## 🤝 Contributing

Contributions are welcome! Feel free to open issues and pull requests.

---

## 📄 License

MIT © Shivam Shukla
