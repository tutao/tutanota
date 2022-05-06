import type {InterWindowEventTypes} from "../../native/common/InterWindowEventTypes"
import type {IPC} from "../IPC"
import {WindowManager} from "../DesktopWindowManager"
import {exposeRemote} from "../../api/common/WorkerProxy"
import {ApplicationWindow} from "../ApplicationWindow"
import {InterWindowEventHandler, InterWindowEventSender} from "../../native/common/InterWindowEventBus"

export class DesktopInterWindowEventSender<Events> implements InterWindowEventSender<Events> {
	constructor(
		private readonly ipc: IPC,
		private readonly windowManager: WindowManager,
		private readonly windowId: number,
	) {
	}

	async send<E extends keyof Events>(event: E, data: Events[E]): Promise<void> {
		await Promise.all(this.windowManager.getAll().map(window => this.sendToWindow(window, event, data)))
	}

	private async sendToWindow<E extends keyof Events>(window: ApplicationWindow, event: E, data: Events[E]): Promise<void> {
		if (window.id !== this.windowId) {
			// Do not send to the same window it was sent from or funny things will happen
			const {interWindowEventHandler} = exposeRemote<{interWindowEventHandler: InterWindowEventHandler<Events>}>(
				(r) => this.ipc.sendRequest(window.id, r.requestType, r.args)
			)
			return interWindowEventHandler.onEvent(event, data)
		}
	}
}