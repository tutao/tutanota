import { isNotNull, remove } from "@tutao/tutanota-utils"

export interface QuickAction {
	/** Displayed in the list */
	readonly description: string
	/** Actually runs the action. Should be run via {@link QuickActionsModel#runAction} */
	readonly exec: () => unknown
}

export type LazyActionProvider = () => Promise<readonly QuickAction[]>

/**
 * Provides the state and logic for the quick actions (navigation/actions that can be searched).
 */
export class QuickActionsModel {
	/**
	 * Last actions in the order they've been run (latest first). Should only occur once.
	 */
	private _lastRunActions: QuickAction[] = []
	/**
	 * Map from action description to action itself.
	 * Using map to dedup and update lastRunActions in O(n) where n is _lastRunActions.length
	 */
	private actions: ReadonlyMap<string, QuickAction> = new Map()
	private readonly providers: LazyActionProvider[] = []

	/**
	 * Register an action provider that will be used to query the actions
	 */
	register(actionProvider: LazyActionProvider) {
		this.providers.push(actionProvider)
	}

	/**
	 * Re-query the providers for the latest actions.
	 */
	async updateActions(): Promise<void> {
		const result = new Map<string, QuickAction>()
		for (const actionProvider of this.providers) {
			const actions = await actionProvider()
			for (const action of actions) {
				result.set(action.description, action)
			}
		}
		this.actions = result

		// we also have to update lastRunActions because they might be outdated by now (either completely missing or
		//   doing something else)
		// we are not just filtering, we are also getting up-to-date actions, this map() is important!
		this._lastRunActions = this._lastRunActions.map((lastAction) => this.actions.get(lastAction.description)).filter(isNotNull)
	}

	/**
	 * Execute the action and update the last actions.
	 */
	runAction(action: QuickAction) {
		remove(this._lastRunActions, action)
		this._lastRunActions.unshift(action)
		action.exec()
	}

	/**
	 * Actions that are shown initially, before anything is queried.
	 * Includes both last run actions and other actions, deduplicating them.
	 */
	initialActions(): readonly QuickAction[] {
		const actionsCopy = new Map(this.actions)
		for (const lastAction of this._lastRunActions) {
			actionsCopy.delete(lastAction.description)
		}
		return this._lastRunActions.concat([...actionsCopy.values()])
	}

	/**
	 * Last run actions in reverse order of their execution.
	 */
	lastActions(): readonly QuickAction[] {
		return this._lastRunActions
	}

	/**
	 * Get actions that match the query.
	 */
	getMatchingActions(query: string): readonly QuickAction[] {
		const lowerQuery = query.toLowerCase()
		const result: QuickAction[] = []
		// filter map values into an array. like [...this.actions.values()].filter() but in a single pass
		for (const [desc, action] of this.actions) {
			if (desc.toLowerCase().includes(lowerQuery)) {
				result.push(action)
			}
		}
		return result
	}
}
