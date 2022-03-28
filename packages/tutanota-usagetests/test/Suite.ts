import o from "ospec"
import {PingAdapter, Stage, UsageTest} from "../lib/index.js"
import {UsageTestController} from "../lib/model/UsageTestController.js"


class MockPingAdapter implements PingAdapter {
	pingsSent = 0

	async sendPing(test: UsageTest, stage: Stage) {
		this.pingsSent++
	}
}

o.spec("Main", function () {
	o("dom render variant", function () {
		const testId = "t123"
		const test = new UsageTest(testId, "test 123", 0, true, false)
		test.pingAdapter = new MockPingAdapter()

		const rendered = test.renderVariant({
			[0]: () => 0,
			[1]: () => 1
		})

		o(rendered).equals(0)
	})

	o("complete stage and send ping", function () {
		const testId = "t123"
		const pingAdapter = new MockPingAdapter()

		const test = new UsageTest(testId, "test 123", 2, true, false)
		test.pingAdapter = pingAdapter

		const stage0 = new Stage(0, test)
		stage0.complete()

		o(pingAdapter.pingsSent).equals(1)
	})

	o("add tests to and retrieve from usage test controller", function () {
		const testId1 = "t1"
		const test1 = new UsageTest(testId1, "test 1", 0, true, false)

		const testId2 = "t2"
		const test2 = new UsageTest(testId2, "test 2", 1, true, false)

		const adapter = new MockPingAdapter()
		const usageTestController = new UsageTestController(adapter)

		usageTestController.addTests([test1, test2])

		// Correctly injected ping adapter
		o(usageTestController.getTest(testId1).pingAdapter).equals(adapter)

		o(usageTestController.getTest(testId2)).equals(test2)
	})

	o("pings are only sent once if strictStageOrder is true", async function () {
		const testId1 = "t1"
		const test1 = new UsageTest(testId1, "test 1", 1, true, true)

		for (let i = 0; i < 3; i++) {
			test1.addStage(new Stage(i, test1))
		}

		const adapter = new MockPingAdapter()
		const usageTestController = new UsageTestController(adapter)

		usageTestController.addTests([test1])

		await test1.getStage(0).complete()
		await test1.getStage(0).complete()
		await test1.getStage(1).complete()
		await test1.getStage(1).complete()
		await test1.getStage(1).complete()
		await test1.getStage(0).complete()
		await test1.getStage(2).complete()
		await test1.getStage(1).complete()
		await test1.getStage(2).complete()

		o(adapter.pingsSent).equals(3)
	})

	o("lastCompletedStage is reset upon completing the last stage of a test", async function () {
		const testId1 = "t1"
		const test1 = new UsageTest(testId1, "test 1", 1, true, true)

		for (let i = 0; i < 3; i++) {
			test1.addStage(new Stage(i, test1))
		}

		const adapter = new MockPingAdapter()
		const usageTestController = new UsageTestController(adapter)

		usageTestController.addTests([test1])

		await test1.getStage(0).complete()
		await test1.getStage(0).complete()
		await test1.getStage(1).complete()
		await test1.getStage(1).complete()
		await test1.getStage(1).complete()
		await test1.getStage(0).complete()
		await test1.getStage(2).complete()
		await test1.getStage(1).complete()
		await test1.getStage(2).complete()
		await test1.getStage(0).complete()
		await test1.getStage(1).complete()

		o(adapter.pingsSent).equals(5)
	})
})

o.run()
