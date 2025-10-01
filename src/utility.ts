// Copyright (c) 2025 Michele Tavella <meeghele@proton.me>
// Licensed under the MIT License. See LICENSE file for details.

import { err, ok } from './core.js'
import type { Result } from './core.js'

export const tryCatch = <T, E = unknown>(
  fn: () => T,
  mapError?: (error: unknown) => E,
): Result<T, E> => {
  try {
    return ok(fn())
  } catch (error) {
    return err(mapError ? mapError(error) : (error as E))
  }
}

export const fromPromise = async <T, E = unknown>(
  promise: Promise<T>,
  mapError?: (error: unknown) => E,
): Promise<Result<T, E>> => {
  try {
    return ok(await promise)
  } catch (error) {
    return err(mapError ? mapError(error) : (error as E))
  }
}
