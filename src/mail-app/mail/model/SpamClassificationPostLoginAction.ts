import { LoggedInEvent, PostLoginAction } from "../../../common/api/main/LoginController"
import { SpamClassifier } from "../../workerUtils/spamClassification/SpamClassifier"
import { FeatureType } from "../../../common/api/common/TutanotaConstants"
import { CustomerFacade } from "../../../common/api/worker/facades/lazy/CustomerFacade"
import { filterMailMemberships } from "../../../common/api/common/utils/IndexUtils"
import { assertNotNull } from "@tutao/tutanota-utils"

/**
 * Initialize SpamClassifier if FeatureType.SpamClientClassification feature is enabled for the customer.
 */
export class SpamClassificationPostLoginAction implements PostLoginAction {
	constructor(
		private readonly spamClassifier: SpamClassifier,
		private readonly customerFacade: CustomerFacade,
	) {}

	async onPartialLoginSuccess(event: LoggedInEvent): Promise<void> {
		await this.customerFacade.loadCustomizations()
		const isSpamClassificationEnabled = await this.customerFacade.isEnabled(FeatureType.SpamClientClassification)
		if (isSpamClassificationEnabled && this.spamClassifier) {
			const ownerGroups = filterMailMemberships(assertNotNull(await this.customerFacade.getUser()))
			for (const ownerGroup of ownerGroups) {
				this.spamClassifier.initialize(ownerGroup.group).catch((e) => {
					console.log(`failed to initialize spam classification model for group: ${ownerGroup.group}`, e)
				})
			}
		}
	}

	async onFullLoginSuccess(_: LoggedInEvent): Promise<void> {}
}
