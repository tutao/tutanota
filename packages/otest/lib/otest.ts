import { ansiSequences, fancy } from "./fancy.js"
import { Assertion } from "./Assertion.js"
import { RunResult, TestResult } from "./TestResult.js"

class OTestmpl {
	private static readonly DEFAULT_TIMEOUT_MS = 200
	private taskTree: Spec = { name: "O", specs: [], tests: [], before: [], after: [], beforeEach: [], afterEach: [] }
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

	test(name: string, task: (() => Promise<void>) | (() => void)) {
		Object.defineProperty(task, "name", { value: name, writable: false })
		this.currentSpec.tests.push({ name, task })
	}

	check<T>(value: T): Assertion<T> {
		if (this.currentTest == null) {
			throw new Error("Assertion outside of running test!")
		}
		return new Assertion(value, this.currentTest)
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

	terminateProcess(result: RunResult) {
		if (typeof process !== "undefined") {
			process.exit(result.failingTests.length ? 1 : 0)
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
				currentTestResult.timeout = currentTestResult.timeout ?? OTestmpl.DEFAULT_TIMEOUT_MS
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

// this weird API is inherited from ospec, we would like to eventually deprecate it
export type CallableOTest = OTestmpl & {
	(name: string, definition: () => Promise<void> | void): void

	<T>(actual: T): Assertion<T>
}

const otest = new OTestmpl()

function o<T>(item: T | string, definition?: () => Promise<void> | void) {
	// we need to do these tricks otherwise "this" reference will be lost
	const oo = o as unknown as OTestmpl
	if (typeof definition === "undefined") {
		return oo.check(item)
	} else {
		oo.test(item as string, definition)
	}
}

Object.assign(o, otest)
Object.setPrototypeOf(o, Object.getPrototypeOf(otest))

export default o as CallableOTest
