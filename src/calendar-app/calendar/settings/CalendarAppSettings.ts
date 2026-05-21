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
import {
	adminSettingsSection,
	appearanceSettings,
	calendarSettings,
	loginSettings,
	subscriptionSettingsSection,
} from "../../../common/settings/standardSettings"
import { CustomerFacade } from "../../../common/api/worker/facades/lazy/CustomerFacade"
import { SettingsFolder } from "../../../common/settings/SettingsFolder"
import { Icons } from "../../../common/gui/base/icons/Icons"
import { NotificationSettingsViewer } from "./NotificationSettingsViewer"

assertMainOrNode()

export function makeCalendarAppSettings(
	credentialsProvider: CredentialsProvider,
	systemFacade: MobileSystemFacade,
	entityClient: EntityClient,
	logins: LoginController,
	themeController: ThemeController,
	whitelabelThemeGenerator: WhitelabelThemeGenerator,
	mobilePaymentsFacade: MobilePaymentsFacade,
	customerFacade: CustomerFacade,
): readonly SettingsViewSection[] {
	return [
		{
			name: lang.getTranslation("userSettings_label"),
			settings: [
				loginSettings(credentialsProvider, systemFacade),
				calendarSettings(entityClient, logins.getUserController().userSettingsGroupRoot),
				appearanceSettings(),
				notificationSettings(),
			],
		},
		adminSettingsSection(logins, entityClient, themeController, whitelabelThemeGenerator, customerFacade),
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
