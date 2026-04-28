// @bundleInto:boot

import { RouteResolver } from "mithril"

export type ApplicationPaths = Record<string, RouteResolver>
type ViewResolvers = {
	login: RouteResolver
	termination: RouteResolver
	signup: RouteResolver
	giftcard: RouteResolver
	recover: RouteResolver
	webauthn: RouteResolver
	webauthnmobile: RouteResolver
	drive: RouteResolver
}

export function applicationPaths({ login, termination, signup, giftcard, recover, webauthn, webauthnmobile, drive }: ViewResolvers): ApplicationPaths {
	return {
		"/login": login,
		"/termination": termination,
		"/signup": signup,
		"/recover": recover,
		"/giftcard/": giftcard,
		"/webauthn": webauthn,
		"/webauthnmobile": webauthnmobile,
		"/drive": drive,
		"/drive/:folderListId/:folderElementId": drive,
	}
}

export function getPathBases(): Array<string> {
	const paths = Object.keys(applicationPaths({} as any))
	const uniquePathBases = new Set(paths.map((path) => path.split("/")[1]))
	return Array.from(uniquePathBases)
}
