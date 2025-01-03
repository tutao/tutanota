import o from "@tutao/otest"
import { getElementId, getListId, sortCompareById } from "../../../src/common/api/common/utils/EntityUtils.js"
import { defer, DeferredObject } from "@tutao/tutanota-utils"
import { KnowledgeBaseEntry, KnowledgeBaseEntryTypeRef } from "../../../src/common/api/entities/tutanota/TypeRefs.js"
import { ListFetchResult } from "../../../src/common/gui/base/ListUtils.js"
import { OperationType } from "../../../src/common/api/common/TutanotaConstants.js"
import { createTestEntity } from "../TestUtils.js"
import { ListAutoSelectBehavior } from "../../../src/common/misc/DeviceConfig.js"
import { ListElementListModel, ListElementListModelConfig } from "../../../src/common/misc/ListElementListModel"

o.spec("ListElementListModel", function () {
	const listId = "listId"
	let fetchDefer: DeferredObject<ListFetchResult<KnowledgeBaseEntry>>
	let listModel: ListElementListModel<KnowledgeBaseEntry>
	const defaultListConfig: ListElementListModelConfig<KnowledgeBaseEntry> = {
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
		listModel = new ListElementListModel<KnowledgeBaseEntry>(defaultListConfig)
	})

	function getSortedSelection() {
		return listModel.getSelectedAsArray().sort(sortCompareById)
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
		o("update for item with id sorting updates item", async function () {
			const updatedItemD = createTestEntity(KnowledgeBaseEntryTypeRef, { ...itemD, title: "AA" })

			const newConfig: ListElementListModelConfig<KnowledgeBaseEntry> = {
				...defaultListConfig,
				async loadSingle(_listId: Id, elementId: Id): Promise<KnowledgeBaseEntry | null> {
					if (elementId === getElementId(itemD)) {
						return updatedItemD
					} else {
						throw new Error("noop")
					}
				},
			}

			listModel = new ListElementListModel<KnowledgeBaseEntry>(newConfig)
			await setItems(items)

			await listModel.entityEventReceived(getListId(itemD), getElementId(itemD), OperationType.UPDATE)

			o(listModel.state.items).deepEquals([itemA, itemB, itemC, updatedItemD])
		})

		o("update for item with custom sorting changes position", async function () {
			const updatedItemD = createTestEntity(KnowledgeBaseEntryTypeRef, { ...itemD, title: "AA" })

			const newConfig: ListElementListModelConfig<KnowledgeBaseEntry> = {
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

			listModel = new ListElementListModel<KnowledgeBaseEntry>(newConfig)
			await setItems(items)

			await listModel.entityEventReceived(getListId(itemD), getElementId(itemD), OperationType.UPDATE)

			o(listModel.state.items).deepEquals([itemA, updatedItemD, itemB, itemC])
		})
	})
})
