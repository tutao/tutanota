import { SettingsViewSection } from "../../common/settings/Interfaces"
import { CredentialsProvider } from "../../common/misc/credentials/CredentialsProvider"
import { MobileSystemFacade } from "../../common/native/common/generatedipc/MobileSystemFacade"
import { EntityClient } from "../../common/api/common/EntityClient"
import { LoginController } from "../../common/api/main/LoginController"
import { ThemeController } from "../../common/gui/ThemeController"
import { WhitelabelThemeGenerator } from "../../common/gui/WhitelabelThemeGenerator"
import type { MobilePaymentsFacade } from "../../common/native/common/generatedipc/MobilePaymentsFacade"
import { lang } from "../../common/misc/LanguageViewModel"
import { adminSettingsSection, appearanceSettings, loginSettings, subscriptionSettingsSection } from "../../common/settings/standardSettings"
import { CustomerFacade } from "../../common/api/worker/facades/lazy/CustomerFacade"

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
