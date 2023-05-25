import type { LoginController } from "../api/main/LoginController"
import { assertNotNull, downcast, neverNull } from "@tutao/tutanota-utils"
import { Dialog } from "../gui/base/Dialog"
import type { TranslationKey, TranslationText } from "./LanguageViewModel"
import { isIOSApp } from "../api/common/Env"
import type { clickHandler } from "../gui/base/GuiUtils"
import { locator } from "../api/main/MainLocator"
import type { UserController } from "../api/main/UserController.js"
import { BookingTypeRef } from "../api/entities/sys/TypeRefs.js"
import { GENERATED_MAX_ID } from "../api/common/utils/EntityUtils.js"
import { AvailablePlanType, NewBusinessPlans, NewPaidPlans, NewPersonalPlans, PlanType } from "../api/common/TutanotaConstants.js"
import { showSwitchDialog } from "../subscription/SwitchSubscriptionDialog.js"

/**
 * Opens a dialog which states that the function is not available in the Free subscription and provides an option to upgrade.
 */
export async function showNotAvailableForFreeDialog(acceptedPlans: AvailablePlanType[] = NewPaidPlans) {
	if (isIOSApp()) {
		await Dialog.message("notAvailableInApp_msg")
	} else {
		const wizard = await import("../subscription/UpgradeSubscriptionWizard")
		const customerInfo = await locator.logins.getUserController().loadCustomerInfo()

		const businessPlanRequired =
			acceptedPlans.filter((plan) => NewBusinessPlans.includes(plan)).length === acceptedPlans.length &&
			NewPersonalPlans.includes(downcast(customerInfo.plan))
		const msg = businessPlanRequired ? "pricing.notSupportedByPersonalPlan_msg" : "newPaidPlanRequired_msg"

		await wizard.showUpgradeWizard(acceptedPlans, msg)
	}
}

export function createNotAvailableForFreeClickHandler(
	acceptedPlans: AvailablePlanType[] = NewPaidPlans,
	click: clickHandler,
	available: () => boolean,
): clickHandler {
	return (e, dom) => {
		if (!available()) {
			showNotAvailableForFreeDialog(acceptedPlans)
		} else {
			click(e, dom)
		}
	}
}

/**
 * Returns whether premium is active and shows one of the showNotAvailableForFreeDialog or subscription cancelled dialogs if needed.
 */
export function checkPremiumSubscription(): Promise<boolean> {
	if (locator.logins.getUserController().isFreeAccount()) {
		showNotAvailableForFreeDialog()
		return Promise.resolve(false)
	}

	return locator.logins
		.getUserController()
		.loadCustomer()
		.then((customer) => {
			if (customer.canceledPremiumAccount) {
				return Dialog.message("subscriptionCancelledMessage_msg").then(() => false)
			} else {
				return Promise.resolve(true)
			}
		})
}

export async function showMoreStorageNeededOrderDialog(loginController: LoginController, messageIdOrMessageFunction: TranslationKey): Promise<PlanType | void> {
	const userController = locator.logins.getUserController()
	if (!userController.isGlobalAdmin()) {
		return Dialog.message("insufficientStorageWarning_msg")
	}
	const confirmed = await Dialog.confirm(messageIdOrMessageFunction, "upgrade_action")
	if (confirmed) {
		if (userController.isFreeAccount()) {
			const wizard = await import("../subscription/UpgradeSubscriptionWizard")
			return wizard.showUpgradeWizard()
		} else {
			await showPlanUpgradeRequiredDialog()
		}
	}
}

/**
 * @returns true if the needed plan has been ordered
 */
export async function showPlanUpgradeRequiredDialog(acceptedPlans: AvailablePlanType[] = NewPaidPlans, reason?: TranslationText): Promise<boolean> {
	const userController = locator.logins.getUserController()
	if (userController.isFreeAccount()) {
		showNotAvailableForFreeDialog(acceptedPlans)
		return false
	} else {
		if (reason == null) {
			// show generic reason if not supplied
			let customerInfo = await userController.loadCustomerInfo()
			const businessPlanRequired =
				acceptedPlans.filter((plan) => NewBusinessPlans.includes(plan)).length === acceptedPlans.length &&
				!NewBusinessPlans.includes(downcast(customerInfo.plan))
			reason = businessPlanRequired ? "pricing.notSupportedByPersonalPlan_msg" : "newPaidPlanRequired_msg"
		}
		await showSwitchPlanDialog(userController, acceptedPlans, reason)
		return acceptedPlans.includes(downcast<AvailablePlanType>(await userController.getPlanType()))
	}
}

export async function showUpgradeWizardOrSwitchSubscriptionDialog(userController: UserController): Promise<PlanType> {
	if (userController.isFreeAccount()) {
		const { showUpgradeWizard } = await import("../subscription/UpgradeSubscriptionWizard")
		return showUpgradeWizard()
	} else {
		return showSwitchPlanDialog(userController, NewPaidPlans)
	}
}

async function showSwitchPlanDialog(userController: UserController, acceptedPlans: AvailablePlanType[], reason?: TranslationText): Promise<PlanType> {
	let customerInfo = await userController.loadCustomerInfo()
	const bookings = await locator.entityClient.loadRange(BookingTypeRef, neverNull(customerInfo.bookings).items, GENERATED_MAX_ID, 1, true)
	const { showSwitchDialog } = await import("../subscription/SwitchSubscriptionDialog")
	return showSwitchDialog(
		await userController.loadCustomer(),
		customerInfo,
		await userController.loadAccountingInfo(),
		assertNotNull(bookings[0]),
		acceptedPlans,
		reason ?? null,
	)
}
