import { showPlanUpgradeRequiredDialog } from "../../common/misc/SubscriptionDialogs"
import { locator } from "../../common/api/main/CommonLocator"
import { FeatureType, UpgradePromptType } from "../../../platform-kit/app-env"
import { Dialog } from "../../../ui/base/Dialog.js"
import { isCustomizationEnabledForCustomer } from "../../common/api/common/utils/CustomerUtils.js"
import { TemplateGroupRoot, TemplateGroupRootTypeRef } from "@tutao/entities/tutanota"
import { idToElementId } from "@tutao/meta"

/**
 * @return True if the group has been created.
 */
export async function createInitialTemplateListIfAllowed(): Promise<TemplateGroupRoot | null> {
	const userController = locator.logins.getUserController()
	const customer = await userController.reloadCustomer()
	const { getAvailablePlansWithTemplates } = await import("../../common/subscription/utils/SubscriptionUtils.js")
	let allowed = (await userController.getPlanConfig()).templates || isCustomizationEnabledForCustomer(customer, FeatureType.BusinessFeatureEnabled)
	if (!allowed) {
		if (userController.isGlobalAdmin()) {
			allowed = await showPlanUpgradeRequiredDialog(UpgradePromptType.TEMPLATE_LIST, await getAvailablePlansWithTemplates())
		} else {
			Dialog.message("contactAdmin_msg")
		}
	}

	if (allowed) {
		const groupId = await locator.groupManagementFacade.createTemplateGroup("")
		return locator.entityClient.load<TemplateGroupRoot>(TemplateGroupRootTypeRef, idToElementId(groupId))
	} else {
		return null
	}
}
