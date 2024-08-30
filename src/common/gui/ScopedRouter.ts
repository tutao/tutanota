import { throttleRoute } from "../misc/RouteChange.js"
import m from "mithril"
import { debounceStart } from "@tutao/tutanota-utils"
import { ProgrammingError } from "../api/common/error/ProgrammingError.js"

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

/** router that is scoped to a specific prefix and will ignore the path changes outside of it */
export class ScopedRouter<Scope extends string> implements Router {
	private readonly scope: string

	constructor(private readonly router: Router, scope: Scope) {
		if (!scope.startsWith("/")) {
			throw new ProgrammingError(`Scope must start with a forward slash! got: ${scope}`)
		}
		if (scope.split("/").length > 2) {
			throw new ProgrammingError(`Does not support nested scopes yet. Easter egg! got: ${scope}`)
		}
		this.scope = scope.substring(1)
	}

	getFullPath(): string {
		return this.router.getFullPath()
	}

	routeTo(path: string, params: Record<string, any>) {
		if (routeMatchesPrefix(this.scope, this.router.getFullPath())) {
			this.router.routeTo(path, params)
		}
	}
}

export function routeMatchesPrefix(prefixWithoutLeadingSlash: string, route: string): boolean {
	const { path } = m.parsePathname(route)
	return path.split("/")[1] === prefixWithoutLeadingSlash
}
