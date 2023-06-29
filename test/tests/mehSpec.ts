import { deepEqual, promiseMap } from "@tutao/tutanota-utils"

type AssertionDescriber = (description: string) => void

const ansiSequences = Object.freeze({
	redFg: "\x1b[31m",
	greenBg: "\x1b[42m",
	redBg: "\x1b[41m",
	yellowBg: "\x1b[43m",
	reset: "\x1b[0m",
	bold: "\x1b[0;1m",
	faint: "\x1b[0;2m",
})

function fancy(text: string, code: Values<typeof ansiSequences>) {
	if (typeof process !== "undefined" && process.stdout.isTTY) {
		return `${code}${text}${ansiSequences.reset}`
	} else {
		return text
	}
}

class MehSpecImpl {
	private static readonly DEFAULT_TIMEOUT_MS = 200
	private taskTree: Spec = { name: "MEH", specs: [], tests: [], before: [], after: [], beforeEach: [], afterEach: [] }
	private currentSpec = this.taskTree
	currentTest: TestResult | null = null

	spec(name: string, definition: () => void) {
		const previousCurrentSpec = this.currentSpec
		const newSpec = (this.currentSpec = {
			name,
			tests: [],
			specs: [],
			before: [],
			after: [],
			beforeEach: [],
			afterEach: [],
		})
		Object.defineProperty(definition, "name", { value: name, writable: false })
		definition()
		this.currentSpec = previousCurrentSpec
		this.currentSpec.specs.push(newSpec)
	}

	test(name: string, task: () => Promise<void> | void) {
		Object.defineProperty(task, "name", { value: name, writable: false })
		this.currentSpec.tests.push({ name, task })
	}

	before(task: () => Promise<void> | void) {
		this.currentSpec.before.push(task)
	}

	after(task: () => Promise<void> | void) {
		this.currentSpec.after.push(task)
	}

	beforeEach(task: () => Promise<void> | void) {
		this.currentSpec.beforeEach.push(task)
	}

	afterEach(task: () => Promise<void> | void) {
		this.currentSpec.afterEach.push(task)
	}

	async run({ filter }: { filter?: string } = {}): Promise<RunResult> {
		const runResult: RunResult = { passedTests: [], failingTests: [] }

		function processSpecResult(spec: SpecResult, path: SpecResult[]) {
			const pathNames = path.map((s) => s.name).concat(spec.name)
			for (const test of spec.testResults) {
				if (test.errors.length) {
					runResult.failingTests.push({ path: pathNames, result: test })
				} else {
					runResult.passedTests.push({ path: pathNames, result: test })
				}
			}

			for (const subspec of spec.specResults) {
				processSpecResult(subspec, [...path, spec])
			}
		}

		const topSpecResult = await this.runSpec(this.currentSpec, [], filter ?? "")
		processSpecResult(topSpecResult, [])
		return runResult
	}

	private async runSpec(spec: Spec, path: Spec[], filter: string): Promise<SpecResult> {
		const newPath = [...path, spec]
		const newPathSerialized = newPath.map((s) => s.name).join(" > ")

		console.log(fancy("SPEC", ansiSequences.greenBg), newPathSerialized)

		for (const before of spec.before) {
			await before()
		}

		const specMatches = filter === "" || spec.name.includes(filter)

		const result = {
			name: spec.name,
			specResults: await promiseMap(spec.specs, (nestedSpec) => this.runSpec(nestedSpec, newPath, specMatches ? "" : filter)),
			testResults: await promiseMap(spec.tests, async (test) => {
				if (specMatches || test.name.includes(filter)) {
					const allBeforeEach = [...path.flatMap((s) => s.beforeEach), ...spec.beforeEach]
					for (const beforeEach of allBeforeEach) {
						await beforeEach()
					}
					console.log("  ", fancy("TEST", ansiSequences.greenBg), test.name)

					const testResult = await this.runTest(test)

					const allAfterEach = [...path.flatMap((s) => s.afterEach), ...spec.afterEach]
					for (const afterEach of allAfterEach) {
						await afterEach()
					}

					return testResult
				} else {
					console.log("  ", fancy("SKIP", ansiSequences.yellowBg), fancy(test.name, ansiSequences.faint))
					return { name: test.name, errors: [], timeout: null, skipped: true }
				}
			}),
		}

		for (const after of spec.after) {
			await after()
		}

		return result
	}

	printReport(result: RunResult) {
		console.log(
			`

${fancy("TEST FINISHED", ansiSequences.bold)}

passing:`,
			result.passedTests.length,
			"failing: ",
			result.failingTests.length,
			"\n",
		)

		for (const test of result.failingTests) {
			console.error(fancy("FAIL", ansiSequences.redBg), test.path.join(" > "), "|", test.result.name)

			for (const error of test.result.errors) {
				if (error.userMessage) {
					console.error(fancy(error.userMessage, ansiSequences.redFg))
				}

				console.error(error.error)
				console.log()
			}
		}
	}

