import { InterWindowEventFacade } from "../../native/common/generatedipc/InterWindowEventFacade.js"
import { ApplicationWindow } from "../ApplicationWindow.js"
import { WindowManager } from "../DesktopWindowManager.js"

/**
 * this receives inter window events and dispatches them to all other windows
 */
export class DesktopInterWindowEventFacade implements InterWindowEventFacade {
	constructor(private readonly window: ApplicationWindow, private readonly wm: WindowManager) {}

	async localUserDataInvalidated(userId: string): Promise<void> {
		await this.executeOnOthers((other) => other.interWindowEventSender.localUserDataInvalidated(userId))
	}

	async reloadDeviceConfig(): Promise<void> {
		await this.executeOnOthers((other) => other.interWindowEventSender.reloadDeviceConfig())
	}

	private async executeOnOthers(f: (other: ApplicationWindow) => Promise<void>): Promise<void> {
		const others = this.wm.getAll().filter((w) => w.id != this.window.id)
		for (const other of others) {
			await f(other)
		}
		return
	}
}
