import { DesktopSystemFacade } from "../native/common/generatedipc/DesktopSystemFacade.js"
import { WindowManager } from "./DesktopWindowManager.js"
import { ApplicationWindow } from "./ApplicationWindow.js"
import { Socketeer } from "./Socketeer.js"

export class DesktopDesktopSystemFacade implements DesktopSystemFacade {
	constructor(private readonly wm: WindowManager, private readonly window: ApplicationWindow, private readonly sock: Socketeer) {}

	async focusApplicationWindow(): Promise<void> {
		this.window.focus()
	}

	async openNewWindow(): Promise<void> {
		await this.wm.newWindow(true)
	}

	async sendSocketMessage(message: string): Promise<void> {
		this.sock.sendSocketMessage(message)
	}
}