	async runTest(test: Test): Promise<TestResult> {
		const currentTestResult: TestResult = (this.currentTest = { name: test.name, errors: [], timeout: null, skipped: false })

		let testResolved = false

		async function startTimeoutTask() {
			await new Promise((resolve) => {
				if (currentTestResult.timeout == null) throw new Error("timeout not set while running timeout task!")
				setTimeout(resolve, currentTestResult.timeout)
			})
			if (!testResolved) {
				throw new Error("timed out!")
			}
		}

		async function runTask() {
			try {
				const p = test.task()
				currentTestResult.timeout = currentTestResult.timeout ?? MehSpecImpl.DEFAULT_TIMEOUT_MS
				await p
			} finally {
				testResolved = true
			}
		}

		try {
			// run task and timeout in parallel, if timeout counter comes first, we are timeout out
			// the test task should set the timeout immediately or we will not pick it up.
			await Promise.race([runTask(), startTimeoutTask()])
		} catch (e) {
			currentTestResult.errors.push({ error: e, userMessage: null })
		} finally {
			this.currentTest = null
		}
		return currentTestResult
	}

	timeout(ms: number) {
		if (this.currentTest === null) {
			throw new Error("timeout() call outside of test")
		} else if (this.currentTest.timeout != null) {
			throw new Error(`timeout is already set! ${this.currentTest}`)
		} else {
			this.currentTest.timeout = ms
		}
	}
}

interface TestError {
	error: Error
	userMessage: string | null
}

interface TestResult {
	name: string
	skipped: boolean
	errors: TestError[]
	timeout: number | null
}

export interface RunResult {
	passedTests: {
		path: string[]
		result: TestResult
	}[]

	failingTests: {
		path: string[]
		result: TestResult
	}[]
}

interface SpecResult {
	name: string
	testResults: TestResult[]
	specResults: SpecResult[]
}

interface Test {
	name: string

	task(): Promise<void> | void
}

interface Spec {
	name: string
	tests: Test[]
	specs: Spec[]
	before: (() => void)[]
	after: (() => void)[]
	beforeEach: (() => void)[]
	afterEach: (() => void)[]
}

const noop = () => {}

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

	notSatisfies(check: (value: T) => { pass: boolean; message: string }) {
		const result = check(this.actual)
		if (result.pass) {
			return this.addError(`expected "${this.actual}" to NOT satisfy condition: "${result.message}"`)
		}
		return noop
	}

	throws(error: string | ErrorConstructor | Class<any>): AssertionDescriber {
		if (typeof this.actual !== "function") {
			throw new Error(`Value for throws() call is not a function! ${error}`)
		}
		try {
			this.actual()
			return this.addError(`Expected to be thrown: ${this.errorName(error)} but nothing was thrown`)
		} catch (e) {
			if ((typeof error === "string" && e.message === error) || e instanceof (error as any)) {
				return noop
			} else {
				return this.addError(`Expected to be thrown: ${this.errorName(error)} but instead was thrown: ${this.errorName(e)}`)
			}
		}
	}

	async asyncThrows(error: string | ErrorConstructor | Class<any>): Promise<AssertionDescriber> {
		if (typeof this.actual !== "function") {
			throw new Error(`Value for throws() call is not a function! ${error}`)
		}
		try {
			await this.actual()
			return this.addError(`Expected to be thrown: ${this.errorName(error)} but nothing was thrown`)
		} catch (e) {
			if ((typeof error === "string" && e.message === error) || e instanceof (error as any)) {
				return noop
			} else {
				return this.addError(`Expected to be thrown: ${this.errorName(error)} but instead was thrown: ${this.errorName(e)}`)
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

export type CallableMehSpec = MehSpecImpl & {
	(name: string, definition: () => Promise<void> | void): void

	<T>(actual: T): Assertion<T>
}

const mehSpec = new MehSpecImpl()

function o<T>(item: T | string, definition?: () => Promise<void> | void) {
	// we need to do these tricks otherwise "this" reference will be lost
	const oo = o as unknown as MehSpecImpl
	if (typeof definition === "undefined") {
		if (oo.currentTest == null) {
			throw new Error("Assertion outside of running test!")
		}
		return new Assertion(item, oo.currentTest)
	} else {
		oo.test(item as string, definition)
	}
}

class AssertionError extends Error {}

Object.assign(o, mehSpec)
Object.setPrototypeOf(o, Object.getPrototypeOf(mehSpec))

export default o as CallableMehSpec
