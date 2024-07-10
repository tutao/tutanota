import type { TemplateGroupRoot } from "../../common/api/entities/tutanota/TypeRefs.js"
import { TemplateGroupRootTypeRef } from "../../common/api/entities/tutanota/TypeRefs.js"
import { showPlanUpgradeRequiredDialog } from "../../common/misc/SubscriptionDialogs"
import { locator } from "../../common/api/main/CommonLocator"
import { FeatureType } from "../../common/api/common/TutanotaConstants"
import { Dialog } from "../../common/gui/base/Dialog.js"
import { lang } from "../../common/misc/LanguageViewModel.js"
import { isCustomizationEnabledForCustomer } from "../../common/api/common/utils/CustomerUtils.js"

/**
 * @return True if the group has been created.
 */
export async function createInitialTemplateListIfAllowed(): Promise<TemplateGroupRoot | null> {
	const userController = locator.logins.getUserController()
	const customer = await userController.loadCustomer()
	const { getAvailablePlansWithTemplates } = await import("../../common/subscription/SubscriptionUtils.js")
	let allowed = (await userController.getPlanConfig()).templates || isCustomizationEnabledForCustomer(customer, FeatureType.BusinessFeatureEnabled)
	if (!allowed) {
		if (userController.isGlobalAdmin()) {
			allowed = await showPlanUpgradeRequiredDialog(await getAvailablePlansWithTemplates())
		} else {
			Dialog.message(() => lang.get("contactAdmin_msg"))
		}
	}

	if (allowed) {
		const groupId = await locator.groupManagementFacade.createTemplateGroup("")
		return locator.entityClient.load<TemplateGroupRoot>(TemplateGroupRootTypeRef, groupId)
	} else {
		return null
	}
}
