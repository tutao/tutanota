import { TestError, TestResult } from "./TestResult.js"

export type AssertionDescriber = (description: string) => void

var asString: (thing: unknown) => string
if (typeof process !== "undefined") {
	const { inspect } = await import("node:util")
	asString = function (thing) {
		return inspect(thing, { depth: 5 })
	}
} else {
	asString = function (thing) {
		return JSON.stringify(thing)
	}
}

/**
 * A started assertion.
 */
export class Assertion<T> {
	constructor(private readonly actual: T, private readonly testResult: TestResult) {}

	/**
	 * Verify that two items are deeply equal.
	 * For arrays length and each element must be deeply equal.
	 * For objects the key sets must match and each property must be deeply equal.
	 */
	deepEquals(expected: T): AssertionDescriber {
		if (!deepEqual(this.actual, expected)) {
			return this.addError(`expected "${asString(this.actual)}" to be deep equal to "${asString(expected)}"`)
		}
		return noop
	}

	/**
	 * Verify that two items are referentially equal.
	 */
	equals(expected: T | null | undefined): AssertionDescriber {
		if (this.actual !== expected) {
			return this.addError(`expected "${asString(this.actual)}" to be equal to "${asString(expected)}"`)
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
			return this.addError(`expected "${asString(this.actual)}" to satisfy condition: "${result.message}"`)
		}
		return noop
	}

	/**
	 * Same as {@link satisfies} but the check function is async.
	 */
	async asyncSatisfies(check: (value: T) => Promise<{ pass: boolean; message: string }>): Promise<AssertionDescriber> {
		const result = await check(this.actual)
		if (!result.pass) {
			return this.addError(`expected "${asString(this.actual)}" to satisfy condition: "${result.message}"`)
		}
		return noop
	}

	/** {@see satisfies} */
	notSatisfies(check: (value: T) => { pass: boolean; message: string }): AssertionDescriber {
		const result = check(this.actual)
		if (result.pass) {
			return this.addError(`expected "${asString(this.actual)}" to NOT satisfy condition: "${result.message}"`)
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

	private addError(assertionDescription: string) {
		const testError: TestError = { error: new AssertionError(assertionDescription), userMessage: null }
		this.testResult.errors.push(testError)
		return (userMessage: string) => {
			testError.userMessage = userMessage
		}
	}

	private errorName(error: unknown): string {
		return typeof error === "string" ? error : typeof error === "function" ? error.name : String(error)
	}
}

/**
 * modified deepEquals from ospec is only needed as long as we use custom classes (TypeRef) and Date is not properly handled
 */
function deepEqual(a: any, b: any): boolean {
	if (a === b) return true
	if (xor(a === null, b === null) || xor(a === undefined, b === undefined)) return false

	if (typeof a === "object" && typeof b === "object") {
		const aIsArgs = isArguments(a),
			bIsArgs = isArguments(b)

		if (a.length === b.length && ((a instanceof Array && b instanceof Array) || (aIsArgs && bIsArgs))) {
			const aKeys = Object.getOwnPropertyNames(a),
				bKeys = Object.getOwnPropertyNames(b)
			if (aKeys.length !== bKeys.length) return false

			for (let i = 0; i < aKeys.length; i++) {
				if (!Object.hasOwn(b, aKeys[i]) || !deepEqual(a[aKeys[i]], b[aKeys[i]])) return false
			}

			return true
		}

		if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime()

		if (a instanceof Uint8Array && b instanceof Uint8Array) {
			if (a.length != b.length) return false
			for (let i = 0; i < a.length; i++) {
				if (a[i] !== b[i]) return false
			}

			return true
		}

		if (a instanceof Object && b instanceof Object && !aIsArgs && !bIsArgs) {
			for (let i in a) {
				if (!(i in b) || !deepEqual(a[i], b[i])) return false
			}

			for (let i in b) {
				if (!(i in a)) return false
			}

			return true
		}

		// @ts-ignore: we would need to include all @types/node for this to work or import it explicitly. Should probably be rewritten for all typed arrays.
		if (typeof Buffer === "function" && a instanceof Buffer && b instanceof Buffer) {
			if (a.length != b.length) return false
			for (let i = 0; i < a.length; i++) {
				if (a[i] !== b[i]) return false
			}

			return true
		}

		if (a.valueOf() === b.valueOf()) return true
	}

	return false
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
