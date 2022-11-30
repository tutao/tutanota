import {UsageTest} from "./UsageTest.js"

type MetricName = string
type Metric = {
	name: MetricName,
	value: string,
}
type MetricConfig = {
	name: MetricName,
	type: string,
	configValues: Map<string, string>
}

interface StageCompletionOptions {
	/**
	 * Called before check() and before stage completion.
	 */
	delay?: () => Promise<void>,
	/**
	 * Called before actual completion of the stage after all delays to see if the
	 * condition for stage completion still holds.
	 * The stage is only completed if check() returns true.
	 */
	check?: () => boolean,
}

/** One part of the test. Has multiple metrics that are sent together. */
export class Stage {
	readonly collectedMetrics = new Map<MetricName, Metric>()
	readonly metricConfigs = new Map<MetricName, MetricConfig>()

	constructor(
		readonly number: number,
		private readonly test: UsageTest,
		readonly minPings: number,
		readonly maxPings: number,
	) {
	}

	/**
	 * Attempts to the complete the stage and returns true if a ping has been sent successfully.
	 */
	async complete(options?: StageCompletionOptions): Promise<boolean | void> {
		if (options?.delay) {
			await options.delay()
		}

		if (options?.check && !options.check()) {
			return
		}

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