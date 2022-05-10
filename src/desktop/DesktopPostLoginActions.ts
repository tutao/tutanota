import {IPostLoginAction, LoggedInEvent} from "../api/main/LoginController"
import {WindowManager} from "./DesktopWindowManager"

export class DesktopPostLoginActions implements IPostLoginAction {
	constructor(
		private readonly wm: WindowManager,
		private readonly windowId: number,
	) {
	}

	async onPartialLoginSuccess({userId}: LoggedInEvent): Promise<void> {
		this.wm.get(this.windowId)?.setUserId(userId)
	}

	async onFullLoginSuccess(loggedInEvent: LoggedInEvent): Promise<void> {
	}
}