import type {IInterWindowEventHandler, IInterWindowEventSender, InterWindowEvent} from "./IInterWindowEventBus"
import type {IPC} from "../IPC"
import {WindowManager} from "../DesktopWindowManager"
import {exposeRemote} from "../../api/common/WorkerProxy"
import {ApplicationWindow} from "../ApplicationWindow"

export class DesktopInterWindowEventSender implements IInterWindowEventSender {
	constructor(
		private readonly ipc: IPC,
		private readonly windowManager: WindowManager,
		private readonly windowId: number,
	) {
	}

	async send(event: InterWindowEvent): Promise<void> {
		await Promise.all(this.windowManager.getAll().map(window => this.sendToWindow(window, event)))
	}

	private async sendToWindow(window: ApplicationWindow, event: InterWindowEvent): Promise<void> {
		if (window.id !== this.windowId) {
			// Do not send to the same window it was sent from or funny things will happen
			const {interWindowEventHandler} = exposeRemote<{interWindowEventHandler: IInterWindowEventHandler}>(
				(r) => this.ipc.sendRequest(window.id, r.requestType, r.args)
			)
			return interWindowEventHandler.onEvent(event)
		}
	}
}