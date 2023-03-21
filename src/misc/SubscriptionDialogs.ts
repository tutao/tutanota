import type { LoginController } from "../api/main/LoginController"
import { CustomerTypeRef } from "../api/entities/sys/TypeRefs.js"
import type { lazy } from "@tutao/tutanota-utils"
import { neverNull } from "@tutao/tutanota-utils"
import { Dialog } from "../gui/base/Dialog"
import type { TranslationKey } from "./LanguageViewModel"
import { InfoLink, lang } from "./LanguageViewModel"
import { isIOSApp } from "../api/common/Env"
import { ProgrammingError } from "../api/common/error/ProgrammingError"
import type { clickHandler } from "../gui/base/GuiUtils"
import { locator } from "../api/main/MainLocator"

/**
 * Opens a dialog which states that the function is not available in the Free subscription and provides an option to upgrade.
 * @param isInPremiumIncluded Whether the feature is included in the premium membership or not.
 */
export async function showNotAvailableForFreeDialog(isInPremiumIncluded: boolean, customMessage?: TranslationKey) {
	const wizard = await import("../subscription/UpgradeSubscriptionWizard")

	if (isIOSApp()) {
		await Dialog.message("notAvailableInApp_msg")
	} else {
		const baseMessage =
			customMessage != null ? customMessage : !isInPremiumIncluded ? "onlyAvailableForPremiumNotIncluded_msg" : "onlyAvailableForPremium_msg"

		const message = `${lang.get(baseMessage)}\n\n${lang.get("premiumOffer_msg")}`
		const confirmed = await Dialog.reminder(lang.get("upgradeReminderTitle_msg"), message, InfoLink.PremiumProBusiness)
		if (confirmed) {
			wizard.showUpgradeWizard()
		}
	}
}

export function createNotAvailableForFreeClickHandler(includedInPremium: boolean, click: clickHandler, available: () => boolean): clickHandler {
	return (e, dom) => {
		if (!available()) {
			showNotAvailableForFreeDialog(includedInPremium)
		} else {
			click(e, dom)
		}
	}
}

/**
 * Returns whether premium is active and shows one of the showNotAvailableForFreeDialog or subscription cancelled dialogs if needed.
 */
export function checkPremiumSubscription(included: boolean): Promise<boolean> {
	if (locator.logins.getUserController().isFreeAccount()) {
		showNotAvailableForFreeDialog(included)
		return Promise.resolve(false)
	}

	return locator.entityClient.load(CustomerTypeRef, neverNull(locator.logins.getUserController().user.customer)).then((customer) => {
		if (customer.canceledPremiumAccount) {
			return Dialog.message("subscriptionCancelledMessage_msg").then(() => false)
		} else {
			return Promise.resolve(true)
		}
	})
}

export function showMoreStorageNeededOrderDialog(loginController: LoginController, messageIdOrMessageFunction: TranslationKey): Promise<void> {
	const userController = locator.logins.getUserController()

	if (!userController.isGlobalAdmin()) {
		throw new ProgrammingError("changing storage or other subscription options is only allowed for global admins")
	}

	if (userController.isFreeAccount()) {
		const confirmMsg = () => lang.get(messageIdOrMessageFunction) + "\n\n" + lang.get("onlyAvailableForPremiumNotIncluded_msg")

		return Dialog.confirm(confirmMsg, "upgrade_action").then((confirm) => {
			if (confirm) {
				import("../subscription/UpgradeSubscriptionWizard").then((wizard) => wizard.showUpgradeWizard())
			}
		})
	} else {
		return import("../subscription/StorageCapacityOptionsDialog").then(({ showStorageCapacityOptionsDialog }) =>
			showStorageCapacityOptionsDialog(messageIdOrMessageFunction),
		)
	}
}

/**
 * @returns true if the business feature has been ordered
 */
export function showBusinessFeatureRequiredDialog(reason: TranslationKey | lazy<string>): Promise<boolean> {
	if (locator.logins.getUserController().isFreeAccount()) {
		showNotAvailableForFreeDialog(false)
		return Promise.resolve(false)
	} else {
		if (locator.logins.getUserController().isGlobalAdmin()) {
			return Dialog.confirm(() => lang.getMaybeLazy(reason) + " " + lang.get("ordertItNow_msg")).then((confirmed) => {
				if (confirmed) {
					return import("../subscription/BuyDialog").then((BuyDialog) => {
						return BuyDialog.showBusinessBuyDialog(true).then((failed) => {
							return !failed
						})
					})
				} else {
					return false
				}
			})
		} else {
			return Dialog.message(() => lang.getMaybeLazy(reason) + " " + lang.get("contactAdmin_msg")).then(() => false)
		}
	}
}
