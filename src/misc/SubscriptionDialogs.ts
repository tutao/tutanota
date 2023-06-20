import { assertNotNull, downcast, neverNull } from "@tutao/tutanota-utils"
import { Dialog } from "../gui/base/Dialog"
import type { TranslationKey, TranslationText } from "./LanguageViewModel"
import { isIOSApp } from "../api/common/Env"
import type { clickHandler } from "../gui/base/GuiUtils"
import { locator } from "../api/main/MainLocator"
import type { UserController } from "../api/main/UserController.js"
import { BookingTypeRef, PlanConfiguration } from "../api/entities/sys/TypeRefs.js"
import { GENERATED_MAX_ID } from "../api/common/utils/EntityUtils.js"
import { AvailablePlanType, Const, NewBusinessPlans, NewPaidPlans, NewPersonalPlans, PlanType } from "../api/common/TutanotaConstants.js"
import { showSwitchDialog } from "../subscription/SwitchSubscriptionDialog.js"
import { UserError } from "../api/main/UserError.js"
import { IServiceExecutor } from "../api/common/ServiceRequest.js"
import { ProgrammingError } from "../api/common/error/ProgrammingError.js"

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

		await wizard.showUpgradeWizard(locator.logins, acceptedPlans, msg)
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

/**
 * Get plans that are available for purchase and that comply with the given criteria.
 * @param serviceExecutor
 * @param predicate
 */
export async function getAvailableMatchingPlans(
	serviceExecutor: IServiceExecutor,
	predicate: (configuration: PlanConfiguration) => boolean,
): Promise<Array<AvailablePlanType>> {
	const { PriceAndConfigProvider } = await import("../subscription/PriceUtils.js")
	const priceAndConfigProvider = await PriceAndConfigProvider.getInitializedInstance(null, serviceExecutor, null)
	return NewPaidPlans.filter((p) => {
		const config = priceAndConfigProvider.getPlanPricesForPlan(p).planConfiguration
		return predicate(config)
	})
}

/**
 * Filter for plans a customer can upgrade to that include a feature, assuming that the feature must be available on at least one plan.
 * @param predicate the criterion to select plans by
 * @param errorMessage the error message to throw in case no plan satisfies the criterion
 */
async function getPlansThatShouldExist(predicate: (configuration: PlanConfiguration) => boolean, errorMessage: string): Promise<Array<AvailablePlanType>> {
	const plans = await getAvailableMatchingPlans(locator.serviceExecutor, predicate)
	if (plans.length <= 0) {
		throw new ProgrammingError(errorMessage)
	}
	return plans
}

/**
 * Get plans that a customer can upgrade to that include the Whitelabel feature.
 * @throws ProgrammingError if no plans include it.
 */
export async function getAvailablePlansWithWhitelabel(): Promise<Array<AvailablePlanType>> {
	return getPlansThatShouldExist((config) => config.whitelabel, "no available plan with the Whitelabel feature")
}

/**
 * Get plans that a customer can upgrade to that include the Whitelabel feature.
 * @throws ProgrammingError if no plans include it.
 */
export async function getAvailablePlansWithTemplates(): Promise<Array<AvailablePlanType>> {
	return getPlansThatShouldExist((config) => config.templates, "no available plan with the Templates feature")
}

/**
 * Get plans that a customer can upgrade to that include the Sharing feature.
 * @throws ProgrammingError if no plans include it.
 */
export async function getAvailablePlansWithSharing(): Promise<Array<AvailablePlanType>> {
	return getPlansThatShouldExist((config) => config.sharing, "no available plan with the Sharing feature")
}

/**
 * Get plans that a customer can upgrade to that include the Event Invites feature.
 * @throws ProgrammingError if no plans include it.
 */
export async function getAvailablePlansWithEventInvites(): Promise<Array<AvailablePlanType>> {
	return getPlansThatShouldExist((config) => config.eventInvites, "no available plan with the Event Invites feature")
}

/**
 * Get plans that a customer can upgrade to that include the Auto-Responder feature.
 * @throws ProgrammingError if no plans include it.
 */
export async function getAvailablePlansWithAutoResponder(): Promise<Array<AvailablePlanType>> {
	return getPlansThatShouldExist((config) => config.autoResponder, "no available plan with the Auto-Responder feature")
}

export async function showMoreStorageNeededOrderDialog(messageIdOrMessageFunction: TranslationKey): Promise<PlanType | void> {
	const userController = locator.logins.getUserController()
	if (!userController.isGlobalAdmin()) {
		return Dialog.message("insufficientStorageWarning_msg")
	}
	const confirmed = await Dialog.confirm(messageIdOrMessageFunction, "upgrade_action")
	if (confirmed) {
		if (userController.isFreeAccount()) {
			const wizard = await import("../subscription/UpgradeSubscriptionWizard")
			return wizard.showUpgradeWizard(locator.logins)
		} else {
			const user = locator.logins.getUserController().user
			const usedStorage = Number(await locator.userManagementFacade.readUsedUserStorage(user))

			const plansWithMoreStorage = await getAvailableMatchingPlans(
				locator.serviceExecutor,
				(config) => Number(config.storageGb) * Const.MEMORY_GB_FACTOR > usedStorage,
			)
			if (plansWithMoreStorage.length > 0) {
				await showPlanUpgradeRequiredDialog(plansWithMoreStorage)
			} else {
				if (userController.isGlobalAdmin()) {
					throw new UserError("insufficientStorageAdmin_msg")
				} else {
					throw new UserError("insufficientStorageUser_msg")
				}
			}
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
		return showUpgradeWizard(locator.logins)
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
