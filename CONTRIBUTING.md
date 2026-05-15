# Contributing to Depsight

First off, thank you for considering contributing to Depsight! 🎉

## How to Contribute

### Reporting Bugs

1. Check if the issue already exists in [GitHub Issues](https://github.com/shuklashivam33221/depsight/issues).
2. If not, open a new issue using the **Bug Report** template.
3. Include your Node.js version, OS, and the lockfile format (npm/pnpm).

### Suggesting Features

1. Open an issue using the **Feature Request** template.
2. Describe the problem you're trying to solve, not just the solution.

### Submitting Code

1. **Fork** the repository.
2. **Clone** your fork locally.
3. Create a **new branch** from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
4. Make your changes.
5. **Run the tests** to make sure nothing breaks:
   ```bash
   npm test
   ```
6. **Build** to verify TypeScript compiles:
   ```bash
   npm run build
   ```
7. **Commit** with a clear message:
   ```bash
   git commit -m "feat: add support for yarn lockfiles"
   ```
8. **Push** and open a Pull Request.

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — A new feature
- `fix:` — A bug fix
- `docs:` — Documentation only
- `test:` — Adding or updating tests
- `refactor:` — Code changes that don't add features or fix bugs

### Code Style

- Use **2 spaces** for indentation.
- Use **single quotes** for strings.
- All new code must have **tests**.
- Run `npm run build` before submitting to catch TypeScript errors.

## Development Setup

```bash
# Clone and install
git clone https://github.com/shuklashivam33221/depsight.git
cd depsight
npm install

# Build
npm run build

# Run tests
npm test

# Run locally
node dist/cli.js doctor
```

## Questions?

Open an issue or start a discussion. We're happy to help! 🙌
