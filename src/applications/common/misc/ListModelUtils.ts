import { ListModel } from "./ListModel"
import { ListItemSelectionCallbacks } from "../../../ui/base/ListUtils"

export function listItemSelectionCallbacksFor<T>(model: ListModel<T, unknown>): ListItemSelectionCallbacks<T> {
	return {
		selectPrevious(multiselect: boolean) {
			model.selectPrevious(multiselect)
		},
		selectNext(multiselect: boolean) {
			model.selectNext(multiselect)
		},
		areAllSelected(): boolean {
			return model.areAllSelected()
		},
		selectNone() {
			model.selectNone()
		},
		selectAll() {
			model.selectAll()
		},
		onSingleSelection(item) {
			model.onSingleSelection(item)
		},
		onSingleExclusiveSelection(item) {
			model.onSingleExclusiveSelection(item)
		},
		onSingleInclusiveSelection(item) {
			model.onSingleInclusiveSelection(item)
		},
		onRangeSelectionTowards(item) {
			model.selectRangeTowards(item)
		},
	}
}
