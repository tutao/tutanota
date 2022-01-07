// @bundleInto:boot

import {RouteResolver} from "mithril";

export type ApplicationPaths = Record<string, RouteResolver>
type ViewResolvers = {
	loginViewResolver: RouteResolver
	mailViewResolver: RouteResolver
	externalLoginViewResolver: RouteResolver
	contactViewResolver: RouteResolver
	searchViewResolver: RouteResolver
	settingsViewResolver: RouteResolver
	contactFormViewResolver: RouteResolver
	calendarViewResolver: RouteResolver
	signupViewResolver: RouteResolver
	giftcardViewResolver: RouteResolver
	recoverViewResolver: RouteResolver
}

export function applicationPaths({
									 loginViewResolver,
									 mailViewResolver,
									 externalLoginViewResolver,
									 contactViewResolver,
									 searchViewResolver,
									 settingsViewResolver,
									 contactFormViewResolver,
									 calendarViewResolver,
									 signupViewResolver,
									 giftcardViewResolver,
									 recoverViewResolver,
								 }: ViewResolvers): ApplicationPaths {
	return {
		"/login": loginViewResolver,
		"/signup": signupViewResolver,
		"/recover": recoverViewResolver,
		"/mailto": mailViewResolver,
		"/mail": mailViewResolver,
		"/mail/:listId": mailViewResolver,
		"/mail/:listId/:mailId": mailViewResolver,
		"/ext": externalLoginViewResolver,
		"/contact": contactViewResolver,
		"/contact/:listId": contactViewResolver,
		"/contact/:listId/:contactId": contactViewResolver,
		"/search/:category": searchViewResolver,
		"/search/:category/:id": searchViewResolver,
		"/settings": settingsViewResolver,
		"/settings/:folder": settingsViewResolver,
		"/settings/:folder/:id": settingsViewResolver,
		"/contactform/:formId": contactFormViewResolver,
		"/calendar": calendarViewResolver,
		"/calendar/:view": calendarViewResolver,
		"/calendar/:view/:date": calendarViewResolver,
		"/giftcard/": giftcardViewResolver,
	}
}

export function getPathBases(): Array<string> {
	const paths = Object.keys(applicationPaths({} as any))
	const uniquePathBases = new Set(paths.map(path => path.split("/")[1]))
	return Array.from(uniquePathBases)
}