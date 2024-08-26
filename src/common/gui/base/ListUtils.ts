import { ListElement } from "../../api/common/utils/EntityUtils.js"
import { ListModel } from "../../misc/ListModel.js"
import { Shortcut } from "../../misc/KeyManager.js"
import { Keys } from "../../api/common/TutanotaConstants.js"
import { mapLazily } from "@tutao/tutanota-utils"
import { ListState, MultiselectMode } from "./List.js"
import { Children } from "mithril"
import { isBrowser } from "../../api/common/Env.js"

export const ACTION_DISTANCE = 150
export const PageSize = 100

/**
 * 1:1 mapping to DOM elements. Displays a single list entry.
 */
export interface VirtualRow<ElementType> {
	render(): Children

	update(listEntry: ElementType, selected: boolean, isInMultiSelect: boolean): void

	entity: ElementType | null
	top: number
	domElement: HTMLElement | null
}

export interface ListFetchResult<ElementType> {
	items: Array<ElementType>
	/** Complete means that we loaded the whole list and additional requests will not yield any results. */
	complete: boolean
}

export type ListSelectionCallbacks = Pick<ListModel<ListElement>, "selectPrevious" | "selectNext" | "areAllSelected" | "selectAll" | "selectNone">

export function listSelectionKeyboardShortcuts(multiselectMode: MultiselectMode, callbacks: () => ListSelectionCallbacks | null): Array<Shortcut> {
	const multiselectionEnabled = multiselectMode == MultiselectMode.Enabled ? () => true : () => false
	return [
		{
			key: Keys.UP,
			exec: mapLazily(callbacks, (list) => list?.selectPrevious(false)),
			help: "selectPrevious_action",
		},
		{
			key: Keys.K,
			exec: mapLazily(callbacks, (list) => list?.selectPrevious(false)),
			help: "selectPrevious_action",
		},
		{
			key: Keys.UP,
			shift: true,
			exec: mapLazily(callbacks, (list) => list?.selectPrevious(true)),
			help: "addPrevious_action",
			enabled: multiselectionEnabled,
		},
		{
			key: Keys.K,
			shift: true,
			exec: mapLazily(callbacks, (list) => list?.selectPrevious(true)),
			help: "addPrevious_action",
			enabled: multiselectionEnabled,
		},
		{
			key: Keys.DOWN,
			exec: mapLazily(callbacks, (list) => list?.selectNext(false)),
			help: "selectNext_action",
		},
		{
			key: Keys.J,
			exec: mapLazily(callbacks, (list) => list?.selectNext(false)),
			help: "selectNext_action",
		},
		{
			key: Keys.DOWN,
			shift: true,
			exec: mapLazily(callbacks, (list) => list?.selectNext(true)),
			help: "addNext_action",
			enabled: multiselectionEnabled,
		},
		{
			key: Keys.J,
			shift: true,
			exec: mapLazily(callbacks, (list) => list?.selectNext(true)),
			help: "addNext_action",
			enabled: multiselectionEnabled,
		},
		{
			key: Keys.A,
			ctrlOrCmd: true,
			shift: true,
			exec: mapLazily(callbacks, (list) => (list?.areAllSelected() ? list.selectNone() : list?.selectAll())),
			help: "selectAllLoaded_action",
			// this specific shortcut conflicts with a chrome shortcut. it was chosen because it's adjacent to ctrl + A
			// for select all.
			enabled: () => multiselectionEnabled() && !isBrowser(),
		},
	]
}

export function onlySingleSelection<T>(state: ListState<T>): T | null {
	if (state.selectedItems.size === 1) {
		return state.selectedItems.values().next().value
	} else {
		return null
	}
}
