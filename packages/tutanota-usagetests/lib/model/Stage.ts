import {UsageTest} from "./UsageTest.js"

export type Metrics = Map<string, Metric>
type Metric = {
	name: string,
	value: string | null,
}

export class Stage {
	readonly number: number
	readonly collectedMetrics: Metrics
	private readonly test: UsageTest
	private completed: boolean

	constructor(number: number, test: UsageTest) {
		this.number = number
		this.test = test
		this.completed = false

		this.collectedMetrics = new Map<string, Metric>()
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