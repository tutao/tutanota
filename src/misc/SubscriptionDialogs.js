//@flow

/**
 * Wrappers for commonly used dialogs which we don't want to import() every time. This is in the main bundle and we should not import
 * subscription stuff here.
 */
import type {LoginController} from "../api/main/LoginController";
import type {TranslationKey} from "./LanguageViewModel";
import {lang} from "./LanguageViewModel";
import {Dialog} from "../gui/base/Dialog";
import {isIOSApp} from "../api/common/Env";

export function showNotAvailableForFreeDialog(isInPremiumIncluded: boolean) {
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

export function showMoreStorageNeededOrderDialog(loginController: LoginController,
                                                 messageIdOrMessageFunction: TranslationKey | lazy<string>
): Promise<void> {
	return Dialog.confirm(messageIdOrMessageFunction, "upgrade_action").then((confirm) => {
		if (confirm) {
			if (loginController.getUserController().isPremiumAccount()) {
				import("../subscription/StorageCapacityOptionsDialog").then((StorageCapacityOptionsDialog) => {
					StorageCapacityOptionsDialog.show()
				})
			} else {
				showNotAvailableForFreeDialog(false)
			}
		}
	})
}