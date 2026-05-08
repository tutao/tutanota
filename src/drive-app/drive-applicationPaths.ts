// @bundleInto:boot

import { RouteResolver } from "mithril"

export type ApplicationPaths = Record<string, RouteResolver>
type ViewResolvers = {
	login: RouteResolver
	signup: RouteResolver
	giftcard: RouteResolver
	recover: RouteResolver
	drive: RouteResolver
}

export function applicationPaths({ login, signup, giftcard, recover, drive }: ViewResolvers): ApplicationPaths {
	return {
		"/login": login,
		"/signup": signup,
		"/recover": recover,
		"/giftcard/": giftcard,
		"/drive": drive,
		"/drive/:folderListId/:folderElementId": drive,
	}
}

export function getPathBases(): Array<string> {
	const paths = Object.keys(applicationPaths({} as any))
	const uniquePathBases = new Set(paths.map((path) => path.split("/")[1]))
	return Array.from(uniquePathBases)
}
