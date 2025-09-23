// Copyright (c) 2025 Michele Tavella <meeghele@proton.me>
// Licensed under the MIT License. See LICENSE file for details.

import { ok, err, tryCatch, fromPromise, Result } from '../src/index.js';

// Abstract advanced patterns with Result

// Pattern 1: Async operations with fromPromise
async function asyncOperation<T>(input: T, shouldFail = false): Promise<Result<T, string>> {
  const promise = new Promise<T>((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) {
        reject(new Error("Operation failed"));
      } else {
        resolve(input);
      }
    }, 50);
  });

  return fromPromise(promise, error => `Async error: ${error}`);
}

// Pattern 2: Throwing operations with tryCatch
function throwingOperation<T>(fn: () => T): Result<T, string> {
  return tryCatch(fn, error => `Caught error: ${error}`);
}

// Pattern 3: Chaining operations with andThen
function pipeline<A, B, C>(
  input: A,
  step1: (a: A) => Result<B, string>,
  step2: (b: B) => Result<C, string>
): Result<C, string> {
  return step1(input).andThen(step2);
}

// Pattern 4: Transforming success values with map
function transform<T, U>(result: Result<T, string>, fn: (value: T) => U): Result<U, string> {
  return result.map(fn);
}

// Pattern 5: Error recovery with orElse
function withFallback<T>(result: Result<T, string>, fallback: T): Result<T, string> {
  return result.orElse(() => ok(fallback));
}

// Composition example
async function composedOperation(value: number): Promise<Result<string, string>> {
  const step1 = (n: number) => {
    if (n < 0) return err("Negative input");
    return ok(n * 2);
  };

  const step2 = async (n: number) => {
    return asyncOperation(n.toString(), n > 100);
  };

  const step3 = (s: string) => {
    return throwingOperation(() => {
      if (s.length > 10) throw new Error("String too long");
      return `Result: ${s}`;
    });
  };

  // Handle async operations properly
  const result1 = step1(value);
  if (result1.isErr()) {
    return result1;
  }

  const result2 = await step2(result1.value);
  if (result2.isErr()) {
    return result2;
  }

  return step3(result2.value);
}

// Demonstration
async function demo() {
  console.log("=== Advanced Result Patterns ===\n");

  // Success case
  console.log("1. Successful composition:");
  const result1 = await composedOperation(10);
  result1.match({
    ok: value => console.log(`Success: ${value}`),
    err: error => console.log(`Error: ${error}`)
  });

  // Error case with recovery
  console.log("\n2. Error with fallback:");
  const result2 = await composedOperation(-5);
  const recovered = withFallback(result2, "Default value");
  console.log(`Recovered: ${recovered.unwrap()}`);

  // Transformation
  console.log("\n3. Transforming results:");
  const result3 = await asyncOperation(42);
  const transformed = transform(result3, x => x * 3);
  transformed.match({
    ok: value => console.log(`Transformed: ${value}`),
    err: error => console.log(`Error: ${error}`)
  });

  // Error propagation
  console.log("\n4. Error propagation:");
  const result4 = await composedOperation(200);
  result4.match({
    ok: value => console.log(`Success: ${value}`),
    err: error => console.log(`Propagated error: ${error}`)
  });
}

demo().catch(console.error);