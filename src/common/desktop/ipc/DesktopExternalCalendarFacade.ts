import { ExternalCalendarFacade } from "../../native/common/generatedipc/ExternalCalendarFacade.js"

/**
 * this receives inter window events and dispatches them to all other windows
 */
export class DesktopExternalCalendarFacade implements ExternalCalendarFacade {
	constructor(private readonly userAgent: string) {}

	async fetchExternalCalendar(url: string): Promise<string> {
		const response = await fetch(url, {
			method: "GET",
			headers: { "User-Agent": this.userAgent },
		})
		if (!response.ok) throw new Error(`Failed to fetch external calendar ${response.statusText}`)
		return await response.text()
	}
}
