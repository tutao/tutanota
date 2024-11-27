import m from "mithril"
import { LoginController } from "../../api/main/LoginController.js"

/**
 * Handles requests for opening settings paths from native.
 */
export class OpenSettingsHandler {
	constructor(private readonly logins: LoginController) {}

	async openSettings(path: string): Promise<void> {
		await this.logins.waitForFullLogin()

		console.log("Trying to open settings page", path)
		if (this.logins.isUserLoggedIn()) {
			m.route.set(`/settings/${path}`)
		} else {
			m.route.set(`/login?noAutoLogin=false&userId=${this.logins.getUserController().user._id}&requestedPath=${encodeURIComponent(`/settings/${path}`)}`)
		}
	}
}
