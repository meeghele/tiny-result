// Copyright (c) 2025 Michele Tavella <meeghele@proton.me>
// Licensed under the MIT License. See LICENSE file for details.

import { describe, expect, it } from 'bun:test'
import { all, err, fromPromise, ok, partition, tryCatch } from '../src/index.js'

describe('Utility Functions', () => {
  describe('tryCatch', () => {
    it('should wrap successful function calls', () => {
      const result = tryCatch(() => JSON.parse('{"test": true}'))
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toEqual({ test: true })
      }
    })

    it('should catch thrown errors', () => {
      const result = tryCatch(() => JSON.parse('invalid json'))
      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(SyntaxError)
      }
    })

    it('should apply error mapping function', () => {
      const result = tryCatch(
        () => JSON.parse('invalid json'),
        error => `Parse error: ${error.message}`,
      )
      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error).toContain('Parse error:')
      }
    })

    it('should handle functions that return values', () => {
      const result = tryCatch(() => 42)
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toBe(42)
      }
    })

    it('should handle custom error types', () => {
      class CustomError extends Error {
        constructor(message: string) {
          super(message)
          this.name = 'CustomError'
        }
      }

      const result = tryCatch(
        () => {
          throw new CustomError('custom failure')
        },
        error => (error instanceof CustomError ? error.message : 'Unknown error'),
      )

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error).toBe('custom failure')
      }
    })

    it('should handle division by zero', () => {
      const safeDivide = (a: number, b: number): ReturnType<typeof tryCatch<number, unknown>> =>
        tryCatch(() => {
          if (b === 0) throw new Error('Division by zero')
          return a / b
        })

      const success = safeDivide(10, 2)
      expect(success.isOk()).toBe(true)
      if (success.isOk()) {
        expect(success.value).toBe(5)
      }

      const failure = safeDivide(10, 0)
      expect(failure.isErr()).toBe(true)
      if (failure.isErr()) {
        expect(failure.error).toBeInstanceOf(Error)
      }
    })
  })

  describe('fromPromise', () => {
    it('should wrap successful promises', async () => {
      const result = await fromPromise(Promise.resolve(42))
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toBe(42)
      }
    })

    it('should catch rejected promises', async () => {
      const result = await fromPromise(Promise.reject(new Error('failure')))
      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(Error)
      }
    })

    it('should apply error mapping to rejected promises', async () => {
      const result = await fromPromise(
        Promise.reject(new Error('network error')),
        error => `Request failed: ${error.message}`,
      )
      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error).toBe('Request failed: network error')
      }
    })

    it('should handle async functions', async () => {
      const asyncOperation = async (): Promise<string> => {
        await new Promise(resolve => setTimeout(resolve, 1))
        return 'success'
      }

      const result = await fromPromise(asyncOperation())
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toBe('success')
      }
    })

    it('should handle async functions that throw', async () => {
      const asyncOperation = async (): Promise<never> => {
        await new Promise(resolve => setTimeout(resolve, 1))
        throw new Error('async failure')
      }

      const result = await fromPromise(asyncOperation())
      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(Error)
      }
    })

    it('should work with fetch-like operations', async () => {
      // Mock fetch that returns a promise
      const mockFetch = (url: string): Promise<{ json: () => Promise<{ data: string }> }> => {
        if (url === '/success') {
          return Promise.resolve({
            json: (): Promise<{ data: string }> => Promise.resolve({ data: 'test' }),
          })
        }
        return Promise.reject(new Error('Network error'))
      }

      // Success case
      const successResult = await fromPromise(
        mockFetch('/success').then(r => r.json()),
        error => `Fetch failed: ${error.message}`,
      )
      expect(successResult.isOk()).toBe(true)

      // Failure case
      const failureResult = await fromPromise(
        mockFetch('/error').then(r => r.json()),
        error => `Fetch failed: ${error.message}`,
      )
      expect(failureResult.isErr()).toBe(true)
      if (failureResult.isErr()) {
        expect(failureResult.error).toBe('Fetch failed: Network error')
      }
    })

    it('should preserve promise resolution types', async () => {
      interface User {
        id: number
        name: string
      }

      const user: User = { id: 1, name: 'John' }
      const result = await fromPromise(Promise.resolve(user))

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        // TypeScript should infer the correct type here
        expect(result.value.id).toBe(1)
        expect(result.value.name).toBe('John')
      }
    })

    it('should handle timeout scenarios', async () => {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), 10)
      })

      const result = await fromPromise(
        timeoutPromise,
        error => `Operation timed out: ${error.message}`,
      )

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error).toBe('Operation timed out: Timeout')
      }
    })
  })

  describe('all', () => {
    it('should return ok with all values when all results are ok', () => {
      const results = [ok(1), ok(2), ok(3)]
      const result = all(results)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toEqual([1, 2, 3])
      }
    })

    it('should return the first error when any result is err', () => {
      const results = [ok(1), err('error1'), ok(3), err('error2')]
      const result = all(results)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error).toBe('error1')
      }
    })

    it('should handle empty array', () => {
      const results = []
      const result = all(results)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toEqual([])
      }
    })

    it('should handle single ok result', () => {
      const results = [ok(42)]
      const result = all(results)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toEqual([42])
      }
    })

    it('should handle single err result', () => {
      const results = [err('failure')]
      const result = all(results)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error).toBe('failure')
      }
    })

    it('should work with different value types', () => {
      const results = [ok('hello'), ok('world')]
      const result = all(results)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toEqual(['hello', 'world'])
      }
    })

    it('should preserve order of values', () => {
      const results = [ok(3), ok(1), ok(4), ok(1), ok(5)]
      const result = all(results)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toEqual([3, 1, 4, 1, 5])
      }
    })

    it('should work with complex types', () => {
      interface User {
        id: number
        name: string
      }

      const results = [ok({ id: 1, name: 'Alice' }), ok({ id: 2, name: 'Bob' })]
      const result = all(results)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toEqual([
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
        ])
      }
    })

    it('should short-circuit on first error', () => {
      const results = [ok(1), err('first error'), ok(3)]
      const result = all(results)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error).toBe('first error')
      }
    })
  })

  describe('partition', () => {
    it('should separate ok and err results', () => {
      const results = [ok(1), err('error1'), ok(2), err('error2'), ok(3)]
      const { oks, errs } = partition(results)

      expect(oks).toEqual([1, 2, 3])
      expect(errs).toEqual(['error1', 'error2'])
    })

    it('should handle all ok results', () => {
      const results = [ok(1), ok(2), ok(3)]
      const { oks, errs } = partition(results)

      expect(oks).toEqual([1, 2, 3])
      expect(errs).toEqual([])
    })

    it('should handle all err results', () => {
      const results = [err('error1'), err('error2'), err('error3')]
      const { oks, errs } = partition(results)

      expect(oks).toEqual([])
      expect(errs).toEqual(['error1', 'error2', 'error3'])
    })

    it('should handle empty array', () => {
      const results = []
      const { oks, errs } = partition(results)

      expect(oks).toEqual([])
      expect(errs).toEqual([])
    })

    it('should handle single ok result', () => {
      const results = [ok(42)]
      const { oks, errs } = partition(results)

      expect(oks).toEqual([42])
      expect(errs).toEqual([])
    })

    it('should handle single err result', () => {
      const results = [err('failure')]
      const { oks, errs } = partition(results)

      expect(oks).toEqual([])
      expect(errs).toEqual(['failure'])
    })

    it('should preserve order of values', () => {
      const results = [ok(3), err('a'), ok(1), err('b'), ok(4), ok(1), err('c'), ok(5)]
      const { oks, errs } = partition(results)

      expect(oks).toEqual([3, 1, 4, 1, 5])
      expect(errs).toEqual(['a', 'b', 'c'])
    })

    it('should work with complex types', () => {
      interface User {
        id: number
        name: string
      }

      const results = [
        ok({ id: 1, name: 'Alice' }),
        err('User not found'),
        ok({ id: 2, name: 'Bob' }),
        err('Invalid user'),
      ]
      const { oks, errs } = partition(results)

      expect(oks).toEqual([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ])
      expect(errs).toEqual(['User not found', 'Invalid user'])
    })

    it('should work with different value and error types', () => {
      const results = [ok('hello'), err(404), ok('world'), err(500)]
      const { oks, errs } = partition(results)

      expect(oks).toEqual(['hello', 'world'])
      expect(errs).toEqual([404, 500])
    })
  })

  describe('Integration tests', () => {
    it('should combine tryCatch and fromPromise', async () => {
      const processData = async (
        jsonString: string,
      ): Promise<ReturnType<typeof fromPromise<number, string>>> => {
        // First parse JSON synchronously
        const parsed = tryCatch(() => JSON.parse(jsonString))
        if (parsed.isErr()) {
          return parsed
        }

        // Then make an async operation
        const asyncResult = await fromPromise(
          Promise.resolve(parsed.value.id * 2),
          error => `Async operation failed: ${error}`,
        )

        return asyncResult
      }

      // Success case
      const success = await processData('{"id": 21}')
      expect(success.isOk()).toBe(true)
      if (success.isOk()) {
        expect(success.value).toBe(42)
      }

      // Parse failure
      const parseFailure = await processData('invalid json')
      expect(parseFailure.isErr()).toBe(true)
    })

    it('should work in real-world scenarios', async () => {
      // Simulate a complete user registration flow
      const validateEmail = (email: string): ReturnType<typeof tryCatch<string, unknown>> =>
        tryCatch(() => {
          if (!email.includes('@')) throw new Error('Invalid email')
          return email.toLowerCase()
        })

      const checkEmailAvailability = async (
        email: string,
      ): Promise<ReturnType<typeof fromPromise<boolean, string>>> => {
        // Simulate async database check
        return fromPromise(
          new Promise((resolve, reject) => {
            setTimeout(() => {
              if (email === 'taken@example.com') {
                reject(new Error('Email already exists'))
              } else {
                resolve(true)
              }
            }, 1)
          }),
          error => `Database error: ${error.message}`,
        )
      }

      const registerUser = async (
        email: string,
      ): Promise<
        ReturnType<typeof ok<string>> | ReturnType<typeof fromPromise<boolean, string>>
      > => {
        const validatedEmail = validateEmail(email)
        if (validatedEmail.isErr()) {
          return validatedEmail
        }

        const available = await checkEmailAvailability(validatedEmail.value)
        if (available.isErr()) {
          return available
        }

        return ok(`User registered: ${validatedEmail.value}`)
      }

      // Test successful registration
      const success = await registerUser('new@example.com')
      expect(success.isOk()).toBe(true)

      // Test validation failure
      const validationError = await registerUser('invalid-email')
      expect(validationError.isErr()).toBe(true)

      // Test availability failure
      const availabilityError = await registerUser('taken@example.com')
      expect(availabilityError.isErr()).toBe(true)
    })
  })
})
