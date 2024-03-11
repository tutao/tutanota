import { createWizardDialog, wizardPageWrapper } from "../../../gui/base/WizardDialog.js"
import { defer } from "@tutao/tutanota-utils"
import { SetupCongratulationsPage, SetupCongratulationsPageAttrs } from "./setupwizardpages/SetupCongraulationsPage.js"
import { DeviceConfig } from "../../../misc/DeviceConfig.js"
import m from "mithril"
import { SetupNotificationsPage, SetupNotificationsPageAttrs } from "./setupwizardpages/SetupNotificationsPage.js"
import { BannerButton } from "../../../gui/base/buttons/BannerButton.js"
import { theme } from "../../../gui/theme.js"
import { ClickHandler } from "../../../gui/base/GuiUtils.js"
import { DialogType } from "../../../gui/base/Dialog.js"
import { TranslationKey } from "../../../misc/LanguageViewModel.js"
import { SetupThemePage, SetupThemePageAttrs } from "./setupwizardpages/SetupThemePage.js"
import { SetupContactsPage, SetupContactsPageAttrs } from "./setupwizardpages/SetupContactsPage.js"
import { SetupLockPage, SetupLockPageAttrs } from "./setupwizardpages/SetupLockPage.js"
import { SystemPermissionHandler } from "../SystemPermissionHandler.js"
import { WebMobileFacade } from "../WebMobileFacade.js"
import { ContactImporter } from "../../../contacts/ContactImporter.js"
import { MobileSystemFacade } from "../../common/generatedipc/MobileSystemFacade.js"
import { CredentialsProvider } from "../../../misc/credentials/CredentialsProvider.js"
import { NativeContactsSyncManager } from "../../../contacts/model/NativeContactsSyncManager.js"
import { locator } from "../../../api/main/MainLocator.js"

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
		wizardPageWrapper(SetupLockPage, new SetupLockPageAttrs(locator.systemFacade)),
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
