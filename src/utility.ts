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

export function all<T, E>(results: Result<T, E>[]): Result<T[], E> {
  const values: T[] = []

  for (const result of results) {
    if (result.isErr()) {
      return err(result.error)
    }
    values.push(result.value)
  }

  return ok(values)
}

export function partition<T, E>(results: Result<T, E>[]): { oks: T[]; errs: E[] } {
  const oks: T[] = []
  const errs: E[] = []

  for (const result of results) {
    if (result.isOk()) {
      oks.push(result.value)
    } else {
      errs.push(result.error)
    }
  }

  return { oks, errs }
}
