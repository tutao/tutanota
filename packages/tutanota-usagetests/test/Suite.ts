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
		const test = new UsageTest(testId, "test 123", 0, true)
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

	o("pings are only sent once if minPings=maxPings=1", async function () {
		const testId1 = "t1"
		const test1 = new UsageTest(testId1, "test 1", 1, true)

		for (let i = 0; i < 3; i++) {
			test1.addStage(new Stage(i, test1, 1, 1))
		}

		const adapter = new MockPingAdapter()
		const usageTestController = new UsageTestController(adapter)

		usageTestController.addTests([test1])

		await test1.getStage(0).complete() // 1
		await test1.getStage(0).complete() // 1
		await test1.getStage(1).complete() // 2
		await test1.getStage(1).complete() // 2
		await test1.getStage(1).complete() // 2
		await test1.getStage(0).complete() // 2
		await test1.getStage(2).complete() // 3
		await test1.getStage(1).complete() // 3
		await test1.getStage(2).complete() // 3

		o(adapter.pingsSent).equals(3)
	})

	o("test may be restarted upon reaching the last stage", async function () {
		const testId1 = "t1"
		const test1 = new UsageTest(testId1, "test 1", 1, true)

		for (let i = 0; i < 3; i++) {
			test1.addStage(new Stage(i, test1, 1, 1))
		}

		const adapter = new MockPingAdapter()
		const usageTestController = new UsageTestController(adapter)

		usageTestController.addTests([test1])

		await test1.getStage(0).complete() // 1
		await test1.getStage(0).complete() // 1
		await test1.getStage(1).complete() // 2
		await test1.getStage(1).complete() // 2
		await test1.getStage(1).complete() // 2
		await test1.getStage(0).complete() // 2
		await test1.getStage(2).complete() // 3
		await test1.getStage(1).complete() // 3
		await test1.getStage(2).complete() // 3
		await test1.getStage(0).complete() // 4
		await test1.getStage(1).complete() // 5

		o(adapter.pingsSent).equals(5)
	})

	o("test may be restarted before reaching the last stage if allowEarlyRestarts=true", async function () {
		const testId1 = "t1"
		const test1 = new UsageTest(testId1, "test 1", 1, true)
		test1.allowEarlyRestarts = true

		for (let i = 0; i < 3; i++) {
			test1.addStage(new Stage(i, test1, 1, 1))
		}

		const adapter = new MockPingAdapter()
		const usageTestController = new UsageTestController(adapter)

		usageTestController.addTests([test1])

		await test1.getStage(0).complete() // 1
		await test1.getStage(0).complete() // 2
		await test1.getStage(1).complete() // 3
		await test1.getStage(1).complete() // 3
		await test1.getStage(1).complete() // 3
		await test1.getStage(0).complete() // 4
		await test1.getStage(2).complete() // 4
		await test1.getStage(1).complete() // 5
		await test1.getStage(2).complete() // 6
		await test1.getStage(0).complete() // 7
		await test1.getStage(1).complete() // 8

		o(adapter.pingsSent).equals(8)
	})

	o("stages may be repeated if configured as such", async function () {
		const testId1 = "t1"
		const test1 = new UsageTest(testId1, "test 1", 1, true)

		for (let i = 0; i < 3; i++) {
			test1.addStage(new Stage(i, test1, 1, i + 1))
		}

		const adapter = new MockPingAdapter()
		const usageTestController = new UsageTestController(adapter)

		usageTestController.addTests([test1])

		await test1.getStage(0).complete() // 1
		await test1.getStage(0).complete() // 1
		await test1.getStage(1).complete() // 2
		await test1.getStage(1).complete() // 3
		await test1.getStage(1).complete() // 4
		await test1.getStage(0).complete() // 4
		await test1.getStage(2).complete() // 5
		await test1.getStage(1).complete() // 5
		await test1.getStage(2).complete() // 5
		await test1.getStage(0).complete() // 6
		await test1.getStage(1).complete() // 7
		await test1.getStage(1).complete() // 8
		await test1.getStage(2).complete() // 9
		await test1.getStage(2).complete() // 10
		await test1.getStage(2).complete() // 11
		await test1.getStage(2).complete() // 11

		o(adapter.pingsSent).equals(11)
	})

	o("stages may be skipped if configured as such", async function () {
		const testId1 = "t1"
		const test1 = new UsageTest(testId1, "test 1", 1, true)

		for (let i = 0; i < 3; i++) {
			test1.addStage(new Stage(i, test1, 0, i + 1))
		}

		const adapter = new MockPingAdapter()
		const usageTestController = new UsageTestController(adapter)

		usageTestController.addTests([test1])

		await test1.getStage(2).complete() // 1
		await test1.getStage(1).complete() // 1
		await test1.getStage(2).complete() // 2
		await test1.getStage(0).complete() // 3
		await test1.getStage(1).complete() // 4
		await test1.getStage(1).complete() // 5
		await test1.getStage(2).complete() // 6
		await test1.getStage(2).complete() // 7
		await test1.getStage(2).complete() // 8
		await test1.getStage(2).complete() // 8

		o(adapter.pingsSent).equals(8)
	})

	o("stages may be skipped if configured as such, 2", async function () {
		const testId1 = "t1"
		const test1 = new UsageTest(testId1, "test 1", 1, true)
		test1.allowEarlyRestarts = true

		for (let i = 0; i < 4; i++) {
			test1.addStage(new Stage(i, test1, i == 2 ? 0 : 1, i + 1))
		}

		const adapter = new MockPingAdapter()
		const usageTestController = new UsageTestController(adapter)

		usageTestController.addTests([test1])

		await test1.getStage(0).complete() // 1
		await test1.getStage(0).complete() // 2
		await test1.getStage(0).complete() // 3
		await test1.getStage(0).complete() // 4
		await test1.getStage(2).complete() // 4
		await test1.getStage(2).complete() // 4
		await test1.getStage(0).complete() // 5
		await test1.getStage(1).complete() // 6
		await test1.getStage(1).complete() // 7
		await test1.getStage(3).complete() // 8

		o(adapter.pingsSent).equals(8)
	})

	o("stage completion check function is respected", async function () {
		const testId1 = "t1"
		const test1 = new UsageTest(testId1, "test 1", 1, true)

		for (let i = 0; i < 2; i++) {
			test1.addStage(new Stage(i, test1, 0, 1))
		}

		const adapter = new MockPingAdapter()
		const usageTestController = new UsageTestController(adapter)

		usageTestController.addTests([test1])

		await test1.getStage(0).complete({
			check: () => false,
		})
		await test1.getStage(1).complete({
			check: () => true,
		})

		o(adapter.pingsSent).equals(1)
	})

	o("stage completion check function is respected after delay", async function () {
		const testId1 = "t1"
		const test1 = new UsageTest(testId1, "test 1", 1, true)
		test1.addStage(new Stage(0, test1, 0, 1))

		const adapter = new MockPingAdapter()
		const usageTestController = new UsageTestController(adapter)

		usageTestController.addTests([test1])

		let doComplete = true
		setTimeout(() => doComplete = false, 90)

		await test1.getStage(0).complete({
			check: () => doComplete,
			delay: () => new Promise(resolve => setTimeout(resolve, 100)),
		})

		o(adapter.pingsSent).equals(0)
	})
})

o.run()
