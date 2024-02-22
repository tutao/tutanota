import { createWizardDialog, emitWizardEvent, WizardEventType, wizardPageWrapper } from "../base/WizardDialog.js"
import { defer } from "@tutao/tutanota-utils"
import { SetupCongratulationsPage, SetupCongratulationsPageAttrs } from "./setupwizardpages/SetupCongraulationsPage.js"
import { deviceConfig } from "../../misc/DeviceConfig.js"
import m from "mithril"
import { LoginButton } from "../base/buttons/LoginButton.js"
import { isAndroidApp, isApp } from "../../api/common/Env.js"
import { NotificationPermissionsData, SetupNotificationsPage, SetupNotificationsPageAttrs } from "./setupwizardpages/SetupNotificationsPage.js"
import { BannerButton } from "../base/buttons/BannerButton.js"
import { theme } from "../theme.js"
import { ClickHandler } from "../base/GuiUtils.js"
import { PermissionType } from "../../native/common/generatedipc/PermissionType.js"
import { locator } from "../../api/main/MainLocator.js"
import { PermissionError } from "../../api/common/error/PermissionError.js"
import { Dialog } from "../base/Dialog.js"
import stream from "mithril/stream"
import { TranslationKey } from "../../misc/LanguageViewModel.js"
import { SetupThemePage, SetupThemePageAttrs } from "./setupwizardpages/SetupThemePage.js"

export function renderPermissionButton(permissionName: TranslationKey, isPermissionGranted: boolean, onclick: ClickHandler) {
	return m(BannerButton, {
		text: isPermissionGranted ? "granted_msg" : permissionName,
		borderColor: theme.content_accent,
		color: theme.content_accent,
		class: "b full-width mt-s",
		click: (event: MouseEvent, dom: HTMLElement) => {
			onclick(event, dom)
			console.log("Click called.")
		},
		disabled: isPermissionGranted,
	})
}

// Show the onboarding wizard if this is the first time the app has been opened since install
export async function showSetupWizardIfNeeded(): Promise<void> {
	const isSetupComplete = deviceConfig.getIsSetupComplete()
	if (isApp() && !isSetupComplete) {
		await showSetupWizard()
	}
}

export async function showSetupWizard(): Promise<void> {
	const NotificationPermissions = stream<NotificationPermissionsData>(await queryPermissionsState())

	const wizardPages = [
		wizardPageWrapper(SetupCongratulationsPage, new SetupCongratulationsPageAttrs()),
		wizardPageWrapper(SetupNotificationsPage, new SetupNotificationsPageAttrs(NotificationPermissions)),
		wizardPageWrapper(SetupThemePage, new SetupThemePageAttrs()),
	]
	const deferred = defer<void>()

	const wizardBuilder = createWizardDialog(null, wizardPages, async () => {
		deviceConfig.setIsSetupComplete(true)
		deferred.resolve()
	})

	wizardBuilder.dialog.show()
	return deferred.promise
}

export async function queryPermissionsState() {
	return {
		isNotificationPermissionGranted: await hasPermission(PermissionType.Notification),
		isBatteryPermissionGranted: isAndroidApp() ? await hasPermission(PermissionType.IgnoreBatteryOptimization) : true,
	}
}

async function hasPermission(permission: PermissionType): Promise<boolean> {
	return await locator.systemFacade.hasPermission(permission)
}

export async function requestPermission(permission: PermissionType, deniedMessage: TranslationKey): Promise<boolean> {
	try {
		await locator.systemFacade.requestPermission(permission)
		return true
	} catch (e) {
		if (e instanceof PermissionError) {
			console.warn("Permission denied for", permission)
			Dialog.message(deniedMessage).then(() => locator.systemFacade.goToSettings())
			return false
		}
		throw e
	}
}
