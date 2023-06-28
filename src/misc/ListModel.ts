import { ListFetchResult, PageSize } from "../gui/base/List.js"
import { getElementId, isSameId, ListElement } from "../api/common/utils/EntityUtils.js"
import { ListLoadingState, ListState } from "../gui/base/NewList.js"
import { isOfflineError } from "../api/common/utils/ErrorCheckUtils.js"
import { OperationType } from "../api/common/TutanotaConstants.js"
import { settledThen } from "@tutao/tutanota-utils/dist/PromiseUtils.js"
import { assertNonNull, binarySearch, defer, findLast, first, getFirstOrThrow, last, lastIndex, lastThrow, remove } from "@tutao/tutanota-utils"
import { findBy, setAddAll } from "@tutao/tutanota-utils/dist/CollectionUtils.js"
import { memoizedWithHiddenArgument } from "@tutao/tutanota-utils/dist/Utils.js"
import Stream from "mithril/stream"
import stream from "mithril/stream"

interface ListModelConfig<ElementType> {
	topId: Id

	/**
	 * Get the given number of entities starting after the given id. May return more elements than requested, e.g. if all elements are available on first fetch.
	 */
	fetch(startId: Id, count: number): Promise<ListFetchResult<ElementType>>

	/**
	 * Returns null if the given element could not be loaded
	 */
	loadSingle(elementId: Id): Promise<ElementType | null>

	sortCompare(entity1: ElementType, entity2: ElementType): number
}

export type ListFilter<ElementType extends ListElement> = (item: ElementType) => boolean

type PrivateListState<ElementType> = Omit<ListState<ElementType>, "items" | "activeIndex"> & {
	unfilteredItems: ElementType[]
	filteredItems: ElementType[]
	activeElement: ElementType | null
}

/** ListModel that does the state upkeep for the List, including loading state, loaded items, selection and filters*/
export class ListModel<ElementType extends ListElement> {
	constructor(private readonly config: ListModelConfig<ElementType>) {}

	private loadState: "created" | "initialized" = "created"
	private loading: Promise<unknown> = Promise.resolve()
	private filter: ListFilter<ElementType> | null = null
	private rangeSelectionAnchorElement: ElementType | null = null

	get state(): ListState<ElementType> {
		return this.stateStream()
	}

	private get rawState(): PrivateListState<ElementType> {
		return this.rawStateStream()
	}

	private rawStateStream: Stream<PrivateListState<ElementType>> = stream({
		unfilteredItems: [],
		filteredItems: [],
		inMultiselect: false,
		loadingStatus: ListLoadingState.Idle,
		loadingAll: false,
		selectedItems: new Set(),
		activeElement: null,
	})

	readonly stateStream: Stream<ListState<ElementType>> = this.rawStateStream.map((state) => {
		const activeElement = state.activeElement
		const foundIndex = activeElement ? binarySearch(state.filteredItems, activeElement, (l, r) => this.config.sortCompare(l, r)) : -1
		const activeIndex = foundIndex < 0 ? null : foundIndex
		return { ...state, items: state.filteredItems, activeIndex }
	})

	private updateState(newStatePart: Partial<PrivateListState<ElementType>>) {
		this.rawStateStream({ ...this.rawState, ...newStatePart })
	}

	private waitUtilInit(): Promise<unknown> {
		const deferred = defer()
		const subscription = this.rawStateStream.map(() => {
			if (this.loadState === "initialized") {
				Promise.resolve().then(() => {
					subscription.end(true)
					deferred.resolve(undefined)
				})
			}
		})
		return deferred.promise
	}

	async loadInitial() {
		if (this.loadState !== "created") {
			return
		}
		this.loadState = "initialized"
		this.doLoad()
	}

	async loadMore() {
		if (this.rawState.loadingStatus === ListLoadingState.Loading) {
			return this.loading
		}
		if (this.loadState !== "initialized" || this.rawState.loadingStatus !== ListLoadingState.Idle) {
			return
		}
		await this.doLoad()
	}

