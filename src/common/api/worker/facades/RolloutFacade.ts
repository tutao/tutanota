import { assertWorkerOrNode } from "../../common/Env"
import { RolloutService } from "../../entities/sys/Services"
import { IServiceExecutor } from "../../common/ServiceRequest"
import { Rollout } from "../../entities/sys/TypeRefs"
import { RolloutType } from "../../common/TutanotaConstants"
import { remove } from "@tutao/tutanota-utils"

assertWorkerOrNode()

/**
 * Handles gradual rollout of features and/or migrations.
 */
export class RolloutFacade {
	private rollouts: Rollout[] = []

	constructor(private readonly serviceExecutor: IServiceExecutor) {}

	public async initialize() {
		const rolloutGetOut = await this.serviceExecutor.get(RolloutService, null)
		this.rollouts = rolloutGetOut.rollouts
	}

	/**
	 * This can be called to execute a migration.
	 * It will only be executed if the user was selected for the rollout by the server.
	 * @param rolloutType the rolloutType the action corresponds to
	 * @param rolloutAction the migration to execute
	 * @returns null if not executed because it was not scheduled.
	 */
	public async processRollout<T>(rolloutType: RolloutType, rolloutAction: () => Promise<T>): Promise<T | null> {
		const rollout = this.rollouts.filter((rollout) => rollout.rolloutType === rolloutType)
		if (rollout.length > 0) {
			const result = await rolloutAction()
			remove(this.rollouts, rollout[0])
			return result
		}
		return null
	}
}
