import { InterWindowEventFacade } from "../../native/common/generatedipc/InterWindowEventFacade.js"
import { ApplicationWindow } from "../ApplicationWindow.js"
import { WindowManager } from "../DesktopWindowManager.js"
import { ExternalCalendarFacade } from "../../native/common/generatedipc/ExternalCalendarFacade.js"

/**
 * this receives inter window events and dispatches them to all other windows
 */
export class DesktopExternalCalendarFacade implements ExternalCalendarFacade {
	async fetchExternalCalendar(url: string): Promise<string> {
		const response = await fetch(url)
		if (!response.ok) throw new Error(`Failed to fetch external calendar ${response.statusText}`)
		return await response.text()
	}
}