	retryLoading() {
		if (this.loadState !== "initialized" || this.rawState.loadingStatus !== ListLoadingState.ConnectionLost) {
			return
		}
		this.doLoad()
	}

	private async doLoad() {
		this.updateState({ loadingStatus: ListLoadingState.Loading })
		this.loading = Promise.resolve().then(async () => {
			const lastItem = last(this.rawState.unfilteredItems)
			try {
				const { items: newItems, complete } = await this.config.fetch(lastItem ? getElementId(lastItem) : this.config.topId, PageSize)
				// if the loading was cancelled in the meantime, don't insert anything so that it's not confusing
				if (this.state.loadingStatus === ListLoadingState.ConnectionLost) {
					return
				}
				const newUnfilteredItems = [...this.rawState.unfilteredItems, ...newItems]
				newUnfilteredItems.sort(this.config.sortCompare)

				const newFilteredItems = [...this.rawState.filteredItems, ...this.applyFilter(newItems)]
				newFilteredItems.sort(this.config.sortCompare)

				const loadingStatus = complete ? ListLoadingState.Done : ListLoadingState.Idle
				this.updateState({ loadingStatus, unfilteredItems: newUnfilteredItems, filteredItems: newFilteredItems })
			} catch (e) {
				this.updateState({ loadingStatus: ListLoadingState.ConnectionLost })
				if (!isOfflineError(e)) {
					throw e
				}
			}
		})
		return this.loading
	}

	private applyFilter(newItems: ReadonlyArray<ElementType>): Array<ElementType> {
		return newItems.filter(this.filter ?? (() => true))
	}

	setFilter(filter: ListFilter<ElementType> | null) {
		this.filter = filter
		const newFilteredItems = this.applyFilter(this.rawState.unfilteredItems)

		const newSelectedItems = new Set(this.applyFilter([...this.state.selectedItems]))

		this.updateState({ filteredItems: newFilteredItems, selectedItems: newSelectedItems })
	}

	isFiltered(): boolean {
		return this.filter != null
	}

	async entityEventReceived(elementId: Id, operation: OperationType): Promise<void> {
		if (operation === OperationType.CREATE || operation === OperationType.UPDATE) {
			// load the element without range checks for now
			const entity = await this.config.loadSingle(elementId)
			if (!entity) {
				return
			}

			// Wait for any pending loading
			return settledThen(this.loading, () => {
				if (operation === OperationType.CREATE) {
					if (
						this.rawState.loadingStatus === ListLoadingState.Done ||
						// new element is in the loaded range or newer than the first element
						(this.rawState.unfilteredItems.length > 0 && this.config.sortCompare(entity, lastThrow(this.rawState.unfilteredItems)) < 0)
					) {
						this.addToLoadedEntities(entity)
					}
				} else if (operation === OperationType.UPDATE) {
					this.updateLoadedEntity(entity)
				}
			})
		} else if (operation === OperationType.DELETE) {
			// await this.swipeHandler?.animating
			await this.deleteLoadedEntity(elementId)
		}
	}

	private addToLoadedEntities(entity: ElementType) {
		const id = getElementId(entity)
		if (this.rawState.unfilteredItems.some((item) => getElementId(item) === id)) {
			return
		}

		// can we do something like binary search?
		const unfilteredItems = this.rawState.unfilteredItems.concat(entity).sort(this.config.sortCompare)
		const filteredItems = this.rawState.filteredItems.concat(this.applyFilter([entity])).sort(this.config.sortCompare)
		this.updateState({ filteredItems, unfilteredItems })
	}

