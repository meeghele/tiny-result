// Copyright (c) 2025 Michele Tavella <meeghele@proton.me>
// Licensed under the MIT License. See LICENSE file for details.

import { ok, err, Result } from '../src/index.js';

// Abstract metadata example - attach any metadata to Result objects

// Generic metadata container
interface WithMetadata<T, M> {
  value: T;
  metadata: M;
}

// Example metadata types (use any shape you need)
interface TrackingInfo {
  id: string;
  timestamp: number;
}

interface DebugInfo {
  source: string;
  context: Record<string, unknown>;
}

// Pattern 1: Simple metadata wrapper
function withInfo<T, M>(value: T, metadata: M): WithMetadata<T, M> {
  return { value, metadata };
}

// Pattern 2: Direct metadata in Result types
function operation1(input: number): Result<WithMetadata<number, TrackingInfo>, WithMetadata<string, TrackingInfo>> {
  const tracking: TrackingInfo = { id: 'op1', timestamp: Date.now() };

  if (input < 0) {
    return err(withInfo('Negative input', tracking));
  }

  return ok(withInfo(input * 2, tracking));
}

// Pattern 3: Metadata only on success
function operation2(input: string): Result<WithMetadata<string, DebugInfo>, string> {
  if (input.length === 0) {
    return err('Empty input');
  }

  const debug: DebugInfo = {
    source: 'operation2',
    context: { inputLength: input.length, processedAt: Date.now() }
  };

  return ok(withInfo(input.toUpperCase(), debug));
}

// Pattern 4: Different metadata for success and error
function operation3(x: number, y: number): Result<WithMetadata<number, { operation: string }>, WithMetadata<string, { reason: string; inputs: number[] }>> {
  if (y === 0) {
    return err(withInfo('Division by zero', { reason: 'invalid_divisor', inputs: [x, y] }));
  }

  return ok(withInfo(x / y, { operation: 'division' }));
}

// Usage examples
console.log('=== Metadata Patterns ===\n');

// Example 1
const result1 = operation1(5);
if (result1.isOk()) {
  console.log(`Result: ${result1.value.value}, ID: ${result1.value.metadata.id}`);
}

// Example 2
const result2 = operation2('hello');
result2.match({
  ok: success => console.log(`Value: ${success.value}, Source: ${success.metadata.source}`),
  err: error => console.log(`Error: ${error}`)
});

// Example 3
const result3 = operation3(10, 0);
result3.match({
  ok: success => console.log(`Division result: ${success.value}`),
  err: error => console.log(`Failed: ${error.value}, Reason: ${error.metadata.reason}`)
});