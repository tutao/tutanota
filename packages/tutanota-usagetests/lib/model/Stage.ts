import {UsageTest} from "./UsageTest.js"

export type Metrics = Map<string, Metric>
type Metric = {
	name: string,
	value: string,
}

/** One part of the test. Has multiple metrics that are sent together. */
export class Stage {
	readonly collectedMetrics = new Map<string, Metric>()
	private completed = false

	constructor(
		readonly number: number,
		private readonly test: UsageTest,
	) {
	}

	/**
	 * Marks the stage as completed if the method was called
	 * for the first time. No op if the stage has already been completed.
	 */
	async complete() {
		if (!this.completed) {
			this.completed = true
			await this.test.completeStage(this)
		}
	}

	setMetric(metric: Metric) {
		this.collectedMetrics.set(metric.name, metric)
	}
}

export class ObsoleteStage extends Stage {
	async complete() {
		// no op
	}

	setMetric(metric: Metric) {
		// no op
	}
}