	private updateLoadedEntity(entity: ElementType) {
		// update unfiltered list: find the position, take out the old item and put the updated one
		const positionToUpdateUnfiltered = binarySearch(this.rawState.unfilteredItems, entity, (left, right) => this.config.sortCompare(left, right))
		const unfilteredItems = this.rawState.unfilteredItems.slice()
		if (positionToUpdateUnfiltered > 0) {
			unfilteredItems.splice(positionToUpdateUnfiltered, 1, entity)
			unfilteredItems.sort(this.config.sortCompare)
		}

		// update filtered list & selected items
		const positionToUpdateFiltered = binarySearch(this.rawState.filteredItems, entity, (left, right) => this.config.sortCompare(left, right))
		const filteredItems = this.rawState.filteredItems.slice()
		const selectedItems = new Set(this.rawState.selectedItems)
		if (positionToUpdateFiltered > 0) {
			const [oldItem] = filteredItems.splice(positionToUpdateFiltered, 1, entity)
			filteredItems.sort(this.config.sortCompare)
			if (selectedItems.delete(oldItem)) {
				selectedItems.add(entity)
			}
		}

		// keep active element up-to-date
		const activeElementUpdated = this.rawState.activeElement != null && isSameId(this.rawState.activeElement._id, entity._id)
		const newActiveElement = activeElementUpdated ? this.rawState.activeElement : this.rawState.activeElement

		if (positionToUpdateUnfiltered !== -1 && positionToUpdateFiltered !== -1 && activeElementUpdated) {
			this.updateState({ unfilteredItems, filteredItems, selectedItems, activeElement: newActiveElement })
		}

		// keep anchor up-to-date
		if (this.rangeSelectionAnchorElement != null && isSameId(this.rangeSelectionAnchorElement._id, entity._id)) {
			this.rangeSelectionAnchorElement = entity
		}
	}

	deleteLoadedEntity(elementId: Id): Promise<void> {
		return settledThen(this.loading, () => {
			const entity = this.rawState.filteredItems.find((e) => getElementId(e) === elementId)

			const selectedItems = new Set(this.rawState.selectedItems)

			if (entity) {
				selectedItems.delete(entity)

				// select next item in the list
				if (
					this.getSelectedAsArray().length === 1 &&
					this.getSelectedAsArray()[0] === entity &&
					this.rawState.filteredItems.length > 1 &&
					!this.rawState.inMultiselect
				) {
					const nextSelection =
						entity === last(this.state.items)
							? this.state.items[this.state.items.length - 2]
							: this.state.items[this.state.items.indexOf(entity) + 1]

					selectedItems.add(nextSelection)
				}

				const filteredItems = this.rawState.filteredItems.slice()
				remove(filteredItems, entity)
				const unfilteredItems = this.rawState.unfilteredItems.slice()
				remove(unfilteredItems, entity)
				this.updateState({ filteredItems, selectedItems, unfilteredItems })
			}
		})
	}

	onSingleSelection(item: ElementType): void {
		this.updateState({ selectedItems: new Set([item]), inMultiselect: false, activeElement: item })
		this.rangeSelectionAnchorElement = item
	}

	/** An element was added to the selection. If multiselect was not on, discard previous single selection and only added selected item to the selection. */
	onSingleExclusiveSelection(item: ElementType): void {
		if (!this.rawState.inMultiselect) {
			this.updateState({ selectedItems: new Set([item]), inMultiselect: true, activeElement: item })
			this.rangeSelectionAnchorElement = item
		} else {
			const selectedItems = new Set(this.state.selectedItems)
			if (selectedItems.has(item)) {
				selectedItems.delete(item)
			} else {
				selectedItems.add(item)
			}
			if (selectedItems.size === 0) {
				this.updateState({ selectedItems, inMultiselect: false, activeElement: null })
				this.rangeSelectionAnchorElement = null
			} else {
				this.updateState({ selectedItems, inMultiselect: true, activeElement: item })
				this.rangeSelectionAnchorElement = item
			}
		}
	}

