import {UsageTest} from "./UsageTest.js"

export type Metric = any
export type MetricKey = string
export type Metrics = Map<MetricKey, Metric>
export type MetricsToCollect = Set<MetricKey>

export class Stage {
	readonly number: number
	readonly collectedMetrics: Metrics
	private readonly test: UsageTest
	private completed: boolean

	constructor(number: number, test: UsageTest) {
		this.number = number
		this.test = test
		this.completed = false

		this.collectedMetrics = new Map<MetricKey, Metric>()
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

	setMetric(key: MetricKey, value: Metric) {
		this.collectedMetrics.set(key, value)
	}

}