import {ObsoleteStage, Stage} from "./Stage.js"
import {PingAdapter} from "../storage/PingAdapter.js"

const NO_PARTICIPATION_VARIANT = 0

export type VariantsIndex<ReturnT> = {
	[key: number]: () => ReturnT
}

/** Holds all variants and can render current variant. Combines a test's config and the user's assignment. */
export class UsageTest {
	private readonly stages: Map<number, Stage> = new Map<number, Stage>()
	pingAdapter?: PingAdapter

	constructor(
		readonly testId: string,
		readonly testName: string,
		readonly variant: number,
		public active: boolean,
	) {
	}

	getStage(stageNum: number): Stage | null {
		return this.stages.get(stageNum) ?? null
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

	async completeStage(stage: Stage) {
		if (!this.pingAdapter) {
			throw new Error("no ping adapter has been registered")
		} else if (this.variant === NO_PARTICIPATION_VARIANT || !this.active) {
			return
		}

		console.log(`Completing stage: ${stage.number}, variant : ${this.variant}`)
		await this.pingAdapter.sendPing(this, stage)
	}
}

export class ObsoleteUsageTest extends UsageTest {
	private readonly obsoleteStage: ObsoleteStage

	constructor(testId: string, testName: string, variant: number) {
		super(testId, testName, variant, false)
		this.obsoleteStage = new ObsoleteStage(0, this)
	}

	getStage(stageNum: number): Stage | null {
		return this.obsoleteStage
	}

	addStage(stage: Stage): Stage {
		return this.obsoleteStage
	}

	renderVariant<T>(variants: VariantsIndex<T>): T {
		return variants[0]()
	}

	async completeStage(stage: Stage) {
		// no op
	}
}