// @bundleInto:boot

import { RouteResolver } from "mithril"

export type ApplicationPaths = Record<string, RouteResolver>
type ViewResolvers = {
	login: RouteResolver
	termination: RouteResolver
	search: RouteResolver
	settings: RouteResolver
	calendar: RouteResolver
	signup: RouteResolver
	giftcard: RouteResolver
	recover: RouteResolver
	webauthn: RouteResolver
	webauthnmobile: RouteResolver
}

export function applicationPaths({
	login,
	termination,
	search,
	settings,
	calendar,
	signup,
	giftcard,
	recover,
	webauthn,
	webauthnmobile,
}: ViewResolvers): ApplicationPaths {
	return {
		"/login": login,
		"/termination": termination,
		"/signup": signup,
		"/recover": recover,
		"/search/:category": search,
		"/search/:category/:id": search,
		"/settings": settings,
		"/settings/:folder": settings,
		"/settings/:folder/:id": settings,
		"/calendar": calendar,
		"/calendar/:view": calendar,
		"/calendar/:view/:date": calendar,
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
