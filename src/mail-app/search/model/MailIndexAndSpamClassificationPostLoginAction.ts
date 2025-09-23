import { LoggedInEvent, PostLoginAction } from "../../../common/api/main/LoginController"
import { OfflineStorageSettingsModel } from "../../../common/offline/OfflineStorageSettingsModel"
import { Indexer } from "../../workerUtils/index/Indexer"
import { SessionType } from "../../../common/api/common/SessionType"
import { SpamClassifier } from "../../workerUtils/spamClassification/SpamClassifier"
import { FeatureType } from "../../../common/api/common/TutanotaConstants"
import { CustomerFacade } from "../../../common/api/worker/facades/lazy/CustomerFacade"

/**
 * The search range is tied to the offline storage settings.
 * This updates the mail index on full login.
 * And also initialize spamClassification if enabled
 */
export class MailIndexAndSpamClassificationPostLoginAction implements PostLoginAction {
	constructor(
		private readonly offlineStorageSettings: OfflineStorageSettingsModel,
		private readonly indexer: Indexer,
		private readonly spamClassifier: SpamClassifier | null,
		private readonly customerFacade: CustomerFacade,
	) {}

	async onPartialLoginSuccess(event: LoggedInEvent): Promise<void> {
		if (event.sessionType === SessionType.Persistent) {
			await this.offlineStorageSettings.init()
			// noinspection ES6MissingAwait
			this.indexer.resizeMailIndex(this.offlineStorageSettings.getTimeRange().getTime()).then(async () => {
				// spamClassification
				// Wait until indexing is done, as its populate offlineDb

				await this.customerFacade.loadCustomizations()
				if (this.spamClassifier && (await this.customerFacade.isEnabled(FeatureType.SpamClientClassification))) {
					// noinspection ES6MissingAwait
					this.spamClassifier.initialize()
				}
			})
		}
	}

	async onFullLoginSuccess(_: LoggedInEvent): Promise<void> {}
}
