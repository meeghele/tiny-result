// Copyright (c) 2025 Michele Tavella <meeghele@proton.me>
// Licensed under the MIT License. See LICENSE file for details.

// Re-export everything from core
export type { Result } from './core.js'
export { Ok, Err, ok, err, isOk, isErr } from './core.js'
export { tryCatch, fromPromise, all, partition } from './utility.js'
