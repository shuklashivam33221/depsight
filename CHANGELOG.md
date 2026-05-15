# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-05-15

### Added

- **`depsight <package>`** — Reverse dependency tracing with BFS algorithm
- **`depsight duplicates`** — Detect packages with multiple installed versions
- **`depsight doctor`** — Full dependency health report (deprecated packages, duplicates, deep chains)
- NPM lockfile parser (`package-lock.json` v3 support)
- Custom graph engine with forward and reverse edges
- Pretty tree formatter with box-drawing characters
- Human-readable English explanations for dependency chains
- Colorized terminal output using picocolors

### Not Yet Implemented

- pnpm lockfile support
- Yarn lockfile support
- `--json` output flag
- Interactive mode
