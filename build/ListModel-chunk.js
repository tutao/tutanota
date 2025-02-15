import { __toESM } from "./chunk-chunk.js";
import { assertNonNull, binarySearch, defer, findBy, findLast, first, getFirstOrThrow, last, lastThrow, memoizedWithHiddenArgument, remove, setAddAll, setEquals, setMap, settledThen } from "./dist2-chunk.js";
import { require_stream } from "./stream-chunk.js";
import { ListAutoSelectBehavior } from "./DeviceConfig-chunk.js";
import { isOfflineError } from "./ErrorUtils-chunk.js";
import { ListLoadingState, PageSize } from "./List-chunk.js";

//#region src/common/misc/ListModel.ts
var import_stream = __toESM(require_stream(), 1);
var import_stream$1 = __toESM(require_stream(), 1);
var ListModel = class {
	constructor(config) {
		this.config = config;
	}
	loadState = "created";
	loading = Promise.resolve();
	filter = null;
	rangeSelectionAnchorItem = null;
	get state() {
		return this.stateStream();
	}
	get rawState() {
		return this.rawStateStream();
	}
	defaultRawStateStream = {
		unfilteredItems: [],
		filteredItems: [],
		inMultiselect: false,
		loadingStatus: ListLoadingState.Idle,
		loadingAll: false,
		selectedItems: new Set(),
		activeItem: null
	};
	rawStateStream = (0, import_stream$1.default)(this.defaultRawStateStream);
	stateStream = this.rawStateStream.map((state) => {
		const activeItem = state.activeItem;
		const foundIndex = activeItem ? binarySearch(state.filteredItems, activeItem, (l, r) => this.config.sortCompare(l, r)) : -1;
		const activeIndex = foundIndex < 0 ? null : foundIndex;
		return {
			...state,
			items: state.filteredItems,
			activeIndex
		};
	});
	differentItemsSelected = import_stream.default.scan((acc, state) => {
		const newSelectedIds = setMap(state.selectedItems, (item) => this.config.getItemId(item));
		const oldSelectedIds = setMap(acc, (item) => this.config.getItemId(item));
		if (setEquals(oldSelectedIds, newSelectedIds)) return import_stream.default.SKIP;
else return state.selectedItems;
	}, new Set(), this.stateStream);
	updateState(newStatePart) {
		this.rawStateStream({
			...this.rawState,
			...newStatePart
		});
	}
	waitUtilInit() {
		const deferred = defer();
		const subscription = this.rawStateStream.map(() => {
			if (this.loadState === "initialized") Promise.resolve().then(() => {
				subscription.end(true);
				deferred.resolve(undefined);
			});
		});
		return deferred.promise;
	}
	async loadInitial() {
		if (this.loadState !== "created") return;
		this.loadState = "initialized";
		await this.doLoad();
	}
	async loadMore() {
		if (this.rawState.loadingStatus === ListLoadingState.Loading) return this.loading;
		if (this.loadState !== "initialized" || this.rawState.loadingStatus !== ListLoadingState.Idle) return;
		await this.doLoad();
	}
	async retryLoading() {
		if (this.loadState !== "initialized" || this.rawState.loadingStatus !== ListLoadingState.ConnectionLost) return;
		await this.doLoad();
	}
	updateLoadingStatus(status) {
		if (this.rawState.loadingStatus === status) return;
		this.updateState({ loadingStatus: status });
	}
	async doLoad() {
		this.updateLoadingStatus(ListLoadingState.Loading);
		this.loading = Promise.resolve().then(async () => {
			const lastFetchedItem = last(this.rawState.unfilteredItems);
			try {
				const { items: newItems, complete } = await this.config.fetch(lastFetchedItem, PageSize);
				if (this.state.loadingStatus === ListLoadingState.ConnectionLost) return;
				const newUnfilteredItems = [...this.rawState.unfilteredItems, ...newItems];
				newUnfilteredItems.sort(this.config.sortCompare);
				const newFilteredItems = [...this.rawState.filteredItems, ...this.applyFilter(newItems)];
				newFilteredItems.sort(this.config.sortCompare);
				const loadingStatus = complete ? ListLoadingState.Done : ListLoadingState.Idle;
				this.updateState({
					loadingStatus,
					unfilteredItems: newUnfilteredItems,
					filteredItems: newFilteredItems
				});
			} catch (e) {
				this.updateLoadingStatus(ListLoadingState.ConnectionLost);
				if (!isOfflineError(e)) throw e;
			}
		});
		return this.loading;
	}
	applyFilter(newItems) {
		return newItems.filter(this.filter ?? (() => true));
	}
	setFilter(filter) {
		this.filter = filter;
		this.reapplyFilter();
	}
	reapplyFilter() {
		const newFilteredItems = this.applyFilter(this.rawState.unfilteredItems);
		const newSelectedItems = new Set(this.applyFilter([...this.state.selectedItems]));
		this.updateState({
			filteredItems: newFilteredItems,
			selectedItems: newSelectedItems
		});
	}
	onSingleSelection(item) {
		this.updateState({
			selectedItems: new Set([item]),
			inMultiselect: false,
			activeItem: item
		});
		this.rangeSelectionAnchorItem = item;
	}
	/** An item was added to the selection. If multiselect was not on, discard previous single selection and only added selected item to the selection. */
	onSingleExclusiveSelection(item) {
		if (!this.rawState.inMultiselect) {
			this.updateState({
				selectedItems: new Set([item]),
				inMultiselect: true,
				activeItem: item
			});
			this.rangeSelectionAnchorItem = item;
		} else {
			const selectedItems = new Set(this.state.selectedItems);
			if (selectedItems.has(item)) selectedItems.delete(item);
else selectedItems.add(item);
			if (selectedItems.size === 0) {
				this.updateState({
					selectedItems,
					inMultiselect: false,
					activeItem: null
				});
				this.rangeSelectionAnchorItem = null;
			} else {
				this.updateState({
					selectedItems,
					inMultiselect: true,
					activeItem: item
				});
				this.rangeSelectionAnchorItem = item;
			}
		}
	}
	/** An item was added to the selection. If multiselect was not on, add previous single selection and newly added selected item to the selection. */
	onSingleInclusiveSelection(item, clearSelectionOnMultiSelectStart) {
		if (!this.state.inMultiselect && clearSelectionOnMultiSelectStart) this.selectNone();
		const selectedItems = new Set(this.state.selectedItems);
		if (this.state.inMultiselect && selectedItems.has(item)) selectedItems.delete(item);
else selectedItems.add(item);
		if (selectedItems.size === 0) {
			this.updateState({
				selectedItems,
				inMultiselect: false,
				activeItem: null
			});
			this.rangeSelectionAnchorItem = null;
		} else {
			this.updateState({
				selectedItems,
				inMultiselect: true,
				activeItem: item
			});
			this.rangeSelectionAnchorItem = item;
		}
	}
	async loadAndSelect(finder, shouldStop) {
		await this.waitUtilInit();
		let foundItem = undefined;
		while (!(foundItem = this.rawState.unfilteredItems.find(finder)) && !shouldStop() && this.rawState.loadingStatus !== ListLoadingState.Done && this.rawState.loadingStatus !== ListLoadingState.ConnectionLost) await this.loadMore();
		if (foundItem) this.onSingleSelection(foundItem);
		return foundItem ?? null;
	}
	selectRangeTowards(item) {
		const selectedItems = new Set(this.state.selectedItems);
		if (selectedItems.size === 0) selectedItems.add(item);
else {
			const clickedItemIndex = this.state.items.indexOf(item);
			let nearestSelectedIndex = null;
			for (const selectedItem of selectedItems) {
				const currentSelectedItemIndex = this.state.items.indexOf(selectedItem);
				if (nearestSelectedIndex == null || Math.abs(clickedItemIndex - currentSelectedItemIndex) < Math.abs(clickedItemIndex - nearestSelectedIndex)) nearestSelectedIndex = currentSelectedItemIndex;
			}
			assertNonNull(nearestSelectedIndex);
			const itemsToAddToSelection = [];
			if (nearestSelectedIndex < clickedItemIndex) for (let i = nearestSelectedIndex + 1; i <= clickedItemIndex; i++) itemsToAddToSelection.push(this.state.items[i]);
else for (let i = clickedItemIndex; i < nearestSelectedIndex; i++) itemsToAddToSelection.push(this.state.items[i]);
			setAddAll(selectedItems, itemsToAddToSelection);
		}
		this.updateState({
			selectedItems,
			inMultiselect: true,
			activeItem: item
		});
		this.rangeSelectionAnchorItem = item;
	}
	selectPrevious(multiselect) {
		const oldActiveItem = this.rawState.activeItem;
		const newActiveItem = this.getPreviousItem(oldActiveItem);
		if (newActiveItem != null) if (!multiselect) this.onSingleSelection(newActiveItem);
else {
			const selectedItems = new Set(this.state.selectedItems);
			this.rangeSelectionAnchorItem = this.rangeSelectionAnchorItem ?? first(this.state.items);
			if (!this.rangeSelectionAnchorItem) return;
			const previousActiveIndex = this.state.activeIndex ?? 0;
			const towardsAnchor = this.config.sortCompare(oldActiveItem ?? getFirstOrThrow(this.state.items), this.rangeSelectionAnchorItem) > 0;
			if (towardsAnchor) selectedItems.delete(this.state.items[previousActiveIndex]);
else selectedItems.add(newActiveItem);
			this.updateState({
				activeItem: newActiveItem,
				selectedItems,
				inMultiselect: true
			});
		}
	}
	getPreviousItem(oldActiveItem) {
		return oldActiveItem == null ? first(this.state.items) : findLast(this.state.items, (item) => this.config.sortCompare(item, oldActiveItem) < 0) ?? first(this.state.items);
	}
	selectNext(multiselect) {
		const oldActiveItem = this.rawState.activeItem;
		const lastItem = last(this.state.items);
		const newActiveItem = this.getNextItem(oldActiveItem, lastItem);
		if (newActiveItem != null) if (!multiselect) this.onSingleSelection(newActiveItem);
else {
			const selectedItems = new Set(this.state.selectedItems);
			this.rangeSelectionAnchorItem = this.rangeSelectionAnchorItem ?? first(this.state.items);
			if (!this.rangeSelectionAnchorItem) return;
			const previousActiveIndex = this.state.activeIndex ?? 0;
			const towardsAnchor = this.config.sortCompare(oldActiveItem ?? getFirstOrThrow(this.state.items), this.rangeSelectionAnchorItem) < 0;
			if (towardsAnchor) selectedItems.delete(this.state.items[previousActiveIndex]);
else selectedItems.add(newActiveItem);
			this.updateState({
				selectedItems,
				inMultiselect: true,
				activeItem: newActiveItem
			});
		}
	}
	getNextItem(oldActiveItem, lastItem) {
		return oldActiveItem == null ? first(this.state.items) : lastItem && this.config.sortCompare(lastItem, oldActiveItem) <= 0 ? lastItem : this.state.items.find((item) => this.config.sortCompare(item, oldActiveItem) > 0) ?? first(this.state.items);
	}
	areAllSelected() {
		return this.rawState.inMultiselect && this.state.selectedItems.size === this.state.items.length;
	}
	selectAll() {
		this.updateState({
			selectedItems: new Set(this.state.items),
			activeItem: null,
			inMultiselect: true
		});
		this.rangeSelectionAnchorItem = null;
	}
	selectNone() {
		this.rangeSelectionAnchorItem = null;
		this.updateState({
			selectedItems: new Set(),
			inMultiselect: false
		});
	}
	isItemSelected(itemId) {
		return findBy(this.state.selectedItems, (item) => this.config.isSameId(this.config.getItemId(item), itemId)) != null;
	}
	getSelectedAsArray = memoizedWithHiddenArgument(() => this.state, (state) => [...state.selectedItems]);
	isSelectionEmpty = memoizedWithHiddenArgument(() => this.state, (state) => state.selectedItems.size === 0);
	getUnfilteredAsArray = memoizedWithHiddenArgument(() => this.rawState, (state) => [...state.unfilteredItems]);
	enterMultiselect() {
		this.selectNone();
		this.updateState({ inMultiselect: true });
	}
	sort() {
		const filteredItems = this.rawState.filteredItems.slice().sort(this.config.sortCompare);
		const unfilteredItems = this.rawState.filteredItems.slice().sort(this.config.sortCompare);
		this.updateState({
			filteredItems,
			unfilteredItems
		});
	}
	isLoadedCompletely() {
		return this.rawState.loadingStatus === ListLoadingState.Done;
	}
	cancelLoadAll() {
		if (this.state.loadingAll) this.updateState({ loadingAll: false });
	}
	async loadAll() {
		if (this.rawState.loadingAll) return;
		this.updateState({ loadingAll: true });
		try {
			while (this.rawState.loadingAll && !this.isLoadedCompletely()) {
				await this.loadMore();
				this.selectAll();
			}
		} finally {
			this.cancelLoadAll();
		}
	}
	isEmptyAndDone() {
		return this.state.items.length === 0 && this.state.loadingStatus === ListLoadingState.Done;
	}
	stopLoading() {
		if (this.state.loadingStatus === ListLoadingState.Loading) this.updateState({ loadingStatus: ListLoadingState.ConnectionLost });
	}
	waitLoad(what) {
		return settledThen(this.loading, what);
	}
	insertLoadedItem(item) {
		if (this.rawState.unfilteredItems.some((unfilteredItem) => this.hasSameId(unfilteredItem, item))) return;
		const unfilteredItems = this.rawState.unfilteredItems.concat(item).sort(this.config.sortCompare);
		const filteredItems = this.rawState.filteredItems.concat(this.applyFilter([item])).sort(this.config.sortCompare);
		this.updateState({
			filteredItems,
			unfilteredItems
		});
	}
	updateLoadedItem(item) {
		const positionToUpdateUnfiltered = this.rawState.unfilteredItems.findIndex((unfilteredItem) => this.hasSameId(unfilteredItem, item));
		const unfilteredItems = this.rawState.unfilteredItems.slice();
		if (positionToUpdateUnfiltered >= 0) {
			unfilteredItems.splice(positionToUpdateUnfiltered, 1, item);
			unfilteredItems.sort(this.config.sortCompare);
		}
		const positionToUpdateFiltered = this.rawState.filteredItems.findIndex((filteredItem) => this.hasSameId(filteredItem, item));
		const filteredItems = this.rawState.filteredItems.slice();
		const selectedItems = new Set(this.rawState.selectedItems);
		if (positionToUpdateFiltered >= 0) {
			const [oldItem] = filteredItems.splice(positionToUpdateFiltered, 1, item);
			filteredItems.sort(this.config.sortCompare);
			if (selectedItems.delete(oldItem)) selectedItems.add(item);
		}
		const activeItemUpdated = this.rawState.activeItem != null && this.hasSameId(this.rawState.activeItem, item);
		const newActiveItem = this.rawState.activeItem;
		if (positionToUpdateUnfiltered !== -1 || positionToUpdateFiltered !== -1 || activeItemUpdated) this.updateState({
			unfilteredItems,
			filteredItems,
			selectedItems,
			activeItem: newActiveItem
		});
		if (this.rangeSelectionAnchorItem != null && this.hasSameId(this.rangeSelectionAnchorItem, item)) this.rangeSelectionAnchorItem = item;
	}
	deleteLoadedItem(itemId) {
		return settledThen(this.loading, () => {
			const item = this.rawState.filteredItems.find((e) => this.config.isSameId(this.config.getItemId(e), itemId));
			const selectedItems = new Set(this.rawState.selectedItems);
			let newActiveItem;
			if (item) {
				const wasRemoved = selectedItems.delete(item);
				if (this.rawState.filteredItems.length > 1) {
					const desiredBehavior = this.config.autoSelectBehavior?.() ?? null;
					if (wasRemoved) if (desiredBehavior === ListAutoSelectBehavior.NONE || this.state.inMultiselect) selectedItems.clear();
else if (desiredBehavior === ListAutoSelectBehavior.NEWER) newActiveItem = this.getPreviousItem(item);
else newActiveItem = item === last(this.state.items) ? this.getPreviousItem(item) : this.getNextItem(item, null);
					if (newActiveItem) selectedItems.add(newActiveItem);
else newActiveItem = this.rawState.activeItem;
				}
				const filteredItems = this.rawState.filteredItems.slice();
				remove(filteredItems, item);
				const unfilteredItems = this.rawState.unfilteredItems.slice();
				remove(unfilteredItems, item);
				this.updateState({
					filteredItems,
					selectedItems,
					unfilteredItems,
					activeItem: newActiveItem
				});
			}
		});
	}
	getLastItem() {
		if (this.rawState.unfilteredItems.length > 0) return lastThrow(this.rawState.unfilteredItems);
else return null;
	}
	hasSameId(item1, item2) {
		const id1 = this.config.getItemId(item1);
		const id2 = this.config.getItemId(item2);
		return this.config.isSameId(id1, id2);
	}
	canInsertItem(entity) {
		if (this.state.loadingStatus === ListLoadingState.Done) return true;
		const lastElement = this.getLastItem();
		return lastElement != null && this.config.sortCompare(entity, lastElement) < 0;
	}
};
function selectionAttrsForList(listModel) {
	return {
		selected: listModel?.areAllSelected() ?? false,
		selectNone: () => listModel?.selectNone(),
		selectAll: () => listModel?.selectAll()
	};
}

