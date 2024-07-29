import { keyManager } from "./KeyManager.js"
import { FeatureType, Keys } from "../api/common/TutanotaConstants.js"
import { locator } from "../api/main/CommonLocator.js"
import m from "mithril"
import { CALENDAR_PREFIX, CONTACTS_PREFIX, LogoutUrl, MAIL_PREFIX, SETTINGS_PREFIX } from "./RouteChange.js"

export function setupNavShortcuts() {
	keyManager.registerShortcuts([
		{
			key: Keys.M,
			enabled: () => locator.logins.isUserLoggedIn(),
			exec: () => m.route.set(MAIL_PREFIX),
			help: "mailView_action",
		},
		{
			key: Keys.C,
			enabled: () => locator.logins.isInternalUserLoggedIn() && !locator.logins.isEnabled(FeatureType.DisableContacts),
			exec: () => m.route.set(CONTACTS_PREFIX),
			help: "contactView_action",
		},
		{
			key: Keys.O,
			enabled: () => locator.logins.isInternalUserLoggedIn(),
			exec: () => m.route.set(CALENDAR_PREFIX),
			help: "calendarView_action",
		},
		{
			key: Keys.S,
			enabled: () => locator.logins.isInternalUserLoggedIn(),
			exec: () => m.route.set(SETTINGS_PREFIX),
			help: "settingsView_action",
		},
		{
			key: Keys.L,
			shift: true,
			ctrlOrCmd: true,
			enabled: () => locator.logins.isUserLoggedIn(),
			exec: (key) => m.route.set(LogoutUrl),
			help: "switchAccount_action",
		},
	])
}
