import { TestError, TestResult } from "./TestResult.js"
import { deepEqual } from "../../src/platform-kit/utils"

export type AssertionDescriber = (description: string) => void

let asString: (thing: unknown) => string
let differ: (actual: unknown, expected: unknown) => string | null
if (typeof process !== "undefined") {
	const { inspect } = await import("node:util")
	asString = function (thing) {
		return inspect(thing, { depth: 5 })
	}
	const NodeAssertionError = (await import("node:assert")).AssertionError
	differ = (actual, expected) =>
		new NodeAssertionError({
			actual: actual,
			expected: expected,
			operator: "deepStrictEqual",
		}).message
} else {
	asString = function (thing) {
		return JSON.stringify(thing)
	}
	differ = () => null
}

/**
 * A started assertion.
 */
export class Assertion<T> {
	constructor(
		private readonly actual: T,
		private readonly testResult: TestResult,
	) {}

	/**
	 * Verify that two items are deeply equal.
	 * For arrays length and each element must be deeply equal.
	 * For objects the key sets must match and each property must be deeply equal.
	 */
	deepEquals(expected: T): AssertionDescriber {
		if (!deepEqual(this.actual, expected)) {
			const left = asString(this.actual)
			const right = asString(expected)
			const diffMsg = differ(this.actual, expected) ?? undefined

			return this.addError(`expected "${left}" to be deep equal to "${right}"`, diffMsg)
		}
		return noop
	}

	/**
	 * Verify that two items are referentially equal.
	 */
	equals(expected: T | null | undefined): AssertionDescriber {
		if (this.actual !== expected) {
			const left = asString(this.actual)
			const right = asString(expected)
			const diffMsg = differ(this.actual, expected) ?? undefined
			return this.addError(`expected "${left}" to be equal to "${right}"`, diffMsg)
		}
		return noop
	}

	/** {@see deepEquals} */
	notDeepEquals(value: T): AssertionDescriber {
		if (deepEqual(this.actual, value)) {
			return this.addError(`expected to "${asString(this.actual)}" NOT deep equal to "${asString(value)}"`)
		}
		return noop
	}

	/** {@see equals} */
	notEquals(value: T | null | undefined): AssertionDescriber {
		if (this.actual === value) {
			return this.addError(`expected "${asString(this.actual)}" to NOT be equal to "${asString(value)}"`)
		}
		return noop
	}

	/**
	 * Verify that the value satisfies the {@param check}.
	 */
	satisfies(check: (value: T) => { pass: false; message: string } | { pass: true }): AssertionDescriber {
		const result = check(this.actual)
		if (!result.pass) {
			return this.addError(`expected
${this.actual}
to satisfy condition:
${result.message}
`)
		}
		return noop
	}

	/**
	 * Same as {@link satisfies} but the check function is async.
	 */
	async asyncSatisfies(
		check: (value: T) => Promise<{
			pass: boolean
			message: string
		}>,
	): Promise<AssertionDescriber> {
		const result = await check(this.actual)
		if (!result.pass) {
			return this.addError(`expected
${this.actual}
to satisfy condition:
${result.message}
`)
		}
		return noop
	}

	/** {@see satisfies} */
	notSatisfies(check: (value: T) => { pass: boolean; message: string }): AssertionDescriber {
		const result = check(this.actual)
		if (result.pass) {
			return this.addError(`expected
${asString(this.actual)}
to NOT satisfy condition:
${result.message}`)
		}
		return noop
	}

	/**
	 * Verify that the value returned by the subject function matches the description.
	 * In case of a string description the message is matched, otherwise the error is checked by instanceof.
	 */
	throws(errorDescription: string | ErrorConstructor | Class<any>): AssertionDescriber {
		if (typeof this.actual !== "function") {
			throw new Error(`Value for throws() call is not a function! ${errorDescription}`)
		}
		try {
			this.actual()
			return this.addError(`Expected to be thrown: ${this.errorName(errorDescription)} but nothing was thrown`)
		} catch (e) {
			if (errorMatchesDescription(e, errorDescription)) {
				return noop
			} else {
				return this.addError(`Expected to be thrown: ${this.errorName(errorDescription)} but instead was thrown: ${this.errorName(e)}`)
			}
		}
	}

	/**
	 * Verity that the value returned by the subject function matches the description.
	 * In case of a string description the message is matched, otherwise the error is checked by instanceof.
	 */
	async asyncThrows(errorDescription: string | ErrorConstructor | Class<any>): Promise<AssertionDescriber> {
		if (typeof this.actual !== "function") {
			throw new Error(`Value for throws() call is not a function! ${errorDescription}`)
		}
		try {
			await this.actual()
			return this.addError(`Expected to be thrown: ${this.errorName(errorDescription)} but nothing was thrown`)
		} catch (e) {
			if (errorMatchesDescription(e, errorDescription)) {
				return noop
			} else {
				return this.addError(`Expected to be thrown: ${this.errorName(errorDescription)} but instead was thrown: ${this.errorName(e)}`)
			}
		}
	}

	private addError(assertionDescription: string, diff?: string) {
		const testError: TestError = { error: new AssertionError(assertionDescription), userMessage: null, diff }
		this.testResult.errors.push(testError)
		return (userMessage: string) => {
			testError.userMessage = userMessage
		}
	}

	private errorName(error: unknown): string {
		return typeof error === "string" ? error : typeof error === "function" ? error.name : String(error)
	}
}

class AssertionError extends Error {}

interface Class<T> {
	new (...args: any[]): T
}

function xor(a: boolean, b: boolean): boolean {
	return (a && !b) || (b && !a)
}

function isArguments(a: any) {
	if ("callee" in a) {
		for (const i in a) if (i === "callee") return false

		return true
	}
}

function errorMatchesDescription(e: unknown, errorDescription: string | ErrorConstructor | Class<any>): boolean {
	if (e == null) return false
	// make ts shut up, we know what we are doing here, we are ✨ professionals ✨ here
	const erased = e as any
	return (
		(typeof errorDescription === "string" && typeof erased.message === "string" && erased.message === errorDescription) ||
		e instanceof (errorDescription as any)
	)
}

function noop() {}
