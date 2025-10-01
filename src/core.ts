// Copyright (c) 2025 Michele Tavella <meeghele@proton.me>
// Licensed under the MIT License. See LICENSE file for details.

// Result type definition
export type Result<T, E> = Ok<T> | Err<E>

// Ok variant
export class Ok<T> {
  readonly ok = true as const
  readonly err = false as const

  constructor(readonly value: T) {}

  map<U>(fn: (value: T) => U): Result<U, never> {
    return new Ok(fn(this.value))
  }

  mapErr<F>(_fn: (error: never) => F): Result<T, F> {
    return this as Result<T, F>
  }

  andThen<U, E>(fn: (value: T) => Result<U, E>): Result<U, E> {
    return fn(this.value)
  }

  orElse<F>(_fn: (error: never) => Result<T, F>): Result<T, F> {
    return this as Result<T, F>
  }

  match<U>(matcher: { ok: (value: T) => U; err: (error: never) => U }): U {
    return matcher.ok(this.value)
  }

  unwrap(): T {
    return this.value
  }

  unwrapOr(_defaultValue: T): T {
    return this.value
  }

  unwrapErr(): never {
    throw new Error('Called unwrapErr on Ok')
  }

  isOk(): this is Ok<T> {
    return true
  }

  isErr(): this is Err<never> {
    return false
  }
}

// Err variant
export class Err<E> {
  readonly ok = false as const
  readonly err = true as const

  constructor(readonly error: E) {}

  map<U>(_fn: (value: never) => U): Result<U, E> {
    return this as Result<U, E>
  }

  mapErr<F>(fn: (error: E) => F): Result<never, F> {
    return new Err(fn(this.error))
  }

  andThen<U>(_fn: (value: never) => Result<U, E>): Result<U, E> {
    return this as Result<U, E>
  }

  orElse<T, F>(fn: (error: E) => Result<T, F>): Result<T, F> {
    return fn(this.error)
  }

  match<U>(matcher: { ok: (value: never) => U; err: (error: E) => U }): U {
    return matcher.err(this.error)
  }

  unwrap(): never {
    throw new Error(`Called unwrap on Err: ${this.error}`)
  }

  unwrapOr<T>(defaultValue: T): T {
    return defaultValue
  }

  unwrapErr(): E {
    return this.error
  }

  isOk(): this is Ok<never> {
    return false
  }

  isErr(): this is Err<E> {
    return true
  }
}

// Constructor functions
export const ok = <T>(value: T): Ok<T> => new Ok(value)
export const err = <E>(error: E): Err<E> => new Err(error)

// Type guards
export const isOk = <T, E>(result: Result<T, E>): result is Ok<T> => result.ok
export const isErr = <T, E>(result: Result<T, E>): result is Err<E> => result.err
