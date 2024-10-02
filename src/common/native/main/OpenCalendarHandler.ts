import m from "mithril"
import { LoginController } from "../../api/main/LoginController.js"

/**
 * Handles requests for opening calendar paths from native.
 */
export class OpenCalendarHandler {
	constructor(private readonly logins: LoginController) {}

	async openCalendar(userId: Id): Promise<void> {
		if (this.logins.isUserLoggedIn() && this.logins.getUserController().user._id === userId) {
			m.route.set("/calendar/agenda")
		} else {
			m.route.set(`/login?noAutoLogin=false&userId=${userId}&requestedPath=${encodeURIComponent("/calendar/agenda")}`)
		}
	}
}
