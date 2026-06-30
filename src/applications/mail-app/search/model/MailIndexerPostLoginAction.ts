import { Indexer } from "../../workerUtils/index/Indexer"
import { FULL_INDEXED_TIMESTAMP, SessionType } from "../../../../platform-kit/app-env"
import { SyncDonePriority, SyncTracker } from "../../../common/api/main/SyncTracker"
import { LoggedInEvent, PostLoginAction } from "../../../../app-kit/native-bridge/common/PostLoginAction.js"

/**
 * The search range is tied to the offline storage settings.
 * This updates the mail index on full login.
 */
export class MailIndexerPostLoginAction implements PostLoginAction {
	constructor(
		private readonly indexer: Indexer,
		private readonly syncTracker: SyncTracker,
	) {}

	async onPartialLoginSuccess(event: LoggedInEvent): Promise<void> {
		if (event.sessionType === SessionType.Persistent) {
			this.syncTracker.addSyncDoneListener({
				onSyncDone: async () => {
					await this.indexer.extendMailIndex(FULL_INDEXED_TIMESTAMP)
				},
				priority: SyncDonePriority.HIGH,
			})
		}
	}

	async onFullLoginSuccess(_: LoggedInEvent): Promise<void> {}
}
