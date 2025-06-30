import o from "@tutao/otest"
import { batchMod, EntityModificationType, EventQueue, QueuedBatch } from "../../../../../src/common/api/worker/EventQueue.js"
import { GroupTypeRef } from "../../../../../src/common/api/entities/sys/TypeRefs.js"
import { OperationType } from "../../../../../src/common/api/common/TutanotaConstants.js"
import { defer, delay } from "@tutao/tutanota-utils"
import { ConnectionError } from "../../../../../src/common/api/common/error/RestError.js"
import { ContactTypeRef, MailboxGroupRootTypeRef, MailTypeRef } from "../../../../../src/common/api/entities/tutanota/TypeRefs.js"
import { spy } from "@tutao/tutanota-test-utils"
import { EntityUpdateData } from "../../../../../src/common/api/common/utils/EntityUpdateUtils"

o.spec("EventQueueTest", function () {
	let queue: EventQueue
	let processElement: any
	let lastProcess: { resolve: () => void; reject: (Error) => void; promise: Promise<void> }

	const noPatchesAndInstance: Pick<EntityUpdateData, "instance" | "patches"> = {
		instance: null,
		patches: null,
	}
	const newUpdate = (type: OperationType, instanceId: string): EntityUpdateData => {
		return {
			operation: type,
			instanceId,
			instanceListId: "",
			typeRef: MailTypeRef,
			...noPatchesAndInstance,
		} as Partial<EntityUpdateData> as EntityUpdateData
	}

	o.beforeEach(function () {
		lastProcess = defer()
		processElement = spy(() => {
			if (queue.queueSize() === 1) {
				// the last element is removed right after processing it
				lastProcess.resolve()
			}
			return Promise.resolve()
		})
		queue = new EventQueue("test!", true, processElement)
	})

	o("pause and resume", async function () {
		queue.pause()
		const groupId = "groupId"
		const batchWithOnlyDelete: QueuedBatch = {
			events: [newUpdate(OperationType.DELETE, "1")],
			groupId,
			batchId: "1",
		}
		queue.addBatches([batchWithOnlyDelete])

		await delay(5)
		o(queue.queueSize()).equals(1)

		queue.resume()
		await lastProcess.promise
		o(queue.queueSize()).equals(0)
	})

	o("start after pause", async function () {
		queue.pause()
		const groupId = "groupId"
		const batchWithOnlyDelete: QueuedBatch = {
			events: [newUpdate(OperationType.DELETE, "1")],
			groupId,
			batchId: "1",
		}
		queue.addBatches([batchWithOnlyDelete])

		await delay(5)
		queue.start()
		o(queue.queueSize()).equals(1)
	})

	o("handle ConnectionError", async function () {
		const groupId = "groupId"
		const batchWithThrow: QueuedBatch = {
			events: [newUpdate(OperationType.CREATE, "2"), newUpdate(OperationType.DELETE, "2")],
			groupId,
			batchId: "2",
		}
		const batchWithOnlyCreate: QueuedBatch = {
			events: [newUpdate(OperationType.CREATE, "3")],
			groupId,
			batchId: "3",
		}

		lastProcess = defer()
		processElement = spy(() => {
			if (queue.queueSize() === 1) {
				// the last element is removed right after processing it
				lastProcess.resolve()
			}
			return Promise.resolve()
		})
		let queue = new EventQueue("test 2!", true, (nextElement: QueuedBatch) => {
			if (nextElement.batchId === "2") {
				return Promise.reject(new ConnectionError("no connection"))
			} else {
				throw new Error("should not be called")
			}
		})
		queue.addBatches([batchWithThrow, batchWithOnlyCreate])

		queue.start()
		await delay(5)
		o(queue.queueSize()).equals(2)
		o(queue.__processingBatch).equals(null)
	})

	o.spec("collapsing events", function () {
		o.beforeEach(function () {
			queue.pause()
		})

		o("create + delete == delete", async function () {
			const createEvent = createUpdate(OperationType.CREATE, "new-mail-list", "1")
			const deleteEvent = createUpdate(OperationType.DELETE, createEvent.instanceListId, createEvent.instanceId)

			queue.add("batch-id-1", "group-id", [createEvent])
			queue.add("batch-id-2", "group-id", [deleteEvent])
			queue.resume()
			await lastProcess.promise

			const expectedDelete = createUpdate(OperationType.DELETE, createEvent.instanceListId, createEvent.instanceId)

			o(processElement.invocations).deepEquals([
				[{ events: [], batchId: "batch-id-1", groupId: "group-id" }],
				[{ events: [expectedDelete], batchId: "batch-id-2", groupId: "group-id" }],
			])
		})

		o("create + update == create", async function () {
			const createEvent = createUpdate(OperationType.CREATE, "new-mail-list", "1")
			const updateEvent = createUpdate(OperationType.UPDATE, createEvent.instanceListId, createEvent.instanceId)

			queue.add("batch-id-1", "group-id", [createEvent])
			queue.add("batch-id-2", "group-id", [updateEvent])
			queue.resume()
			await lastProcess.promise

			const expectedCreate = createUpdate(OperationType.CREATE, createEvent.instanceListId, createEvent.instanceId)

			o(processElement.invocations).deepEquals([
				[{ events: [expectedCreate], batchId: "batch-id-1", groupId: "group-id" }],
				// new update got optimized away on the spot
			])
		})

		o("create + create == create + create", async function () {
			const createEvent = createUpdate(OperationType.CREATE, "new-mail-list", "1")
			const createEvent2 = createUpdate(OperationType.CREATE, createEvent.instanceListId, createEvent.instanceId)

			queue.add("batch-id-1", "group-id", [createEvent])
			queue.add("batch-id-2", "group-id", [createEvent2])
			queue.resume()
			await lastProcess.promise

			const expectedCreate = createUpdate(OperationType.CREATE, createEvent.instanceListId, createEvent.instanceId)
			const expectedCreate2 = createUpdate(OperationType.CREATE, createEvent.instanceListId, createEvent.instanceId)

			o(processElement.invocations).deepEquals([
				[{ events: [expectedCreate], batchId: "batch-id-1", groupId: "group-id" }],
				[{ events: [expectedCreate2], batchId: "batch-id-2", groupId: "group-id" }],
			])
		})

		o("create + update + delete == delete", async function () {
			const createEvent = createUpdate(OperationType.CREATE, "new-mail-list", "1")
			const updateEvent = createUpdate(OperationType.UPDATE, "new-mail-list", "1")
			const deleteEvent = createUpdate(OperationType.DELETE, createEvent.instanceListId, createEvent.instanceId)

			queue.add("batch-id-1", "group-id", [createEvent])
			queue.add("batch-id-2", "group-id", [updateEvent])
			queue.add("batch-id-3", "group-id", [deleteEvent])
			queue.resume()
			await lastProcess.promise

			const expectedDelete = createUpdate(OperationType.DELETE, createEvent.instanceListId, createEvent.instanceId)

			o(processElement.invocations).deepEquals([
				[{ events: [], batchId: "batch-id-1", groupId: "group-id" }],
				// update event was optimized away
				[{ events: [expectedDelete], batchId: "batch-id-3", groupId: "group-id" }],
			])
		})

		o("delete + create == delete + create", async function () {
			// DELETE can happen after CREATE in case of custom id. We keep it as-is
			const deleteEvent = createUpdate(OperationType.DELETE, "mail-list", "1")
			const createEvent = createUpdate(OperationType.CREATE, "mail-list", "1")

			queue.add("batch-id-0", "group-id", [deleteEvent])
			queue.add("batch-id-1", "group-id", [createEvent])
			queue.resume()
			await lastProcess.promise

			o(processElement.invocations).deepEquals([
				[{ events: [deleteEvent], batchId: "batch-id-0", groupId: "group-id" }],
				[{ events: [createEvent], batchId: "batch-id-1", groupId: "group-id" }],
			])
		})

		o("delete + create + delete + create == delete + create", async function () {
			// This tests that create still works a
			const deleteEvent1 = createUpdate(OperationType.DELETE, "list", "1")
			const nonEmptyEventInBetween = createUpdate(OperationType.CREATE, "list2", "2")
			const createEvent1 = createUpdate(OperationType.CREATE, "list", "1")

			const deleteEvent2 = createUpdate(OperationType.DELETE, "list", "1")
			const createEvent2 = createUpdate(OperationType.CREATE, "list", "1")

			queue.add("batch-id-1", "group-id", [deleteEvent1])
			queue.add("batch-id-1.1", "group-id", [nonEmptyEventInBetween])
			queue.add("batch-id-2", "group-id", [createEvent1])
			queue.add("batch-id-3", "group-id", [deleteEvent2])
			queue.add("batch-id-4", "group-id", [createEvent2])
			queue.resume()
			await lastProcess.promise

			const expectedDelete = createUpdate(OperationType.DELETE, createEvent1.instanceListId, createEvent1.instanceId)
			const expectedCreate = createUpdate(OperationType.CREATE, createEvent1.instanceListId, createEvent1.instanceId)
			const expectedDelete2 = createUpdate(OperationType.DELETE, createEvent1.instanceListId, createEvent1.instanceId)

			o(processElement.invocations).deepEquals([
				[{ events: [expectedDelete], batchId: "batch-id-1", groupId: "group-id" }],
				[{ events: [nonEmptyEventInBetween], batchId: "batch-id-1.1", groupId: "group-id" }],
				[{ events: [], batchId: "batch-id-2", groupId: "group-id" }],
				[{ events: [expectedDelete2], batchId: "batch-id-3", groupId: "group-id" }],
				[{ events: [expectedCreate], batchId: "batch-id-4", groupId: "group-id" }],
			])
		})

		o("delete (list 1) + create (list 2) == delete (list 1) + create (list 2)", async function () {
			// entity updates with for the same element id but different list IDs do not influence each other
			const deleteEvent1 = createUpdate(OperationType.DELETE, "list1", "1")
			const createEvent1 = createUpdate(OperationType.CREATE, "list2", "1")

			queue.add("batch-id-1", "group-id", [deleteEvent1])
			queue.add("batch-id-2", "group-id", [createEvent1])
			queue.resume()
			await lastProcess.promise

			const expectedDelete = createUpdate(OperationType.DELETE, deleteEvent1.instanceListId, deleteEvent1.instanceId)
			const expectedCreate = createUpdate(OperationType.CREATE, createEvent1.instanceListId, createEvent1.instanceId)

			o(processElement.invocations).deepEquals([
				[{ events: [expectedDelete], batchId: "batch-id-1", groupId: "group-id" }],
				[{ events: [expectedCreate], batchId: "batch-id-2", groupId: "group-id" }],
			])
		})

		o("create (list 1) + update (list 1) + delete (list 2) == create (list 1) + delete (list 2)", async function () {
			// entity updates with for the same element id but different list IDs do not influence each other
			const createEvent1 = createUpdate(OperationType.CREATE, "list1", "1")
			const updateEvent1 = createUpdate(OperationType.UPDATE, "list1", "1")
			const deleteEvent1 = createUpdate(OperationType.DELETE, "list2", "1")

			queue.add("batch-id-1", "group-id", [createEvent1])
			queue.add("batch-id-2", "group-id", [updateEvent1])
			queue.add("batch-id-3", "group-id", [deleteEvent1])
			queue.resume()
			await lastProcess.promise

			const expectedCreate = createUpdate(OperationType.CREATE, createEvent1.instanceListId, createEvent1.instanceId)
			const expectedDelete = createUpdate(OperationType.DELETE, deleteEvent1.instanceListId, deleteEvent1.instanceId)

			o(processElement.invocations).deepEquals([
				[{ events: [expectedCreate], batchId: "batch-id-1", groupId: "group-id" }],
				[{ events: [expectedDelete], batchId: "batch-id-3", groupId: "group-id" }],
			])
		})

		o("same batch in two different groups", async function () {
			const createEvent1 = createUpdate(OperationType.CREATE, "old-mail-list", "1")
			const createEvent2 = createUpdate(OperationType.CREATE, "old-mail-list", "1")

			queue.add("batch-id-1", "group-id-1", [createEvent1])
			queue.add("batch-id-1", "group-id-2", [createEvent2])
			queue.resume()
			await lastProcess.promise

			o(processElement.invocations).deepEquals([
				[{ events: [createEvent1], batchId: "batch-id-1", groupId: "group-id-1" }],
				[{ events: [createEvent1], batchId: "batch-id-1", groupId: "group-id-2" }],
			])
		})

		o(
			"[delete (list 1) + create (list 2)] + delete (list 2) + create (list 2) = [delete (list 1) + create (list 2)] + delete (list 2) + create (list 2)",
			async function () {
				const deleteEvent1 = createUpdate(OperationType.DELETE, "l1", "1")
				const createEvent1 = createUpdate(OperationType.CREATE, "l2", "1")
				const deleteEvent2 = createUpdate(OperationType.DELETE, "l2", "1")
				const createEvent2 = createUpdate(OperationType.CREATE, "l2", "1")

				queue.add("batch-id-1", "group-id-1", [deleteEvent1, createEvent1])
				queue.add("batch-id-2", "group-id-1", [deleteEvent2])
				queue.add("batch-id-3", "group-id-1", [createEvent2])
				queue.resume()
				await lastProcess.promise

				o(processElement.invocations).deepEquals([
					[{ events: [deleteEvent1], batchId: "batch-id-1", groupId: "group-id-1" }],
					[{ events: [deleteEvent2], batchId: "batch-id-2", groupId: "group-id-1" }],
					[{ events: [createEvent2], batchId: "batch-id-3", groupId: "group-id-1" }],
				])
			},
		)

		o("optimization does not fail when there are new events with the same id but a different type", function () {
			const batchId = "batch-id-1"
			const groupId = "group-id-1"
			const instanceId = "instance-id-1"
			const updateEvent1 = createUpdate(OperationType.UPDATE, "", instanceId)
			const updateEvent2 = createUpdate(OperationType.UPDATE, "", instanceId)
			updateEvent1.typeRef = GroupTypeRef
			updateEvent2.typeRef = MailboxGroupRootTypeRef
			queue.add(batchId, groupId, [updateEvent1])
			queue.add(batchId, groupId, [updateEvent2])
		})

		function createUpdate(type: OperationType, listId: Id, instanceId: Id): EntityUpdateData {
			return {
				typeRef: MailTypeRef,
				operation: type,
				instanceId,
				instanceListId: listId,
				instance: null,
				patches: null,
				isPrefetched: false,
			}
		}
	})

	o.spec("batchMod", function () {
		const batchId = "batchId"
		const instanceListId = "instanceListId"
		const instanceId = "instanceId"
		o("one entity with the same id and type", async () => {
			o(
				batchMod(
					batchId,
					[
						{
							typeRef: MailTypeRef,
							instanceId,
							instanceListId,
							operation: OperationType.CREATE,
							...noPatchesAndInstance,
							isPrefetched: false,
						},
					],
					{
						typeRef: MailTypeRef,
						instanceId,
						instanceListId,
						operation: OperationType.CREATE,
						...noPatchesAndInstance,
						isPrefetched: false,
					},
				),
			).equals(EntityModificationType.CREATE)
		})

		o("there is another op with the same type but different element id", async () => {
			o(
				batchMod(
					batchId,
					[
						{
							typeRef: MailTypeRef,
							instanceId: "instanceId2",
							instanceListId,
							operation: OperationType.DELETE,
							...noPatchesAndInstance,
							isPrefetched: false,
						},
						{
							typeRef: MailTypeRef,
							instanceId,
							instanceListId,
							operation: OperationType.CREATE,
							...noPatchesAndInstance,
							isPrefetched: false,
						},
					],
					{
						typeRef: MailTypeRef,
						instanceId,
						instanceListId,
						operation: OperationType.CREATE,
						...noPatchesAndInstance,
						isPrefetched: false,
					},
				),
			).equals(EntityModificationType.CREATE)
		})

		o("there is another op with the same type but different list id", async () => {
			o(
				batchMod(
					batchId,
					[
						{
							typeRef: MailTypeRef,
							instanceId,
							instanceListId: "instanceListId2",
							operation: OperationType.DELETE,
							...noPatchesAndInstance,
							isPrefetched: false,
						},
						{
							typeRef: MailTypeRef,
							instanceId,
							instanceListId,
							operation: OperationType.CREATE,
							...noPatchesAndInstance,
							isPrefetched: false,
						},
					],
					{
						typeRef: MailTypeRef,
						instanceId,
						instanceListId,
						operation: OperationType.CREATE,
						...noPatchesAndInstance,
						isPrefetched: false,
					},
				),
			).equals(EntityModificationType.CREATE)
		})

		o("there is another op with the id but different type", async () => {
			o(
				batchMod(
					batchId,
					[
						{
							typeRef: ContactTypeRef,
							instanceId,
							instanceListId,
							operation: OperationType.DELETE,
							...noPatchesAndInstance,
							isPrefetched: false,
						},
						{
							typeRef: MailTypeRef,
							instanceId,
							instanceListId,
							operation: OperationType.CREATE,
							...noPatchesAndInstance,
							isPrefetched: false,
						},
					],
					{
						typeRef: MailTypeRef,
						instanceId,
						instanceListId,
						operation: OperationType.CREATE,
						...noPatchesAndInstance,
						isPrefetched: false,
					},
				),
			).equals(EntityModificationType.CREATE)
		})

		o("modification is based on operation of batch, not the argument", async () => {
			o(
				batchMod(
					batchId,
					[
						{
							typeRef: MailTypeRef,
							instanceId,
							instanceListId,
							operation: OperationType.CREATE,
							...noPatchesAndInstance,
							isPrefetched: false,
						},
					],
					{
						typeRef: MailTypeRef,
						instanceId,
						instanceListId,
						operation: OperationType.DELETE,
						...noPatchesAndInstance,
						isPrefetched: false,
					},
				),
			).equals(EntityModificationType.CREATE)
		})
	})
})
