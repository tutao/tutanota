import { FeatureType } from "../../api/common/TutanotaConstants"
import { locator } from "../../api/main/MainLocator.js"
import { LoginController } from "../../api/main/LoginController.js"

export function showUpgradeDialog() {
	import("../../subscription/UpgradeSubscriptionWizard.js").then((upgradeWizard) => upgradeWizard.showUpgradeWizard())
}

export function showSupportDialog(logins: LoginController) {
	import("../../support/SupportDialog.js").then((supportModule) => supportModule.showSupportDialog(logins))
}

export function isNewMailActionAvailable(): boolean {
	return locator.logins.isInternalUserLoggedIn() && !locator.logins.isEnabled(FeatureType.ReplyOnly)
}
