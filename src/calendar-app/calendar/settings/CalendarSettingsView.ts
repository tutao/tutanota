import { assertMainOrNode } from "@tutao/app-env"
import { LoginController } from "../../../common/api/main/LoginController.js"
import { SettingsViewSection } from "../../../common/settings/Interfaces.js"
import type { MobilePaymentsFacade } from "../../../common/native/common/generatedipc/MobilePaymentsFacade"
import { EntityClient } from "../../../common/api/common/EntityClient"
import { ThemeController } from "../../../common/gui/ThemeController"
import { WhitelabelThemeGenerator } from "../../../common/gui/WhitelabelThemeGenerator"
import { lang } from "../../../common/misc/LanguageViewModel"
import { CredentialsProvider } from "../../../common/misc/credentials/CredentialsProvider"
import { MobileSystemFacade } from "../../../common/native/common/generatedipc/MobileSystemFacade"
import { appearanceSettings, loginSettings, subscriptionSettingsSection, whitelabelSettings } from "../../../common/settings/standardSettings"
import { SettingsFolder } from "../../../common/settings/SettingsFolder"
import { Icons } from "../../../common/gui/base/icons/Icons"
import { NotificationSettingsViewer } from "./NotificationSettingsViewer"
import { GlobalSettingsViewer } from "./GlobalSettingsViewer"

assertMainOrNode()

export function makeCalendarSettings(
	credentialsProvider: CredentialsProvider,
	systemFacade: MobileSystemFacade,
	entityClient: EntityClient,
	logins: LoginController,
	themeController: ThemeController,
	whitelabelThemeGenerator: WhitelabelThemeGenerator,
	mobilePaymentsFacade: MobilePaymentsFacade,
): readonly SettingsViewSection[] {
	return [
		{
			name: lang.getTranslation("userSettings_label"),
			settings: [loginSettings(credentialsProvider, systemFacade), appearanceSettings(), notificationSettings()],
		},
		adminSettingsSection(logins, entityClient, themeController, whitelabelThemeGenerator),
		subscriptionSettingsSection(logins, mobilePaymentsFacade),
	]
}
export function notificationSettings(): SettingsFolder<unknown> {
	return new SettingsFolder(
		() => "notificationSettings_action",
		() => Icons.BellFilled,
		"notifications",
		() => new NotificationSettingsViewer(),
		undefined,
	)
}
export function adminSettingsSection(
	logins: LoginController,
	entityClient: EntityClient,
	themeController: ThemeController,
	whitelabelThemeGenerator: WhitelabelThemeGenerator,
): SettingsViewSection {
	return {
		name: lang.getTranslation("adminSettings_label"),
		settings: [
			new SettingsFolder(
				() => "globalSettings_label",
				() => Icons.GearWheelFilled,
				"global",
				() => new GlobalSettingsViewer(),
				undefined,
			).setIsVisibleHandler(() => logins.getUserController().isGlobalAdmin()),
			whitelabelSettings(entityClient, logins, themeController, whitelabelThemeGenerator),
		],
	}
}
