import { RolloutAction } from "../facades/RolloutFacade"
import { UserFacade } from "../facades/UserFacade"
import { EnvProvider, SessionType } from "@tutao/app-env"
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

	public async execute(): Promise<void> {
		if (!EnvProvider.get().isAdminClient() && this.sessionType !== SessionType.Temporary) {
			const user = this.userFacade.getUser()
			if (user != null && user.accountType !== AccountType.EXTERNAL) {
				await this.instanceKeyFacade.loadAndProcessPendingInstanceKeySharing(user)
			}
		}
	}
}
