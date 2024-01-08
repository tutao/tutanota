import type { TemplateGroupRoot } from "../api/entities/tutanota/TypeRefs.js"
import { TemplateGroupRootTypeRef } from "../api/entities/tutanota/TypeRefs.js"
import { showPlanUpgradeRequiredDialog } from "../misc/SubscriptionDialogs"
import { locator } from "../api/main/MainLocator"
import { FeatureType } from "../api/common/TutanotaConstants"
import { Dialog } from "../gui/base/Dialog.js"
import { lang } from "../misc/LanguageViewModel.js"
import { isCustomizationEnabledForCustomer } from "../api/common/utils/CustomerUtils.js"

/**
 * @return True if the group has been created.
 */
export async function createInitialTemplateListIfAllowed(): Promise<TemplateGroupRoot | null> {
	const userController = locator.logins.getUserController()
	const customer = await userController.loadCustomer()
	const { getAvailablePlansWithTemplates } = await import("../subscription/SubscriptionUtils.js")
	let allowed = (await userController.getPlanConfig()).templates || isCustomizationEnabledForCustomer(customer, FeatureType.BusinessFeatureEnabled)
	if (!allowed && userController.isGlobalAdmin()) {
		allowed = await showPlanUpgradeRequiredDialog(await getAvailablePlansWithTemplates())
	} else {
		Dialog.message(() => lang.get("contactAdmin_msg"))
	}
	if (allowed) {
		const groupId = await locator.groupManagementFacade.createTemplateGroup("")
		return locator.entityClient.load<TemplateGroupRoot>(TemplateGroupRootTypeRef, groupId)
	} else {
		return null
	}
}
