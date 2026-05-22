import { assertMainOrNode } from "@tutao/app-env"
import { CredentialsProvider } from "../../../common/misc/credentials/CredentialsProvider"
import { LoginController } from "../../../common/api/main/LoginController"
import { ThemeController } from "../../../../ui/ThemeController"
import { WhitelabelThemeGenerator } from "../../../../ui/WhitelabelThemeGenerator"
import { MobilePaymentsFacade, MobileSystemFacade } from "../../../native-bridge/common/generatedipc/types"
import { CustomerFacade } from "../../../common/api/worker/facades/lazy/CustomerFacade"
import { SettingsViewSection } from "../../../common/settings/Interfaces"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import { adminSettingsSection, appearanceSettings, loginSettings, subscriptionSettingsSection } from "../../../common/settings/standardSettings"
import { SettingsFolder } from "../../../common/settings/SettingsFolder"
import { NotificationSettingsViewer } from "./NotificationSettingsViewer"
import { Icons } from "../../../../ui/base/icons/Icons"
import { EntityClient } from "../../../../platform-kits/network/EntityClient"

assertMainOrNode()

export function makeCalendarSettings(
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
			settings: [loginSettings(credentialsProvider, systemFacade), appearanceSettings(), notificationSettings()],
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