	/** An element was added to the selection. If multiselect was not on, app previous single selection and newly added selected item to the selection. */
	onSingleInclusiveSelection(item: ElementType): void {
		const selectedItems = new Set(this.state.selectedItems)
		if (selectedItems.has(item)) {
			selectedItems.delete(item)
		} else {
			selectedItems.add(item)
		}
		if (selectedItems.size === 0) {
			this.updateState({ selectedItems, inMultiselect: false, activeElement: null })
			this.rangeSelectionAnchorElement = null
		} else {
			this.updateState({ selectedItems, inMultiselect: true, activeElement: item })
			this.rangeSelectionAnchorElement = item
		}
	}

	async loadAndSelect(itemId: Id, shouldStop: () => boolean): Promise<ElementType | null> {
		await this.waitUtilInit()
		let foundItem: ElementType | undefined = undefined
		while (
			// if we did find the target mail, stop
			// make sure to call this before shouldStop or we might stop before trying to find an item
			// this can probably be optimized to be binary search in most (all?) cases
			!(foundItem = this.rawState.unfilteredItems.find((item) => getElementId(item) === itemId)) &&
			!shouldStop() &&
			// if we are done loading, stop
			this.rawState.loadingStatus !== ListLoadingState.Done &&
			// if we are offline, stop
			this.rawState.loadingStatus !== ListLoadingState.ConnectionLost
		) {
			await this.loadMore()
		}
		if (foundItem) {
			this.onSingleSelection(foundItem)
		}
		return foundItem ?? null
	}

	selectRangeTowards(item: ElementType): void {
		const selectedItems = new Set(this.state.selectedItems)
		if (selectedItems.size === 0) {
			selectedItems.add(item)
		} else {
			const clickedItemIndex: number = this.state.items.indexOf(item)
			let nearestSelectedIndex: number | null = null

			for (const selectedItem of selectedItems) {
				const currentSelectedItemIndex = this.state.items.indexOf(selectedItem)

				if (nearestSelectedIndex == null || Math.abs(clickedItemIndex - currentSelectedItemIndex) < Math.abs(clickedItemIndex - nearestSelectedIndex)) {
					nearestSelectedIndex = currentSelectedItemIndex
				}
			}
			assertNonNull(nearestSelectedIndex)

			const itemsToAddToSelection: ElementType[] = []

			if (nearestSelectedIndex < clickedItemIndex) {
				for (let i = nearestSelectedIndex + 1; i <= clickedItemIndex; i++) {
					itemsToAddToSelection.push(this.state.items[i])
				}
			} else {
				for (let i = clickedItemIndex; i < nearestSelectedIndex; i++) {
					itemsToAddToSelection.push(this.state.items[i])
				}
			}

			setAddAll(selectedItems, itemsToAddToSelection)
		}
		this.updateState({ selectedItems, inMultiselect: true, activeElement: item })
		this.rangeSelectionAnchorElement = item
	}

	selectPrevious(multiselect: boolean) {
		const oldActiveItem = this.rawState.activeElement
		const newActiveItem =
			oldActiveItem == null
				? first(this.state.items)
				: findLast(this.state.items, (el) => this.config.sortCompare(el, oldActiveItem) < 0) ?? first(this.state.items)
		if (newActiveItem != null) {
			if (!multiselect) {
				this.onSingleSelection(newActiveItem)
			} else {
				const selectedItems = new Set(this.state.selectedItems)
				this.rangeSelectionAnchorElement = this.rangeSelectionAnchorElement ?? first(this.state.items)
				if (!this.rangeSelectionAnchorElement) return

				const previousActiveIndex = this.state.activeIndex ?? 0
				const towardsAnchor = this.config.sortCompare(oldActiveItem ?? getFirstOrThrow(this.state.items), this.rangeSelectionAnchorElement) > 0
				if (towardsAnchor) {
					// remove
					selectedItems.delete(this.state.items[previousActiveIndex])
				} else {
					// add
					selectedItems.add(newActiveItem)
				}
				this.updateState({ activeElement: newActiveItem, selectedItems, inMultiselect: true })
			}
		}
	}

