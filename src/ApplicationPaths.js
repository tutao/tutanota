// @flow

export type ApplicationPaths = {[path: string]: RouteResolverMatch}

type ViewResolvers = {
	loginViewResolver: RouteResolverMatch,
	mailViewResolver: RouteResolverMatch,
	externalLoginViewResolver: RouteResolverMatch,
	contactViewResolver: RouteResolverMatch,
	searchViewResolver: RouteResolverMatch,
	settingsViewResolver: RouteResolverMatch,
	contactFormViewResolver: RouteResolverMatch,
	calendarViewResolver: RouteResolverMatch
}

export function applicationPaths(
	{
		loginViewResolver,
		mailViewResolver,
		externalLoginViewResolver,
		contactViewResolver,
		searchViewResolver,
		settingsViewResolver,
		contactFormViewResolver,
		calendarViewResolver
	}: ViewResolvers
): ApplicationPaths {
	return {
		"/login": loginViewResolver,
		"/signup": loginViewResolver,
		"/recover": loginViewResolver,
		"/takeover": loginViewResolver,
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
		"/contactform/:formId": contactFormViewResolver,
		"/calendar": calendarViewResolver,
		"/calendar/:view": calendarViewResolver,
		"/calendar/:view/:date": calendarViewResolver,
		"/giftcard/": loginViewResolver,
	}
}


export function getPathBases(): Array<string> {
	const paths = Object.keys(applicationPaths(({}: any)))
	const uniquePathBases = new Set(paths.map(path => path.split("/")[1]))
	return Array.from(uniquePathBases)
}