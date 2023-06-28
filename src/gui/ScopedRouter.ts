import { throttleRoute } from "../misc/RouteChange.js"
import m from "mithril"
import { debounceStart } from "@tutao/tutanota-utils"

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
	constructor(private readonly router: Router, readonly scope: Scope) {}

	getFullPath(): string {
		return this.router.getFullPath()
	}

	routeTo(path: string, params: Record<string, any>) {
		if (this.router.getFullPath().startsWith(this.scope)) {
			this.router.routeTo(path, params)
		}
	}
}
