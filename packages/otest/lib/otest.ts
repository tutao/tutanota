import { ansiSequences, fancy } from "./fancy.js"
import { Assertion } from "./Assertion.js"
import { RunResult, TestResult } from "./TestResult.js"

class OTest {
	private static readonly DEFAULT_TIMEOUT_MS = 200
	private taskTree: Spec = { name: "O", specs: [], tests: [], before: [], after: [], beforeEach: [], afterEach: [] }
	private currentSpec = this.taskTree
	private currentTest: TestResult | null = null

	/**
	 * Define a group of tests.
	 * Spec may contain:
	 *  * tests
	 *  * before/beforeEach/after/afterEach clauses
	 *  * other specs
	 *
	 *  Example:
	 *  ```ts
	 *  o.spec("testableFunction", () => {
	 *      o.test("it works", () => {
	 *          o.check(testableFunction(1)).equals(2)
	 *      })
	 *  })
	 *  ```
	 */
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
		const definitionResult = definition()
		if (typeof definitionResult !== "undefined") {
			throw new Error(`Invalid spec definition for "${previousCurrentSpec.name} > ${name}"! Is it async by any chance?`)
		}
		this.currentSpec = previousCurrentSpec
		this.currentSpec.specs.push(newSpec)
	}

	/**
	 * Define a test.
	 * Tests may be async in which case they should either await or return a promise.
	 * Timeouts apply and can be changed with {@link timeout}.
	 */
	test(name: string, definition: (() => Promise<void>) | (() => void)) {
		Object.defineProperty(definition, "name", { value: name, writable: false })
		this.currentSpec.tests.push({ name, task: definition })
	}

	/**
	 * Start an assertion.
	 */
	check<T>(value: T): Assertion<T> {
		if (this.currentTest == null) {
			throw new Error("Assertion outside of running test!")
		}
		return new Assertion(value, this.currentTest)
	}

	/**
	 * Define a task to be executed before any test in the spec (once per spec).
	 */
	before(task: () => Promise<void> | void) {
		this.currentSpec.before.push(task)
	}

	/**
	 * Define a task to be executed after all test in the spec (once per spec).
	 */
	after(task: () => Promise<void> | void) {
		this.currentSpec.after.push(task)
	}

	/**
	 * Define a task to be executed before each test in the spec (once per test).
	 * Also applies to tests in nested specs.
	 */
	beforeEach(task: () => Promise<void> | void) {
		this.currentSpec.beforeEach.push(task)
	}

	/**
	 * Define a task to be executed after each test in the spec (once per test).
	 * Also applies to tests in nested specs.
	 */
	afterEach(task: () => Promise<void> | void) {
		this.currentSpec.afterEach.push(task)
	}

	/**
	 * Set a timeout (in ms) for the currently running test.
	 */
	timeout(ms: number) {
		if (this.currentTest === null) {
			throw new Error("timeout() call outside of test")
		} else if (this.currentTest.timeout != null) {
			throw new Error(`timeout is already set! ${this.currentTest}`)
		} else {
			this.currentTest.timeout = ms
		}
	}

	/**
	 * Run the tests that were previously defined.
	 * @param {string} filter: only run tests that match the filter string in either spec name or a test name.
	 */
	async run({ filter }: { filter?: string } = {}): Promise<RunResult> {
		const runResult: RunResult = { passedTests: [], failingTests: [], skippedTests: [] }

		function processSpecResult(spec: SpecResult, path: SpecResult[]) {
			const pathNames = path.map((s) => s.name).concat(spec.name)
			for (const test of spec.testResults) {
				if (test.errors.length) {
					runResult.failingTests.push({ path: pathNames, result: test })
				} else if (test.skipped) {
					runResult.skippedTests.push({ path: pathNames, result: test })
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

		let printSpecOnce = () => {
			printSpecOnce = () => {}
			console.log(fancy("SPEC", ansiSequences.greenBg), newPathSerialized)
		}

		for (const before of spec.before) {
			try {
				await before()
			} catch (e) {
				console.error("Spec before() failed!", newPathSerialized, e)
				throw e
			}
		}

		const specMatches = filter === "" || spec.name.includes(filter)

		const result = {
			name: spec.name,
			specResults: await promiseMap(spec.specs, (nestedSpec) => this.runSpec(nestedSpec, newPath, specMatches ? "" : filter)),
			testResults: await promiseMap(spec.tests, async (test) => {
				if (specMatches || test.name.includes(filter)) {
					printSpecOnce()
					printSpecOnce = () => {}
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
					return { name: test.name, errors: [], timeout: null, skipped: true }
				}
			}),
		}

		for (const after of spec.after) {
			try {
				await after()
			} catch (e) {
				console.error("Spec after() failed!", newPathSerialized, e)
				throw e
			}
		}

		return result
	}

	/**
	 * Output the result of the test run.
	 * @param result
	 */
	printReport(result: RunResult) {
		console.log(
			`

${fancy("TEST FINISHED", ansiSequences.bold)}

${result.filter ? `filter: "${result.filter}"` : ""}

${fancy("passing", ansiSequences.greenBg)}: ${result.passedTests.length} ${fancy("failing", ansiSequences.redBg)}: ${result.failingTests.length} ${fancy(
				"skipped",
				ansiSequences.yellowBg,
			)}: ${result.skippedTests.length}`,
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

	/**
	 * A utility to exit the process with the appropriate exit code.
	 * only runs in node, no-op otherwise.
	 */
	terminateProcess(result: RunResult) {
		if (typeof process !== "undefined") {
			process.exit(result.failingTests.length ? 1 : 0)
		}
	}

	private async runTest(test: Test): Promise<TestResult> {
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
				currentTestResult.timeout = currentTestResult.timeout ?? OTest.DEFAULT_TIMEOUT_MS
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
			currentTestResult.errors.push({ error: wrapError(e), userMessage: null })
		} finally {
			this.currentTest = null
		}
		return currentTestResult
	}
}

function wrapError(e: unknown) {
	return e instanceof Error ? e : new Error(String(e))
}

async function promiseMap<T, R>(array: ReadonlyArray<T>, mapper: (value: T) => Promise<R>): Promise<Array<R>> {
	const result = []
	for (const el of array) {
		result.push(await mapper(el))
	}
	return result
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

// this weird API is inherited from ospec, we would like to eventually deprecate it with proper functions like o.test and o.check but this API is TBD
export type CallableOTest = OTest & {
	/** An alias for {@link OTest.test}. Discouraged. */
	(name: string, definition: () => Promise<void> | void): void

	/** An alias for {@link OTest.check}. Discouraged. */ <T>(actual: T): Assertion<T>
}

const otest = new OTest()

function o<T>(item: T | string, definition?: () => Promise<void> | void) {
	// we need to do these tricks otherwise "this" reference will be lost
	const oo = o as unknown as OTest
	if (typeof definition === "undefined") {
		return oo.check(item)
	} else {
		oo.test(item as string, definition)
	}
}

Object.assign(o, otest)
Object.setPrototypeOf(o, Object.getPrototypeOf(otest))

export default o as CallableOTest
