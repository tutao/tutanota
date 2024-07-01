import m from "mithril"
import { assertMainOrNodeBoot } from "../api/common/Env"
import { lazyMemoized } from "@tutao/tutanota-utils"

assertMainOrNodeBoot()

export type RouteSetFn = (path: string, args: Record<string, any>) => void

/** return a replacement for m.route.set that replaces the last history
 * state for reroutes that happen quickly enough instead of adding a
 * new history entry. will also latch to the route, ignoring any
 * followup calls to the same route.  */
export const throttleRoute = lazyMemoized((): RouteSetFn => {
	const limit = 200
	let lastCall = 0
	let lastUrl: string | null = null
	let lastArgs: Record<string, any> = {}
	let lastRoute = m.route.get()
	return function (url: string, args: Record<string, any>) {
		// someone might have called m.route.set() without us, so if the route changed, we need to
		// call m.route.set() in any case.
		if (m.route.get() === lastRoute && url === lastUrl && shallowCompare(lastArgs, args)) return
		lastUrl = url
		lastArgs = args
		const now = new Date().getTime()
		try {
			m.route.set(url, args, {
				replace: now - lastCall < limit,
			})
			lastRoute = m.route.get()
		} catch (e) {
			if (e.message.includes("can't access dead object")) {
				console.log(`Caught error: ${e.message}`)
			} else {
				throw e
			}
		}

		lastCall = now
	}
})

/** return true if a and b contain the same keys with values that are the same when compared with === */
function shallowCompare(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
	if (a === b) return true
	const aEntries = Object.entries(a)
	const bEntries = Object.entries(b)
	return aEntries.length === bEntries.length && !aEntries.some(([key, value]) => b[key] !== value)
}

export const MAIL_PREFIX = "/mail"
export const CONTACTS_PREFIX = "/contact"
export const CONTACTLIST_PREFIX = "/contactlist"
export const CALENDAR_PREFIX = "/calendar"
export const SEARCH_PREFIX = "/search"
export const SETTINGS_PREFIX = "/settings"
const LogoutPath = "/login?noAutoLogin=true"
export const LogoutUrl: string = window.location.hash.startsWith("#mail") ? "/ext?noAutoLogin=true" + location.hash : LogoutPath
