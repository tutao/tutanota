import { UsageTest } from "./UsageTest.js"

type MetricName = string
type Metric = {
	name: MetricName
	value: string
}
type MetricConfig = {
	name: MetricName
	type: string
	configValues: Map<string, string>
}

/** One part of the test. Has multiple metrics that are sent together. */
export class Stage {
	readonly collectedMetrics = new Map<MetricName, Metric>()
	readonly metricConfigs = new Map<MetricName, MetricConfig>()

	constructor(readonly number: number, private readonly test: UsageTest, readonly minPings: number, readonly maxPings: number) {}

	/**
	 * Attempts to complete the stage and returns true if a ping has been sent successfully.
	 */
	async complete(): Promise<boolean | void> {
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
