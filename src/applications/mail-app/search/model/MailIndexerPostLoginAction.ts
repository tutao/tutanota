import { Indexer } from "../../workerUtils/index/Indexer"
import { FULL_INDEXED_TIMESTAMP, SessionType } from "../../../../platform-kit/app-env"
import { SyncTracker } from "../../../common/api/main/SyncTracker"
import { LoggedInEvent, PostLoginAction } from "../../../../app-kit/native-bridge/common/PostLoginAction.js"
import { CacheSyncStatus, ListenerPriority } from "../../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"

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
			this.syncTracker.addSyncListener({
				id: "MailIndexerPostLoginAction",
				onSyncStatusChange: async () => {
					await this.indexer.extendMailIndex(FULL_INDEXED_TIMESTAMP)
				},
				priority: ListenerPriority.HIGH,
				targetStatus: CacheSyncStatus.OnlineSyncDone,
			})
		}
	}

	async onFullLoginSuccess(_: LoggedInEvent): Promise<void> {}
}
