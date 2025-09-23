// Copyright (c) 2025 Michele Tavella <meeghele@proton.me>
// Licensed under the MIT License. See LICENSE file for details.

import { describe, expect, it } from 'bun:test'
import { type Result, err, ok } from '../src/index.js'

describe('Type Safety and Inference', () => {
  describe('Type narrowing', () => {
    it('should narrow types with isOk()', () => {
      const result: Result<number, string> = ok(42)

      if (result.isOk()) {
        // TypeScript should know this is Ok<number>
        expect(typeof result.value).toBe('number')
        expect(result.value).toBe(42)

        // These should not exist on Ok type (TypeScript compilation check)
        // @ts-expect-error - error property should not exist on Ok
        expect(result.error).toBeUndefined()
      } else {
        // This branch should not execute
        expect(true).toBe(false)
      }
    })

    it('should narrow types with isErr()', () => {
      const result: Result<number, string> = err('failure')

      if (result.isErr()) {
        // TypeScript should know this is Err<string>
        expect(typeof result.error).toBe('string')
        expect(result.error).toBe('failure')

        // These should not exist on Err type (TypeScript compilation check)
        // @ts-expect-error - value property should not exist on Err
        expect(result.value).toBeUndefined()
      } else {
        // This branch should not execute
        expect(true).toBe(false)
      }
    })

    it('should work with complex types', () => {
      interface User {
        id: number
        name: string
        email: string
      }

      interface ApiError {
        code: number
        message: string
      }

      const user: User = { id: 1, name: 'John', email: 'john@example.com' }
      const error: ApiError = { code: 404, message: 'Not found' }

      const successResult: Result<User, ApiError> = ok(user)
      const errorResult: Result<User, ApiError> = err(error)

      if (successResult.isOk()) {
        expect(successResult.value.id).toBe(1)
        expect(successResult.value.name).toBe('John')
        expect(successResult.value.email).toBe('john@example.com')
      }

      if (errorResult.isErr()) {
        expect(errorResult.error.code).toBe(404)
        expect(errorResult.error.message).toBe('Not found')
      }
    })
  })

  describe('Generic type preservation', () => {
    it('should preserve types through map operations', () => {
      const result = ok(42)
        .map(x => x.toString()) // number -> string
        .map(s => s.length) // string -> number

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(typeof result.value).toBe('number')
        expect(result.value).toBe(2) // "42".length
      }
    })

    it('should preserve types through andThen operations', () => {
      const divide = (a: number, b: number): Result<number, string> => {
        if (b === 0) return err('Division by zero')
        return ok(a / b)
      }

      const convertToString = (n: number): Result<string, string> => {
        return ok(n.toString())
      }

      const result = ok(20)
        .andThen(x => divide(x, 4)) // number -> Result<number, string>
        .andThen(x => convertToString(x)) // number -> Result<string, string>

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(typeof result.value).toBe('string')
        expect(result.value).toBe('5')
      }
    })

    it('should handle error type transformations', () => {
      const result = err(404)
        .mapErr(code => ({ code, message: 'Not found' }))
        .mapErr(error => `Error ${error.code}: ${error.message}`)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(typeof result.error).toBe('string')
        expect(result.error).toBe('Error 404: Not found')
      }
    })
  })

  describe('Match exhaustiveness', () => {
    it('should require both ok and err handlers', () => {
      const result: Result<number, string> = ok(42)

      // This should compile fine
      const matched = result.match({
        ok: (value: number): string => `Success: ${value}`,
        err: (error: string): string => `Error: ${error}`,
      })

      expect(matched).toBe('Success: 42')

      // TypeScript should enforce that both handlers are provided
      // The following would cause a compilation error:
      /*
      result.match({
        ok: value => `Success: ${value}`
        // Missing err handler - TypeScript error
      });
      */
    })

    it('should preserve return types in match', () => {
      const result: Result<number, string> = ok(42)

      const stringResult = result.match({
        ok: (value: number): string => `Number: ${value}`,
        err: (error: string): string => `Error: ${error}`,
      })

      expect(typeof stringResult).toBe('string')

      const numberResult = result.match({
        ok: (value: number): number => value * 2,
        err: (): number => 0,
      })

      expect(typeof numberResult).toBe('number')
    })
  })

  describe('Never types', () => {
    it('should use never for impossible operations', () => {
      const okResult = ok(42)
      const errResult = err('failure')

      // These operations should work (return the original result)
      const okAfterMapErr = okResult.mapErr(() => 'new error')
      const errAfterMap = errResult.map(x => x * 2)

      expect(okAfterMapErr.isOk()).toBe(true)
      expect(errAfterMap.isErr()).toBe(true)

      // The type system should prevent impossible unwraps at compile time
      if (okResult.isOk()) {
        expect(() => okResult.unwrapErr()).toThrow()
      }

      if (errResult.isErr()) {
        expect(() => errResult.unwrap()).toThrow()
      }
    })
  })

  describe('Union types', () => {
    it('should handle union types correctly', () => {
      type StringOrNumber = string | number
      type ValidationError = 'required' | 'invalid' | 'too_long'

      const validateInput = (input: unknown): Result<StringOrNumber, ValidationError> => {
        if (input === null || input === undefined) {
          return err('required')
        }

        if (typeof input !== 'string' && typeof input !== 'number') {
          return err('invalid')
        }

        if (typeof input === 'string' && input.length > 100) {
          return err('too_long')
        }

        return ok(input)
      }

      const validString = validateInput('hello')
      const validNumber = validateInput(42)
      const invalid = validateInput({})
      const required = validateInput(null)

      expect(validString.isOk()).toBe(true)
      expect(validNumber.isOk()).toBe(true)
      expect(invalid.isErr()).toBe(true)
      expect(required.isErr()).toBe(true)

      if (validString.isOk()) {
        expect(typeof validString.value === 'string' || typeof validString.value === 'number').toBe(
          true,
        )
      }

      if (invalid.isErr()) {
        expect(['required', 'invalid', 'too_long']).toContain(invalid.error)
      }
    })
  })

  describe('Async type preservation', () => {
    it('should maintain types through async operations', async () => {
      const asyncOperation = async (value: number): Promise<Result<string, Error>> => {
        await new Promise(resolve => setTimeout(resolve, 1))
        return ok(value.toString())
      }

      const result = await asyncOperation(42)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(typeof result.value).toBe('string')
        expect(result.value).toBe('42')
      }
    })
  })

  describe('Nested Results', () => {
    it('should handle nested Result types', () => {
      const parseAndValidate = (input: string): Result<Result<number, string>, string> => {
        try {
          const parsed = JSON.parse(input)
          if (typeof parsed.value === 'number') {
            return ok(ok(parsed.value))
          }
          return ok(err('Not a number'))
        } catch {
          return err('Invalid JSON')
        }
      }

      const validInput = parseAndValidate('{"value": 42}')
      const invalidValue = parseAndValidate('{"value": "not a number"}')
      const invalidJson = parseAndValidate('invalid json')

      expect(validInput.isOk()).toBe(true)
      if (validInput.isOk() && validInput.value.isOk()) {
        expect(validInput.value.value).toBe(42)
      }

      expect(invalidValue.isOk()).toBe(true)
      if (invalidValue.isOk() && invalidValue.value.isErr()) {
        expect(invalidValue.value.error).toBe('Not a number')
      }

      expect(invalidJson.isErr()).toBe(true)
      if (invalidJson.isErr()) {
        expect(invalidJson.error).toBe('Invalid JSON')
      }
    })
  })
})
