import { LoggedInEvent, PostLoginAction } from "../../../common/api/main/LoginController"
import { OfflineStorageSettingsModel } from "../../../common/offline/OfflineStorageSettingsModel"
import { Indexer } from "../../workerUtils/index/Indexer"
import { SessionType } from "../../../common/api/common/SessionType"
import { SyncDonePriority, SyncTracker } from "../../../common/api/main/SyncTracker"

/**
 * The search range is tied to the offline storage settings.
 * This updates the mail index on full login.
 */
export class MailIndexerPostLoginAction implements PostLoginAction {
	constructor(
		private readonly offlineStorageSettings: OfflineStorageSettingsModel,
		private readonly indexer: Indexer,
		private readonly syncTracker: SyncTracker,
	) {}

	async onPartialLoginSuccess(event: LoggedInEvent): Promise<void> {
		if (event.sessionType === SessionType.Persistent) {
			this.syncTracker.addSyncDoneListener({
				onSyncDone: async () => {
					await this.offlineStorageSettings.init()
					await this.indexer.resizeMailIndex(this.offlineStorageSettings.getTimeRange().getTime())
				},
				priority: SyncDonePriority.HIGH,
			})
		}
	}

	async onFullLoginSuccess(_: LoggedInEvent): Promise<void> {}
}
