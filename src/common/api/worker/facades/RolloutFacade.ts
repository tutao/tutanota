import { assertWorkerOrNode } from "../../common/Env"
import { RolloutService } from "../../entities/sys/Services"
import { IServiceExecutor } from "../../common/ServiceRequest"
import { getAsEnumValue, RolloutType } from "../../common/TutanotaConstants"
import { assertNotNull, LazyLoaded } from "@tutao/tutanota-utils"
import { ProgrammingError } from "../../common/error/ProgrammingError"

assertWorkerOrNode()

export interface RolloutAction {
	execute(): Promise<void>
}

/**
 * Handles gradual rollout of features and/or migrations.
 *
 * Asks the server what RolloutTypes are scheduled for this user and manages their corresponding actions.
 */
export class RolloutFacade {
	private rolloutActions: LazyLoaded<Map<RolloutType, RolloutAction>>

	constructor(
		private readonly serviceExecutor: IServiceExecutor,
		private readonly sendError: (error: Error) => Promise<void>,
	) {
		this.rolloutActions = new LazyLoaded(async () => {
			const result = await this.serviceExecutor.get(RolloutService, null)
			const rolloutActions = new Map<RolloutType, RolloutAction>()
			for (const rollout of result.rollouts) {
				const rolloutType = assertNotNull(getAsEnumValue(RolloutType, rollout.rolloutType))
				rolloutActions.set(rolloutType, {
					execute: () => {
						throw new ProgrammingError(`tried to execute an action that was not configured, rollout type ${rollout}`)
					},
				})
			}
			return rolloutActions
		})
	}

	public async getScheduledRolloutTypes() {
		return (await this.rolloutActions.getAsync()).keys()
	}

	/**
	 * Configures an action to execute for a given RolloutType.
	 *
	 * Must be called before processing said RolloutType.
	 *
	 * The action will be discarded if the RolloutType is not scheduled for this user, and it will also be deleted
	 * after being executed.
	 */
	public async configureRollout(rolloutType: RolloutType, rolloutAction: RolloutAction) {
		const actions = await this.rolloutActions.getAsync()
		if (actions.has(rolloutType)) {
			actions.set(rolloutType, rolloutAction)
		}
	}

	/**
	 * This can be called to execute a migration.
	 *
	 * @param rolloutType the RolloutType whose action we want to execute.
	 * @throws ProgrammingError if the RolloutType was scheduled but not configured.
	 * @returns RolloutResult that indicates whether it was executed.
	 */
	public async processRollout<T>(rolloutType: RolloutType): Promise<void> {
		const rolloutActions = await this.rolloutActions.getAsync()
		const rollout = rolloutActions.get(rolloutType)
		if (rollout) {
			try {
				await rollout.execute()
			} catch (e) {
				console.log(`error executing rollout action`, rolloutType)
				//@ts-ignore We report the error to the user interface but do not block further execution.
				this.sendError(e)
			} finally {
				// we remove it for now to delete locally stored data (potentially sensitive)
				// it will be scheduled again in the next login
				rolloutActions.delete(rolloutType)
			}
		}
	}
}
