// @bundleInto:boot

import { RouteResolver } from "mithril"

export type ApplicationPaths = Record<string, RouteResolver>
type ViewResolvers = {
	login: RouteResolver
	termination: RouteResolver
	revocation: RouteResolver
	search: RouteResolver
	settings: RouteResolver
	calendar: RouteResolver
	signup: RouteResolver
	giftcard: RouteResolver
	recover: RouteResolver
	webauthn: RouteResolver
	webauthnmobile: RouteResolver
	calendarSearch: RouteResolver
}

export function applicationPaths({
	login,
	termination,
	revocation,
	search,
	settings,
	calendar,
	signup,
	giftcard,
	recover,
	webauthn,
	webauthnmobile,
	calendarSearch,
}: ViewResolvers): ApplicationPaths {
	return {
		"/login": login,
		"/termination": termination,
		"/revocation": revocation,
		"/signup": signup,
		"/recover": recover,
		"/search/calendar": calendarSearch,
		"/search/calendar/:id": calendarSearch,
		"/settings": settings,
		"/settings/:folder": settings,
		"/settings/:folder/:id": settings,
		"/calendar": calendar,
		"/calendar/:view": calendar,
		"/calendar/:view/:date": calendar,
		"/calendar/:view/:date/:eventId": calendar,
		"/giftcard/": giftcard,
		"/webauthn": webauthn,
		"/webauthnmobile": webauthnmobile,
	}
}

export function getPathBases(): Array<string> {
	const paths = Object.keys(applicationPaths({} as any))
	const uniquePathBases = new Set(paths.map((path) => path.split("/")[1]))
	return Array.from(uniquePathBases)
}
