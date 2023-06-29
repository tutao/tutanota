import { TestError, TestResult } from "./TestResult.js"

export type AssertionDescriber = (description: string) => void
const noop = () => {}

class AssertionError extends Error {}

interface Class<T> {
	new (...args: any[]): T
}

function xor(a: boolean, b: boolean): boolean {
	return (a && !b) || (b && !a)
}

function isArguments(a: any) {
	if ("callee" in a) {
		for (let i in a) if (i === "callee") return false

		return true
	}
}

function testError(errorDescription: string | ErrorConstructor | Class<any>, e: unknown): boolean {
	if (e == null) return false
	// make ts shut up, we know what we are doing here, we are ✨ professionals ✨ here
	const erased = e as any
	return (
		(typeof errorDescription === "string" && typeof erased.message === "string" && erased.message === errorDescription) ||
		e instanceof (errorDescription as any)
	)
}

export class Assertion<T> {
	constructor(private readonly actual: T, private readonly testResult: TestResult) {}

	deepEquals(expected: T): AssertionDescriber {
		if (!deepEqual(this.actual, expected)) {
			return this.addError(`expected "${this.actual}" to be deep equal to "${expected}"`)
		}
		return noop
	}

	equals(expected: T | null | undefined): AssertionDescriber {
		if (this.actual !== expected) {
			return this.addError(`expected "${this.actual}" to be equal to "${expected}"`)
		}
		return noop
	}

	notDeepEquals(value: T): AssertionDescriber {
		if (deepEqual(this.actual, value)) {
			return this.addError(`expected to "${this.actual}" NOT deep equal to "${value}"`)
		}
		return noop
	}

	notEquals(value: T | null | undefined): AssertionDescriber {
		if (this.actual === value) {
			return this.addError(`expected "${this.actual}" to NOT be equal to "${value}"`)
		}
		return noop
	}

	satisfies(check: (value: T) => { pass: boolean; message: string }) {
		const result = check(this.actual)
		if (!result.pass) {
			return this.addError(`expected "${this.actual}" to satisfy condition: "${result.message}"`)
		}
		return noop
	}

	async asyncSatisfies(check: (value: T) => Promise<{ pass: boolean; message: string }>) {
		const result = await check(this.actual)
		if (!result.pass) {
			return this.addError(`expected "${this.actual}" to satisfy condition: "${result.message}"`)
		}
		return noop
	}

	notSatisfies(check: (value: T) => { pass: boolean; message: string }) {
		const result = check(this.actual)
		if (result.pass) {
			return this.addError(`expected "${this.actual}" to NOT satisfy condition: "${result.message}"`)
		}
		return noop
	}

	throws(errorDescription: string | ErrorConstructor | Class<any>): AssertionDescriber {
		if (typeof this.actual !== "function") {
			throw new Error(`Value for throws() call is not a function! ${errorDescription}`)
		}
		try {
			this.actual()
			return this.addError(`Expected to be thrown: ${this.errorName(errorDescription)} but nothing was thrown`)
		} catch (e) {
			if (testError(errorDescription, e)) {
				return noop
			} else {
				return this.addError(`Expected to be thrown: ${this.errorName(errorDescription)} but instead was thrown: ${this.errorName(e)}`)
			}
		}
	}

	async asyncThrows(errorDescription: string | ErrorConstructor | Class<any>): Promise<AssertionDescriber> {
		if (typeof this.actual !== "function") {
			throw new Error(`Value for throws() call is not a function! ${errorDescription}`)
		}
		try {
			await this.actual()
			return this.addError(`Expected to be thrown: ${this.errorName(errorDescription)} but nothing was thrown`)
		} catch (e) {
			if (testError(errorDescription, e)) {
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

type Promisable<T> = T | Promise<T>

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
			for (let i = 0; i < a.length; i++) {
				if (a[i] !== b[i]) return false
			}

			return true
		}

		if (a.valueOf() === b.valueOf()) return true
	}

	return false
}
