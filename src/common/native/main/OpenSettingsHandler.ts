import m from "mithril"
import { LoginController } from "../../api/main/LoginController.js"

/**
 * Handles requests for opening settings paths from native.
 */
export class OpenSettingsHandler {
	constructor(private readonly logins: LoginController) {}

	async openSettings(path: string): Promise<void> {
		await this.logins.waitForFullLogin()
		m.route.set(`/settings/:folder`, { folder: path })
	}
}
