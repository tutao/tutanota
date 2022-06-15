import {WindowManager} from "../DesktopWindowManager"
import {ApplicationWindow} from "../ApplicationWindow"
import {InterWindowEventSender} from "../../native/common/InterWindowEventBus"
import {InterWindowEventTypes} from "../../native/common/InterWindowEventTypes.js"

export class DesktopInterWindowEventSender implements InterWindowEventSender<InterWindowEventTypes> {
	constructor(
		private readonly windowManager: WindowManager,
		private readonly windowId: number,
	) {
	}

	async send<E extends keyof InterWindowEventTypes>(event: E, data: InterWindowEventTypes[E]): Promise<void> {
		await Promise.all(this.windowManager.getAll().map(window => this.sendToWindow(window, event, data)))
	}

	private async sendToWindow<E extends keyof InterWindowEventTypes>(window: ApplicationWindow, event: E, data: InterWindowEventTypes[E]): Promise<void> {
		if (window.id !== this.windowId) {
			return window.interWindowEventSender.send(event, data)
		}
	}
}