[![npm version](https://img.shields.io/npm/v/@meeghele/tiny-result.svg)](https://www.npmjs.com/package/@meeghele/tiny-result)
[![CI](https://github.com/meeghele/tiny-result/actions/workflows/ci.yml/badge.svg)](https://github.com/meeghele/tiny-result/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)

# Tiny Result

A minimal yet fully type-safe Result implementation for TypeScript. This library provides robust error handling with full type safety in a tiny package (~100 lines of code).

## Features

- **Fully Type-Safe**: Complete TypeScript support with proper type narrowing
- **Minimal API**: Essential methods only - `map`, `mapErr`, `andThen`, `match`, `isOk/isErr`
- **Zero Dependencies**: No external dependencies
- **Rust-Inspired**: Familiar API for developers coming from Rust
- **Lightweight**: ~100 lines of implementation code
- **Composable**: Chain operations that return Results
- **Utility Functions**: `tryCatch` and `fromPromise` for converting throwing code

## Comparison with Other Libraries

### Compared to [neverthrow](https://github.com/supermacro/neverthrow) 
- ✅ Much smaller bundle size
- ✅ Simpler API surface
- ❌ No ResultAsync utilities
- ❌ No combine/combineWithAllErrors

### Compared to [ts-result](https://github.com/vultix/ts-results)
- ✅ Smaller and more focused
- ✅ Better TypeScript inference
- ✅ Rust-inspired naming
- ❌ Fewer utility methods

### When to use tiny-result
- Learning the Result pattern
- Small projects where bundle size matters
- When you only need basic Result functionality
- As a starting point to build your own extensions
- If you need to handle fewer edge cases
- If you want more predictable inference

### When to use larger libraries
- Production applications with complex error handling
- Heavy async operations (use neverthrow)
- When you need Result.combine operations

## Install

tiny-result is provided as an ESM-only package.

```bash
# Using bun
bun install @meeghele/tiny-result

# Using npm
npm install @meeghele/tiny-result

# Using pnpm
pnpm add @meeghele/tiny-result

# Using yarn
yarn add @meeghele/tiny-result
```

### Alternative: copy source files

Just copy [`src/core.ts`](https://github.com/meeghele/tiny-result/blob/main/src/core.ts), [`src/utility.ts`](https://github.com/meeghele/tiny-result/blob/main/src/utility.ts), and [`src/index.ts`](https://github.com/meeghele/tiny-result/blob/main/src/index.ts) to your project.

## Quick Start

```typescript
import { ok, err, Result } from '@meeghele/tiny-result';

// Success with metadata
const result = ok(42);

// Error handling
const error = err("Something went wrong");

// Type-safe operations
const doubled = result.map(x => x * 2);

// Pattern matching
result.match({
  ok: value => console.log(`Success: ${value}`),
  err: error => console.error(`Error: ${error}`)
});
```

## Core API

### Creating Results

```typescript
import { ok, err, type Result } from '@meeghele/tiny-result';

// Create successful result
const success = ok(42);

// Create error result
const failure = err("Something went wrong");

// Function returning Result
function divide(a: number, b: number): Result<number, string> {
  if (b === 0) return err("Division by zero");
  return ok(a / b);
}
```

### Type Narrowing

```typescript
const result = divide(10, 2);

if (result.isOk()) {
  console.log(result.value); // TypeScript knows this is number
} else {
  console.log(result.error); // TypeScript knows this is string
}
```

### Transforming Values

```typescript
// Transform success values
const doubled = ok(21).map(x => x * 2); // Ok(42)

// Transform error values
const formatted = err("failure").mapErr(e => `Error: ${e}`); // Err("Error: failure")

// Chain operations that return Results
const result = ok(20)
  .andThen(x => divide(x, 4))
  .andThen(x => divide(x, 2)); // Ok(2.5)
```

### Pattern Matching

```typescript
const result = divide(10, 2);

const message = result.match({
  ok: value => `Result: ${value}`,
  err: error => `Failed: ${error}`
});
```

### Safe Unwrapping

```typescript
// Unsafe unwrap (throws on error)
const value = result.unwrap();

// Safe unwrap with default
const safeValue = result.unwrapOr(0);

// Get error (throws on success)
const error = result.unwrapErr();
```

## Utility Functions

### tryCatch

Convert throwing functions to Results:

```typescript
import { tryCatch } from '@meeghele/tiny-result';

// Parse JSON safely
const parsed = tryCatch(
  () => JSON.parse(jsonString),
  error => `Parse error: ${error.message}`
);

// File operations
const config = tryCatch(
  () => readFileSync('config.json', 'utf8'),
  error => `Failed to read config: ${error}`
);
```

### fromPromise

Convert Promises to Results:

```typescript
import { fromPromise } from '@meeghele/tiny-result';

// Fetch data safely
const response = await fromPromise(
  fetch('/api/data').then(r => r.json()),
  error => `Network error: ${error.message}`
);

// Database operations
const user = await fromPromise(
  db.users.findById(id),
  error => `Database error: ${error}`
);
```

## Examples

Check the [`examples/`](https://github.com/meeghele/tiny-result/tree/main/examples) directory for complete usage examples:

- [`examples/basic.ts`](https://github.com/meeghele/tiny-result/blob/main/examples/basic.ts) - Basic Result operations and patterns
- [`examples/advanced.ts`](https://github.com/meeghele/tiny-result/blob/main/examples/advanced.ts) - Advanced async patterns and composition
- [`examples/metadata.ts`](https://github.com/meeghele/tiny-result/blob/main/examples/metadata.ts) - Adding metadata to Result objects

Run examples with:
```bash
bun run example:basic
bun run example:advanced
bun run example:metadata
```

## Development

```bash
# Install dependencies
bun install

# Run tests
bun test

# Build
bun run build

# Run examples
bun run example:basic
bun run example:advanced
bun run example:metadata

# Format and lint
bun run format
bun run lint
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please follow the semantic versioning branch naming convention:

- **main**: Production-ready code
- **feat/**: New features (`feat/user-authentication`)
- **fix/**: Bug fixes (`fix/connection-timeout`)
- **chore/**: Maintenance (`chore/update-dependencies`)

## Author

**Michele Tavella** - [meeghele@proton.me](mailto:meeghele@proton.me)
