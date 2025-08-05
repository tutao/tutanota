import o from "@tutao/otest"
// Do not try to "simplify" these imports to "../lib", this does not work with ES modules in node.
// This could work as "../lib/index.js".
import { PingIdTuple, Stage } from "../lib/model/Stage.js"
import { PingAdapter } from "../lib/storage/PingAdapter.js"
import { UsageTest } from "../lib/model/UsageTest.js"
import { UsageTestController } from "../lib/model/UsageTestController.js"

class MockPingAdapter implements PingAdapter {
	pingsSent = 0

	async sendPing(test: UsageTest, stage: Stage): Promise<PingIdTuple | undefined> {
		this.pingsSent++
		return Promise.resolve({ pingListId: "pingList", pingId: "pingId" + this.pingsSent })
	}

	async deletePing(testId: string, pingIdTuple: PingIdTuple): Promise<void> {
		this.pingsSent--
	}
}

o.spec("Main", function () {
	o("dom render variant", function () {
		const testId = "t123"
		const test = new UsageTest(testId, "test 123", 0, true)
		test.pingAdapter = new MockPingAdapter()

		const rendered = test.getVariant({
			[0]: () => 0,
			[1]: () => 1,
		})

		o(rendered).equals(0)
	})

	o("complete stage and send ping", function () {
		const testId = "t123"
		const pingAdapter = new MockPingAdapter()

		const test = new UsageTest(testId, "test 123", 2, true)
		test.pingAdapter = pingAdapter

		const stage0 = new Stage(0, test, 1, 1)
		stage0.complete()

		o(pingAdapter.pingsSent).equals(1)
	})

	o("add tests to and retrieve from usage test controller", function () {
		const testId1 = "t1"
		const test1 = new UsageTest(testId1, "test 1", 0, true)

		const testId2 = "t2"
		const test2 = new UsageTest(testId2, "test 2", 1, true)

		const adapter = new MockPingAdapter()
		const usageTestController = new UsageTestController(adapter)

		usageTestController.addTests([test1, test2])

		// Correctly injected ping adapter
		o(usageTestController.getTest(testId1).pingAdapter).equals(adapter)

		o(usageTestController.getTest(testId2)).equals(test2)
	})
})

const result = await o.run()
o.printReport(result)
o.terminateProcess(result)
