import {MetricNotCollectedError} from "../errors.js"
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

    constructor(number: number, test: UsageTest, metricsToCollect?: MetricsToCollect) {
        this.number = number
        this.test = test
        this.completed = false

        this.collectedMetrics = new Map<MetricKey, Metric>()
        if (metricsToCollect !== undefined) {
            for (let metricKey of metricsToCollect) {
                this.collectedMetrics.set(metricKey, "")
            }
        }
    }

    allMetricsCollected(): boolean {
        return Array.from(this.collectedMetrics).every(([key, value], index, array) => value !== "")
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
        if (!this.collectedMetrics.has(key)) {
            throw new MetricNotCollectedError(`metric '${key}' is not being collected at this stage`)
        }

        this.collectedMetrics.set(key, value)
    }

}