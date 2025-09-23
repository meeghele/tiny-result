// Copyright (c) 2025 Michele Tavella <meeghele@proton.me>
// Licensed under the MIT License. See LICENSE file for details.

import { ok, err, Result } from '../src/index.js';

// Basic divide function example
function divide(a: number, b: number): Result<number, string> {
  if (b === 0) return err("Division by zero");
  return ok(a / b);
}

// Chaining operations with map and mapErr
const result = divide(10, 2)
  .map(x => x * 2)
  .mapErr(e => `Error: ${e}`)
  .match({
    ok: value => console.log(`Result: ${value}`),
    err: error => console.error(error)
  });

// Type narrowing example
const res = divide(10, 0);
if (res.isOk()) {
  console.log(res.value); // TypeScript knows res is Ok<number>
} else {
  console.log(res.error); // TypeScript knows res is Err<string>
}

// Example with unwrapOr for safe default values
const safeResult = divide(10, 0).unwrapOr(0);
console.log(`Safe result: ${safeResult}`);

// Chaining multiple operations
const complexResult = divide(20, 4)
  .andThen(x => divide(x, 2))
  .map(x => Math.sqrt(x))
  .match({
    ok: value => `Square root: ${value}`,
    err: error => `Failed: ${error}`
  });

console.log(complexResult);