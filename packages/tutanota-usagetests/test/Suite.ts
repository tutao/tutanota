import o from "ospec"
import {PingAdapter, Stage, UsageTest} from "../lib/index.js"
import {ArbitraryVariantRenderer} from "../lib/view/VariantRenderer.js"
import {MetricNotCollectedError} from "../lib/errors.js"
import {UsageTestController} from "../lib/model/UsageTestController.js"


class MockPingAdapter implements PingAdapter {
	pingsSent = 0

	async sendPing(test: UsageTest, stage: Stage) {
		this.pingsSent++
	}
}

o.spec("Main", function () {
	o("dom render variant", function () {
		let variantZeroRan = false

		const testId = "t123"
		const test = new UsageTest(testId, "test 123", 0)
		test.pingAdapter = new MockPingAdapter()

		test.renderVariant(new ArbitraryVariantRenderer(), {
			[0]: () => variantZeroRan = true,
			[1]: () => variantZeroRan = false
		})

		o(variantZeroRan).equals(true)
	})

	o("complete stage and send ping", function () {
		const testId = "t123"
		const pingAdapter = new MockPingAdapter()

		const test = new UsageTest(testId, "test 123", 2)
		test.pingAdapter = pingAdapter

		const stage0 = new Stage(0, test)

		o(function () {
			stage0.setMetric("metric1", "")
		}).throws(MetricNotCollectedError)

		stage0.complete()

		o(pingAdapter.pingsSent).equals(1)
	})

	o("add tests to and retrieve from usage test controller", function () {
		const testId1 = "t1"
		const test1 = new UsageTest(testId1, "test 1", 0)

		const testId2 = "t2"
		const test2 = new UsageTest(testId2, "test 2", 1)

		const usageTestController = new UsageTestController()

		usageTestController.pingAdapter = new MockPingAdapter()

		usageTestController.addTests([test1, test2])

		// Correctly injected ping adapter
		o(usageTestController.getTest(testId1).pingAdapter).equals(usageTestController._pingAdapter)

		o(usageTestController.getTest(testId2)).equals(test2)
	})
})

o.run()