	selectNext(multiselect: boolean) {
		const newActiveIndex =
			this.state.activeIndex == null
				? 0
				: this.state.activeIndex >= lastIndex(this.state.items)
				? lastIndex(this.state.items)
				: this.state.activeIndex + 1

		const oldActiveItem = this.rawState.activeElement
		const lastItem = last(this.state.items)
		const newActiveItem =
			oldActiveItem == null
				? first(this.state.items)
				: lastItem && this.config.sortCompare(lastItem, oldActiveItem) <= 0
				? lastItem
				: this.state.items.find((el) => this.config.sortCompare(el, oldActiveItem) > 0) ?? first(this.state.items)

		if (newActiveItem != null) {
			if (!multiselect) {
				this.onSingleSelection(newActiveItem)
			} else {
				const selectedItems = new Set(this.state.selectedItems)
				this.rangeSelectionAnchorElement = this.rangeSelectionAnchorElement ?? first(this.state.items)
				if (!this.rangeSelectionAnchorElement) return

				const previousActiveIndex = this.state.activeIndex ?? 0
				const towardsAnchor = this.config.sortCompare(oldActiveItem ?? getFirstOrThrow(this.state.items), this.rangeSelectionAnchorElement) < 0
				if (towardsAnchor) {
					selectedItems.delete(this.state.items[previousActiveIndex])
				} else {
					selectedItems.add(newActiveItem)
				}
				this.updateState({ selectedItems, inMultiselect: true, activeElement: newActiveItem })
			}
		}
	}

	areAllSelected(): boolean {
		return this.rawState.inMultiselect && this.state.selectedItems.size === this.state.items.length
	}

	selectAll() {
		this.updateState({ selectedItems: new Set(this.state.items), activeElement: null, inMultiselect: true })
		this.rangeSelectionAnchorElement = null
	}

	selectNone() {
		this.rangeSelectionAnchorElement = null
		this.updateState({ selectedItems: new Set<ElementType>(), inMultiselect: false })
	}

	isItemSelected(itemId: Id): boolean {
		return findBy(this.state.selectedItems, (item: ElementType) => getElementId(item) === itemId) != null
	}

	readonly getSelectedAsArray: () => Array<ElementType> = memoizedWithHiddenArgument(
		() => this.state,
		(state: ListState<ElementType>) => [...state.selectedItems],
	)

	enterMultiselect() {
		// avoid having the viewed element as a preselected one which might be confusing.
		this.selectNone()
		this.updateState({ inMultiselect: true })
	}

	sort() {
		const filteredItems = this.rawState.filteredItems.slice().sort(this.config.sortCompare)
		const unfilteredItems = this.rawState.filteredItems.slice().sort(this.config.sortCompare)
		this.updateState({ filteredItems, unfilteredItems })
	}

	isLoadedCompletely(): boolean {
		return this.rawState.loadingStatus === ListLoadingState.Done
	}

	cancelLoadAll() {
		if (this.state.loadingAll) {
			this.updateState({ loadingAll: false })
		}
	}

	async loadAll() {
		if (this.rawState.loadingAll) return

		this.updateState({ loadingAll: true })

		try {
			while (this.rawState.loadingAll && !this.isLoadedCompletely()) {
				await this.loadMore()
				this.selectAll()
			}
		} finally {
			this.cancelLoadAll()
		}
	}

	isEmptyAndDone(): boolean {
		return this.state.items.length === 0 && this.state.loadingStatus === ListLoadingState.Done
	}

	stopLoading() {
		if (this.state.loadingStatus === ListLoadingState.Loading) {
			// We can't really cancel ongoing requests but we can prevent more requests from happening
			this.updateState({ loadingStatus: ListLoadingState.ConnectionLost })
		}
	}
}

export function selectionAttrsForList(listModel: ListModel<ListElement> | null) {
	return {
		selected: listModel?.areAllSelected() ?? false,
		selectNone: () => listModel?.selectNone(),
		selectAll: () => listModel?.selectAll(),
	}
}
