import { InterWindowEventFacade } from "../../native/common/generatedipc/InterWindowEventFacade.js"
import { ApplicationWindow } from "../ApplicationWindow.js"
import { WindowManager } from "../DesktopWindowManager.js"

/**
 * this receives inter window events and dispatches them to all other windows
 */
export class DesktopInterWindowEventFacade implements InterWindowEventFacade {
	constructor(private readonly window: ApplicationWindow, private readonly wm: WindowManager) {}

	async localUserDataInvalidated(userId: string): Promise<void> {
		const others = this.wm.getAll().filter((w) => w.id != this.window.id)
		for (const other of others) {
			await other.interWindowEventSender.localUserDataInvalidated(userId)
		}
		return
	}
}
