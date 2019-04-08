//@flow
import stream from "mithril/stream/stream.js"
import m from "mithril"

export type RouteChangeEvent = {args: Object, requestedPath: string, currentPath: string}

export const routeChange: Stream<RouteChangeEvent> = stream()

export function throttleRoute() {
	const limit = 200
	let lastCall = 0
	return function (url: string) {
		const now = new Date().getTime()
		m.route.set(url, null, {replace: now - lastCall < limit})
		lastCall = now
	}
}
