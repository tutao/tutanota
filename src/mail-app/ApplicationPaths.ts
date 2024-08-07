// @bundleInto:boot

import { RouteResolver } from "mithril"

export type ApplicationPaths = Record<string, RouteResolver>
type ViewResolvers = {
	login: RouteResolver
	termination: RouteResolver
	mail: RouteResolver
	externalLogin: RouteResolver
	contact: RouteResolver
	contactList: RouteResolver
	search: RouteResolver
	settings: RouteResolver
	calendar: RouteResolver
	signup: RouteResolver
	giftcard: RouteResolver
	recover: RouteResolver
	webauthn: RouteResolver
	webauthnmobile: RouteResolver
	migrate: RouteResolver
}

export function applicationPaths({
	login,
	termination,
	mail,
	externalLogin,
	contact,
	contactList,
	search,
	settings,
	calendar,
	signup,
	giftcard,
	recover,
	webauthn,
	webauthnmobile,
	migrate,
}: ViewResolvers): ApplicationPaths {
	return {
		"/login": login,
		"/termination": termination,
		"/signup": signup,
		"/recover": recover,
		"/mailto": mail,
		"/mail": mail,
		"/mail/:folderId": mail,
		"/mail/:folderId/:mailId": mail,
		"/ext": externalLogin,
		"/contact": contact,
		"/contact/:listId": contact,
		"/contact/:listId/:contactId": contact,
		"/contactlist": contactList,
		"/contactlist/:listId": contactList,
		"/contactlist/:listId/:Id": contactList,
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
		"/migrate": migrate,
	}
}

export function getPathBases(): Array<string> {
	const paths = Object.keys(applicationPaths({} as any))
	const uniquePathBases = new Set(paths.map((path) => path.split("/")[1]))
	return Array.from(uniquePathBases)
}
