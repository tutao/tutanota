import { throttleRoute } from "../misc/RouteChange.js"
import m from "mithril"

/** URL-related functions */
export interface Router {
	/** will do parameter substitution like mithril route */
	routeTo(path: string, params: Record<string, any>): void
}

/** router that is scoped to a specific prefix and will ignore the path changes outside of it */
export class ScopedRouter<Scope extends string> implements Router {
	private thorttledRoute = throttleRoute()

	constructor(readonly scope: Scope) {}

	routeTo(path: string, params: Record<string, any>) {
		if (m.route.get().startsWith(this.scope)) {
			this.thorttledRoute(path, params)
		}
	}
}
