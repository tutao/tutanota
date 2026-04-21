import o from "@tutao/otest"
import { getElementId, getListId, EntityIdEncoding, sortCompareById, tutanotaTypeRefs } from "@tutao/typerefs"
import { defer, DeferredObject } from "@tutao/utils"
import { ListFetchResult } from "../../../src/common/gui/base/ListUtils.js"
import { createTestEntity } from "../TestUtils.js"
import { ListAutoSelectBehavior } from "../../../src/common/misc/DeviceConfig.js"
import { ListElementListModel, ListElementListModelConfig } from "../../../src/common/misc/ListElementListModel"
import * as restError from "@tutao/rest-client/error"
import { OperationType } from "@tutao/app-env"

o.spec("ListElementListModel", function () {
	const listId = "listId"
	const entityIdEncoding = EntityIdEncoding.Base64Ext
	let fetchDefer: DeferredObject<ListFetchResult<tutanotaTypeRefs.KnowledgeBaseEntry>>
	let listModel: ListElementListModel<tutanotaTypeRefs.KnowledgeBaseEntry>
	const defaultListConfig: ListElementListModelConfig<tutanotaTypeRefs.KnowledgeBaseEntry> = {
		fetch: () => fetchDefer.promise,
		sortCompare: (a, b) => sortCompareById(a, b, entityIdEncoding),
		loadSingle: () => {
			throw new Error("noop")
		},
		autoSelectBehavior: () => ListAutoSelectBehavior.OLDER,
	}

	const itemA = createTestEntity(tutanotaTypeRefs.KnowledgeBaseEntryTypeRef, {
		_id: [listId, "a"],
		title: "a",
	})
	const itemB = createTestEntity(tutanotaTypeRefs.KnowledgeBaseEntryTypeRef, {
		_id: [listId, "b"],
		title: "b",
	})
	const itemC = createTestEntity(tutanotaTypeRefs.KnowledgeBaseEntryTypeRef, {
		_id: [listId, "c"],
		title: "c",
	})
	const itemD = createTestEntity(tutanotaTypeRefs.KnowledgeBaseEntryTypeRef, {
		_id: [listId, "d"],
		title: "d",
	})

	const items = [itemA, itemB, itemC, itemD]

	async function setItems(items: tutanotaTypeRefs.KnowledgeBaseEntry[]) {
		fetchDefer.resolve({ items, complete: true })
		await listModel.loadInitial()
	}

	o.beforeEach(function () {
		fetchDefer = defer<ListFetchResult<tutanotaTypeRefs.KnowledgeBaseEntry>>()
		listModel = new ListElementListModel<tutanotaTypeRefs.KnowledgeBaseEntry>(defaultListConfig)
	})

	function getSortedSelection() {
		return listModel.getSelectedAsArray().sort((a, b) => sortCompareById(a, b, entityIdEncoding))
	}

	o.spec("selection controls", function () {
		o.spec("selectPrevious/selectNext", function () {
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
		function loadsElement(
			element: tutanotaTypeRefs.KnowledgeBaseEntry,
		): (listId: Id, elementId: Id) => Promise<tutanotaTypeRefs.KnowledgeBaseEntry | null> {
			return async (_listId: Id, elementId: Id): Promise<tutanotaTypeRefs.KnowledgeBaseEntry | null> => {
				if (elementId === getElementId(element)) {
					return element
				} else {
					throw new Error("noop")
				}
			}
		}

		o("update for item with id sorting updates item", async function () {
			const updatedItemD = createTestEntity(tutanotaTypeRefs.KnowledgeBaseEntryTypeRef, { ...itemD, title: "AA" })

			const newConfig: ListElementListModelConfig<tutanotaTypeRefs.KnowledgeBaseEntry> = {
				...defaultListConfig,
				loadSingle: loadsElement(updatedItemD),
			}

			listModel = new ListElementListModel<tutanotaTypeRefs.KnowledgeBaseEntry>(newConfig)
			await setItems(items)

			await listModel.entityEventReceived(getListId(itemD), getElementId(itemD), OperationType.UPDATE)

			o(listModel.state.items).deepEquals([itemA, itemB, itemC, updatedItemD])
		})

		o("update for item with custom sorting changes position", async function () {
			const updatedItemD = createTestEntity(tutanotaTypeRefs.KnowledgeBaseEntryTypeRef, { ...itemD, title: "AA" })

			const newConfig: ListElementListModelConfig<tutanotaTypeRefs.KnowledgeBaseEntry> = {
				...defaultListConfig,
				loadSingle: loadsElement(updatedItemD),
				sortCompare: (e1, e2) => {
					return e1.title.localeCompare(e2.title)
				},
			}

			listModel = new ListElementListModel<tutanotaTypeRefs.KnowledgeBaseEntry>(newConfig)
			await setItems(items)

			await listModel.entityEventReceived(getListId(itemD), getElementId(itemD), OperationType.UPDATE)

			o(listModel.state.items).deepEquals([itemA, updatedItemD, itemB, itemC])
		})

		o("create loading done", async function () {
			const itemE = createTestEntity(tutanotaTypeRefs.KnowledgeBaseEntryTypeRef, {
				_id: [listId, "e"],
				title: "e",
			})

			let somePromise: DeferredObject<ListFetchResult<tutanotaTypeRefs.KnowledgeBaseEntry>> = defer()

			const newConfig: ListElementListModelConfig<tutanotaTypeRefs.KnowledgeBaseEntry> = {
				...defaultListConfig,
				fetch: () => {
					return somePromise.promise
				},
				loadSingle: loadsElement(itemE),
			}

			listModel = new ListElementListModel<tutanotaTypeRefs.KnowledgeBaseEntry>(newConfig)

			listModel.loadInitial()

			const received = listModel.entityEventReceived(getListId(itemE), getElementId(itemE), OperationType.CREATE)
			somePromise.resolve({
				items: [],
				complete: true,
			})

			await received

			o(listModel.state.items).deepEquals([itemE])
		})

		o("when receive create event while empty list and not loaded completely it will not insert the item", async function () {
			const itemE = createTestEntity(tutanotaTypeRefs.KnowledgeBaseEntryTypeRef, {
				_id: [listId, "e"],
				title: "e",
			})

			let somePromise: DeferredObject<ListFetchResult<tutanotaTypeRefs.KnowledgeBaseEntry>> = defer()

			const newConfig: ListElementListModelConfig<tutanotaTypeRefs.KnowledgeBaseEntry> = {
				...defaultListConfig,
				fetch: () => {
					return somePromise.promise
				},
				loadSingle: loadsElement(itemE),
			}

			listModel = new ListElementListModel<tutanotaTypeRefs.KnowledgeBaseEntry>(newConfig)

			listModel.loadInitial()

			const received = listModel.entityEventReceived(getListId(itemE), getElementId(itemE), OperationType.CREATE)
			somePromise.resolve({
				items: [],
				complete: false,
			})

			await received

			o(listModel.state.items).deepEquals([])
		})

		o("when receive create event while empty list and error it does not insert", async function () {
			const itemE = createTestEntity(tutanotaTypeRefs.KnowledgeBaseEntryTypeRef, {
				_id: [listId, "e"],
				title: "e",
			})

			let somePromise: DeferredObject<ListFetchResult<tutanotaTypeRefs.KnowledgeBaseEntry>> = defer()

			const newConfig: ListElementListModelConfig<tutanotaTypeRefs.KnowledgeBaseEntry> = {
				...defaultListConfig,
				fetch: () => {
					return somePromise.promise
				},
				loadSingle: loadsElement(itemE),
			}

			listModel = new ListElementListModel<tutanotaTypeRefs.KnowledgeBaseEntry>(newConfig)

			listModel.loadInitial()

			const received = listModel.entityEventReceived(getListId(itemE), getElementId(itemE), OperationType.CREATE)
			somePromise.reject(new restError.ConnectionError("test"))

			await received

			o(listModel.state.items).deepEquals([])
		})

		o("when receive create event and out of range", async function () {
			const itemE = createTestEntity(tutanotaTypeRefs.KnowledgeBaseEntryTypeRef, {
				_id: [listId, "e"],
				title: "e",
			})

			let somePromise: DeferredObject<ListFetchResult<tutanotaTypeRefs.KnowledgeBaseEntry>> = defer()

			const newConfig: ListElementListModelConfig<tutanotaTypeRefs.KnowledgeBaseEntry> = {
				...defaultListConfig,
				fetch: () => {
					return somePromise.promise
				},
				loadSingle: loadsElement(itemE),
			}

			listModel = new ListElementListModel<tutanotaTypeRefs.KnowledgeBaseEntry>(newConfig)

			listModel.loadInitial()

			const received = listModel.entityEventReceived(getListId(itemE), getElementId(itemE), OperationType.CREATE)
			somePromise.resolve({
				items: [itemA, itemB, itemC, itemD],
				complete: false,
			})

			await received

			o(listModel.state.items).deepEquals([itemA, itemB, itemC, itemD])
		})
	})
})
