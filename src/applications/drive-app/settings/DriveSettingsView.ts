import { SettingsViewSection } from "../../common/settings/Interfaces"
import { CredentialsProvider } from "../../common/misc/credentials/CredentialsProvider"
import { LoginController } from "../../common/api/main/LoginController"
import { adminSettingsSection, appearanceSettings, loginSettings, subscriptionSettingsSection } from "../../common/settings/standardSettings"
import { CustomerFacade } from "../../common/api/worker/facades/lazy/CustomerFacade"
import { MobilePaymentsFacade, MobileSystemFacade } from "../../native-bridge/common/generatedipc/types"
import { EntityClient } from "../../../platform-kits/network/EntityClient"
import { ThemeController } from "../../../ui/ThemeController"
import { WhitelabelThemeGenerator } from "../../../ui/WhitelabelThemeGenerator"
import { lang } from "../../../ui/utils/LanguageViewModel"

export function makeDriveSettings(
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
			settings: [loginSettings(credentialsProvider, systemFacade), appearanceSettings()],
		},
		adminSettingsSection(logins, entityClient, themeController, whitelabelThemeGenerator, customerFacade),
		subscriptionSettingsSection(logins, mobilePaymentsFacade),
	]
}
