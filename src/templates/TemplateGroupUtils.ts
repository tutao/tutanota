import type { TemplateGroupRoot } from "../api/entities/tutanota/TypeRefs.js"
import { TemplateGroupRootTypeRef } from "../api/entities/tutanota/TypeRefs.js"
import { showPlanUpgradeRequiredDialog } from "../misc/SubscriptionDialogs"
import { locator } from "../api/main/MainLocator"
import { FeatureType, PlanType } from "../api/common/TutanotaConstants"
import { isCustomizationEnabledForCustomer } from "../api/common/utils/Utils"

/**
 * @return True if the group has been created.
 */
export async function createInitialTemplateListIfAllowed(): Promise<TemplateGroupRoot | null> {
	const userController = locator.logins.getUserController()
	const customer = await userController.loadCustomer()
	const allowed =
		(await userController.getPlanConfig()).templates ||
		isCustomizationEnabledForCustomer(customer, FeatureType.BusinessFeatureEnabled) ||
		(await showPlanUpgradeRequiredDialog([PlanType.Unlimited]))
	if (allowed) {
		const groupId = await locator.groupManagementFacade.createTemplateGroup("")
		return locator.entityClient.load<TemplateGroupRoot>(TemplateGroupRootTypeRef, groupId)
	} else {
		return null
	}
}
