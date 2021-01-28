// @flow

export type ApplicationPaths = Array<{root: string, params?: Array<string>, resolver: RouteResolver}>

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
	return [
		{
			root: "/login", resolver: loginViewResolver,
		},
		{
			root: "/signup", resolver: loginViewResolver,
		},
		{
			root: "/recover", resolver: loginViewResolver,
		},
		{
			root: "/takeover", resolver: loginViewResolver,
		},
		{
			root: "/giftcard", resolver: loginViewResolver
		},
		{
			root: "/mailto", resolver: mailViewResolver,
		},
		{
			root: "/mail", resolver: mailViewResolver,
			params: ["/:listId", "/:listId/:mailId"],
		},
		{
			root: "/ext", resolver: externalLoginViewResolver,
		},
		{
			root: "/contact", resolver: contactViewResolver,
			params: ["/:listId", "/:listId/:contactId"]
		},
		{
			root: "/search/:category", resolver: searchViewResolver,
			params: ["/:id"]
		},
		{
			root: "/settings", resolver: settingsViewResolver,
			params: ["/:folder"]
		},
		{
			root: "/contactform/:formId", resolver: contactFormViewResolver,
		},
		{
			root: "/calendar", resolver: calendarViewResolver,
			params: ["/:view", "/:view/:date"]
		},
	]
}


export function getPathBases(): Array<string> {
	return applicationPaths(({}: any)).map(path => path.root.split("/")[1])
}