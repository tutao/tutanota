import { QuickAction } from "../misc/QuickActionBar"
import { lang } from "../misc/LanguageViewModel"
import { Router } from "../gui/ScopedRouter"

export async function quickSettingsActions(router: Router): Promise<readonly QuickAction[]> {
	return [
		{
			description: `${lang.get("settings_label")} ${lang.get("login_label")}`,
			exec: () => router.routeTo("/settings/login", {}),
		},
		{
			description: `${lang.get("settings_label")} ${lang.get("email_label")}`,
			exec: () => router.routeTo("/settings/mail", {}),
		},
		{
			description: `${lang.get("settings_label")} ${lang.get("email_label")} ${lang.get("defaultSenderMailAddress_label")}`,
			exec: () => router.routeTo("/settings/mail#defaultSender", {}),
		},
		{
			description: `${lang.get("settings_label")} ${lang.get("appearanceSettings_label")}`,
			exec: () => router.routeTo("/settings/appearance", {}),
		},
		{
			description: `${lang.get("settings_label")} ${lang.get("appearanceSettings_label")} ${lang.get("language_label")}`,
			exec: () => router.routeTo("/settings/appearance#label", {}),
		},
		{
			description: `${lang.get("settings_label")} ${lang.get("appearanceSettings_label")} ${lang.get("switchColorTheme_action")}`,
			exec: () => router.routeTo("/settings/appearance#colorTheme", {}),
		},
		{
			description: `${lang.get("settings_label")} ${lang.get("appearanceSettings_label")} ${lang.get("weekScrollTime_label")}`,
			exec: () => router.routeTo("/settings/appearance#weekScrollTime", {}),
		},
	]
}
