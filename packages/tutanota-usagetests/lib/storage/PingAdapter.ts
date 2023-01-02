import { Stage } from "../model/Stage.js"
import { UsageTest } from "../model/UsageTest.js"

export interface PingAdapter {
	sendPing(test: UsageTest, stage: Stage): Promise<void>
}

export class DummyPingAdapter implements PingAdapter {
	async sendPing(test: UsageTest, stage: Stage): Promise<void> {
		console.log(`ping:\n
        test ${JSON.stringify(test)}
        variant ${test.variant}\n
        stage ${stage.number}\n
        metrics\n`)
		console.log(stage.collectedMetrics)
	}
}
