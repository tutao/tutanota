import { ExternalCalendarFacade } from "../../native/common/generatedipc/ExternalCalendarFacade.js"

/**
 * this receives inter window events and dispatches them to all other windows
 */
export class DesktopExternalCalendarFacade implements ExternalCalendarFacade {
	constructor(private readonly userAgent: string) {}

	async fetchExternalCalendar(url: string): Promise<string> {
		const requestHeaders = {
			method: "GET",
			headers: {
				"User-Agent": this.userAgent,
				"Accept-Language": "en",
			},
		}
		const response = await fetch(url, requestHeaders)
		if (!response.ok) throw new Error(`Failed to fetch external calendar statusCode: ${response.status} message: ${response.statusText}`)
		return await response.text()
	}
}
