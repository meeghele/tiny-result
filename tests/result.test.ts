// Copyright (c) 2025 Michele Tavella <meeghele@proton.me>
// Licensed under the MIT License. See LICENSE file for details.

import { describe, expect, it } from 'bun:test'
import { type Result, err, isErr, isOk, ok } from '../src/index.js'

describe('Result - Core Functionality', () => {
  describe('Ok variant', () => {
    it('should create Ok result with value', () => {
      const result = ok(42)
      expect(result.ok).toBe(true)
      expect(result.err).toBe(false)
      expect(result.value).toBe(42)
    })

    it('should return true for isOk()', () => {
      const result = ok('test')
      expect(result.isOk()).toBe(true)
      expect(result.isErr()).toBe(false)
    })

    it('should map over value', () => {
      const result = ok(10).map(x => x * 2)
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toBe(20)
      }
    })

    it('should not apply mapErr', () => {
      const result = ok(10).mapErr(e => `Error: ${e}`)
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toBe(10)
      }
    })

    it('should chain with andThen', () => {
      const result = ok(10).andThen(x => ok(x * 2))
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toBe(20)
      }
    })

    it('should not apply orElse', () => {
      const result = ok(10).orElse(() => ok(999))
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toBe(10)
      }
    })

    it('should match with ok handler', () => {
      const result = ok(42).match({
        ok: (value: number): string => `Success: ${value}`,
        err: (): string => 'Failed',
      })
      expect(result).toBe('Success: 42')
    })

    it('should unwrap successfully', () => {
      const result = ok(42)
      expect(result.unwrap()).toBe(42)
    })

    it('should return value with unwrapOr', () => {
      const result = ok(42)
      expect(result.unwrapOr(0)).toBe(42)
    })

    it('should throw when calling unwrapErr', () => {
      const result = ok(42)
      expect(() => result.unwrapErr()).toThrow('Called unwrapErr on Ok')
    })
  })

  describe('Err variant', () => {
    it('should create Err result with error', () => {
      const result = err('failure')
      expect(result.ok).toBe(false)
      expect(result.err).toBe(true)
      expect(result.error).toBe('failure')
    })

    it('should return true for isErr()', () => {
      const result = err('test error')
      expect(result.isErr()).toBe(true)
      expect(result.isOk()).toBe(false)
    })

    it('should not apply map', () => {
      const result = err('failure').map(x => x * 2)
      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error).toBe('failure')
      }
    })

    it('should apply mapErr', () => {
      const result = err('failure').mapErr(e => `Error: ${e}`)
      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error).toBe('Error: failure')
      }
    })

    it('should not chain with andThen', () => {
      const result = err('failure').andThen(x => ok(x * 2))
      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error).toBe('failure')
      }
    })

    it('should apply orElse', () => {
      const result = err('failure').orElse(() => ok(42))
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toBe(42)
      }
    })

    it('should match with err handler', () => {
      const result = err('failure').match({
        ok: (): string => 'Success',
        err: (error: string): string => `Failed: ${error}`,
      })
      expect(result).toBe('Failed: failure')
    })

    it('should throw when calling unwrap', () => {
      const result = err('failure')
      expect(() => result.unwrap()).toThrow('Called unwrap on Err: failure')
    })

    it('should return default value with unwrapOr', () => {
      const result = err('failure')
      expect(result.unwrapOr(42)).toBe(42)
    })

    it('should return error with unwrapErr', () => {
      const result = err('failure')
      expect(result.unwrapErr()).toBe('failure')
    })
  })

  describe('Type guards', () => {
    it('should identify Ok results', () => {
      const result: Result<number, string> = ok(42)
      expect(isOk(result)).toBe(true)
      expect(isErr(result)).toBe(false)
    })

    it('should identify Err results', () => {
      const result: Result<number, string> = err('failure')
      expect(isErr(result)).toBe(true)
      expect(isOk(result)).toBe(false)
    })
  })

  describe('Chaining operations', () => {
    it('should chain multiple maps on Ok', () => {
      const result = ok(10)
        .map(x => x * 2)
        .map(x => x + 5)
        .map(x => x.toString())

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toBe('25')
      }
    })

    it('should chain andThen operations', () => {
      const divide = (a: number, b: number): Result<number, string> => {
        if (b === 0) return err('Division by zero')
        return ok(a / b)
      }

      const result = ok(20)
        .andThen(x => divide(x, 4))
        .andThen(x => divide(x, 2))

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toBe(2.5)
      }
    })

    it('should short-circuit on first error', () => {
      const divide = (a: number, b: number): Result<number, string> => {
        if (b === 0) return err('Division by zero')
        return ok(a / b)
      }

      const result = ok(20)
        .andThen(x => divide(x, 0)) // This will fail
        .andThen(x => divide(x, 2)) // This should not execute

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error).toBe('Division by zero')
      }
    })

    it('should recover from error with orElse', () => {
      const result = err('initial failure')
        .orElse(() => ok(42))
        .map(x => x * 2)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toBe(84)
      }
    })
  })
})
