import { PostLoginAction, LoggedInEvent } from "../api/main/LoginController"
import { WindowManager } from "./DesktopWindowManager"
import { DesktopErrorHandler } from "./DesktopErrorHandler.js"
import { DesktopNotifier } from "./notifications/DesktopNotifier.js"

export class DesktopPostLoginActions implements PostLoginAction {
	constructor(
		private readonly wm: WindowManager,
		private readonly err: DesktopErrorHandler,
		private readonly notifier: DesktopNotifier,
		private readonly windowId: number,
	) {}

	async onPartialLoginSuccess({ userId }: LoggedInEvent): Promise<{ asyncAction: Promise<void> }> {
		this.wm.get(this.windowId)?.setUserId(userId)
		await this.notifier.clearUserNotifications(userId)
		return { asyncAction: Promise.resolve() }
	}

	async onFullLoginSuccess({ userId }: LoggedInEvent): Promise<void> {
		this.wm.get(this.windowId)?.setUserId(userId)
		await this.err.sendErrorReport(this.windowId)
	}
}
