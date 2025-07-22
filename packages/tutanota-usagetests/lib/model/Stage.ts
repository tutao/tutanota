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
export type PingIdTuple = { pingListId: string; pingId: string }

/** One part of the test. Has multiple metrics that are sent together. */
export class Stage {
	readonly collectedMetrics = new Map<MetricName, Metric>()
	readonly metricConfigs = new Map<MetricName, MetricConfig>()
	// store ping list id and ping id to make it undo-able
	private pingList: PingIdTuple[] = []

	constructor(
		readonly number: number,
		private readonly test: UsageTest,
		readonly minPings: number,
		readonly maxPings: number,
	) {}

	/**
	 * Attempts to complete the stage and enables to undo the sent ping later, if necessary
	 */
	async complete(finalizeStage = false): Promise<void> {
		const pingIdTuple = await this.test.completeStage(this, { forceRestart: false, finalizeStage })
		if (pingIdTuple) this.pingList.push(pingIdTuple)
	}

	async deletePing(): Promise<void> {
		if (this.pingList.length === 0) return
		const pingIdTuple = this.pingList.pop()!
		return this.test.deletePing(pingIdTuple)
	}

	setMetric(metric: Metric) {
		this.collectedMetrics.set(metric.name, metric)
	}

	setMetricConfig(metricConfig: MetricConfig) {
		this.metricConfigs.set(metricConfig.name, metricConfig)
	}
}

export class ObsoleteStage extends Stage {
	async complete(): Promise<void> {
		return
	}

	setMetric(metric: Metric) {
		// no op
	}
}
