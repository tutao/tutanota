import { createWizardDialog, wizardPageWrapper } from "../base/WizardDialog.js"
import { defer } from "@tutao/tutanota-utils"
import { SetupCongratulationsPage, SetupCongratulationsPageAttrs } from "./setupwizardpages/SetupCongraulationsPage.js"
import { DeviceConfig, deviceConfig } from "../../misc/DeviceConfig.js"
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
import { SystemPermissionHandler } from "../../native/main/SystemPermissionHandler.js"
import { WebMobileFacade } from "../../native/main/WebMobileFacade.js"
import { ContactImporter } from "../../contacts/ContactImporter.js"
import { MobileSystemFacade } from "../../native/common/generatedipc/MobileSystemFacade.js"
import { CredentialsProvider } from "../../misc/credentials/CredentialsProvider.js"
import { NativeContactsSyncManager } from "../../contacts/model/NativeContactsSyncManager.js"

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

export async function showSetupWizard(
	systemPermissionHandler: SystemPermissionHandler,
	webMobileFacade: WebMobileFacade,
	contactImporter: ContactImporter,
	systemFacade: MobileSystemFacade,
	credentialsProvider: CredentialsProvider,
	contactSyncManager: NativeContactsSyncManager,
	deviceConfig: DeviceConfig,
): Promise<void> {
	const wizardPages = [
		wizardPageWrapper(SetupCongratulationsPage, new SetupCongratulationsPageAttrs()),
		wizardPageWrapper(
			SetupNotificationsPage,
			new SetupNotificationsPageAttrs(await systemPermissionHandler.queryPermissionsState(), webMobileFacade.getIsAppVisible(), systemPermissionHandler),
		),
		wizardPageWrapper(SetupThemePage, new SetupThemePageAttrs()),
		wizardPageWrapper(SetupContactsPage, new SetupContactsPageAttrs(contactSyncManager, contactImporter, systemFacade)),
		wizardPageWrapper(SetupLockPage, new SetupLockPageAttrs(credentialsProvider)),
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
