import { assertNotNull, downcast, isEmpty, neverNull } from "@tutao/utils"
import { Dialog } from "../../../ui/base/Dialog"
import { InfoLink, lang, TranslationKey, TranslationReplacements } from "../../../ui/utils/LanguageViewModel"
import type { ClickHandler } from "../../../ui/base/GuiUtils"
import { locator } from "../api/main/CommonLocator"
import type { UserController } from "../api/main/UserController.js"
import { GENERATED_MAX_ID } from "@tutao/meta"
import { Const, EnvProvider, PaymentSetup, ProgrammingError, UpgradePromptType } from "@tutao/app-env"
import { BookingTypeRef } from "@tutao/entities/sys"
import { AvailablePlanType, NewBusinessPlans, NewPaidPlans, NewPersonalPlans, PaymentMethodType, PlanType } from "../../../entities/sys/Utils"

let upgradeDialogShowing = false

/**
 * Opens a dialog which states that the function is not available in the Free subscription and provides an option to upgrade.
 */
export async function showNotAvailableForFreeDialog(
	upgradePromptType: UpgradePromptType,
	acceptedPlans: readonly AvailablePlanType[] = NewPaidPlans,
): Promise<void> {
	// upgradeDialogShowing prevents the dialog from being opened multiple times, as could happen when waiting for the wizard to import
	if (!upgradeDialogShowing) {
		upgradeDialogShowing = true
		try {
			const wizard = await import("../subscription/UpgradeSubscriptionWizard")
			const customerInfo = await locator.logins.getUserController().loadCustomerInfo()

			const businessPlanRequired =
				acceptedPlans.filter((plan) => NewBusinessPlans.includes(plan)).length === acceptedPlans.length &&
				NewPersonalPlans.includes(downcast(customerInfo.plan))
			const msg = lang.getTranslation(businessPlanRequired ? "pricing.notSupportedByPersonalPlan_msg" : "newPaidPlanRequired_msg")

			await wizard.showUpgradeWizard({
				upgradePromptType,
				logins: locator.logins,
				isCalledBySatisfactionDialog: false,
				acceptedPlans,
				msg,
			})
		} finally {
			upgradeDialogShowing = false
		}
	}
}

export function createNotAvailableForFreeClickHandler(
	upgradePromptType: UpgradePromptType,
	acceptedPlans: readonly AvailablePlanType[],
	click: ClickHandler,
	available: () => boolean,
): ClickHandler {
	return (e, dom) => {
		if (!available()) {
			showNotAvailableForFreeDialog(upgradePromptType, acceptedPlans)
		} else {
			click(e, dom)
		}
	}
}

/**
 * Returns whether a paid subscriptino is active and shows one of the showNotAvailableForFreeDialog or subscription cancelled dialogs if needed.
 */
export async function checkPaidSubscription(upgradePromptType: UpgradePromptType): Promise<boolean> {
	if (locator.logins.getUserController().isFreeAccount()) {
		showNotAvailableForFreeDialog(upgradePromptType)
		return false
	}
	return true
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
			return wizard.showUpgradeWizard({ upgradePromptType: UpgradePromptType.MORE_STORAGE_NEEDED, logins: locator.logins })
		} else {
			const usedStorage = Number(await locator.userManagementFacade.readUsedUserStorage(userController.user))
			const { getAvailableMatchingPlans } = await import("../subscription/utils/SubscriptionUtils.js")
			const plansWithMoreStorage = await getAvailableMatchingPlans(
				locator.serviceExecutor,
				(config) => Number(config.storageGb) * Const.MEMORY_GB_FACTOR > usedStorage,
			)
			if (isEmpty(plansWithMoreStorage)) {
				await Dialog.message(userController.isGlobalAdmin() ? "insufficientStorageAdmin_msg" : "insufficientStorageUser_msg")
			} else {
				await showPlanUpgradeRequiredDialog(UpgradePromptType.MORE_STORAGE_NEEDED, plansWithMoreStorage)
			}
		}
	}
}

/**
 * @returns true if the needed plan has been ordered
 */
export async function showPlanUpgradeRequiredDialog(
	upgradePromptType: UpgradePromptType,
	acceptedPlans: readonly AvailablePlanType[],
	reason?: TranslationKey,
): Promise<boolean> {
	if (isEmpty(acceptedPlans)) {
		throw new ProgrammingError("no plans specified")
	}
	const userController = locator.logins.getUserController()
	if (userController.isFreeAccount()) {
		await showNotAvailableForFreeDialog(upgradePromptType, acceptedPlans)
	} else if (!userController.isGlobalAdmin()) {
		Dialog.message("contactAdmin_msg")
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
	}
	return acceptedPlans.includes(downcast<AvailablePlanType>(await userController.getPlanType()))
}

export async function showUpgradeWizardOrSwitchSubscriptionDialog(
	upgradePromptType: UpgradePromptType,
	userController: UserController,
	acceptedPlans: readonly AvailablePlanType[] = NewPaidPlans,
): Promise<void> {
	if (userController.isFreeAccount()) {
		const { showUpgradeWizard } = await import("../subscription/UpgradeSubscriptionWizard")
		await showUpgradeWizard({ upgradePromptType, logins: locator.logins, acceptedPlans: acceptedPlans })
	} else {
		await showSwitchPlanDialog(userController, acceptedPlans)
	}
}

export async function showDowngradeOrResubscribeDialog(mainText: TranslationKey, replacement?: TranslationReplacements): Promise<boolean> {
	return await Dialog.choice(lang.getTranslation(mainText, replacement ? replacement : undefined), [
		{
			text: "subscriptionSettingDowngrade_action",
			value: false,
		},
		{
			text: "resubscribe_action",
			value: true,
		},
	])
}

export async function showManageSubscriptionThroughExternalStoreDialog(paymentMethod: PaymentMethodType): Promise<void> {
	const term = paymentMethod === PaymentMethodType.AppStore ? "storeSubscription_msg" : "storeSubscriptionGoogle_msg"
	const confirmed = await Dialog.confirm(
		lang.getTranslation(term, {
			"{AppStorePayment}": InfoLink.AppStorePayment,
		}),
	)
	if (confirmed) {
		openExternalSubscriptionPage(paymentMethod)
	}
}

export function openExternalSubscriptionPage(paymentMethod?: PaymentMethodType | null) {
	if (paymentMethod === PaymentMethodType.AppStore || (paymentMethod == null && EnvProvider.get().getPaymentSetup() === PaymentSetup.Appstore)) {
		window.open("https://apps.apple.com/account/subscriptions", "_blank", "noopener,noreferrer")
	} else if (paymentMethod === PaymentMethodType.GooglePlay || (paymentMethod == null && EnvProvider.get().getPaymentSetup() === PaymentSetup.Playstore)) {
		window.open("https://play.google.com/store/account/subscriptions", "_blank", "noopener,noreferrer")
	}
}

async function showSwitchPlanDialog(userController: UserController, acceptedPlans: readonly AvailablePlanType[], reason?: TranslationKey): Promise<void> {
	let customerInfo = await userController.loadCustomerInfo()
	const bookings = await locator.entityClient.loadRange(BookingTypeRef, neverNull(customerInfo.bookings).items, GENERATED_MAX_ID, 1, true)
	const { showSwitchDialog } = await import("../subscription/SwitchSubscriptionDialog")
	return showSwitchDialog({
		customer: await userController.reloadCustomer(),
		accountingInfo: await userController.loadAccountingInfo(),
		lastBooking: assertNotNull(bookings[0]),
		acceptedPlans,
		reason: reason ?? null,
	})
}
