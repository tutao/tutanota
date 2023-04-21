import { keyManager } from "./KeyManager.js"
import { FeatureType, Keys } from "../api/common/TutanotaConstants.js"
import { locator } from "../api/main/MainLocator.js"
import m from "mithril"
import { LogoutUrl, navButtonRoutes } from "./RouteChange.js"

export function setupNavShortcuts() {
	keyManager.registerShortcuts([
		{
			key: Keys.M,
			enabled: () => locator.logins.isUserLoggedIn(),
			exec: (key) => m.route.set(navButtonRoutes.mailUrl),
			help: "mailView_action",
		},
		{
			key: Keys.C,
			enabled: () => locator.logins.isInternalUserLoggedIn() && !locator.logins.isEnabled(FeatureType.DisableContacts),
			exec: (key) => m.route.set(navButtonRoutes.contactsUrl),
			help: "contactView_action",
		},
		{
			key: Keys.O,
			enabled: () => locator.logins.isInternalUserLoggedIn(),
			exec: (key) => m.route.set(navButtonRoutes.calendarUrl),
			help: "calendarView_action",
		},
		{
			key: Keys.S,
			enabled: () => locator.logins.isInternalUserLoggedIn(),
			exec: (key) => m.route.set(navButtonRoutes.settingsUrl),
			help: "settingsView_action",
		},
		{
			key: Keys.L,
			shift: true,
			ctrl: true,
			enabled: () => locator.logins.isUserLoggedIn(),
			exec: (key) => m.route.set(LogoutUrl),
			help: "logout_label",
		},
	])
}
