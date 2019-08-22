//@flow
import stream from "mithril/stream/stream.js"
import m from "mithril"

export type RouteChangeEvent = {args: Object, requestedPath: string, currentPath: string}

export const routeChange: Stream<RouteChangeEvent> = stream()

export function throttleRoute(): ((url: string) => void) {
	const limit = 200
	let lastCall = 0
	return function (url: string) {
		const now = new Date().getTime()
		m.route.set(url, null, {replace: now - lastCall < limit})
		lastCall = now
	}
}

export const MAIL_PREFIX = "/mail"
export const CONTACTS_PREFIX = "/contact"
export const CALENDAR_PREFIX = "/calendar"
export const SEARCH_PREFIX = "/search"
export const SETTINGS_PREFIX = "/settings"

export const navButtonRoutes = {
	mailUrl: MAIL_PREFIX,
	contactsUrl: CONTACTS_PREFIX,
	calendarUrl: CALENDAR_PREFIX,
	settingsUrl: SETTINGS_PREFIX,
}
