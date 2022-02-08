import {UsageTest} from "./UsageTest.js"
import {UsageTestNotRegisteredError} from "../errors.js"
import {PingAdapter} from "../storage/PingAdapter.js"

export class UsageTestController {
	private readonly tests: Map<string, UsageTest> = new Map<string, UsageTest>()
	_pingAdapter?: PingAdapter

	set pingAdapter(pingAdapter: PingAdapter) {
		this._pingAdapter = pingAdapter

		for (let test of this.tests.values()) {
			test.pingAdapter = pingAdapter
		}
	}

	addTest(test: UsageTest) {
		test.pingAdapter = this._pingAdapter
		this.tests.set(test.testId, test)
	}

	addTests(tests: UsageTest[]) {
		for (let test of tests) {
			this.addTest(test)
		}
	}

	getTest(testId: string) {
		let test = this.tests.get(testId)

		if (test === undefined) {
			throw new UsageTestNotRegisteredError(`Test ${testId} is not registered`)
		}

		return test
	}
}