import { FeatureType } from "../../api/common/TutanotaConstants"
import { locator } from "../../api/main/MainLocator.js"

export function showUpgradeDialog() {
	import("../../subscription/UpgradeSubscriptionWizard.js").then((upgradeWizard) => upgradeWizard.showUpgradeWizard())
}

export function showSupportDialog() {
	import("../../support/SupportDialog.js").then((supportModule) => supportModule.showSupportDialog())
}

export function isNewMailActionAvailable(): boolean {
	return locator.logins.isInternalUserLoggedIn() && !locator.logins.isEnabled(FeatureType.ReplyOnly)
}
