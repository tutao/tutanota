// @flow
import type {LoginController} from "../api/main/LoginController";
import {logins} from "../api/main/LoginController"
import {load} from "../api/main/Entity"
import {CustomerTypeRef} from "../api/entities/sys/Customer"
import {neverNull} from "@tutao/tutanota-utils"
import {Dialog} from "../gui/base/Dialog"
import type {TranslationKey} from "./LanguageViewModel";
import {lang} from "./LanguageViewModel"
import {isIOSApp} from "../api/common/Env"
import {ProgrammingError} from "../api/common/error/ProgrammingError"
import type {clickHandler} from "../gui/base/GuiUtils"
import type {lazy} from "@tutao/tutanota-utils"

/**
 * Opens a dialog which states that the function is not available in the Free subscription and provides an option to upgrade.
 * @param isInPremiumIncluded Whether the feature is included in the premium membership or not.
 */
export function showNotAvailableForFreeDialog(isInPremiumIncluded: boolean): void {
	Promise.all([
		import("../subscription/UpgradeSubscriptionWizard"), import("../subscription/PriceUtils")
	]).then(([wizard, priceUtils]) => {
		if (isIOSApp()) {
			Dialog.error("notAvailableInApp_msg")
		} else {
			let message = lang.get(!isInPremiumIncluded ? "onlyAvailableForPremiumNotIncluded_msg" : "onlyAvailableForPremium_msg") + " "
				+ lang.get("premiumOffer_msg", {"{1}": priceUtils.formatPrice(1, true)})
			Dialog.reminder(lang.get("upgradeReminderTitle_msg"), message, lang.getInfoLink("premiumProBusiness_link"))
			      .then(confirmed => {
				      if (confirmed) {
					      wizard.showUpgradeWizard()
				      }
			      })
		}
	})

}

export function createNotAvailableForFreeClickHandler(includedInPremium: boolean,
                                                      click: clickHandler,
                                                      available: () => boolean): clickHandler {
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
	if (logins.getUserController().isFreeAccount()) {
		showNotAvailableForFreeDialog(included)
		return Promise.resolve(false)
	}
	return load(CustomerTypeRef, neverNull(logins.getUserController().user.customer)).then((customer) => {
		if (customer.canceledPremiumAccount) {
			return Dialog.error("subscriptionCancelledMessage_msg").then(() => false)
		} else {
			return Promise.resolve(true)
		}
	})
}

export function showMoreStorageNeededOrderDialog(loginController: LoginController, messageIdOrMessageFunction: TranslationKey): Promise<void> {
	const userController = logins.getUserController()
	if (!userController.isGlobalAdmin()) {
		throw new ProgrammingError("changing storage or other subscription options is only allowed for global admins")
	}
	if (userController.isFreeAccount()) {
		const confirmMsg = () => lang.get(messageIdOrMessageFunction) + "\n\n" + lang.get("onlyAvailableForPremiumNotIncluded_msg")
		return Dialog.confirm(confirmMsg, "upgrade_action").then((confirm) => {
			if (confirm) {
				import("../subscription/UpgradeSubscriptionWizard").then(wizard => wizard.showUpgradeWizard())
			}
		})
	} else {
		return import("../subscription/StorageCapacityOptionsDialog")
			.then(({showStorageCapacityOptionsDialog}) => showStorageCapacityOptionsDialog(messageIdOrMessageFunction))
	}
}

/**
 * @returns true if the business feature has been ordered
 */
export function showBusinessFeatureRequiredDialog(reason: TranslationKey | lazy<string>): Promise<boolean> {
	if (logins.getUserController().isFreeAccount()) {
		showNotAvailableForFreeDialog(false)
		return Promise.resolve(false)
	} else {
		if (logins.getUserController().isGlobalAdmin()) {
			return Dialog.confirm(() => lang.getMaybeLazy(reason) + " " + lang.get("ordertItNow_msg"))
			             .then(confirmed => {
				             if (confirmed) {
					             return import("../subscription/BuyDialog").then((BuyDialog) => {
						             return BuyDialog.showBusinessBuyDialog(true).then(failed => {
							             return !failed
						             })
					             })
				             } else {
					             return false
				             }
			             })

		} else {
			return Dialog.error(() => lang.getMaybeLazy(reason) + " " + lang.get("contactAdmin_msg"))
			             .then(() => false)
		}
	}
}