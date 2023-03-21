import type { TemplateGroupRoot } from "../api/entities/tutanota/TypeRefs.js"
import { TemplateGroupRootTypeRef } from "../api/entities/tutanota/TypeRefs.js"
import { showBusinessFeatureRequiredDialog } from "../misc/SubscriptionDialogs"
import { locator } from "../api/main/MainLocator"
import { FeatureType } from "../api/common/TutanotaConstants"
import { isCustomizationEnabledForCustomer } from "../api/common/utils/Utils"

/**
 * @return True if the group has been created.
 */
export async function createInitialTemplateListIfAllowed(): Promise<TemplateGroupRoot | null> {
	const customer = await locator.logins.getUserController().loadCustomer()
	const allowed =
		isCustomizationEnabledForCustomer(customer, FeatureType.BusinessFeatureEnabled) ||
		(await showBusinessFeatureRequiredDialog("businessFeatureRequiredTemplates_msg"))
	if (allowed) {
		const groupId = await locator.groupManagementFacade.createTemplateGroup("")
		return locator.entityClient.load<TemplateGroupRoot>(TemplateGroupRootTypeRef, groupId)
	} else {
		return null
	}
}
