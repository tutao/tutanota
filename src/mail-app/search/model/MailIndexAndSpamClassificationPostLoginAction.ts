import { LoggedInEvent, PostLoginAction } from "../../../common/api/main/LoginController"
import { OfflineStorageSettingsModel } from "../../../common/offline/OfflineStorageSettingsModel"
import { Indexer } from "../../workerUtils/index/Indexer"
import { SessionType } from "../../../common/api/common/SessionType"
import { SpamClassifier } from "../../workerUtils/spamClassification/SpamClassifier"
import { FeatureType } from "../../../common/api/common/TutanotaConstants"
import { CustomerFacade } from "../../../common/api/worker/facades/lazy/CustomerFacade"
import { filterMailMemberships } from "../../../common/api/common/utils/IndexUtils"
import { assertNotNull } from "@tutao/tutanota-utils"

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

	async onPartialLoginSuccess(event: LoggedInEvent): Promise<{ asyncAction: Promise<void> }> {
		if (event.sessionType === SessionType.Persistent) {
			await this.offlineStorageSettings.init()
			// noinspection ES6MissingAwait
			const resizeMailIndex = this.indexer.resizeMailIndex(this.offlineStorageSettings.getTimeRange().getTime()).then(async () => {
				// spamClassification
				// Wait until indexing is done, as its populate offlineDb

				await this.customerFacade.loadCustomizations()
				if (this.spamClassifier && (await this.customerFacade.isEnabled(FeatureType.SpamClientClassification))) {
					const ownerGroups = filterMailMemberships(assertNotNull(await this.customerFacade.getUser()))
					for (const ownerGroup of ownerGroups) {
						this.spamClassifier.initialize(ownerGroup.group).catch((e) => {
							console.log(`Failed to initialize spam classification model for group: ${ownerGroup._id}::${ownerGroup.group}. With reason:`)
							console.log(e)
						})
					}
				}
			})
			return { asyncAction: resizeMailIndex }
		}
		return { asyncAction: Promise.resolve() }
	}

	async onFullLoginSuccess(_: LoggedInEvent): Promise<void> {}
}
