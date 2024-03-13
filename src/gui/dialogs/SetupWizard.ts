import { createWizardDialog, wizardPageWrapper } from "../base/WizardDialog.js"
import { defer } from "@tutao/tutanota-utils"
import { SetupCongratulationsPage, SetupCongratulationsPageAttrs } from "./setupwizardpages/SetupCongraulationsPage.js"
import { deviceConfig } from "../../misc/DeviceConfig.js"
import m from "mithril"
import { isAndroidApp, isApp } from "../../api/common/Env.js"
import { SetupNotificationsPage, SetupNotificationsPageAttrs } from "./setupwizardpages/SetupNotificationsPage.js"
import { BannerButton } from "../base/buttons/BannerButton.js"
import { theme } from "../theme.js"
import { ClickHandler } from "../base/GuiUtils.js"
import { PermissionType } from "../../native/common/generatedipc/PermissionType.js"
import { locator } from "../../api/main/MainLocator.js"
import { PermissionError } from "../../api/common/error/PermissionError.js"
import { Dialog, DialogType } from "../base/Dialog.js"
import { TranslationKey } from "../../misc/LanguageViewModel.js"
import { SetupThemePage, SetupThemePageAttrs } from "./setupwizardpages/SetupThemePage.js"
import { SetupContactsPage, SetupContactsPageAttrs } from "./setupwizardpages/SetupContactsPage.js"
import { SetupLockPage, SetupLockPageAttrs } from "./setupwizardpages/SetupLockPage.js"

export function renderPermissionButton(permissionName: TranslationKey, isPermissionGranted: boolean, onclick: ClickHandler) {
	return renderBannerButton(isPermissionGranted ? "granted_msg" : permissionName, onclick, isPermissionGranted)
}

export function renderBannerButton(text: TranslationKey, onclick: ClickHandler, isDisabled?: boolean, classes?: string) {
	return m(BannerButton, {
		text,
		borderColor: theme.content_accent,
		color: theme.content_accent,
		class: "b full-width button-content " + classes,
		click: (event: MouseEvent, dom: HTMLElement) => {
			onclick(event, dom)
		},
		disabled: isDisabled ?? undefined,
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
	const wizardPages = [
		wizardPageWrapper(SetupCongratulationsPage, new SetupCongratulationsPageAttrs()),
		wizardPageWrapper(SetupNotificationsPage, new SetupNotificationsPageAttrs(await queryPermissionsState(), locator.webMobileFacade.getIsAppVisible())),
		wizardPageWrapper(SetupThemePage, new SetupThemePageAttrs()),
		wizardPageWrapper(
			SetupContactsPage,
			new SetupContactsPageAttrs(locator.nativeContactsSyncManager(), await locator.contactImporter(), locator.systemFacade),
		),
		wizardPageWrapper(SetupLockPage, new SetupLockPageAttrs(locator.credentialsProvider)),
	]
	const deferred = defer<void>()

	const wizardBuilder = createWizardDialog(
		null,
		wizardPages,
		async () => {
			deviceConfig.setIsSetupComplete(true)
			deferred.resolve()
		},
		DialogType.EditSmall,
	)

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
