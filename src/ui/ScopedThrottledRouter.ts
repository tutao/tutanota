import { throttleRoute } from "./utils/RouteChange.js"
import m from "mithril"
import { debounceStart } from "../platform-kit/utils"
import { ProgrammingError } from "../platform-kit/app-env"

/** URL-related functions */
export interface Router {
	getFullPath(): string

	/** will do parameter substitution like mithril route */

	routeTo(path: string, params: Record<string, any>): void
}

export class ThrottledRouter implements Router {
	private readonly throttledRoute = debounceStart(32, throttleRoute())

	getFullPath(): string {
		return m.route.get()
	}

	routeTo(path: string, params: Record<string, any>) {
		this.throttledRoute(path, params)
	}
}

/**
 * Router that is scoped to a specific prefix and will ignore the path changes outside of it.
 * Also implements throttling.
 */
export class ScopedThrottledRouter<Scope extends string> implements Router {
	private readonly scope: string
	private readonly throttledRoute = throttleRoute()

	constructor(scope: Scope) {
		if (!scope.startsWith("/")) {
			throw new ProgrammingError(`Scope must start with a forward slash! got: ${scope}`)
		}
		if (scope.split("/").length > 2) {
			throw new ProgrammingError(`Does not support nested scopes yet. Easter egg! got: ${scope}`)
		}
		this.scope = scope.substring(1)
	}

	getFullPath(): string {
		return m.route.get()
	}

	// check the route *after* debounce to avoid checking prematurely
	readonly routeTo = debounceStart(32, (path: string, params: Record<string, any>) => {
		if (routeMatchesPrefix(this.scope, this.getFullPath())) {
			this.throttledRoute(path, params)
		}
	})
}

export function routeMatchesPrefix(prefixWithoutLeadingSlash: string, route: string): boolean {
	const { path } = m.parsePathname(route)
	return path.split("/")[1] === prefixWithoutLeadingSlash
}
