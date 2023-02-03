import { ObsoleteUsageTest, UsageTest } from "./UsageTest.js"
import { PingAdapter } from "../storage/PingAdapter.js"

/** Centralized place which holds all the {@link UsageTest}s. */
export class UsageTestController {
	private readonly tests: Map<string, UsageTest> = new Map<string, UsageTest>()
	private readonly obsoleteUsageTest = new ObsoleteUsageTest("obsolete", "obsolete", 0)

	constructor(private readonly pingAdapter: PingAdapter) {}

	addTest(test: UsageTest) {
		test.pingAdapter = this.pingAdapter
		this.tests.set(test.testId, test)
	}

	addTests(tests: UsageTest[]) {
		for (let test of tests) {
			this.addTest(test)
		}
	}

	setTests(tests: UsageTest[]) {
		this.tests.clear()

		this.addTests(tests)
	}

	/**
	 * Searches a test first by its ID and then, if no match is found, by its name.
	 * If no test matches by name either, then we assume that the test is finished and the server no longer sends assignments for it.
	 * In that case, we want to render the no-participation variant, so a sham test instance needs to be returned.
	 *
	 * @param testIdOrName The test's ID or its name
	 */
	getTest(testIdOrName: string): UsageTest {
		let result = this.tests.get(testIdOrName)

		if (result) {
			return result
		}

		for (let test of this.tests.values()) {
			if (test.testName === testIdOrName) {
				return test
			}
		}

		console.log(`Test '${testIdOrName}' not found, using obsolete...`)
		return this.obsoleteUsageTest
	}

	/**
	 * some components are used in multiple places, but only want to do a test in one of them.
	 * use this to get a test that always renders variant 0 and doesn't send pings.
	 */
	getObsoleteTest(): UsageTest {
		return this.obsoleteUsageTest
	}
}
