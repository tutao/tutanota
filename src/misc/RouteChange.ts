import m from "mithril"
import { assertMainOrNodeBoot } from "../api/common/Env"

assertMainOrNodeBoot()

export type RouteSetFn = (path: string, args: Record<string, any>) => void

export function throttleRoute(): RouteSetFn {
	const limit = 200
	let lastCall = 0
	return function (url: string, args: Record<string, any>) {
		const now = new Date().getTime()
		try {
			m.route.set(url, args, {
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
const LogoutPath = "/login?noAutoLogin=true"
export const LogoutUrl: string = window.location.hash.startsWith("#mail") ? "/ext?noAutoLogin=true" + location.hash : LogoutPath
