import { SettingsFolder } from "./SettingsFolder"
import { SettingsViewSection } from "./Interfaces"
import { Icons } from "../gui/base/icons/Icons"
import { LoginSettingsViewer } from "./login/LoginSettingsViewer"
import { AppearanceSettingsViewer } from "./AppearanceSettingsViewer"
import { lang } from "../misc/LanguageViewModel"
import { WhitelabelSettingsViewer } from "./whitelabel/WhitelabelSettingsViewer"
import { FeatureType, isIOSApp } from "@tutao/app-env"
import { shouldHideBusinessPlans } from "../subscription/utils/SubscriptionUtils"
import { SubscriptionViewer } from "../subscription/SubscriptionViewer"
import { PaymentViewer } from "../subscription/PaymentViewer"
import { ReferralSettingsViewer } from "./ReferralSettingsViewer"
import { CredentialsProvider } from "../misc/credentials/CredentialsProvider"
import { MobileSystemFacade } from "../native/common/generatedipc/MobileSystemFacade"
import { LoginController } from "../api/main/LoginController"
import { EntityClient } from "../api/common/EntityClient"
import { ThemeController } from "../gui/ThemeController"
import { WhitelabelThemeGenerator } from "../gui/WhitelabelThemeGenerator"
import { MobilePaymentsFacade } from "../native/common/generatedipc/MobilePaymentsFacade"

export function loginSettings(credentialsProvider: CredentialsProvider, systemFacade: MobileSystemFacade): SettingsFolder<unknown> {
	return new SettingsFolder(
		() => "login_label",
		() => Icons.PersonFilled,
		"login",
		() => new LoginSettingsViewer(credentialsProvider, systemFacade),
		undefined,
	)
}

export function appearanceSettings(): SettingsFolder<unknown> {
	return new SettingsFolder(
		() => "appearanceSettings_label",
		() => Icons.ColorpaletteFilled,
		"appearance",
		() => new AppearanceSettingsViewer(),
		undefined,
	)
}

export function whitelabelSettings(
	entityClient: EntityClient,
	logins: LoginController,
	themeController: ThemeController,
	whitelabelThemeGenerator: WhitelabelThemeGenerator,
) {
	return new SettingsFolder(
		() => "whitelabel_label",
		() => Icons.ColorwandFilled,
		"whitelabel",
		() => new WhitelabelSettingsViewer(entityClient, logins, themeController, whitelabelThemeGenerator),
		undefined,
	).setIsVisibleHandler(() => !logins.isEnabled(FeatureType.WhitelabelChild) && !shouldHideBusinessPlans() && logins.getUserController().isGlobalAdmin())
}

export function subscriptionSettingsSection(logins: LoginController, mobilePaymentsFacade: MobilePaymentsFacade): SettingsViewSection {
	function shouldShowSubscriptionSetting(): boolean {
		return !logins.isEnabled(FeatureType.WhitelabelChild) && logins.getUserController().isGlobalAdmin()
	}
	return {
		name: lang.getTranslation("subscriptionSettings_label"),
		settings: [
			new SettingsFolder<void>(
				() => "adminSubscription_action",
				() => Icons.TrophyFilled,
				"subscription",
				() => new SubscriptionViewer(isIOSApp() ? mobilePaymentsFacade : null),
				undefined,
			).setIsVisibleHandler(() => shouldShowSubscriptionSetting()),
			new SettingsFolder<void>(
				() => "adminPayment_action",
				() => Icons.CreditcardFilled,
				"invoice",
				() => new PaymentViewer(),
				undefined,
			).setIsVisibleHandler(() => shouldShowSubscriptionSetting()),
			new SettingsFolder(
				() => "referralSettings_label",
				() => Icons.ShareFilled,
				"referral",
				() => new ReferralSettingsViewer(),
				undefined,
			).setIsVisibleHandler(
				() =>
					shouldShowSubscriptionSetting() &&
					// until we load the customer assume it could be business and hide the setting
					!(logins.getUserController().getCustomer()?.businessUse ?? true),
			),
		],
	}
}
