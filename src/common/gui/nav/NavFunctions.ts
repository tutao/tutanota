import { FeatureType } from "../../api/common/TutanotaConstants"
import { locator } from "../../api/main/CommonLocator.js"
import { LoginController } from "../../api/main/LoginController.js"

/**
 * Opens the upgrade dialog.
 * The promise resolves, as soon as the dialog is closed. This can be caused either due to a successful upgrade or when the user just dismissed the dialog.
 */
export async function showUpgradeDialog(): Promise<void> {
	await (await import("../../subscription/UpgradeSubscriptionWizard.js")).showUpgradeWizard(locator.logins)
}

export function showSupportDialog(logins: LoginController) {
	import("../../support/SupportDialog.js").then((supportModule) => supportModule.showSupportDialog(logins))
}

export function isNewMailActionAvailable(): boolean {
	return locator.logins.isInternalUserLoggedIn() && !locator.logins.isEnabled(FeatureType.ReplyOnly)
}
