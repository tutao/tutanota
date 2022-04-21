import {UsageTest} from "./UsageTest.js"

export type Metrics = Map<string, Metric>
type Metric = {
	name: string,
	value: string,
}
type MetricConfig = {
	name: string,
	type: string,
	configValues: Map<string, string>
}

/** One part of the test. Has multiple metrics that are sent together. */
export class Stage {
	readonly collectedMetrics = new Map<string, Metric>()
	readonly metricConfigs = new Map<string, MetricConfig>()

	constructor(
		readonly number: number,
		private readonly test: UsageTest,
	) {
	}

	/**
	 * Attempts to the complete the stage and returns true if a ping has been sent successfully.
	 */
	async complete(): Promise<boolean> {
		return await this.test.completeStage(this)
	}

	setMetric(metric: Metric) {
		this.collectedMetrics.set(metric.name, metric)
	}

	setMetricConfig(metricConfig: MetricConfig) {
		this.metricConfigs.set(metricConfig.name, metricConfig)
	}
}

export class ObsoleteStage extends Stage {
	async complete(): Promise<boolean> {
		return true
	}

	setMetric(metric: Metric) {
		// no op
	}
}