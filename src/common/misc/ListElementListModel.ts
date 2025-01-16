import { ListFilter, ListModel, ListModelConfig } from "./ListModel"
import { getElementId, isSameId, ListElement } from "../api/common/utils/EntityUtils"
import { OperationType } from "../api/common/TutanotaConstants"
import Stream from "mithril/stream"
import { ListLoadingState, ListState } from "../gui/base/List"

export type ListElementListModelConfig<ElementType> = Omit<ListModelConfig<ElementType, Id>, "getItemId" | "isSameId">

export class ListElementListModel<ElementType extends ListElement> {
	private readonly listModel: ListModel<ElementType, Id>
	private readonly config: ListModelConfig<ElementType, Id>

	get state(): ListState<ElementType> {
		return this.listModel.state
	}

	get differentItemsSelected(): Stream<ReadonlySet<ElementType>> {
		return this.listModel.differentItemsSelected
	}

	get stateStream(): Stream<ListState<ElementType>> {
		return this.listModel.stateStream
	}

	constructor(config: ListElementListModelConfig<ElementType>) {
		this.config = Object.assign({}, config, {
			isSameId,
			getItemId: getElementId,
		})
		this.listModel = new ListModel(this.config)
	}

	async entityEventReceived(listId: Id, elementId: Id, operation: OperationType): Promise<void> {
		if (operation === OperationType.CREATE || operation === OperationType.UPDATE) {
			// load the element without range checks for now
			const entity = await this.config.loadSingle(listId, elementId)
			if (!entity) {
				return
			}

			// Wait for any pending loading
			return this.listModel.waitLoad(() => {
				if (operation === OperationType.CREATE) {
					if (this.canInsertEntity(entity)) {
						this.listModel.insertLoadedItem(entity)
					}
				} else if (operation === OperationType.UPDATE) {
					this.listModel.updateLoadedItem(entity)
				}
			})
		} else if (operation === OperationType.DELETE) {
			// await this.swipeHandler?.animating
			await this.listModel.deleteLoadedItem(elementId)
		}
	}

	private canInsertEntity(entity: ElementType): boolean {
		if (this.state.loadingStatus === ListLoadingState.Done) {
			return true
		}

		// new element is in the loaded range or newer than the first element
		const lastElement = this.listModel.getLastItem()
		return lastElement != null && this.config.sortCompare(entity, lastElement) < 0
	}

	async loadAndSelect(
		itemId: Id,
		shouldStop: () => boolean,
		finder: (a: ElementType) => boolean = (item) => this.config.isSameId(this.config.getItemId(item), itemId),
	): Promise<ElementType | null> {
		return this.listModel.loadAndSelect(itemId, shouldStop, finder)
	}

	loadItemTimestamp(itemId: Id): number | null {
		return this.listModel.loadItemTimestamp(itemId)
	}

	isItemSelected(itemId: Id): boolean {
		return this.listModel.isItemSelected(itemId)
	}

	enterMultiselect() {
		return this.listModel.enterMultiselect()
	}

	stopLoading(): void {
		return this.listModel.stopLoading()
	}

	isEmptyAndDone(): boolean {
		return this.listModel.isEmptyAndDone()
	}

	isSelectionEmpty(): boolean {
		return this.listModel.isSelectionEmpty()
	}

	getUnfilteredAsArray(): Array<ElementType> {
		return this.listModel.getUnfilteredAsArray()
	}

	sort() {
		return this.listModel.sort()
	}

	async loadMore() {
		return this.listModel.loadMore()
	}

	async loadAll() {
		return this.listModel.loadAll()
	}

	async retryLoading() {
		return this.listModel.retryLoading()
	}

	onSingleSelection(item: ElementType) {
		return this.listModel.onSingleSelection(item)
	}

	onSingleInclusiveSelection(item: ElementType, clearSelectionOnMultiSelectStart?: boolean) {
		return this.listModel.onSingleInclusiveSelection(item, clearSelectionOnMultiSelectStart)
	}

	onSingleExclusiveSelection(item: ElementType) {
		return this.listModel.onSingleExclusiveSelection(item)
	}

	selectRangeTowards(item: ElementType) {
		return this.listModel.selectRangeTowards(item)
	}

	areAllSelected(): boolean {
		return this.listModel.areAllSelected()
	}

	selectNone() {
		return this.listModel.selectNone()
	}

	selectAll() {
		return this.listModel.selectAll()
	}

	selectPrevious(multiselect: boolean) {
		return this.listModel.selectPrevious(multiselect)
	}

	selectNext(multiselect: boolean) {
		return this.listModel.selectNext(multiselect)
	}

	cancelLoadAll() {
		return this.listModel.cancelLoadAll()
	}

	async loadInitial() {
		return this.listModel.loadInitial()
	}

	reapplyFilter() {
		return this.listModel.reapplyFilter()
	}

	setFilter(filter: ListFilter<ElementType> | null) {
		return this.listModel.setFilter(filter)
	}

	getSelectedAsArray(): Array<ElementType> {
		return this.listModel.getSelectedAsArray()
	}

	isLoadedCompletely(): boolean {
		return this.listModel.isLoadedCompletely()
	}

	updateLoadingStatus(status: ListLoadingState) {
		return this.listModel.updateLoadingStatus(status)
	}
}