//#endregion
export { ListModel, selectionAttrsForList };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTGlzdE1vZGVsLWNodW5rLmpzIiwibmFtZXMiOlsiY29uZmlnOiBMaXN0TW9kZWxDb25maWc8SXRlbVR5cGUsIElkVHlwZT4iLCJhY2M6IFJlYWRvbmx5U2V0PEl0ZW1UeXBlPiIsInN0YXRlOiBMaXN0U3RhdGU8SXRlbVR5cGU+IiwiU3RyZWFtIiwibmV3U3RhdGVQYXJ0OiBQYXJ0aWFsPFByaXZhdGVMaXN0U3RhdGU8SXRlbVR5cGU+PiIsInN0YXR1czogTGlzdExvYWRpbmdTdGF0ZSIsIm5ld0l0ZW1zOiBSZWFkb25seUFycmF5PEl0ZW1UeXBlPiIsImZpbHRlcjogTGlzdEZpbHRlcjxJdGVtVHlwZT4gfCBudWxsIiwiaXRlbTogSXRlbVR5cGUiLCJjbGVhclNlbGVjdGlvbk9uTXVsdGlTZWxlY3RTdGFydD86IGJvb2xlYW4iLCJmaW5kZXI6IChpdGVtOiBJdGVtVHlwZSkgPT4gYm9vbGVhbiIsInNob3VsZFN0b3A6ICgpID0+IGJvb2xlYW4iLCJmb3VuZEl0ZW06IEl0ZW1UeXBlIHwgdW5kZWZpbmVkIiwiY2xpY2tlZEl0ZW1JbmRleDogbnVtYmVyIiwibmVhcmVzdFNlbGVjdGVkSW5kZXg6IG51bWJlciB8IG51bGwiLCJpdGVtc1RvQWRkVG9TZWxlY3Rpb246IEl0ZW1UeXBlW10iLCJtdWx0aXNlbGVjdDogYm9vbGVhbiIsIm9sZEFjdGl2ZUl0ZW06IEl0ZW1UeXBlIHwgbnVsbCIsImxhc3RJdGVtOiBJdGVtVHlwZSB8IG51bGwgfCB1bmRlZmluZWQiLCJpdGVtSWQ6IElkVHlwZSIsInN0YXRlOiBQcml2YXRlTGlzdFN0YXRlPEl0ZW1UeXBlPiIsIndoYXQ6ICgpID0+IGFueSIsIml0ZW0xOiBJdGVtVHlwZSIsIml0ZW0yOiBJdGVtVHlwZSIsImVudGl0eTogSXRlbVR5cGUiLCJsaXN0TW9kZWw6IFBpY2s8TGlzdE1vZGVsPEl0ZW1UeXBlLCBJZFR5cGU+LCBcImFyZUFsbFNlbGVjdGVkXCIgfCBcInNlbGVjdE5vbmVcIiB8IFwic2VsZWN0QWxsXCI+IHwgbnVsbCJdLCJzb3VyY2VzIjpbIi4uL3NyYy9jb21tb24vbWlzYy9MaXN0TW9kZWwudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTGlzdExvYWRpbmdTdGF0ZSwgTGlzdFN0YXRlIH0gZnJvbSBcIi4uL2d1aS9iYXNlL0xpc3QuanNcIlxuaW1wb3J0IHtcblx0YXNzZXJ0Tm9uTnVsbCxcblx0YmluYXJ5U2VhcmNoLFxuXHRkZWZlcixcblx0ZmluZEJ5LFxuXHRmaW5kTGFzdCxcblx0Zmlyc3QsXG5cdGdldEZpcnN0T3JUaHJvdyxcblx0bGFzdCxcblx0bGFzdFRocm93LFxuXHRtZW1vaXplZFdpdGhIaWRkZW5Bcmd1bWVudCxcblx0cmVtb3ZlLFxuXHRzZXRBZGRBbGwsXG5cdHNldEVxdWFscyxcblx0c2V0TWFwLFxuXHRzZXR0bGVkVGhlbixcbn0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgU3RyZWFtIGZyb20gXCJtaXRocmlsL3N0cmVhbVwiXG5pbXBvcnQgc3RyZWFtIGZyb20gXCJtaXRocmlsL3N0cmVhbVwiXG5pbXBvcnQgeyBMaXN0RmV0Y2hSZXN1bHQsIFBhZ2VTaXplIH0gZnJvbSBcIi4uL2d1aS9iYXNlL0xpc3RVdGlscy5qc1wiXG5pbXBvcnQgeyBpc09mZmxpbmVFcnJvciB9IGZyb20gXCIuLi9hcGkvY29tbW9uL3V0aWxzL0Vycm9yVXRpbHMuanNcIlxuaW1wb3J0IHsgTGlzdEF1dG9TZWxlY3RCZWhhdmlvciB9IGZyb20gXCIuL0RldmljZUNvbmZpZy5qc1wiXG5cbi8qKlxuICogU3BlY2lmaWVzIG1ldGhvZHMgZm9yIHJldHJpZXZpbmcgaXRlbXMsIGZldGNoaW5nIGl0ZW1zLCBhbmQgY29tcGFyaW5nIGl0ZW1zIGZvciBhIExpc3RNb2RlbC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBMaXN0TW9kZWxDb25maWc8SXRlbVR5cGUsIElkVHlwZT4ge1xuXHQvKipcblx0ICogR2V0IHRoZSBnaXZlbiBudW1iZXIgb2YgZW50aXRpZXMgc3RhcnRpbmcgYWZ0ZXIgdGhlIGdpdmVuIGlkLiBNYXkgcmV0dXJuIG1vcmUgaXRlbXMgdGhhbiByZXF1ZXN0ZWQsIGUuZy4gaWYgYWxsIGl0ZW1zIGFyZSBhdmFpbGFibGUgb24gZmlyc3QgZmV0Y2guXG5cdCAqL1xuXHRmZXRjaChsYXN0RmV0Y2hlZEl0ZW06IEl0ZW1UeXBlIHwgbnVsbCB8IHVuZGVmaW5lZCwgY291bnQ6IG51bWJlcik6IFByb21pc2U8TGlzdEZldGNoUmVzdWx0PEl0ZW1UeXBlPj5cblxuXHQvKipcblx0ICogQ29tcGFyZSB0aGUgaXRlbXNcblx0ICogQHJldHVybiAwIGlmIGVxdWFsLCBsZXNzIHRoYW4gMCBpZiBsZXNzIGFuZCBncmVhdGVyIHRoYW4gMCBpZiBncmVhdGVyXG5cdCAqL1xuXHRzb3J0Q29tcGFyZShpdGVtMTogSXRlbVR5cGUsIGl0ZW0yOiBJdGVtVHlwZSk6IG51bWJlclxuXG5cdC8qKlxuXHQgKiBAcmV0dXJuIHRoZSBJRCBvZiB0aGUgaXRlbVxuXHQgKi9cblx0Z2V0SXRlbUlkKGl0ZW06IEl0ZW1UeXBlKTogSWRUeXBlXG5cblx0LyoqXG5cdCAqIEByZXR1cm4gdHJ1ZSBpZiB0aGUgSURzIGFyZSB0aGUgc2FtZVxuXHQgKi9cblx0aXNTYW1lSWQoaWQxOiBJZFR5cGUsIGlkMjogSWRUeXBlKTogYm9vbGVhblxuXG5cdGF1dG9TZWxlY3RCZWhhdmlvcjogKCkgPT4gTGlzdEF1dG9TZWxlY3RCZWhhdmlvclxufVxuXG5leHBvcnQgdHlwZSBMaXN0RmlsdGVyPEl0ZW1UeXBlPiA9IChpdGVtOiBJdGVtVHlwZSkgPT4gYm9vbGVhblxuXG50eXBlIFByaXZhdGVMaXN0U3RhdGU8SXRlbVR5cGU+ID0gT21pdDxMaXN0U3RhdGU8SXRlbVR5cGU+LCBcIml0ZW1zXCIgfCBcImFjdGl2ZUluZGV4XCI+ICYge1xuXHR1bmZpbHRlcmVkSXRlbXM6IEl0ZW1UeXBlW11cblx0ZmlsdGVyZWRJdGVtczogSXRlbVR5cGVbXVxuXHRhY3RpdmVJdGVtOiBJdGVtVHlwZSB8IG51bGxcbn1cblxuLyoqIExpc3RNb2RlbCB0aGF0IGRvZXMgdGhlIHN0YXRlIHVwa2VlcCBmb3IgdGhlIExpc3QsIGluY2x1ZGluZyBsb2FkaW5nIHN0YXRlLCBsb2FkZWQgaXRlbXMsIHNlbGVjdGlvbiBhbmQgZmlsdGVycyovXG5leHBvcnQgY2xhc3MgTGlzdE1vZGVsPEl0ZW1UeXBlLCBJZFR5cGU+IHtcblx0Y29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBjb25maWc6IExpc3RNb2RlbENvbmZpZzxJdGVtVHlwZSwgSWRUeXBlPikge31cblxuXHRwcml2YXRlIGxvYWRTdGF0ZTogXCJjcmVhdGVkXCIgfCBcImluaXRpYWxpemVkXCIgPSBcImNyZWF0ZWRcIlxuXHRwcml2YXRlIGxvYWRpbmc6IFByb21pc2U8dW5rbm93bj4gPSBQcm9taXNlLnJlc29sdmUoKVxuXHRwcml2YXRlIGZpbHRlcjogTGlzdEZpbHRlcjxJdGVtVHlwZT4gfCBudWxsID0gbnVsbFxuXHRwcml2YXRlIHJhbmdlU2VsZWN0aW9uQW5jaG9ySXRlbTogSXRlbVR5cGUgfCBudWxsID0gbnVsbFxuXG5cdGdldCBzdGF0ZSgpOiBMaXN0U3RhdGU8SXRlbVR5cGU+IHtcblx0XHRyZXR1cm4gdGhpcy5zdGF0ZVN0cmVhbSgpXG5cdH1cblxuXHRwcml2YXRlIGdldCByYXdTdGF0ZSgpOiBQcml2YXRlTGlzdFN0YXRlPEl0ZW1UeXBlPiB7XG5cdFx0cmV0dXJuIHRoaXMucmF3U3RhdGVTdHJlYW0oKVxuXHR9XG5cblx0cHJpdmF0ZSBkZWZhdWx0UmF3U3RhdGVTdHJlYW06IFByaXZhdGVMaXN0U3RhdGU8SXRlbVR5cGU+ID0ge1xuXHRcdHVuZmlsdGVyZWRJdGVtczogW10sXG5cdFx0ZmlsdGVyZWRJdGVtczogW10sXG5cdFx0aW5NdWx0aXNlbGVjdDogZmFsc2UsXG5cdFx0bG9hZGluZ1N0YXR1czogTGlzdExvYWRpbmdTdGF0ZS5JZGxlLFxuXHRcdGxvYWRpbmdBbGw6IGZhbHNlLFxuXHRcdHNlbGVjdGVkSXRlbXM6IG5ldyBTZXQoKSxcblx0XHRhY3RpdmVJdGVtOiBudWxsLFxuXHR9XG5cdHByaXZhdGUgcmF3U3RhdGVTdHJlYW06IFN0cmVhbTxQcml2YXRlTGlzdFN0YXRlPEl0ZW1UeXBlPj4gPSBzdHJlYW0odGhpcy5kZWZhdWx0UmF3U3RhdGVTdHJlYW0pXG5cblx0cmVhZG9ubHkgc3RhdGVTdHJlYW06IFN0cmVhbTxMaXN0U3RhdGU8SXRlbVR5cGU+PiA9IHRoaXMucmF3U3RhdGVTdHJlYW0ubWFwKChzdGF0ZSkgPT4ge1xuXHRcdGNvbnN0IGFjdGl2ZUl0ZW0gPSBzdGF0ZS5hY3RpdmVJdGVtXG5cdFx0Y29uc3QgZm91bmRJbmRleCA9IGFjdGl2ZUl0ZW0gPyBiaW5hcnlTZWFyY2goc3RhdGUuZmlsdGVyZWRJdGVtcywgYWN0aXZlSXRlbSwgKGwsIHIpID0+IHRoaXMuY29uZmlnLnNvcnRDb21wYXJlKGwsIHIpKSA6IC0xXG5cdFx0Y29uc3QgYWN0aXZlSW5kZXggPSBmb3VuZEluZGV4IDwgMCA/IG51bGwgOiBmb3VuZEluZGV4XG5cdFx0cmV0dXJuIHsgLi4uc3RhdGUsIGl0ZW1zOiBzdGF0ZS5maWx0ZXJlZEl0ZW1zLCBhY3RpdmVJbmRleCB9XG5cdH0pXG5cblx0cmVhZG9ubHkgZGlmZmVyZW50SXRlbXNTZWxlY3RlZDogU3RyZWFtPFJlYWRvbmx5U2V0PEl0ZW1UeXBlPj4gPSBTdHJlYW0uc2Nhbihcblx0XHQoYWNjOiBSZWFkb25seVNldDxJdGVtVHlwZT4sIHN0YXRlOiBMaXN0U3RhdGU8SXRlbVR5cGU+KSA9PiB7XG5cdFx0XHRjb25zdCBuZXdTZWxlY3RlZElkcyA9IHNldE1hcChzdGF0ZS5zZWxlY3RlZEl0ZW1zLCAoaXRlbSkgPT4gdGhpcy5jb25maWcuZ2V0SXRlbUlkKGl0ZW0pKVxuXHRcdFx0Y29uc3Qgb2xkU2VsZWN0ZWRJZHMgPSBzZXRNYXAoYWNjLCAoaXRlbSkgPT4gdGhpcy5jb25maWcuZ2V0SXRlbUlkKGl0ZW0pKVxuXHRcdFx0aWYgKHNldEVxdWFscyhvbGRTZWxlY3RlZElkcywgbmV3U2VsZWN0ZWRJZHMpKSB7XG5cdFx0XHRcdC8vIFN0cmVhbS5zY2FuIHR5cGUgZGVmaW5pdGlvbnMgZG9lcyBub3QgdGFrZSBpdCBpbnRvIGFjY291bnRcblx0XHRcdFx0cmV0dXJuIFN0cmVhbS5TS0lQIGFzIHVua25vd24gYXMgUmVhZG9ubHlTZXQ8SXRlbVR5cGU+XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZXR1cm4gc3RhdGUuc2VsZWN0ZWRJdGVtc1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0bmV3IFNldCgpLFxuXHRcdHRoaXMuc3RhdGVTdHJlYW0sXG5cdClcblxuXHRwcml2YXRlIHVwZGF0ZVN0YXRlKG5ld1N0YXRlUGFydDogUGFydGlhbDxQcml2YXRlTGlzdFN0YXRlPEl0ZW1UeXBlPj4pIHtcblx0XHR0aGlzLnJhd1N0YXRlU3RyZWFtKHsgLi4udGhpcy5yYXdTdGF0ZSwgLi4ubmV3U3RhdGVQYXJ0IH0pXG5cdH1cblxuXHRwcml2YXRlIHdhaXRVdGlsSW5pdCgpOiBQcm9taXNlPHVua25vd24+IHtcblx0XHRjb25zdCBkZWZlcnJlZCA9IGRlZmVyKClcblx0XHRjb25zdCBzdWJzY3JpcHRpb24gPSB0aGlzLnJhd1N0YXRlU3RyZWFtLm1hcCgoKSA9PiB7XG5cdFx0XHRpZiAodGhpcy5sb2FkU3RhdGUgPT09IFwiaW5pdGlhbGl6ZWRcIikge1xuXHRcdFx0XHRQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcblx0XHRcdFx0XHRzdWJzY3JpcHRpb24uZW5kKHRydWUpXG5cdFx0XHRcdFx0ZGVmZXJyZWQucmVzb2x2ZSh1bmRlZmluZWQpXG5cdFx0XHRcdH0pXG5cdFx0XHR9XG5cdFx0fSlcblx0XHRyZXR1cm4gZGVmZXJyZWQucHJvbWlzZVxuXHR9XG5cblx0YXN5bmMgbG9hZEluaXRpYWwoKSB7XG5cdFx0aWYgKHRoaXMubG9hZFN0YXRlICE9PSBcImNyZWF0ZWRcIikge1xuXHRcdFx0cmV0dXJuXG5cdFx0fVxuXHRcdHRoaXMubG9hZFN0YXRlID0gXCJpbml0aWFsaXplZFwiXG5cdFx0YXdhaXQgdGhpcy5kb0xvYWQoKVxuXHR9XG5cblx0YXN5bmMgbG9hZE1vcmUoKSB7XG5cdFx0aWYgKHRoaXMucmF3U3RhdGUubG9hZGluZ1N0YXR1cyA9PT0gTGlzdExvYWRpbmdTdGF0ZS5Mb2FkaW5nKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5sb2FkaW5nXG5cdFx0fVxuXHRcdGlmICh0aGlzLmxvYWRTdGF0ZSAhPT0gXCJpbml0aWFsaXplZFwiIHx8IHRoaXMucmF3U3RhdGUubG9hZGluZ1N0YXR1cyAhPT0gTGlzdExvYWRpbmdTdGF0ZS5JZGxlKSB7XG5cdFx0XHRyZXR1cm5cblx0XHR9XG5cdFx0YXdhaXQgdGhpcy5kb0xvYWQoKVxuXHR9XG5cblx0YXN5bmMgcmV0cnlMb2FkaW5nKCkge1xuXHRcdGlmICh0aGlzLmxvYWRTdGF0ZSAhPT0gXCJpbml0aWFsaXplZFwiIHx8IHRoaXMucmF3U3RhdGUubG9hZGluZ1N0YXR1cyAhPT0gTGlzdExvYWRpbmdTdGF0ZS5Db25uZWN0aW9uTG9zdCkge1xuXHRcdFx0cmV0dXJuXG5cdFx0fVxuXHRcdGF3YWl0IHRoaXMuZG9Mb2FkKClcblx0fVxuXG5cdHVwZGF0ZUxvYWRpbmdTdGF0dXMoc3RhdHVzOiBMaXN0TG9hZGluZ1N0YXRlKSB7XG5cdFx0aWYgKHRoaXMucmF3U3RhdGUubG9hZGluZ1N0YXR1cyA9PT0gc3RhdHVzKSByZXR1cm5cblxuXHRcdHRoaXMudXBkYXRlU3RhdGUoeyBsb2FkaW5nU3RhdHVzOiBzdGF0dXMgfSlcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgZG9Mb2FkKCkge1xuXHRcdHRoaXMudXBkYXRlTG9hZGluZ1N0YXR1cyhMaXN0TG9hZGluZ1N0YXRlLkxvYWRpbmcpXG5cdFx0dGhpcy5sb2FkaW5nID0gUHJvbWlzZS5yZXNvbHZlKCkudGhlbihhc3luYyAoKSA9PiB7XG5cdFx0XHRjb25zdCBsYXN0RmV0Y2hlZEl0ZW0gPSBsYXN0KHRoaXMucmF3U3RhdGUudW5maWx0ZXJlZEl0ZW1zKVxuXHRcdFx0dHJ5IHtcblx0XHRcdFx0Y29uc3QgeyBpdGVtczogbmV3SXRlbXMsIGNvbXBsZXRlIH0gPSBhd2FpdCB0aGlzLmNvbmZpZy5mZXRjaChsYXN0RmV0Y2hlZEl0ZW0sIFBhZ2VTaXplKVxuXHRcdFx0XHQvLyBpZiB0aGUgbG9hZGluZyB3YXMgY2FuY2VsbGVkIGluIHRoZSBtZWFudGltZSwgZG9uJ3QgaW5zZXJ0IGFueXRoaW5nIHNvIHRoYXQgaXQncyBub3QgY29uZnVzaW5nXG5cdFx0XHRcdGlmICh0aGlzLnN0YXRlLmxvYWRpbmdTdGF0dXMgPT09IExpc3RMb2FkaW5nU3RhdGUuQ29ubmVjdGlvbkxvc3QpIHtcblx0XHRcdFx0XHRyZXR1cm5cblx0XHRcdFx0fVxuXHRcdFx0XHRjb25zdCBuZXdVbmZpbHRlcmVkSXRlbXMgPSBbLi4udGhpcy5yYXdTdGF0ZS51bmZpbHRlcmVkSXRlbXMsIC4uLm5ld0l0ZW1zXVxuXHRcdFx0XHRuZXdVbmZpbHRlcmVkSXRlbXMuc29ydCh0aGlzLmNvbmZpZy5zb3J0Q29tcGFyZSlcblxuXHRcdFx0XHRjb25zdCBuZXdGaWx0ZXJlZEl0ZW1zID0gWy4uLnRoaXMucmF3U3RhdGUuZmlsdGVyZWRJdGVtcywgLi4udGhpcy5hcHBseUZpbHRlcihuZXdJdGVtcyldXG5cdFx0XHRcdG5ld0ZpbHRlcmVkSXRlbXMuc29ydCh0aGlzLmNvbmZpZy5zb3J0Q29tcGFyZSlcblxuXHRcdFx0XHRjb25zdCBsb2FkaW5nU3RhdHVzID0gY29tcGxldGUgPyBMaXN0TG9hZGluZ1N0YXRlLkRvbmUgOiBMaXN0TG9hZGluZ1N0YXRlLklkbGVcblx0XHRcdFx0dGhpcy51cGRhdGVTdGF0ZSh7IGxvYWRpbmdTdGF0dXMsIHVuZmlsdGVyZWRJdGVtczogbmV3VW5maWx0ZXJlZEl0ZW1zLCBmaWx0ZXJlZEl0ZW1zOiBuZXdGaWx0ZXJlZEl0ZW1zIH0pXG5cdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdHRoaXMudXBkYXRlTG9hZGluZ1N0YXR1cyhMaXN0TG9hZGluZ1N0YXRlLkNvbm5lY3Rpb25Mb3N0KVxuXHRcdFx0XHRpZiAoIWlzT2ZmbGluZUVycm9yKGUpKSB7XG5cdFx0XHRcdFx0dGhyb3cgZVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSlcblx0XHRyZXR1cm4gdGhpcy5sb2FkaW5nXG5cdH1cblxuXHRwcml2YXRlIGFwcGx5RmlsdGVyKG5ld0l0ZW1zOiBSZWFkb25seUFycmF5PEl0ZW1UeXBlPik6IEFycmF5PEl0ZW1UeXBlPiB7XG5cdFx0cmV0dXJuIG5ld0l0ZW1zLmZpbHRlcih0aGlzLmZpbHRlciA/PyAoKCkgPT4gdHJ1ZSkpXG5cdH1cblxuXHRzZXRGaWx0ZXIoZmlsdGVyOiBMaXN0RmlsdGVyPEl0ZW1UeXBlPiB8IG51bGwpIHtcblx0XHR0aGlzLmZpbHRlciA9IGZpbHRlclxuXHRcdHRoaXMucmVhcHBseUZpbHRlcigpXG5cdH1cblxuXHRyZWFwcGx5RmlsdGVyKCkge1xuXHRcdGNvbnN0IG5ld0ZpbHRlcmVkSXRlbXMgPSB0aGlzLmFwcGx5RmlsdGVyKHRoaXMucmF3U3RhdGUudW5maWx0ZXJlZEl0ZW1zKVxuXG5cdFx0Y29uc3QgbmV3U2VsZWN0ZWRJdGVtcyA9IG5ldyBTZXQodGhpcy5hcHBseUZpbHRlcihbLi4udGhpcy5zdGF0ZS5zZWxlY3RlZEl0ZW1zXSkpXG5cblx0XHR0aGlzLnVwZGF0ZVN0YXRlKHsgZmlsdGVyZWRJdGVtczogbmV3RmlsdGVyZWRJdGVtcywgc2VsZWN0ZWRJdGVtczogbmV3U2VsZWN0ZWRJdGVtcyB9KVxuXHR9XG5cblx0b25TaW5nbGVTZWxlY3Rpb24oaXRlbTogSXRlbVR5cGUpOiB2b2lkIHtcblx0XHR0aGlzLnVwZGF0ZVN0YXRlKHsgc2VsZWN0ZWRJdGVtczogbmV3IFNldChbaXRlbV0pLCBpbk11bHRpc2VsZWN0OiBmYWxzZSwgYWN0aXZlSXRlbTogaXRlbSB9KVxuXHRcdHRoaXMucmFuZ2VTZWxlY3Rpb25BbmNob3JJdGVtID0gaXRlbVxuXHR9XG5cblx0LyoqIEFuIGl0ZW0gd2FzIGFkZGVkIHRvIHRoZSBzZWxlY3Rpb24uIElmIG11bHRpc2VsZWN0IHdhcyBub3Qgb24sIGRpc2NhcmQgcHJldmlvdXMgc2luZ2xlIHNlbGVjdGlvbiBhbmQgb25seSBhZGRlZCBzZWxlY3RlZCBpdGVtIHRvIHRoZSBzZWxlY3Rpb24uICovXG5cdG9uU2luZ2xlRXhjbHVzaXZlU2VsZWN0aW9uKGl0ZW06IEl0ZW1UeXBlKTogdm9pZCB7XG5cdFx0aWYgKCF0aGlzLnJhd1N0YXRlLmluTXVsdGlzZWxlY3QpIHtcblx0XHRcdHRoaXMudXBkYXRlU3RhdGUoeyBzZWxlY3RlZEl0ZW1zOiBuZXcgU2V0KFtpdGVtXSksIGluTXVsdGlzZWxlY3Q6IHRydWUsIGFjdGl2ZUl0ZW06IGl0ZW0gfSlcblx0XHRcdHRoaXMucmFuZ2VTZWxlY3Rpb25BbmNob3JJdGVtID0gaXRlbVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRjb25zdCBzZWxlY3RlZEl0ZW1zID0gbmV3IFNldCh0aGlzLnN0YXRlLnNlbGVjdGVkSXRlbXMpXG5cdFx0XHRpZiAoc2VsZWN0ZWRJdGVtcy5oYXMoaXRlbSkpIHtcblx0XHRcdFx0c2VsZWN0ZWRJdGVtcy5kZWxldGUoaXRlbSlcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHNlbGVjdGVkSXRlbXMuYWRkKGl0ZW0pXG5cdFx0XHR9XG5cdFx0XHRpZiAoc2VsZWN0ZWRJdGVtcy5zaXplID09PSAwKSB7XG5cdFx0XHRcdHRoaXMudXBkYXRlU3RhdGUoeyBzZWxlY3RlZEl0ZW1zLCBpbk11bHRpc2VsZWN0OiBmYWxzZSwgYWN0aXZlSXRlbTogbnVsbCB9KVxuXHRcdFx0XHR0aGlzLnJhbmdlU2VsZWN0aW9uQW5jaG9ySXRlbSA9IG51bGxcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXMudXBkYXRlU3RhdGUoeyBzZWxlY3RlZEl0ZW1zLCBpbk11bHRpc2VsZWN0OiB0cnVlLCBhY3RpdmVJdGVtOiBpdGVtIH0pXG5cdFx0XHRcdHRoaXMucmFuZ2VTZWxlY3Rpb25BbmNob3JJdGVtID0gaXRlbVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdC8qKiBBbiBpdGVtIHdhcyBhZGRlZCB0byB0aGUgc2VsZWN0aW9uLiBJZiBtdWx0aXNlbGVjdCB3YXMgbm90IG9uLCBhZGQgcHJldmlvdXMgc2luZ2xlIHNlbGVjdGlvbiBhbmQgbmV3bHkgYWRkZWQgc2VsZWN0ZWQgaXRlbSB0byB0aGUgc2VsZWN0aW9uLiAqL1xuXHRvblNpbmdsZUluY2x1c2l2ZVNlbGVjdGlvbihpdGVtOiBJdGVtVHlwZSwgY2xlYXJTZWxlY3Rpb25Pbk11bHRpU2VsZWN0U3RhcnQ/OiBib29sZWFuKTogdm9pZCB7XG5cdFx0Ly8gSWYgaXQgaXNuJ3QgaW4gTXVsdGlTZWxlY3QsIHdlIGRpc2NhcmQgYWxsIHByZXZpb3VzIGl0ZW1zXG5cdFx0Ly8gYW5kIHN0YXJ0IGEgbmV3IHNldCBvZiBzZWxlY3RlZCBpdGVtcyBpbiBNdWx0aVNlbGVjdCBtb2RlXG5cdFx0Ly8gd2UgZG8gaXQgb25seSBpZiB0aGUgdXNlciBpcyBvbiBzaW5nbGVDb2x1bW5Nb2RlLCBiZWNhdXNlXG5cdFx0Ly8gdGhlcmUgYXJlIGRpZmZlcmVudCBleHBlY3RlZCBiZWhhdmlvcnMgdGhlcmVcblx0XHRpZiAoIXRoaXMuc3RhdGUuaW5NdWx0aXNlbGVjdCAmJiBjbGVhclNlbGVjdGlvbk9uTXVsdGlTZWxlY3RTdGFydCkge1xuXHRcdFx0dGhpcy5zZWxlY3ROb25lKClcblx0XHR9XG5cblx0XHRjb25zdCBzZWxlY3RlZEl0ZW1zID0gbmV3IFNldCh0aGlzLnN0YXRlLnNlbGVjdGVkSXRlbXMpXG5cblx0XHRpZiAodGhpcy5zdGF0ZS5pbk11bHRpc2VsZWN0ICYmIHNlbGVjdGVkSXRlbXMuaGFzKGl0ZW0pKSB7XG5cdFx0XHRzZWxlY3RlZEl0ZW1zLmRlbGV0ZShpdGVtKVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRzZWxlY3RlZEl0ZW1zLmFkZChpdGVtKVxuXHRcdH1cblxuXHRcdGlmIChzZWxlY3RlZEl0ZW1zLnNpemUgPT09IDApIHtcblx0XHRcdHRoaXMudXBkYXRlU3RhdGUoeyBzZWxlY3RlZEl0ZW1zLCBpbk11bHRpc2VsZWN0OiBmYWxzZSwgYWN0aXZlSXRlbTogbnVsbCB9KVxuXHRcdFx0dGhpcy5yYW5nZVNlbGVjdGlvbkFuY2hvckl0ZW0gPSBudWxsXG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMudXBkYXRlU3RhdGUoeyBzZWxlY3RlZEl0ZW1zLCBpbk11bHRpc2VsZWN0OiB0cnVlLCBhY3RpdmVJdGVtOiBpdGVtIH0pXG5cdFx0XHR0aGlzLnJhbmdlU2VsZWN0aW9uQW5jaG9ySXRlbSA9IGl0ZW1cblx0XHR9XG5cdH1cblxuXHRhc3luYyBsb2FkQW5kU2VsZWN0KGZpbmRlcjogKGl0ZW06IEl0ZW1UeXBlKSA9PiBib29sZWFuLCBzaG91bGRTdG9wOiAoKSA9PiBib29sZWFuKTogUHJvbWlzZTxJdGVtVHlwZSB8IG51bGw+IHtcblx0XHRhd2FpdCB0aGlzLndhaXRVdGlsSW5pdCgpXG5cdFx0bGV0IGZvdW5kSXRlbTogSXRlbVR5cGUgfCB1bmRlZmluZWQgPSB1bmRlZmluZWRcblx0XHR3aGlsZSAoXG5cdFx0XHQvLyBpZiB3ZSBkaWQgZmluZCB0aGUgdGFyZ2V0IG1haWwsIHN0b3Bcblx0XHRcdC8vIG1ha2Ugc3VyZSB0byBjYWxsIHRoaXMgYmVmb3JlIHNob3VsZFN0b3Agb3Igd2UgbWlnaHQgc3RvcCBiZWZvcmUgdHJ5aW5nIHRvIGZpbmQgYW4gaXRlbVxuXHRcdFx0Ly8gdGhpcyBjYW4gcHJvYmFibHkgYmUgb3B0aW1pemVkIHRvIGJlIGJpbmFyeSBzZWFyY2ggaW4gbW9zdCAoYWxsPykgY2FzZXNcblx0XHRcdCEoZm91bmRJdGVtID0gdGhpcy5yYXdTdGF0ZS51bmZpbHRlcmVkSXRlbXMuZmluZChmaW5kZXIpKSAmJlxuXHRcdFx0IXNob3VsZFN0b3AoKSAmJlxuXHRcdFx0Ly8gaWYgd2UgYXJlIGRvbmUgbG9hZGluZywgc3RvcFxuXHRcdFx0dGhpcy5yYXdTdGF0ZS5sb2FkaW5nU3RhdHVzICE9PSBMaXN0TG9hZGluZ1N0YXRlLkRvbmUgJiZcblx0XHRcdC8vIGlmIHdlIGFyZSBvZmZsaW5lLCBzdG9wXG5cdFx0XHR0aGlzLnJhd1N0YXRlLmxvYWRpbmdTdGF0dXMgIT09IExpc3RMb2FkaW5nU3RhdGUuQ29ubmVjdGlvbkxvc3Rcblx0XHQpIHtcblx0XHRcdGF3YWl0IHRoaXMubG9hZE1vcmUoKVxuXHRcdH1cblx0XHRpZiAoZm91bmRJdGVtKSB7XG5cdFx0XHR0aGlzLm9uU2luZ2xlU2VsZWN0aW9uKGZvdW5kSXRlbSlcblx0XHR9XG5cdFx0cmV0dXJuIGZvdW5kSXRlbSA/PyBudWxsXG5cdH1cblxuXHRzZWxlY3RSYW5nZVRvd2FyZHMoaXRlbTogSXRlbVR5cGUpOiB2b2lkIHtcblx0XHRjb25zdCBzZWxlY3RlZEl0ZW1zID0gbmV3IFNldCh0aGlzLnN0YXRlLnNlbGVjdGVkSXRlbXMpXG5cdFx0aWYgKHNlbGVjdGVkSXRlbXMuc2l6ZSA9PT0gMCkge1xuXHRcdFx0c2VsZWN0ZWRJdGVtcy5hZGQoaXRlbSlcblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly8gd2UgYXJlIHRyeWluZyB0byBmaW5kIHRoZSBpdGVtIHRoYXQncyBjbG9zZXN0IHRvIHRoZSBjbGlja2VkIG9uZVxuXHRcdFx0Ly8gYW5kIGFmdGVyIHRoYXQgd2Ugd2lsbCBzZWxlY3QgZXZlcnl0aGluZyBiZXR3ZWVuIHRoZSBjbG9zZXN0IGFuZCB0aGUgY2xpY2tlZCBvbmVcblxuXHRcdFx0Y29uc3QgY2xpY2tlZEl0ZW1JbmRleDogbnVtYmVyID0gdGhpcy5zdGF0ZS5pdGVtcy5pbmRleE9mKGl0ZW0pXG5cdFx0XHRsZXQgbmVhcmVzdFNlbGVjdGVkSW5kZXg6IG51bWJlciB8IG51bGwgPSBudWxsXG5cblx0XHRcdC8vIGZpbmQgYWJzb2x1dGUgbWluIGJhc2VkIG9uIHRoZSBkaXN0YW5jZSAoY2xvc2VzdClcblx0XHRcdGZvciAoY29uc3Qgc2VsZWN0ZWRJdGVtIG9mIHNlbGVjdGVkSXRlbXMpIHtcblx0XHRcdFx0Y29uc3QgY3VycmVudFNlbGVjdGVkSXRlbUluZGV4ID0gdGhpcy5zdGF0ZS5pdGVtcy5pbmRleE9mKHNlbGVjdGVkSXRlbSlcblxuXHRcdFx0XHRpZiAobmVhcmVzdFNlbGVjdGVkSW5kZXggPT0gbnVsbCB8fCBNYXRoLmFicyhjbGlja2VkSXRlbUluZGV4IC0gY3VycmVudFNlbGVjdGVkSXRlbUluZGV4KSA8IE1hdGguYWJzKGNsaWNrZWRJdGVtSW5kZXggLSBuZWFyZXN0U2VsZWN0ZWRJbmRleCkpIHtcblx0XHRcdFx0XHRuZWFyZXN0U2VsZWN0ZWRJbmRleCA9IGN1cnJlbnRTZWxlY3RlZEl0ZW1JbmRleFxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRhc3NlcnROb25OdWxsKG5lYXJlc3RTZWxlY3RlZEluZGV4KVxuXG5cdFx0XHRjb25zdCBpdGVtc1RvQWRkVG9TZWxlY3Rpb246IEl0ZW1UeXBlW10gPSBbXVxuXG5cdFx0XHRpZiAobmVhcmVzdFNlbGVjdGVkSW5kZXggPCBjbGlja2VkSXRlbUluZGV4KSB7XG5cdFx0XHRcdGZvciAobGV0IGkgPSBuZWFyZXN0U2VsZWN0ZWRJbmRleCArIDE7IGkgPD0gY2xpY2tlZEl0ZW1JbmRleDsgaSsrKSB7XG5cdFx0XHRcdFx0aXRlbXNUb0FkZFRvU2VsZWN0aW9uLnB1c2godGhpcy5zdGF0ZS5pdGVtc1tpXSlcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Zm9yIChsZXQgaSA9IGNsaWNrZWRJdGVtSW5kZXg7IGkgPCBuZWFyZXN0U2VsZWN0ZWRJbmRleDsgaSsrKSB7XG5cdFx0XHRcdFx0aXRlbXNUb0FkZFRvU2VsZWN0aW9uLnB1c2godGhpcy5zdGF0ZS5pdGVtc1tpXSlcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRzZXRBZGRBbGwoc2VsZWN0ZWRJdGVtcywgaXRlbXNUb0FkZFRvU2VsZWN0aW9uKVxuXHRcdH1cblx0XHR0aGlzLnVwZGF0ZVN0YXRlKHsgc2VsZWN0ZWRJdGVtcywgaW5NdWx0aXNlbGVjdDogdHJ1ZSwgYWN0aXZlSXRlbTogaXRlbSB9KVxuXHRcdHRoaXMucmFuZ2VTZWxlY3Rpb25BbmNob3JJdGVtID0gaXRlbVxuXHR9XG5cblx0c2VsZWN0UHJldmlvdXMobXVsdGlzZWxlY3Q6IGJvb2xlYW4pIHtcblx0XHRjb25zdCBvbGRBY3RpdmVJdGVtID0gdGhpcy5yYXdTdGF0ZS5hY3RpdmVJdGVtXG5cdFx0Y29uc3QgbmV3QWN0aXZlSXRlbSA9IHRoaXMuZ2V0UHJldmlvdXNJdGVtKG9sZEFjdGl2ZUl0ZW0pXG5cblx0XHRpZiAobmV3QWN0aXZlSXRlbSAhPSBudWxsKSB7XG5cdFx0XHRpZiAoIW11bHRpc2VsZWN0KSB7XG5cdFx0XHRcdHRoaXMub25TaW5nbGVTZWxlY3Rpb24obmV3QWN0aXZlSXRlbSlcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGNvbnN0IHNlbGVjdGVkSXRlbXMgPSBuZXcgU2V0KHRoaXMuc3RhdGUuc2VsZWN0ZWRJdGVtcylcblx0XHRcdFx0dGhpcy5yYW5nZVNlbGVjdGlvbkFuY2hvckl0ZW0gPSB0aGlzLnJhbmdlU2VsZWN0aW9uQW5jaG9ySXRlbSA/PyBmaXJzdCh0aGlzLnN0YXRlLml0ZW1zKVxuXHRcdFx0XHRpZiAoIXRoaXMucmFuZ2VTZWxlY3Rpb25BbmNob3JJdGVtKSByZXR1cm5cblxuXHRcdFx0XHRjb25zdCBwcmV2aW91c0FjdGl2ZUluZGV4ID0gdGhpcy5zdGF0ZS5hY3RpdmVJbmRleCA/PyAwXG5cdFx0XHRcdGNvbnN0IHRvd2FyZHNBbmNob3IgPSB0aGlzLmNvbmZpZy5zb3J0Q29tcGFyZShvbGRBY3RpdmVJdGVtID8/IGdldEZpcnN0T3JUaHJvdyh0aGlzLnN0YXRlLml0ZW1zKSwgdGhpcy5yYW5nZVNlbGVjdGlvbkFuY2hvckl0ZW0pID4gMFxuXHRcdFx0XHRpZiAodG93YXJkc0FuY2hvcikge1xuXHRcdFx0XHRcdC8vIHJlbW92ZVxuXHRcdFx0XHRcdHNlbGVjdGVkSXRlbXMuZGVsZXRlKHRoaXMuc3RhdGUuaXRlbXNbcHJldmlvdXNBY3RpdmVJbmRleF0pXG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Ly8gYWRkXG5cdFx0XHRcdFx0c2VsZWN0ZWRJdGVtcy5hZGQobmV3QWN0aXZlSXRlbSlcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHRoaXMudXBkYXRlU3RhdGUoeyBhY3RpdmVJdGVtOiBuZXdBY3RpdmVJdGVtLCBzZWxlY3RlZEl0ZW1zLCBpbk11bHRpc2VsZWN0OiB0cnVlIH0pXG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBnZXRQcmV2aW91c0l0ZW0ob2xkQWN0aXZlSXRlbTogSXRlbVR5cGUgfCBudWxsKSB7XG5cdFx0cmV0dXJuIG9sZEFjdGl2ZUl0ZW0gPT0gbnVsbFxuXHRcdFx0PyBmaXJzdCh0aGlzLnN0YXRlLml0ZW1zKVxuXHRcdFx0OiBmaW5kTGFzdCh0aGlzLnN0YXRlLml0ZW1zLCAoaXRlbSkgPT4gdGhpcy5jb25maWcuc29ydENvbXBhcmUoaXRlbSwgb2xkQWN0aXZlSXRlbSkgPCAwKSA/PyBmaXJzdCh0aGlzLnN0YXRlLml0ZW1zKVxuXHR9XG5cblx0c2VsZWN0TmV4dChtdWx0aXNlbGVjdDogYm9vbGVhbikge1xuXHRcdGNvbnN0IG9sZEFjdGl2ZUl0ZW0gPSB0aGlzLnJhd1N0YXRlLmFjdGl2ZUl0ZW1cblx0XHRjb25zdCBsYXN0SXRlbSA9IGxhc3QodGhpcy5zdGF0ZS5pdGVtcylcblx0XHRjb25zdCBuZXdBY3RpdmVJdGVtID0gdGhpcy5nZXROZXh0SXRlbShvbGRBY3RpdmVJdGVtLCBsYXN0SXRlbSlcblxuXHRcdGlmIChuZXdBY3RpdmVJdGVtICE9IG51bGwpIHtcblx0XHRcdGlmICghbXVsdGlzZWxlY3QpIHtcblx0XHRcdFx0dGhpcy5vblNpbmdsZVNlbGVjdGlvbihuZXdBY3RpdmVJdGVtKVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Y29uc3Qgc2VsZWN0ZWRJdGVtcyA9IG5ldyBTZXQodGhpcy5zdGF0ZS5zZWxlY3RlZEl0ZW1zKVxuXHRcdFx0XHR0aGlzLnJhbmdlU2VsZWN0aW9uQW5jaG9ySXRlbSA9IHRoaXMucmFuZ2VTZWxlY3Rpb25BbmNob3JJdGVtID8/IGZpcnN0KHRoaXMuc3RhdGUuaXRlbXMpXG5cdFx0XHRcdGlmICghdGhpcy5yYW5nZVNlbGVjdGlvbkFuY2hvckl0ZW0pIHJldHVyblxuXG5cdFx0XHRcdGNvbnN0IHByZXZpb3VzQWN0aXZlSW5kZXggPSB0aGlzLnN0YXRlLmFjdGl2ZUluZGV4ID8/IDBcblx0XHRcdFx0Y29uc3QgdG93YXJkc0FuY2hvciA9IHRoaXMuY29uZmlnLnNvcnRDb21wYXJlKG9sZEFjdGl2ZUl0ZW0gPz8gZ2V0Rmlyc3RPclRocm93KHRoaXMuc3RhdGUuaXRlbXMpLCB0aGlzLnJhbmdlU2VsZWN0aW9uQW5jaG9ySXRlbSkgPCAwXG5cdFx0XHRcdGlmICh0b3dhcmRzQW5jaG9yKSB7XG5cdFx0XHRcdFx0c2VsZWN0ZWRJdGVtcy5kZWxldGUodGhpcy5zdGF0ZS5pdGVtc1twcmV2aW91c0FjdGl2ZUluZGV4XSlcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRzZWxlY3RlZEl0ZW1zLmFkZChuZXdBY3RpdmVJdGVtKVxuXHRcdFx0XHR9XG5cdFx0XHRcdHRoaXMudXBkYXRlU3RhdGUoeyBzZWxlY3RlZEl0ZW1zLCBpbk11bHRpc2VsZWN0OiB0cnVlLCBhY3RpdmVJdGVtOiBuZXdBY3RpdmVJdGVtIH0pXG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBnZXROZXh0SXRlbShvbGRBY3RpdmVJdGVtOiBJdGVtVHlwZSB8IG51bGwsIGxhc3RJdGVtOiBJdGVtVHlwZSB8IG51bGwgfCB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gb2xkQWN0aXZlSXRlbSA9PSBudWxsXG5cdFx0XHQ/IGZpcnN0KHRoaXMuc3RhdGUuaXRlbXMpXG5cdFx0XHQ6IGxhc3RJdGVtICYmIHRoaXMuY29uZmlnLnNvcnRDb21wYXJlKGxhc3RJdGVtLCBvbGRBY3RpdmVJdGVtKSA8PSAwXG5cdFx0XHQ/IGxhc3RJdGVtXG5cdFx0XHQ6IHRoaXMuc3RhdGUuaXRlbXMuZmluZCgoaXRlbSkgPT4gdGhpcy5jb25maWcuc29ydENvbXBhcmUoaXRlbSwgb2xkQWN0aXZlSXRlbSkgPiAwKSA/PyBmaXJzdCh0aGlzLnN0YXRlLml0ZW1zKVxuXHR9XG5cblx0YXJlQWxsU2VsZWN0ZWQoKTogYm9vbGVhbiB7XG5cdFx0cmV0dXJuIHRoaXMucmF3U3RhdGUuaW5NdWx0aXNlbGVjdCAmJiB0aGlzLnN0YXRlLnNlbGVjdGVkSXRlbXMuc2l6ZSA9PT0gdGhpcy5zdGF0ZS5pdGVtcy5sZW5ndGhcblx0fVxuXG5cdHNlbGVjdEFsbCgpIHtcblx0XHR0aGlzLnVwZGF0ZVN0YXRlKHsgc2VsZWN0ZWRJdGVtczogbmV3IFNldCh0aGlzLnN0YXRlLml0ZW1zKSwgYWN0aXZlSXRlbTogbnVsbCwgaW5NdWx0aXNlbGVjdDogdHJ1ZSB9KVxuXHRcdHRoaXMucmFuZ2VTZWxlY3Rpb25BbmNob3JJdGVtID0gbnVsbFxuXHR9XG5cblx0c2VsZWN0Tm9uZSgpIHtcblx0XHR0aGlzLnJhbmdlU2VsZWN0aW9uQW5jaG9ySXRlbSA9IG51bGxcblx0XHR0aGlzLnVwZGF0ZVN0YXRlKHsgc2VsZWN0ZWRJdGVtczogbmV3IFNldDxJdGVtVHlwZT4oKSwgaW5NdWx0aXNlbGVjdDogZmFsc2UgfSlcblx0fVxuXG5cdGlzSXRlbVNlbGVjdGVkKGl0ZW1JZDogSWRUeXBlKTogYm9vbGVhbiB7XG5cdFx0cmV0dXJuIGZpbmRCeSh0aGlzLnN0YXRlLnNlbGVjdGVkSXRlbXMsIChpdGVtOiBJdGVtVHlwZSkgPT4gdGhpcy5jb25maWcuaXNTYW1lSWQodGhpcy5jb25maWcuZ2V0SXRlbUlkKGl0ZW0pLCBpdGVtSWQpKSAhPSBudWxsXG5cdH1cblxuXHRyZWFkb25seSBnZXRTZWxlY3RlZEFzQXJyYXk6ICgpID0+IEFycmF5PEl0ZW1UeXBlPiA9IG1lbW9pemVkV2l0aEhpZGRlbkFyZ3VtZW50KFxuXHRcdCgpID0+IHRoaXMuc3RhdGUsXG5cdFx0KHN0YXRlOiBMaXN0U3RhdGU8SXRlbVR5cGU+KSA9PiBbLi4uc3RhdGUuc2VsZWN0ZWRJdGVtc10sXG5cdClcblxuXHRyZWFkb25seSBpc1NlbGVjdGlvbkVtcHR5OiAoKSA9PiBib29sZWFuID0gbWVtb2l6ZWRXaXRoSGlkZGVuQXJndW1lbnQoXG5cdFx0KCkgPT4gdGhpcy5zdGF0ZSxcblx0XHQoc3RhdGU6IExpc3RTdGF0ZTxJdGVtVHlwZT4pID0+IHN0YXRlLnNlbGVjdGVkSXRlbXMuc2l6ZSA9PT0gMCxcblx0KVxuXG5cdHJlYWRvbmx5IGdldFVuZmlsdGVyZWRBc0FycmF5OiAoKSA9PiBBcnJheTxJdGVtVHlwZT4gPSBtZW1vaXplZFdpdGhIaWRkZW5Bcmd1bWVudChcblx0XHQoKSA9PiB0aGlzLnJhd1N0YXRlLFxuXHRcdChzdGF0ZTogUHJpdmF0ZUxpc3RTdGF0ZTxJdGVtVHlwZT4pID0+IFsuLi5zdGF0ZS51bmZpbHRlcmVkSXRlbXNdLFxuXHQpXG5cblx0ZW50ZXJNdWx0aXNlbGVjdCgpIHtcblx0XHQvLyBhdm9pZCBoYXZpbmcgdGhlIHZpZXdlZCBpdGVtIGFzIGEgcHJlc2VsZWN0ZWQgb25lIHdoaWNoIG1pZ2h0IGJlIGNvbmZ1c2luZy5cblx0XHR0aGlzLnNlbGVjdE5vbmUoKVxuXHRcdHRoaXMudXBkYXRlU3RhdGUoeyBpbk11bHRpc2VsZWN0OiB0cnVlIH0pXG5cdH1cblxuXHRzb3J0KCkge1xuXHRcdGNvbnN0IGZpbHRlcmVkSXRlbXMgPSB0aGlzLnJhd1N0YXRlLmZpbHRlcmVkSXRlbXMuc2xpY2UoKS5zb3J0KHRoaXMuY29uZmlnLnNvcnRDb21wYXJlKVxuXHRcdGNvbnN0IHVuZmlsdGVyZWRJdGVtcyA9IHRoaXMucmF3U3RhdGUuZmlsdGVyZWRJdGVtcy5zbGljZSgpLnNvcnQodGhpcy5jb25maWcuc29ydENvbXBhcmUpXG5cdFx0dGhpcy51cGRhdGVTdGF0ZSh7IGZpbHRlcmVkSXRlbXMsIHVuZmlsdGVyZWRJdGVtcyB9KVxuXHR9XG5cblx0aXNMb2FkZWRDb21wbGV0ZWx5KCk6IGJvb2xlYW4ge1xuXHRcdHJldHVybiB0aGlzLnJhd1N0YXRlLmxvYWRpbmdTdGF0dXMgPT09IExpc3RMb2FkaW5nU3RhdGUuRG9uZVxuXHR9XG5cblx0Y2FuY2VsTG9hZEFsbCgpIHtcblx0XHRpZiAodGhpcy5zdGF0ZS5sb2FkaW5nQWxsKSB7XG5cdFx0XHR0aGlzLnVwZGF0ZVN0YXRlKHsgbG9hZGluZ0FsbDogZmFsc2UgfSlcblx0XHR9XG5cdH1cblxuXHRhc3luYyBsb2FkQWxsKCkge1xuXHRcdGlmICh0aGlzLnJhd1N0YXRlLmxvYWRpbmdBbGwpIHJldHVyblxuXG5cdFx0dGhpcy51cGRhdGVTdGF0ZSh7IGxvYWRpbmdBbGw6IHRydWUgfSlcblxuXHRcdHRyeSB7XG5cdFx0XHR3aGlsZSAodGhpcy5yYXdTdGF0ZS5sb2FkaW5nQWxsICYmICF0aGlzLmlzTG9hZGVkQ29tcGxldGVseSgpKSB7XG5cdFx0XHRcdGF3YWl0IHRoaXMubG9hZE1vcmUoKVxuXHRcdFx0XHR0aGlzLnNlbGVjdEFsbCgpXG5cdFx0XHR9XG5cdFx0fSBmaW5hbGx5IHtcblx0XHRcdHRoaXMuY2FuY2VsTG9hZEFsbCgpXG5cdFx0fVxuXHR9XG5cblx0aXNFbXB0eUFuZERvbmUoKTogYm9vbGVhbiB7XG5cdFx0cmV0dXJuIHRoaXMuc3RhdGUuaXRlbXMubGVuZ3RoID09PSAwICYmIHRoaXMuc3RhdGUubG9hZGluZ1N0YXR1cyA9PT0gTGlzdExvYWRpbmdTdGF0ZS5Eb25lXG5cdH1cblxuXHRzdG9wTG9hZGluZygpIHtcblx0XHRpZiAodGhpcy5zdGF0ZS5sb2FkaW5nU3RhdHVzID09PSBMaXN0TG9hZGluZ1N0YXRlLkxvYWRpbmcpIHtcblx0XHRcdC8vIFdlIGNhbid0IHJlYWxseSBjYW5jZWwgb25nb2luZyByZXF1ZXN0cywgYnV0IHdlIGNhbiBwcmV2ZW50IG1vcmUgcmVxdWVzdHMgZnJvbSBoYXBwZW5pbmdcblx0XHRcdHRoaXMudXBkYXRlU3RhdGUoeyBsb2FkaW5nU3RhdHVzOiBMaXN0TG9hZGluZ1N0YXRlLkNvbm5lY3Rpb25Mb3N0IH0pXG5cdFx0fVxuXHR9XG5cblx0d2FpdExvYWQod2hhdDogKCkgPT4gYW55KTogUHJvbWlzZTxhbnk+IHtcblx0XHRyZXR1cm4gc2V0dGxlZFRoZW4odGhpcy5sb2FkaW5nLCB3aGF0KVxuXHR9XG5cblx0aW5zZXJ0TG9hZGVkSXRlbShpdGVtOiBJdGVtVHlwZSkge1xuXHRcdGlmICh0aGlzLnJhd1N0YXRlLnVuZmlsdGVyZWRJdGVtcy5zb21lKCh1bmZpbHRlcmVkSXRlbSkgPT4gdGhpcy5oYXNTYW1lSWQodW5maWx0ZXJlZEl0ZW0sIGl0ZW0pKSkge1xuXHRcdFx0cmV0dXJuXG5cdFx0fVxuXG5cdFx0Ly8gY2FuIHdlIGRvIHNvbWV0aGluZyBsaWtlIGJpbmFyeSBzZWFyY2g/XG5cdFx0Y29uc3QgdW5maWx0ZXJlZEl0ZW1zID0gdGhpcy5yYXdTdGF0ZS51bmZpbHRlcmVkSXRlbXMuY29uY2F0KGl0ZW0pLnNvcnQodGhpcy5jb25maWcuc29ydENvbXBhcmUpXG5cdFx0Y29uc3QgZmlsdGVyZWRJdGVtcyA9IHRoaXMucmF3U3RhdGUuZmlsdGVyZWRJdGVtcy5jb25jYXQodGhpcy5hcHBseUZpbHRlcihbaXRlbV0pKS5zb3J0KHRoaXMuY29uZmlnLnNvcnRDb21wYXJlKVxuXHRcdHRoaXMudXBkYXRlU3RhdGUoeyBmaWx0ZXJlZEl0ZW1zLCB1bmZpbHRlcmVkSXRlbXMgfSlcblx0fVxuXG5cdHVwZGF0ZUxvYWRlZEl0ZW0oaXRlbTogSXRlbVR5cGUpIHtcblx0XHQvLyBXZSBjYW5ub3QgdXNlIGJpbmFyeSBzZWFyY2ggaGVyZSBiZWNhdXNlIHRoZSBzb3J0IG9yZGVyIG9mIGl0ZW1zIGNhbiBjaGFuZ2UgYmFzZWQgb24gYW4gZW50aXR5IHVwZGF0ZSwgYW5kIHdlIG5lZWQgdG8gZmluZCB0aGUgcG9zaXRpb24gb2YgdGhlXG5cdFx0Ly8gb2xkIGVudGl0eSBieSBpZCBpbiBvcmRlciB0byByZW1vdmUgaXQuXG5cblx0XHQvLyBTaW5jZSBldmVyeSBpdGVtIGlkIGlzIHVuaXF1ZSBhbmQgdGhlcmUncyBubyBzY2VuYXJpbyB3aGVyZSB0aGUgc2FtZSBpdGVtIGFwcGVhcnMgdHdpY2UgYnV0IGluIGRpZmZlcmVudCBsaXN0cywgd2UgY2FuIHNhZmVseSBzb3J0IGp1c3Rcblx0XHQvLyBieSB0aGUgaXRlbSBpZCwgaWdub3JpbmcgdGhlIGxpc3QgaWRcblxuXHRcdC8vIHVwZGF0ZSB1bmZpbHRlcmVkIGxpc3Q6IGZpbmQgdGhlIHBvc2l0aW9uLCB0YWtlIG91dCB0aGUgb2xkIGl0ZW0gYW5kIHB1dCB0aGUgdXBkYXRlZCBvbmVcblx0XHRjb25zdCBwb3NpdGlvblRvVXBkYXRlVW5maWx0ZXJlZCA9IHRoaXMucmF3U3RhdGUudW5maWx0ZXJlZEl0ZW1zLmZpbmRJbmRleCgodW5maWx0ZXJlZEl0ZW0pID0+IHRoaXMuaGFzU2FtZUlkKHVuZmlsdGVyZWRJdGVtLCBpdGVtKSlcblx0XHRjb25zdCB1bmZpbHRlcmVkSXRlbXMgPSB0aGlzLnJhd1N0YXRlLnVuZmlsdGVyZWRJdGVtcy5zbGljZSgpXG5cdFx0aWYgKHBvc2l0aW9uVG9VcGRhdGVVbmZpbHRlcmVkID49IDApIHtcblx0XHRcdHVuZmlsdGVyZWRJdGVtcy5zcGxpY2UocG9zaXRpb25Ub1VwZGF0ZVVuZmlsdGVyZWQsIDEsIGl0ZW0pXG5cdFx0XHR1bmZpbHRlcmVkSXRlbXMuc29ydCh0aGlzLmNvbmZpZy5zb3J0Q29tcGFyZSlcblx0XHR9XG5cblx0XHQvLyB1cGRhdGUgZmlsdGVyZWQgbGlzdCAmIHNlbGVjdGVkIGl0ZW1zXG5cdFx0Y29uc3QgcG9zaXRpb25Ub1VwZGF0ZUZpbHRlcmVkID0gdGhpcy5yYXdTdGF0ZS5maWx0ZXJlZEl0ZW1zLmZpbmRJbmRleCgoZmlsdGVyZWRJdGVtKSA9PiB0aGlzLmhhc1NhbWVJZChmaWx0ZXJlZEl0ZW0sIGl0ZW0pKVxuXHRcdGNvbnN0IGZpbHRlcmVkSXRlbXMgPSB0aGlzLnJhd1N0YXRlLmZpbHRlcmVkSXRlbXMuc2xpY2UoKVxuXHRcdGNvbnN0IHNlbGVjdGVkSXRlbXMgPSBuZXcgU2V0KHRoaXMucmF3U3RhdGUuc2VsZWN0ZWRJdGVtcylcblx0XHRpZiAocG9zaXRpb25Ub1VwZGF0ZUZpbHRlcmVkID49IDApIHtcblx0XHRcdGNvbnN0IFtvbGRJdGVtXSA9IGZpbHRlcmVkSXRlbXMuc3BsaWNlKHBvc2l0aW9uVG9VcGRhdGVGaWx0ZXJlZCwgMSwgaXRlbSlcblx0XHRcdGZpbHRlcmVkSXRlbXMuc29ydCh0aGlzLmNvbmZpZy5zb3J0Q29tcGFyZSlcblx0XHRcdGlmIChzZWxlY3RlZEl0ZW1zLmRlbGV0ZShvbGRJdGVtKSkge1xuXHRcdFx0XHRzZWxlY3RlZEl0ZW1zLmFkZChpdGVtKVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIGtlZXAgYWN0aXZlIGl0ZW0gdXAtdG8tZGF0ZVxuXHRcdGNvbnN0IGFjdGl2ZUl0ZW1VcGRhdGVkID0gdGhpcy5yYXdTdGF0ZS5hY3RpdmVJdGVtICE9IG51bGwgJiYgdGhpcy5oYXNTYW1lSWQodGhpcy5yYXdTdGF0ZS5hY3RpdmVJdGVtLCBpdGVtKVxuXHRcdGNvbnN0IG5ld0FjdGl2ZUl0ZW0gPSB0aGlzLnJhd1N0YXRlLmFjdGl2ZUl0ZW1cblxuXHRcdGlmIChwb3NpdGlvblRvVXBkYXRlVW5maWx0ZXJlZCAhPT0gLTEgfHwgcG9zaXRpb25Ub1VwZGF0ZUZpbHRlcmVkICE9PSAtMSB8fCBhY3RpdmVJdGVtVXBkYXRlZCkge1xuXHRcdFx0dGhpcy51cGRhdGVTdGF0ZSh7IHVuZmlsdGVyZWRJdGVtcywgZmlsdGVyZWRJdGVtcywgc2VsZWN0ZWRJdGVtcywgYWN0aXZlSXRlbTogbmV3QWN0aXZlSXRlbSB9KVxuXHRcdH1cblxuXHRcdC8vIGtlZXAgYW5jaG9yIHVwLXRvLWRhdGVcblx0XHRpZiAodGhpcy5yYW5nZVNlbGVjdGlvbkFuY2hvckl0ZW0gIT0gbnVsbCAmJiB0aGlzLmhhc1NhbWVJZCh0aGlzLnJhbmdlU2VsZWN0aW9uQW5jaG9ySXRlbSwgaXRlbSkpIHtcblx0XHRcdHRoaXMucmFuZ2VTZWxlY3Rpb25BbmNob3JJdGVtID0gaXRlbVxuXHRcdH1cblx0fVxuXG5cdGRlbGV0ZUxvYWRlZEl0ZW0oaXRlbUlkOiBJZFR5cGUpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRyZXR1cm4gc2V0dGxlZFRoZW4odGhpcy5sb2FkaW5nLCAoKSA9PiB7XG5cdFx0XHRjb25zdCBpdGVtID0gdGhpcy5yYXdTdGF0ZS5maWx0ZXJlZEl0ZW1zLmZpbmQoKGUpID0+IHRoaXMuY29uZmlnLmlzU2FtZUlkKHRoaXMuY29uZmlnLmdldEl0ZW1JZChlKSwgaXRlbUlkKSlcblxuXHRcdFx0Y29uc3Qgc2VsZWN0ZWRJdGVtcyA9IG5ldyBTZXQodGhpcy5yYXdTdGF0ZS5zZWxlY3RlZEl0ZW1zKVxuXG5cdFx0XHRsZXQgbmV3QWN0aXZlSXRlbVxuXG5cdFx0XHRpZiAoaXRlbSkge1xuXHRcdFx0XHRjb25zdCB3YXNSZW1vdmVkID0gc2VsZWN0ZWRJdGVtcy5kZWxldGUoaXRlbSlcblxuXHRcdFx0XHRpZiAodGhpcy5yYXdTdGF0ZS5maWx0ZXJlZEl0ZW1zLmxlbmd0aCA+IDEpIHtcblx0XHRcdFx0XHRjb25zdCBkZXNpcmVkQmVoYXZpb3IgPSB0aGlzLmNvbmZpZy5hdXRvU2VsZWN0QmVoYXZpb3I/LigpID8/IG51bGxcblx0XHRcdFx0XHRpZiAod2FzUmVtb3ZlZCkge1xuXHRcdFx0XHRcdFx0aWYgKGRlc2lyZWRCZWhhdmlvciA9PT0gTGlzdEF1dG9TZWxlY3RCZWhhdmlvci5OT05FIHx8IHRoaXMuc3RhdGUuaW5NdWx0aXNlbGVjdCkge1xuXHRcdFx0XHRcdFx0XHRzZWxlY3RlZEl0ZW1zLmNsZWFyKClcblx0XHRcdFx0XHRcdH0gZWxzZSBpZiAoZGVzaXJlZEJlaGF2aW9yID09PSBMaXN0QXV0b1NlbGVjdEJlaGF2aW9yLk5FV0VSKSB7XG5cdFx0XHRcdFx0XHRcdG5ld0FjdGl2ZUl0ZW0gPSB0aGlzLmdldFByZXZpb3VzSXRlbShpdGVtKVxuXHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0bmV3QWN0aXZlSXRlbSA9IGl0ZW0gPT09IGxhc3QodGhpcy5zdGF0ZS5pdGVtcykgPyB0aGlzLmdldFByZXZpb3VzSXRlbShpdGVtKSA6IHRoaXMuZ2V0TmV4dEl0ZW0oaXRlbSwgbnVsbClcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAobmV3QWN0aXZlSXRlbSkge1xuXHRcdFx0XHRcdFx0c2VsZWN0ZWRJdGVtcy5hZGQobmV3QWN0aXZlSXRlbSlcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0bmV3QWN0aXZlSXRlbSA9IHRoaXMucmF3U3RhdGUuYWN0aXZlSXRlbVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNvbnN0IGZpbHRlcmVkSXRlbXMgPSB0aGlzLnJhd1N0YXRlLmZpbHRlcmVkSXRlbXMuc2xpY2UoKVxuXHRcdFx0XHRyZW1vdmUoZmlsdGVyZWRJdGVtcywgaXRlbSlcblx0XHRcdFx0Y29uc3QgdW5maWx0ZXJlZEl0ZW1zID0gdGhpcy5yYXdTdGF0ZS51bmZpbHRlcmVkSXRlbXMuc2xpY2UoKVxuXHRcdFx0XHRyZW1vdmUodW5maWx0ZXJlZEl0ZW1zLCBpdGVtKVxuXHRcdFx0XHR0aGlzLnVwZGF0ZVN0YXRlKHsgZmlsdGVyZWRJdGVtcywgc2VsZWN0ZWRJdGVtcywgdW5maWx0ZXJlZEl0ZW1zLCBhY3RpdmVJdGVtOiBuZXdBY3RpdmVJdGVtIH0pXG5cdFx0XHR9XG5cdFx0fSlcblx0fVxuXG5cdGdldExhc3RJdGVtKCk6IEl0ZW1UeXBlIHwgbnVsbCB7XG5cdFx0aWYgKHRoaXMucmF3U3RhdGUudW5maWx0ZXJlZEl0ZW1zLmxlbmd0aCA+IDApIHtcblx0XHRcdHJldHVybiBsYXN0VGhyb3codGhpcy5yYXdTdGF0ZS51bmZpbHRlcmVkSXRlbXMpXG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBudWxsXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBoYXNTYW1lSWQoaXRlbTE6IEl0ZW1UeXBlLCBpdGVtMjogSXRlbVR5cGUpOiBib29sZWFuIHtcblx0XHRjb25zdCBpZDEgPSB0aGlzLmNvbmZpZy5nZXRJdGVtSWQoaXRlbTEpXG5cdFx0Y29uc3QgaWQyID0gdGhpcy5jb25maWcuZ2V0SXRlbUlkKGl0ZW0yKVxuXHRcdHJldHVybiB0aGlzLmNvbmZpZy5pc1NhbWVJZChpZDEsIGlkMilcblx0fVxuXG5cdGNhbkluc2VydEl0ZW0oZW50aXR5OiBJdGVtVHlwZSk6IGJvb2xlYW4ge1xuXHRcdGlmICh0aGlzLnN0YXRlLmxvYWRpbmdTdGF0dXMgPT09IExpc3RMb2FkaW5nU3RhdGUuRG9uZSkge1xuXHRcdFx0cmV0dXJuIHRydWVcblx0XHR9XG5cblx0XHQvLyBuZXcgZWxlbWVudCBpcyBpbiB0aGUgbG9hZGVkIHJhbmdlIG9yIG5ld2VyIHRoYW4gdGhlIGZpcnN0IGVsZW1lbnRcblx0XHRjb25zdCBsYXN0RWxlbWVudCA9IHRoaXMuZ2V0TGFzdEl0ZW0oKVxuXHRcdHJldHVybiBsYXN0RWxlbWVudCAhPSBudWxsICYmIHRoaXMuY29uZmlnLnNvcnRDb21wYXJlKGVudGl0eSwgbGFzdEVsZW1lbnQpIDwgMFxuXHR9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZWxlY3Rpb25BdHRyc0Zvckxpc3Q8SXRlbVR5cGUsIElkVHlwZT4obGlzdE1vZGVsOiBQaWNrPExpc3RNb2RlbDxJdGVtVHlwZSwgSWRUeXBlPiwgXCJhcmVBbGxTZWxlY3RlZFwiIHwgXCJzZWxlY3ROb25lXCIgfCBcInNlbGVjdEFsbFwiPiB8IG51bGwpIHtcblx0cmV0dXJuIHtcblx0XHRzZWxlY3RlZDogbGlzdE1vZGVsPy5hcmVBbGxTZWxlY3RlZCgpID8/IGZhbHNlLFxuXHRcdHNlbGVjdE5vbmU6ICgpID0+IGxpc3RNb2RlbD8uc2VsZWN0Tm9uZSgpLFxuXHRcdHNlbGVjdEFsbDogKCkgPT4gbGlzdE1vZGVsPy5zZWxlY3RBbGwoKSxcblx0fVxufVxuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0lBNkRhLFlBQU4sTUFBa0M7Q0FDeEMsWUFBNkJBLFFBQTJDO0VBa2hCeEUsS0FsaEI2QjtDQUE2QztDQUUxRSxBQUFRLFlBQXVDO0NBQy9DLEFBQVEsVUFBNEIsUUFBUSxTQUFTO0NBQ3JELEFBQVEsU0FBc0M7Q0FDOUMsQUFBUSwyQkFBNEM7Q0FFcEQsSUFBSSxRQUE2QjtBQUNoQyxTQUFPLEtBQUssYUFBYTtDQUN6QjtDQUVELElBQVksV0FBdUM7QUFDbEQsU0FBTyxLQUFL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