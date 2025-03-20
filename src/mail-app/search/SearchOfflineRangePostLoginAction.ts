import { LoggedInEvent, PostLoginAction } from "../../common/api/main/LoginController"
import { OfflineStorageSettingsModel } from "../../common/offline/OfflineStorageSettingsModel"
import { Indexer } from "../workerUtils/index/Indexer"

// FIXME: shouldn't be in /search
export class SearchOfflineRangePostLoginAction implements PostLoginAction {
	constructor(private readonly offlineStorageSettings: OfflineStorageSettingsModel, private readonly indexer: Indexer) {}

	async onPartialLoginSuccess(_: LoggedInEvent): Promise<void> {}

	async onFullLoginSuccess(_: LoggedInEvent): Promise<void> {
		await this.offlineStorageSettings.init()
		// noinspection ES6MissingAwait
		this.indexer.extendMailIndex(this.offlineStorageSettings.getTimeRange().getTime())
	}
}
