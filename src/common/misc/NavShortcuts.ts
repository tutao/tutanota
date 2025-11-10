import { keyManager } from "./KeyManager.js"
import { FeatureType, Keys } from "../api/common/TutanotaConstants.js"
import m from "mithril"
import { CALENDAR_PREFIX, CONTACTS_PREFIX, LogoutUrl, MAIL_PREFIX, SETTINGS_PREFIX } from "./RouteChange.js"
import { showQuickActionBar } from "./quickactions/QuickActionBar"
import { LoginController } from "../api/main/LoginController"
import { QuickActionsModel } from "./quickactions/QuickActionsModel"

export function setupNavShortcuts({ quickActionsModel, logins }: { quickActionsModel: () => Promise<QuickActionsModel>; logins: LoginController }) {
	keyManager.registerShortcuts([
		{
			key: Keys.M,
			enabled: () => logins.isUserLoggedIn(),
			exec: () => m.route.set(MAIL_PREFIX),
			help: "mailView_action",
		},
		{
			key: Keys.C,
			enabled: () => logins.isInternalUserLoggedIn() && !logins.isEnabled(FeatureType.DisableContacts),
			exec: () => m.route.set(CONTACTS_PREFIX),
			help: "contactView_action",
		},
		{
			key: Keys.O,
			enabled: () => logins.isInternalUserLoggedIn(),
			exec: () => m.route.set(CALENDAR_PREFIX),
			help: "calendarView_action",
		},
		{
			key: Keys.S,
			enabled: () => logins.isInternalUserLoggedIn(),
			exec: () => m.route.set(SETTINGS_PREFIX),
			help: "settingsView_action",
		},
		{
			key: Keys.L,
			shift: true,
			ctrlOrCmd: true,
			enabled: () => logins.isUserLoggedIn(),
			exec: (key) => m.route.set(LogoutUrl),
			help: "switchAccount_action",
		},
		{
			key: Keys.K,
			shift: true,
			ctrlOrCmd: true,
			enabled: () => logins.isInternalUserLoggedIn() && logins.isEnabled(FeatureType.QuickActions),
			exec: () => {
				quickActionsModel().then(showQuickActionBar)
			},
			help: "search_label",
		},
	])
}
