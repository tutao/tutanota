import { SettingsFolder } from "./SettingsFolder"
import { SettingsViewSection } from "./Interfaces"
import { LoginSettingsViewer } from "./login/LoginSettingsViewer"
import { AppearanceSettingsViewer } from "./AppearanceSettingsViewer"
import { WhitelabelSettingsViewer } from "./whitelabel/WhitelabelSettingsViewer"
import { FeatureType, isIOSApp } from "@tutao/app-env"
import { shouldHideBusinessPlans } from "../subscription/utils/SubscriptionUtils"
import { SubscriptionViewer } from "../subscription/SubscriptionViewer"
import { PaymentViewer } from "../subscription/PaymentViewer"
import { ReferralSettingsViewer } from "./ReferralSettingsViewer"
import { CredentialsProvider } from "../misc/credentials/CredentialsProvider"
import { LoginController } from "../api/main/LoginController"
import { CustomerFacade } from "../api/worker/facades/lazy/CustomerFacade"
import { MobileGlobalSettingsViewer } from "./MobileGlobalSettingsViewer"
import { MobilePaymentsFacade, MobileSystemFacade } from "../../native-bridge/common/generatedipc/types"
import { Icons } from "../../../ui/base/icons/Icons"
import { EntityClient } from "../../../platform-kits/network/EntityClient"
import { ThemeController } from "../../../ui/ThemeController"
import { WhitelabelThemeGenerator } from "../../../ui/WhitelabelThemeGenerator"
import { lang } from "../../../ui/utils/LanguageViewModel"

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
export function adminSettingsSection(
	logins: LoginController,
	entityClient: EntityClient,
	themeController: ThemeController,
	whitelabelThemeGenerator: WhitelabelThemeGenerator,
	customerFacade: CustomerFacade,
): SettingsViewSection {
	return {
		name: lang.getTranslation("adminSettings_label"),
		settings: [
			new SettingsFolder(
				() => "globalSettings_label",
				() => Icons.GearWheelFilled,
				"global",
				() => new MobileGlobalSettingsViewer(entityClient, logins, customerFacade),
				undefined,
			).setIsVisibleHandler(() => logins.getUserController().isGlobalAdmin()),
			whitelabelSettings(entityClient, logins, themeController, whitelabelThemeGenerator),
		],
	}
}
