import { createWizardDialog, WizardPageWrapper, wizardPageWrapper } from "../../../gui/base/WizardDialog.js"
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
import { ContactImporter } from "../../../../mail-app/contacts/ContactImporter.js"
import { MobileSystemFacade } from "../../common/generatedipc/MobileSystemFacade.js"
import { NativeContactsSyncManager } from "../../../../mail-app/contacts/model/NativeContactsSyncManager.js"
import { locator } from "../../../api/main/CommonLocator.js"
import { PermissionType } from "../../common/generatedipc/PermissionType.js"
import { CredentialsProvider } from "../../../misc/credentials/CredentialsProvider.js"

export async function showSetupWizard(
	systemPermissionHandler: SystemPermissionHandler,
	webMobileFacade: WebMobileFacade,
	contactImporter: ContactImporter | null,
	systemFacade: MobileSystemFacade,
	credentialsProvider: CredentialsProvider,
	contactSyncManager: NativeContactsSyncManager | null,
	deviceConfig: DeviceConfig,
	allowContactSyncAndImport: boolean,
): Promise<void> {
	const permissionStatus = await systemPermissionHandler.queryPermissionsState([
		PermissionType.Contacts,
		PermissionType.Notification,
		PermissionType.IgnoreBatteryOptimization,
	])

	let wizardPages: WizardPageWrapper<any>[] = []
	wizardPages.push(wizardPageWrapper(SetupCongratulationsPage, new SetupCongratulationsPageAttrs()))
	wizardPages.push(
		wizardPageWrapper(
			SetupNotificationsPage,
			new SetupNotificationsPageAttrs(
				{
					isNotificationPermissionGranted: permissionStatus.get(PermissionType.Notification) ?? false,
					isBatteryPermissionGranted: permissionStatus.get(PermissionType.IgnoreBatteryOptimization) ?? false,
				},
				webMobileFacade.getIsAppVisible(),
				systemPermissionHandler,
			),
		),
	)
	wizardPages.push(wizardPageWrapper(SetupThemePage, new SetupThemePageAttrs()))
	if (allowContactSyncAndImport && contactSyncManager && contactImporter) {
		wizardPages.push(
			wizardPageWrapper(SetupContactsPage, new SetupContactsPageAttrs(contactSyncManager, contactImporter, systemFacade, allowContactSyncAndImport)),
		)
	}
	wizardPages.push(wizardPageWrapper(SetupLockPage, new SetupLockPageAttrs(locator.systemFacade)))

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
