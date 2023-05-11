import m from "mithril"
import { assertMainOrNodeBoot } from "../api/common/Env"

assertMainOrNodeBoot()

export function throttleRoute(): (url: string) => void {
	const limit = 200
	let lastCall = 0
	return function (url: string) {
		const now = new Date().getTime()
		try {
			m.route.set(url, null, {
				replace: now - lastCall < limit,
			})
		} catch (e) {
			if (e.message.includes("can't access dead object")) {
				console.log(`Caught error: ${e.message}`)
			} else {
				throw e
			}
		}

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
const LogoutPath = "/login?noAutoLogin=true"
export const LogoutUrl: string = window.location.hash.startsWith("#mail") ? "/ext?noAutoLogin=true" + location.hash : LogoutPath
