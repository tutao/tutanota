import { ExternalCalendarFacade } from "@tutao/native-bridge/generatedIpc/types"

/**
 * this receives inter window events and dispatches them to all other windows
 */
export class DesktopExternalCalendarFacade implements ExternalCalendarFacade {
	constructor(private readonly userAgent: string) {}

	/** @throws {Error, TypeError} */
	async fetchExternalCalendar(url: string): Promise<string> {
		const requestHeaders = {
			method: "GET",
			headers: new Headers({
				"User-Agent": this.userAgent,
				"Accept-Language": "en",
			}),
		}

		// Native fetch() throws for URLs like "http://username:password@example.com/events.ics":
		// TypeError: Request cannot be constructed from a URL that includes credentials
		// So we remove the credentials and use HTTP header instead. To extract the username and password we use the
		// URL object that allows the "username:password@" components.
		const urlObj = new URL(url)
		const { username, password } = urlObj
		if (username.length || password.length) {
			requestHeaders.headers.set("Authorization", `Basic ${btoa(username + ":" + password)}`)
			urlObj.username = ""
			urlObj.password = ""
		}

		const response = await fetch(urlObj, requestHeaders)
		if (!response.ok) throw new Error(`Failed to fetch external calendar statusCode: ${response.status} message: ${response.statusText}`)
		return await response.text()
	}
}
