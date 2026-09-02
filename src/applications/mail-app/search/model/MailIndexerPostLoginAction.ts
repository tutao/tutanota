import { Indexer } from "../../workerUtils/index/Indexer"
import { SessionType } from "@tutao/app-env"
import { SyncTracker } from "../../../common/api/main/SyncTracker"
import { LoggedInEvent, PostLoginAction } from "../../../../app-kit/native-bridge/common/PostLoginAction.js"
import { CacheSyncStatus, ListenerPriority } from "../../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { getDayShifted } from "@tutao/utils"
import { getOfflineStorageDefaultIndexRangeDays } from "../../mail/MailUtils"
import { LoginController } from "../../../common/api/main/LoginController"

/**
 * The search range is tied to the offline storage settings.
 * This updates the mail index on full login.
 */
export class MailIndexerPostLoginAction implements PostLoginAction {
	constructor(
		private readonly indexer: Indexer,
		private readonly syncTracker: SyncTracker,
		private readonly login: LoginController,
	) {}

	async onPartialLoginSuccess(event: LoggedInEvent): Promise<void> {
		if (event.sessionType === SessionType.Persistent) {
			this.syncTracker.addSyncListener({
				id: "MailIndexerPostLoginAction",
				priority: ListenerPriority.HIGH,
				targetStatus: CacheSyncStatus.OnlineSyncDone,
				onSyncStatusChange: async () => {
					await this.indexer.extendMailIndex(
						getDayShifted(new Date(), -getOfflineStorageDefaultIndexRangeDays(this.login.getUserController().getUserAccountType())).getTime(),
					)
				},
			})
		}
	}

	async onFullLoginSuccess(_: LoggedInEvent): Promise<void> {}
}
