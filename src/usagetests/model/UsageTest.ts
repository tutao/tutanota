import { ObsoleteStage, PingIdTuple, Stage } from "./Stage.js"
import { PingAdapter } from "../storage/PingAdapter.js"

const NO_PARTICIPATION_VARIANT = 0

export type VariantsIndex<ReturnT> = {
	[key: number]: () => ReturnT
}

/** Holds all variants and can render current variant. Combines a test's config and the user's assignment. */
export class UsageTest {
	private readonly stages: Map<number, Stage> = new Map<number, Stage>()
	pingAdapter?: PingAdapter
	public lastCompletedStage = 0
	// storage for data that is aggregated across stages and sent at some point
	public meta: Record<string, any> = {}
	private _invalidate = false

	/**
	 * Enabling this makes it possible to restart a test even if the last stage has not been sent.
	 */
	public allowEarlyRestarts = false
	private sentPings = 0
	private started = false

	// Enables recording the time that has passed since the last ping (and attaching it as a metric 'secondsPassed')
	public recordTime = false
	private lastPingDate?: Date

	constructor(
		readonly testId: string,
		readonly testName: string,
		public variant: number,
		public active: boolean,
	) {}

	/**
	Tries to restart the test (by sending stage 0) regardless of the allowEarlyRestarts setting
	 */
	forceRestart() {
		return this.completeStage(this.getStage(0), { forceRestart: true, finalizeStage: false })
	}

	isStarted(): boolean {
		return this.started
	}

	getStage(stageNum: number) {
		const stage = this.stages.get(stageNum)

		if (!stage) {
			console.log(`Stage ${stageNum} is not registered, meaning that test '${this.testName}' is likely misconfigured`)
			return new ObsoleteStage(0, this, 0, 0)
		}

		return stage
	}

	addStage(stage: Stage): Stage {
		if (this.stages.get(stage.number)) {
			throw new Error(`Stage ${stage.number} is already registered`)
		}

		this.stages.set(stage.number, stage)
		return stage
	}

	getVariant<T>(variants: VariantsIndex<T>): T {
		return variants[this.variant]()
	}

	invalidateTest() {
		this._invalidate = true
	}

	/**
	 * Should not be used directly. Use stage.complete() instead.
	 */
	async completeStage(
		stage: Stage,
		{ forceRestart, finalizeStage }: { forceRestart: boolean; finalizeStage: boolean } = {
			forceRestart: false,
			finalizeStage: false,
		},
	): Promise<PingIdTuple | undefined> {
		if (this._invalidate) {
			console.log("Usage test invalidated. Not completing stage.")
			return
		}
		if (!this.pingAdapter) {
			throw new Error("no ping adapter has been registered")
		} else if (this.variant === NO_PARTICIPATION_VARIANT || !this.active) {
			return
		}

		for (let i = this.lastCompletedStage + 1; i < stage.number; i++) {
			let currentStage = this.stages.get(i)

			if (!!currentStage && currentStage.minPings !== 0) {
				console.log(
					`Not sending ping for stage (${stage.number}) in wrong order of test '${this.testId}' because stage ${currentStage.number} is not finished`,
				)
				return
			}
		}

		console.log(`Test '${this.testName}': Completing stage ${stage.number}, variant ${this.variant}`)
		this.sentPings = stage.number === this.lastCompletedStage ? this.sentPings + 1 : 1
		this.lastCompletedStage = stage.number

		if (this.recordTime) {
			const currentDate = new Date()

			if (stage.number > 0) {
				const secondsPassed = this.lastPingDate ? (currentDate.getTime() - this.lastPingDate.getTime()) / 1000 : 0
				stage.setMetric({
					name: "secondsPassed",
					value: secondsPassed.toString(),
				})
			}

			this.lastPingDate = currentDate
		}

		const pingIdTuple = await this.pingAdapter.sendPing(this, stage, finalizeStage)

		this.started = true
		return pingIdTuple
	}

	async deletePing(pingIdTuple: PingIdTuple) {
		if (!this.pingAdapter) return
		void this.pingAdapter!.deletePing(this.testId, pingIdTuple)
	}
}

export class ObsoleteUsageTest extends UsageTest {
	private readonly obsoleteStage: ObsoleteStage

	constructor(testId: string, testName: string, variant: number) {
		super(testId, testName, variant, false)
		this.obsoleteStage = new ObsoleteStage(0, this, 1, 1)
	}

	getStage(stageNum: number): Stage {
		return this.obsoleteStage
	}

	addStage(stage: Stage): Stage {
		return this.obsoleteStage
	}

	getVariant<T>(variants: VariantsIndex<T>): T {
		return variants[0]()
	}

	async completeStage(stage: Stage): Promise<PingIdTuple | undefined> {
		return { pingListId: "obsoleteListId", pingId: "obsoleteId" }
	}
}
