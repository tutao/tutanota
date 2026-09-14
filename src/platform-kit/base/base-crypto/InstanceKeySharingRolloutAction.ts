import { RolloutAction } from "../facades/RolloutFacade"
import { UserFacade } from "../facades/UserFacade"
import { isAdminClient, SessionType } from "@tutao/app-env"
import { AccountType } from "../../../entities/sys/Utils"
import { InstanceKeyFacade } from "./InstanceKeyFacade"

/**
 * Explicit RolloutAction to trigger instance key sharing.
 *
 * It is easier to test this as a concrete class than it is to capture and execute lambdas getting passed around.
 */
export class InstanceKeySharingRolloutAction implements RolloutAction {
	constructor(
		private readonly instanceKeyFacade: InstanceKeyFacade,
		private readonly userFacade: UserFacade,
		private readonly sessionType: SessionType,
	) {}

	public async execute() {
		// If we have not migrated to argon2 we postpone the migration.
		if (!isAdminClient() && this.sessionType !== SessionType.Temporary) {
			const user = this.userFacade.getUser()
			if (user && user.accountType !== AccountType.EXTERNAL) {
				await this.instanceKeyFacade.loadAndProcessPendingInstanceKeySharing(user)
			}
		}
	}
}
