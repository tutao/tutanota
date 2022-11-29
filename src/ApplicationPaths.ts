// @bundleInto:boot

import {RouteResolver} from "mithril";

export type ApplicationPaths = Record<string, RouteResolver>
type ViewResolvers = {
	login: RouteResolver
	termination: RouteResolver
	mail: RouteResolver
	externalLogin: RouteResolver
	contact: RouteResolver
	search: RouteResolver
	settings: RouteResolver
	contactForm: RouteResolver
	calendar: RouteResolver
	signup: RouteResolver
	giftcard: RouteResolver
	recover: RouteResolver,
	webauthn: RouteResolver,
	webauthnmobile: RouteResolver
}

export function applicationPaths({
									 login,
									 termination,
									 mail,
									 externalLogin,
									 contact,
									 search,
									 settings,
									 contactForm,
									 calendar,
									 signup,
									 giftcard,
									 recover,
									 webauthn,
									 webauthnmobile
								 }: ViewResolvers
): ApplicationPaths {
	return {
		"/login": login,
		"/termination": termination,
		"/signup": signup,
		"/recover": recover,
		"/mailto": mail,
		"/mail": mail,
		"/mail/:listId": mail,
		"/mail/:listId/:mailId": mail,
		"/ext": externalLogin,
		"/contact": contact,
		"/contact/:listId": contact,
		"/contact/:listId/:contactId": contact,
		"/search/:category": search,
		"/search/:category/:id": search,
		"/settings": settings,
		"/settings/:folder": settings,
		"/settings/:folder/:id": settings,
		"/contactform/:formId": contactForm,
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
	const uniquePathBases = new Set(paths.map(path => path.split("/")[1]))
	return Array.from(uniquePathBases)
}