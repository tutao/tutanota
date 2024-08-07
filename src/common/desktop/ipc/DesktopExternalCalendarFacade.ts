import { InterWindowEventFacade } from "../../native/common/generatedipc/InterWindowEventFacade.js"
import { ApplicationWindow } from "../ApplicationWindow.js"
import { WindowManager } from "../DesktopWindowManager.js"
import { ExternalCalendarFacade } from "../../native/common/generatedipc/ExternalCalendarFacade.js"

/**
 * this receives inter window events and dispatches them to all other windows
 */
export class DesktopExternalCalendarFacade implements ExternalCalendarFacade {
	fetchExternalCalendar(url: string): Promise<string> {
		throw new Error("Method not implemented.")
	}
}
