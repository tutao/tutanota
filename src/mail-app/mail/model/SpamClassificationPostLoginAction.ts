import { LoggedInEvent, PostLoginAction } from "../../../common/api/main/LoginController"
import { SpamClassifier } from "../../workerUtils/spamClassification/SpamClassifier"
import { FeatureType } from "../../../common/api/common/TutanotaConstants"
import { CustomerFacade } from "../../../common/api/worker/facades/lazy/CustomerFacade"
import { filterMailMemberships } from "../../../common/api/common/utils/IndexUtils"
import { assertNotNull } from "@tutao/tutanota-utils"
import { isInternalUser } from "../../../common/api/common/utils/UserUtils"
import { SyncDonePriority, SyncTracker } from "../../../common/api/main/SyncTracker"

/**
 * Initialize SpamClassifier if FeatureType.SpamClientClassification feature is enabled for the customer.
 */
export class SpamClassificationPostLoginAction implements PostLoginAction {
	constructor(
		private readonly spamClassifier: SpamClassifier,
		private readonly customerFacade: CustomerFacade,
		private readonly syncTracker: SyncTracker,
	) {}

	async onPartialLoginSuccess(_: LoggedInEvent): Promise<void> {
		await this.customerFacade.loadCustomizations()
		const isSpamClassificationEnabled = await this.customerFacade.isEnabled(FeatureType.SpamClientClassification)
		const user = assertNotNull(await this.customerFacade.getUser())
		if (isSpamClassificationEnabled && isInternalUser(user) && this.spamClassifier) {
			const ownerGroups = filterMailMemberships(user)
			for (const ownerGroup of ownerGroups) {
				this.spamClassifier.initializeFromStorage(ownerGroup.group).catch((e) => {
					console.log(`failed to load spam classification model for group from storage: ${ownerGroup.group}`, e)
				})
			}
		}
	}

	async onFullLoginSuccess(_: LoggedInEvent): Promise<void> {
		await this.customerFacade.loadCustomizations()
		const isSpamClassificationEnabled = await this.customerFacade.isEnabled(FeatureType.SpamClientClassification)
		const user = assertNotNull(await this.customerFacade.getUser())
		if (isSpamClassificationEnabled && isInternalUser(user) && this.spamClassifier) {
			const ownerGroups = filterMailMemberships(user)
			for (const ownerGroup of ownerGroups) {
				this.syncTracker.addSyncDoneListener({
					onSyncDone: async () => {
						await this.spamClassifier.initializeWithTraining(ownerGroup.group).catch((e) => {
							console.log(`failed to completely initialize spam classification model for group: ${ownerGroup.group}`, e)
						})
					},
					priority: SyncDonePriority.NORMAL,
				})
			}
		}
	}
}
