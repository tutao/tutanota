import {ObsoleteStage, Stage} from "./Stage.js"
import {PingAdapter} from "../storage/PingAdapter.js"

const NO_PARTICIPATION_VARIANT = 0
const ASSIGNMENT_STAGE = -1

export type VariantsIndex<ReturnT> = {
	[key: number]: () => ReturnT
}

/** Holds all variants and can render current variant. Combines a test's config and the user's assignment. */
export class UsageTest {
	private readonly stages: Map<number, Stage> = new Map<number, Stage>()
	pingAdapter?: PingAdapter
	public lastCompletedStage = ASSIGNMENT_STAGE

	public strictStageOrder = false

	constructor(
		readonly testId: string,
		readonly testName: string,
		readonly variant: number,
		public active: boolean,
	) {
	}

	isStarted(): boolean {
		return this.lastCompletedStage > ASSIGNMENT_STAGE
	}

	getStage(stageNum: number): Stage {
		if (!this.stages.has(stageNum)) {
			throw new Error(`Stage ${stageNum} is not registered`)
		}

		return this.stages.get(stageNum)!
	}

	addStage(stage: Stage): Stage {
		if (this.stages.get(stage.number)) {
			throw new Error(`Stage ${stage.number} is already registered`)
		}

		this.stages.set(stage.number, stage)
		return stage
	}

	renderVariant<T>(variants: VariantsIndex<T>): T {
		return variants[this.variant]()
	}

	/**
	 * Should not be used directly. Use stage.complete() instead.
	 */
	async completeStage(stage: Stage): Promise<boolean> {
		if (!this.pingAdapter) {
			throw new Error("no ping adapter has been registered")
		} else if (this.variant === NO_PARTICIPATION_VARIANT || !this.active) {
			return false
		} else if (this.strictStageOrder && stage.number !== this.lastCompletedStage + 1) {
			console.log(`Not sending ping for stage (${stage.number}) in wrong order because strictStageOrder is set on test '${this.testId}'`)
			return false
		}

		console.log(`Completing stage: ${stage.number}, variant: ${this.variant}`)
		this.lastCompletedStage = stage.number === (this.stages.size - 1) ? ASSIGNMENT_STAGE : stage.number
		await this.pingAdapter.sendPing(this, stage)

		return true
	}
}

export class ObsoleteUsageTest extends UsageTest {
	private readonly obsoleteStage: ObsoleteStage

	constructor(testId: string, testName: string, variant: number) {
		super(testId, testName, variant, false)
		this.obsoleteStage = new ObsoleteStage(0, this)
	}

	getStage(stageNum: number): Stage {
		return this.obsoleteStage
	}

	addStage(stage: Stage): Stage {
		return this.obsoleteStage
	}

	renderVariant<T>(variants: VariantsIndex<T>): T {
		return variants[0]()
	}

	async completeStage(stage: Stage): Promise<boolean> {
		return true
	}
}