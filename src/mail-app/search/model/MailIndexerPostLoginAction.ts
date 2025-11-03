import { LoggedInEvent, PostLoginAction } from "../../../common/api/main/LoginController"
import { OfflineStorageSettingsModel } from "../../../common/offline/OfflineStorageSettingsModel"
import { Indexer } from "../../workerUtils/index/Indexer"
import { SessionType } from "../../../common/api/common/SessionType"

/**
 * The search range is tied to the offline storage settings.
 * This updates the mail index on full login.
 */
export class MailIndexerPostLoginAction implements PostLoginAction {
	constructor(
		private readonly offlineStorageSettings: OfflineStorageSettingsModel,
		private readonly indexer: Indexer,
	) {}

	async onPartialLoginSuccess(event: LoggedInEvent): Promise<void> {
		if (event.sessionType === SessionType.Persistent) {
			await this.offlineStorageSettings.init()
			// noinspection ES6MissingAwait
			this.indexer.resizeMailIndex(this.offlineStorageSettings.getTimeRange().getTime())
		}
	}

	async onFullLoginSuccess(_: LoggedInEvent): Promise<void> {}
}
