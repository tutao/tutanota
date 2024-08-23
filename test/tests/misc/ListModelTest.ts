import o from "@tutao/otest"
import { ListModel, ListModelConfig } from "../../../src/common/misc/ListModel.js"
import { getElementId, getListId, sortCompareById, timestampToGeneratedId } from "../../../src/common/api/common/utils/EntityUtils.js"
import { defer, DeferredObject } from "@tutao/tutanota-utils"
import { KnowledgeBaseEntry, KnowledgeBaseEntryTypeRef } from "../../../src/common/api/entities/tutanota/TypeRefs.js"
import { ListFetchResult } from "../../../src/common/gui/base/ListUtils.js"
import { ListLoadingState } from "../../../src/common/gui/base/List.js"
import { ConnectionError } from "../../../src/common/api/common/error/RestError.js"
import { OperationType } from "../../../src/common/api/common/TutanotaConstants.js"
import { createTestEntity } from "../TestUtils.js"
import { ListAutoSelectBehavior } from "../../../src/common/misc/DeviceConfig.js"

o.spec("ListModel", function () {
	const listId = "listId"
	let fetchDefer: DeferredObject<ListFetchResult<KnowledgeBaseEntry>>
	let listModel: ListModel<KnowledgeBaseEntry>
	const defaultListConfig = {
		fetch: () => fetchDefer.promise,
		sortCompare: sortCompareById,
		loadSingle: () => {
			throw new Error("noop")
		},
		autoSelectBehavior: () => ListAutoSelectBehavior.OLDER,
	}

	const itemA = createTestEntity(KnowledgeBaseEntryTypeRef, {
		_id: [listId, "a"],
		title: "a",
	})
	const itemB = createTestEntity(KnowledgeBaseEntryTypeRef, {
		_id: [listId, "b"],
		title: "b",
	})
	const itemC = createTestEntity(KnowledgeBaseEntryTypeRef, {
		_id: [listId, "c"],
		title: "c",
	})
	const itemD = createTestEntity(KnowledgeBaseEntryTypeRef, {
		_id: [listId, "d"],
		title: "d",
	})

	const items = [itemA, itemB, itemC, itemD]

	async function setItems(items: KnowledgeBaseEntry[]) {
		fetchDefer.resolve({ items, complete: true })
		await listModel.loadInitial()
	}

	o.beforeEach(function () {
		fetchDefer = defer<ListFetchResult<KnowledgeBaseEntry>>()
		listModel = new ListModel<KnowledgeBaseEntry>(defaultListConfig)
	})

	o.spec("loading states", function () {
		o("when loading initially it will set state to loading", async function () {
			const loading = listModel.loadInitial()
			o(listModel.state.loadingStatus).equals(ListLoadingState.Loading)
			fetchDefer.resolve({ items: [], complete: false })
			await loading
			o(listModel.state.loadingStatus).equals(ListLoadingState.Idle)
		})

		o("when connection error occurs it wil set state to connectionLost", async function () {
			const loading = listModel.loadInitial()
			o(listModel.state.loadingStatus).equals(ListLoadingState.Loading)
			fetchDefer.reject(new ConnectionError("oops"))
			await loading
			o(listModel.state.loadingStatus).equals(ListLoadingState.ConnectionLost)
		})

		o("when complete it wil set state to done", async function () {
			const loading = listModel.loadInitial()
			o(listModel.state.loadingStatus).equals(ListLoadingState.Loading)
			fetchDefer.resolve({ items: [], complete: true })
			await loading
			o(listModel.state.loadingStatus).equals(ListLoadingState.Done)
		})

		o("when loadMore is called it will set state to loading and will fetch more", async function () {
			const initialLoading = listModel.loadInitial()
			fetchDefer.resolve({ items: [], complete: false })
			await initialLoading

			fetchDefer = defer()
			const moreLoading = listModel.loadMore()
			o(listModel.state.loadingStatus).equals(ListLoadingState.Loading)

			const knowledgeBaseEntry = createTestEntity(KnowledgeBaseEntryTypeRef, {
				_id: [listId, timestampToGeneratedId(10)],
			})
			fetchDefer.resolve({
				items: [knowledgeBaseEntry],
				complete: true,
			})
			await moreLoading
			o(listModel.state.loadingStatus).equals(ListLoadingState.Done)
			o(listModel.state.items).deepEquals([knowledgeBaseEntry])
		})

		o("when called with retryLoading after connection error it will set state to loading and will load again", async function () {
			const initialLoading = listModel.loadInitial()
			fetchDefer.reject(new ConnectionError("oops"))
			await initialLoading

			fetchDefer = defer()
			const retryLoading = listModel.retryLoading()
			o(listModel.state.loadingStatus).equals(ListLoadingState.Loading)

			fetchDefer.resolve({ items: [], complete: true })
			await retryLoading

			o(listModel.state.loadingStatus).equals(ListLoadingState.Done)
		})
	})

	function getSortedSelection() {
		return listModel.getSelectedAsArray().sort(sortCompareById)
	}

	o.spec("selection controls", function () {
		o.spec("single", function () {
			o("when selectNext and the list is empty nothing happens", async function () {
				await setItems([])
				listModel.selectNext(false)
				o(getSortedSelection()).deepEquals([])
				o(listModel.state.inMultiselect).equals(false)
				o(listModel.state.activeIndex).equals(null)
			})

			o("when selectNext and nothing is selected it select the first item", async function () {
				await setItems(items)
				listModel.selectNext(false)
				o(getSortedSelection()).deepEquals([itemA])
				o(listModel.state.inMultiselect).equals(false)
				o(listModel.state.activeIndex).equals(0)
			})

			o("when selectNext selects next item", async function () {
				await setItems(items)
				listModel.onSingleSelection(itemB)
				listModel.selectNext(false)
				o(getSortedSelection()).deepEquals([itemC])
				o(listModel.state.inMultiselect).equals(false)
				o(listModel.state.activeIndex).equals(2)
			})

			o("when selectNext and last item is selected it stays", async function () {
				await setItems(items)
				listModel.onSingleSelection(itemD)
				listModel.selectNext(false)
				o(getSortedSelection()).deepEquals([itemD])
				o(listModel.state.inMultiselect).equals(false)
				o(listModel.state.activeIndex).equals(3)
			})

			o("when selectPrevious and nothing is selected it select the first item", async function () {
				await setItems(items)
				listModel.selectPrevious(false)
				o(getSortedSelection()).deepEquals([itemA])
				o(listModel.state.inMultiselect).equals(false)
				o(listModel.state.activeIndex).equals(0)
			})

			o("when selectPrevious and the first item is selected it stays", async function () {
				await setItems(items)
				listModel.onSingleSelection(itemA)
				listModel.selectPrevious(false)
				o(getSortedSelection()).deepEquals([itemA])
				o(listModel.state.inMultiselect).equals(false)
				o(listModel.state.activeIndex).equals(0)
			})
		})

		o.spec("selectPrevious/selectNext", function () {
			o("when selectNext and the list is empty nothing happens", async function () {
				await setItems([])
				listModel.selectNext(true)
				o(getSortedSelection()).deepEquals([])
				o(listModel.state.inMultiselect).equals(false)
				o(listModel.state.activeIndex).equals(null)
			})

			o("when selectNext and nothing is selected it select the first item", async function () {
				await setItems(items)
				listModel.selectNext(true)
				o(getSortedSelection()).deepEquals([itemA])
				o(listModel.state.inMultiselect).equals(true)
				o(listModel.state.activeIndex).equals(0)
			})

			o("when one item was selected selectNext adds to selection", async function () {
				await setItems(items)
				listModel.onSingleSelection(itemB)
				// start state:
				//
				// A
				// B + selection start
				// C
				// D
				//
				// end state:
				//
				// A
				// B + selection start
				// C +
				// D

				listModel.selectNext(true)
				o(getSortedSelection()).deepEquals([itemB, itemC])
				o(listModel.state.inMultiselect).equals(true)
				o(listModel.state.activeIndex).equals(2)
			})

			o("when multiple items were selected selectNext below the selection start adds to selection", async function () {
				await setItems(items)
				listModel.onSingleSelection(itemB)
				listModel.selectNext(true)
				// start state:
				//
				// A
				// B + selection start
				// C +
				// D
				//
				// end state:
				//
				// A
				// B + selection start
				// C +
				// D +

				listModel.selectNext(true)
				o(getSortedSelection()).deepEquals([itemB, itemC, itemD])
				o(listModel.state.inMultiselect).equals(true)
				o(listModel.state.activeIndex).equals(3)
			})

			o("when multiple items were selected selectNext above the selection start removes from selection", async function () {
				await setItems(items)
				listModel.onSingleSelection(itemB)
				listModel.selectPrevious(true)
				// start state:
				//
				// A +
				// B + selection start
				// C
				// D
				//
				// end state:
				//
				// A
				// B + selection start
				// C
				// D

				listModel.selectNext(true)
				o(getSortedSelection()).deepEquals([itemB])
				o(listModel.state.inMultiselect).equals(true)
				o(listModel.state.activeIndex).equals(1)
			})

			o("when item below selection start is selected selectPrevious adds previous item to selection ", async function () {
				await setItems(items)
				listModel.onSingleSelection(itemB)
				// start state:
				//
				// A
				// B + selection start
				// C
				// D
				//
				// end state:
				//
				// A +
				// B + selection start
				// C
				// D
				listModel.selectPrevious(true)
				o(getSortedSelection()).deepEquals([itemA, itemB])
				o(listModel.state.inMultiselect).equals(true)
				o(listModel.state.activeIndex).equals(0)
			})

			o("when multiple items above selection start are selected selectPrevious adds previous item to selection ", async function () {
				await setItems(items)
				listModel.onSingleSelection(itemC)
				listModel.selectPrevious(true)
				// start state:
				//
				// A
				// B +
				// C + selection start
				// D
				//
				// end state:
				//
				// A +
				// B +
				// C + selection start
				// D
				listModel.selectPrevious(true)
				o(getSortedSelection()).deepEquals([itemA, itemB, itemC])
				o(listModel.state.inMultiselect).equals(true)
				o(listModel.state.activeIndex).equals(0)
			})

			o("when multiple items were selected selectPrevious above the selection start removes from selection", async function () {
				await setItems(items)
				listModel.onSingleSelection(itemB)
				listModel.selectNext(true)
				// start state:
				//
				// A
				// B + selection start
				// C +
				// D
				//
				// end state:
				//
				// A
				// B + selection start
				// C
				// D

				listModel.selectPrevious(true)
				o(getSortedSelection()).deepEquals([itemB])
				o(listModel.state.inMultiselect).equals(true)
				o(listModel.state.activeIndex).equals(1)
			})

			o("when selectNext and last item is selected it stays", async function () {
				await setItems(items)
				listModel.onSingleSelection(itemD)
				listModel.selectNext(true)
				o(getSortedSelection()).deepEquals([itemD])
				o(listModel.state.inMultiselect).equals(true)
				o(listModel.state.activeIndex).equals(3)
			})

			o("when selectPrevious and nothing is selected it select the first item", async function () {
				await setItems(items)
				listModel.selectPrevious(true)
				o(getSortedSelection()).deepEquals([itemA])
				o(listModel.state.inMultiselect).equals(true)
				o(listModel.state.activeIndex).equals(0)
			})

			o("when selectPrevious and the first item is selected it stays", async function () {
				await setItems(items)
				listModel.onSingleSelection(itemA)
				listModel.selectPrevious(true)
				o(getSortedSelection()).deepEquals([itemA])
				o(listModel.state.inMultiselect).equals(true)
				o(listModel.state.activeIndex).equals(0)
			})

			o(
				"when multiple items are selected and the active item is above the anchor and there's a gap selectPrevious will add item above the active one",
				async function () {
					await setItems(items)
					listModel.onSingleSelection(itemD)
					listModel.onSingleInclusiveSelection(itemA)
					listModel.onSingleInclusiveSelection(itemC)
					// start state:
					//
					// A +
					// B
					// C + active item
					// D + selection start
					//
					// end state:
					//
					// A +
					// B +
					// C + active item
					// D + selection start
					listModel.selectPrevious(true)
					o(getSortedSelection()).deepEquals([itemA, itemB, itemC, itemD])
					o(listModel.state.inMultiselect).equals(true)
					o(listModel.state.activeIndex).equals(1)
				},
			)

			o(
				"when multiple items are selected and the active item is below the anchor and there's a gap select will add item above the active one",
				async function () {
					await setItems(items)
					listModel.onSingleSelection(itemA)
					listModel.onSingleInclusiveSelection(itemD)
					listModel.onSingleInclusiveSelection(itemB)
					// start state:
					//
					// A + selection start
					// B + active item
					// C
					// D +
					//
					// end state:
					//
					// A + selection start
					// B + active item
					// C +
					// D +
					listModel.selectNext(true)
					o(getSortedSelection()).deepEquals([itemA, itemB, itemC, itemD])
					o(listModel.state.inMultiselect).equals(true)
					o(listModel.state.activeIndex).equals(2)
				},
			)

			o("when the active item is deleted selectPrevious single will still select previous item relative to it", async function () {
				await setItems(items)
				listModel.onSingleInclusiveSelection(itemB)
				await listModel.entityEventReceived(getListId(itemB), getElementId(itemB), OperationType.DELETE)
				// start state:
				//
				// A
				// (B) active, gone
				// C
				// D
				//
				// end state:
				//
				// A + active
				// C
				// D
				listModel.selectPrevious(false)
				o(getSortedSelection()).deepEquals([itemA])
				o(listModel.state.inMultiselect).equals(false)
				o(listModel.state.activeIndex).equals(0)
			})

			o("when the active item is deleted selectPrevious multiselect will still select previous item relative to it", async function () {
				await setItems(items)
				listModel.onSingleInclusiveSelection(itemB)
				await listModel.entityEventReceived(getListId(itemB), getElementId(itemB), OperationType.DELETE)
				// start state:
				//
				// A
				// (B) active, gone
				// C
				// D
				//
				// end state:
				//
				// A + active
				// C
				// D
				listModel.selectPrevious(true)
				o(getSortedSelection()).deepEquals([itemA])
				o(listModel.state.inMultiselect).equals(true)
				o(listModel.state.activeIndex).equals(0)
			})

			o("when the active item is deleted selectNext single will still select next item relative to it", async function () {
				await setItems(items)
				listModel.onSingleInclusiveSelection(itemB)
				await listModel.entityEventReceived(getListId(itemB), getElementId(itemB), OperationType.DELETE)
				// start state:
				//
				// A
				// (B) active, gone
				// C
				// D
				//
				// end state:
				//
				// A
				// C + active
				// D
				listModel.selectNext(false)
				o(getSortedSelection()).deepEquals([itemC])
				o(listModel.state.inMultiselect).equals(false)
				o(listModel.state.activeIndex).equals(1)
			})

			o("when the active item is deleted selectNext multiselect will still select next item relative to it", async function () {
				await setItems(items)
				listModel.onSingleInclusiveSelection(itemB)
				await listModel.entityEventReceived(getListId(itemB), getElementId(itemB), OperationType.DELETE)
				// start state:
				//
				// A
				// (B) active, gone
				// C
				// D
				//
				// end state:
				//
				// A
				// C + active
				// D
				listModel.selectNext(true)
				o(getSortedSelection()).deepEquals([itemC])
				o(listModel.state.inMultiselect).equals(true)
				o(listModel.state.activeIndex).equals(1)
			})

			o("when the active item is filtered out selectNext multiselect will still select next item relative to it", async function () {
				await setItems(items)
				listModel.onSingleInclusiveSelection(itemB)
				listModel.setFilter((item) => item !== itemB)
				// start state:
				//
				// A
				// (B) active, gone
				// C
				// D
				//
				// end state:
				//
				// A
				// C + active
				// D
				listModel.selectNext(true)
				o(getSortedSelection()).deepEquals([itemC])
				o(listModel.state.inMultiselect).equals(true)
				o(listModel.state.activeIndex).equals(1)
			})

			o("when the active item is filtered out selectPrevious multiselect will still select previous item relative to it", async function () {
				await setItems(items)
				listModel.onSingleInclusiveSelection(itemB)
				listModel.setFilter((item) => item !== itemB)
				// start state:
				//
				// A
				// (B) active, gone
				// C
				// D
				//
				// end state:
				//
				// A + active
				// C
				// D
				listModel.selectPrevious(true)
				o(getSortedSelection()).deepEquals([itemA])
				o(listModel.state.inMultiselect).equals(true)
				o(listModel.state.activeIndex).equals(0)
			})
		})

		o("selectRangeTowards towards item below", async function () {
			await setItems(items)
			listModel.onSingleSelection(itemA)
			// start state:
			//
			// A +
			// B
			// C
			// D
			//
			// end state:
			//
			// A +
			// B +
			// C +
			// D
			listModel.selectRangeTowards(itemC)
			o(getSortedSelection()).deepEquals([itemA, itemB, itemC])
			o(listModel.state.inMultiselect).equals(true)
			o(listModel.state.activeIndex).equals(2)
		})

		o("selectRangeTowards towards item above", async function () {
			await setItems(items)
			listModel.onSingleSelection(itemC)
			// start state:
			//
			// A
			// B
			// C +
			// D
			//
			// end state:
			//
			// A +
			// B +
			// C +
			// D
			listModel.selectRangeTowards(itemA)
			o(getSortedSelection()).deepEquals([itemA, itemB, itemC])
			o(listModel.state.inMultiselect).equals(true)
			o(listModel.state.activeIndex).equals(0)
		})

		o("selectRangeTowards towards item below with gap", async function () {
			await setItems(items)
			listModel.onSingleInclusiveSelection(itemC)
			listModel.onSingleInclusiveSelection(itemA)
			// start state:
			//
			// A +
			// B
			// C +
			// D
			//
			// end state:
			//
			// A +
			// B
			// C +
			// D +
			listModel.selectRangeTowards(itemD)
			o(getSortedSelection()).deepEquals([itemA, itemC, itemD])
			o(listModel.state.inMultiselect).equals(true)
			o(listModel.state.activeIndex).equals(3)
		})

		o("selectRangeTowards towards item above with gap", async function () {
			await setItems(items)
			listModel.onSingleInclusiveSelection(itemB)
			listModel.onSingleInclusiveSelection(itemD)
			// start state:
			//
			// A
			// B + selection start
			// C
			// D +
			//
			// end state:
			//
			// A +
			// B +
			// C
			// D +
			listModel.selectRangeTowards(itemA)
			o(getSortedSelection()).deepEquals([itemA, itemB, itemD])
			o(listModel.state.inMultiselect).equals(true)
			o(listModel.state.activeIndex).equals(0)
		})

		o("onSingleSelection reset previous selection", async function () {
			await setItems(items)
			listModel.onSingleInclusiveSelection(itemA)
			listModel.onSingleSelection(itemC)
			o(getSortedSelection()).deepEquals([itemC])
			o(listModel.state.inMultiselect).equals(false)
			o(listModel.state.activeIndex).equals(2)
		})

		o.spec("onSingleExclusiveSelection", function () {
			o("when not in multiselect it will only select the newly selected item", async function () {
				await setItems(items)
				listModel.onSingleSelection(itemA)
				listModel.onSingleExclusiveSelection(itemC)
				o(getSortedSelection()).deepEquals([itemC])
				o(listModel.state.inMultiselect).equals(true)
				o(listModel.state.activeIndex).equals(2)
			})

			o("when in multiselect it will add newly selected item to the selection", async function () {
				await setItems(items)
				listModel.onSingleExclusiveSelection(itemA)
				listModel.onSingleExclusiveSelection(itemC)
				o(getSortedSelection()).deepEquals([itemA, itemC])
				o(listModel.state.inMultiselect).equals(true)
				o(listModel.state.activeIndex).equals(2)
			})
		})

		o.spec("onSingleInclusiveSelection", function () {
			o("when not in multiselect it will select both previous single selection and the newly selected item", async function () {
				await setItems(items)
				listModel.onSingleSelection(itemA)
				listModel.onSingleInclusiveSelection(itemC)
				o(getSortedSelection()).deepEquals([itemA, itemC])
				o(listModel.state.inMultiselect).equals(true)
				o(listModel.state.activeIndex).equals(2)
			})

			o(
				"when not in multiselect it will not select both previous single selection and the newly selected item if in one column layout",
				async function () {
					await setItems(items)
					listModel.onSingleSelection(itemA)
					listModel.onSingleInclusiveSelection(itemC, true)
					o(getSortedSelection()).deepEquals([itemC])
					o(listModel.state.inMultiselect).equals(true)
				},
			)

			o("when in multiselect it will add newly selected item to the selection", async function () {
				await setItems(items)
				listModel.onSingleInclusiveSelection(itemA)
				listModel.onSingleInclusiveSelection(itemC)
				o(getSortedSelection()).deepEquals([itemA, itemC])
				o(listModel.state.inMultiselect).equals(true)
				o(listModel.state.activeIndex).equals(2)
			})

			o("when entering multiselect on the same item as previously selected item, the item is selected", async function () {
				await setItems(items)
				listModel.onSingleSelection(itemB)
				listModel.onSingleInclusiveSelection(itemB)
				o(listModel.getSelectedAsArray()).deepEquals([itemB])
				o(listModel.state.inMultiselect).equals(true)
			})

			o("when entering multiselect when having a single item selected, both items are selected", async function () {
				await setItems(items)
				listModel.onSingleSelection(itemB)
				listModel.onSingleInclusiveSelection(itemD)
				o(getSortedSelection()).deepEquals([itemB, itemD])
				o(listModel.state.inMultiselect).equals(true)
			})
		})
	})

	o.spec("Removing element in list ", function () {
		o("in single select, the active element is next entity when active element gets deleted", async function () {
			await setItems(items)
			listModel.onSingleSelection(itemB)
			await listModel.entityEventReceived(getListId(itemB), getElementId(itemB), OperationType.DELETE)

			o(listModel.state.activeIndex).equals(1)
		})

		o("in single select, the active element is not changed when a different entity is deleted", async function () {
			await setItems(items)
			listModel.onSingleSelection(itemC)
			await listModel.entityEventReceived(getListId(itemA), getElementId(itemA), OperationType.DELETE)

			o(listModel.state.activeIndex).equals(1)
		})

		o("in multiselect, next element is not selected when element is removed", async function () {
			await setItems(items)
			listModel.onSingleInclusiveSelection(itemB)
			await listModel.entityEventReceived(getListId(itemB), getElementId(itemB), OperationType.DELETE)

			o(listModel.state.inMultiselect).equals(true)
			o(listModel.state.activeIndex).equals(null)
		})
	})

	o.spec("Updating items", function () {
		o("update for item with id sorting updates item", async function () {
			const updatedItemD = createTestEntity(KnowledgeBaseEntryTypeRef, { ...itemD, title: "AA" })

			const newConfig: ListModelConfig<KnowledgeBaseEntry> = {
				...defaultListConfig,
				async loadSingle(_listId: Id, elementId: Id): Promise<KnowledgeBaseEntry | null> {
					if (elementId === getElementId(itemD)) {
						return updatedItemD
					} else {
						throw new Error("noop")
					}
				},
			}

			listModel = new ListModel<KnowledgeBaseEntry>(newConfig)
			await setItems(items)

			await listModel.entityEventReceived(getListId(itemD), getElementId(itemD), OperationType.UPDATE)

			o(listModel.state.items).deepEquals([itemA, itemB, itemC, updatedItemD])
		})

		o("update for item with custom sorting changes position", async function () {
			const updatedItemD = createTestEntity(KnowledgeBaseEntryTypeRef, { ...itemD, title: "AA" })

			const newConfig: ListModelConfig<KnowledgeBaseEntry> = {
				...defaultListConfig,
				async loadSingle(_listId: Id, elementId: Id): Promise<KnowledgeBaseEntry | null> {
					if (elementId === getElementId(itemD)) {
						return updatedItemD
					} else {
						throw new Error("noop")
					}
				},
				sortCompare: (e1, e2) => {
					return e1.title.localeCompare(e2.title)
				},
			}

			listModel = new ListModel<KnowledgeBaseEntry>(newConfig)
			await setItems(items)

			await listModel.entityEventReceived(getListId(itemD), getElementId(itemD), OperationType.UPDATE)

			o(listModel.state.items).deepEquals([itemA, updatedItemD, itemB, itemC])
		})
	})
})
