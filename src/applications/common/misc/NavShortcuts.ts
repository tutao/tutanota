import { keyManager } from "../../../ui/utils/KeyManager.js"
import { FeatureType } from "../../../platform-kit/app-env"
import m from "mithril"
import { CALENDAR_PREFIX, CONTACTS_PREFIX, DRIVE_PREFIX, LogoutUrl, MAIL_PREFIX, SETTINGS_PREFIX, throttleRoute } from "../../../ui/utils/RouteChange.js"
import { showQuickActionBar } from "./quickactions/QuickActionBar"
import { LoginController } from "../api/main/LoginController"
import { QuickActionsModel } from "./quickactions/QuickActionsModel"
import { SessionType } from "../../../platform-kit/app-env/SessionType"
import { isDriveEnabled } from "./DriveUtils"
import { Keys } from "../../../ui/utils/KeyboardKeys"

export function setupNavShortcuts({ quickActionsModel, logins }: { quickActionsModel: () => Promise<QuickActionsModel>; logins: LoginController }) {
	function hasInAppNavigation() {
		return logins.isInternalUserLoggedIn() && logins.getUserController().sessionType !== SessionType.Temporary
	}

	const routeTo = throttleRoute()

	keyManager.registerShortcuts([
		{
			key: Keys.M,
			enabled: () => hasInAppNavigation(),
			exec: () => routeTo(MAIL_PREFIX),
			help: "mailView_action",
		},
		{
			key: Keys.C,
			enabled: () => hasInAppNavigation() && !logins.isEnabled(FeatureType.DisableContacts),
			exec: () => routeTo(CONTACTS_PREFIX),
			help: "contactView_action",
		},
		{
			key: Keys.O,
			enabled: () => hasInAppNavigation(),
			exec: () => routeTo(CALENDAR_PREFIX),
			help: "calendarView_action",
		},

		{
			key: Keys.P,
			enabled: () => hasInAppNavigation() && isDriveEnabled(logins),
			exec: () => routeTo(DRIVE_PREFIX),
			help: "driveView_action",
		},
		{
			key: Keys.S,
			enabled: () => hasInAppNavigation(),
			exec: () => routeTo(SETTINGS_PREFIX),
			help: "settingsView_action",
		},
		{
			key: Keys.L,
			shift: true,
			ctrlOrCmd: true,
			enabled: () => logins.isUserLoggedIn() && logins.getUserController().sessionType !== SessionType.Temporary,
			exec: (key) => m.route.set(LogoutUrl),
			help: "switchAccount_action",
		},
		{
			key: Keys.K,
			shift: true,
			ctrlOrCmd: true,
			enabled: () => hasInAppNavigation(),
			exec: () => {
				quickActionsModel().then(showQuickActionBar)
			},
			help: "showQuickActionsBar_action",
		},
	])
}
