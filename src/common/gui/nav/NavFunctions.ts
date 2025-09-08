import { FeatureType } from "../../api/common/TutanotaConstants"
import { locator } from "../../api/main/CommonLocator.js"
import { LoginController } from "../../api/main/LoginController.js"

/**
 * Opens the upgrade dialog.
 * The promise resolves, as soon as the dialog is closed. This can be caused either due to a successful upgrade or when the user just dismissed the dialog.
 */
export async function showUpgradeDialog(isCalledBySatisfactionDialog = false): Promise<void> {
	await (
		await import("../../subscription/UpgradeSubscriptionWizard.js")
	).showUpgradeWizard({
		logins: locator.logins,
		isCalledBySatisfactionDialog,
	})
}

export async function showSupportDialog(logins: LoginController) {
	const supportModule = await import("../../support/SupportDialog.js")
	const { getSupportUsageTestStage } = await import("../../support/SupportUsageTestUtils.js")

	const triggerStage = getSupportUsageTestStage(0)
	triggerStage.setMetric({ name: "Trigger", value: "Sidebar" })
	void triggerStage.complete()

	return supportModule.showSupportDialog(logins)
}

export function isNewMailActionAvailable(): boolean {
	return locator.logins.isInternalUserLoggedIn() && !locator.logins.isEnabled(FeatureType.ReplyOnly)
}
