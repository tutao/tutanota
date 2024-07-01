import o from "@tutao/otest"
import type { QueuedBatch } from "../../../../../src/common/api/worker/EventQueue.js"
import { EventQueue } from "../../../../../src/common/api/worker/EventQueue.js"
import type { EntityUpdate } from "../../../../../src/common/api/entities/sys/TypeRefs.js"
import { EntityUpdateTypeRef } from "../../../../../src/common/api/entities/sys/TypeRefs.js"
import { OperationType } from "../../../../../src/common/api/common/TutanotaConstants.js"
import { defer, delay } from "@tutao/tutanota-utils"
import { ConnectionError } from "../../../../../src/common/api/common/error/RestError.js"
import { MailTypeRef } from "../../../../../src/common/api/entities/tutanota/TypeRefs.js"
import { spy } from "@tutao/tutanota-test-utils"
import { createTestEntity } from "../../../TestUtils.js"

o.spec("EventQueueTest", function () {
	let queue: EventQueue
	let processElement: any
	let lastProcess: { resolve: () => void; reject: (Error) => void; promise: Promise<void> }

	const newUpdate = (type: OperationType, instanceId: string) => {
		const update = createTestEntity(EntityUpdateTypeRef)
		update.operation = type
		update.instanceId = instanceId
		return update
	}

	o.beforeEach(function () {
		lastProcess = defer()
		processElement = spy(() => {
			if (queue._eventQueue.length === 1) {
				// the last element is removed right after processing it
				lastProcess.resolve()
			}
			return Promise.resolve()
		})
		queue = new EventQueue(true, processElement)
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
		o(queue._eventQueue.length).equals(1)

		queue.resume()
		await lastProcess.promise
		o(queue._eventQueue.length).equals(0)
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
		o(queue._eventQueue.length).equals(1)
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
			if (queue._eventQueue.length === 1) {
				// the last element is removed right after processing it
				lastProcess.resolve()
			}
			return Promise.resolve()
		})
		let queue = new EventQueue(true, (nextElement: QueuedBatch) => {
			if (nextElement.batchId === "2") {
				return Promise.reject(new ConnectionError("no connection"))
			} else {
				throw new Error("should not be called")
			}
		})
		queue.addBatches([batchWithThrow, batchWithOnlyCreate])

		queue.start()
		await delay(5)
		o(queue._eventQueue.length).equals(2)
		o(queue._processingBatch).equals(null)
	})

	o.spec("collapsing events", function () {
		o.beforeEach(function () {
			queue.pause()
		})

		o("create + delete == delete", async function () {
			const createEvent = createUpdate(OperationType.CREATE, "new-mail-list", "1", "u1")
			const deleteEvent = createUpdate(OperationType.DELETE, createEvent.instanceListId, createEvent.instanceId, "u2")

			queue.add("batch-id-1", "group-id", [createEvent])
			queue.add("batch-id-2", "group-id", [deleteEvent])
			queue.resume()
			await lastProcess.promise

			const expectedDelete = createUpdate(OperationType.DELETE, createEvent.instanceListId, createEvent.instanceId, "u2")

			o(processElement.invocations).deepEquals([[{ events: [expectedDelete], batchId: "batch-id-2", groupId: "group-id" }]])
		})

		o("create + update == create", async function () {
			const createEvent = createUpdate(OperationType.CREATE, "new-mail-list", "1", "u1")
			const updateEvent = createUpdate(OperationType.UPDATE, createEvent.instanceListId, createEvent.instanceId, "u2")

			queue.add("batch-id-1", "group-id", [createEvent])
			queue.add("batch-id-2", "group-id", [updateEvent])
			queue.resume()
			await lastProcess.promise

			const expectedCreate = createUpdate(OperationType.CREATE, createEvent.instanceListId, createEvent.instanceId, "u1")

			o(processElement.invocations).deepEquals([[{ events: [expectedCreate], batchId: "batch-id-1", groupId: "group-id" }]])
		})

		o("create + create", async function () {
			const createEvent = createUpdate(OperationType.CREATE, "new-mail-list", "1", "u1")
			const createEvent2 = createUpdate(OperationType.CREATE, createEvent.instanceListId, createEvent.instanceId, "u2")

			queue.add("batch-id-1", "group-id", [createEvent])
			queue.add("batch-id-2", "group-id", [createEvent2])
			queue.resume()
			await lastProcess.promise

			const expectedCreate = createUpdate(OperationType.CREATE, createEvent.instanceListId, createEvent.instanceId, "u1")
			const expectedCreate2 = createUpdate(OperationType.CREATE, createEvent.instanceListId, createEvent.instanceId, "u2")

			o(processElement.invocations).deepEquals([
				[{ events: [expectedCreate], batchId: "batch-id-1", groupId: "group-id" }],
				[{ events: [expectedCreate2], batchId: "batch-id-2", groupId: "group-id" }],
			])
		})

		o("create + update + delete == delete", async function () {
			const createEvent = createUpdate(OperationType.CREATE, "new-mail-list", "1", "u1")
			const updateEvent = createUpdate(OperationType.UPDATE, "new-mail-list", "1", "u2")
			const deleteEvent = createUpdate(OperationType.DELETE, createEvent.instanceListId, createEvent.instanceId, "u")

			queue.add("batch-id-1", "group-id", [createEvent])
			queue.add("batch-id-2", "group-id", [updateEvent])
			queue.add("batch-id-3", "group-id", [deleteEvent])
			queue.resume()
			await lastProcess.promise

			const expectedDelete = createUpdate(OperationType.DELETE, createEvent.instanceListId, createEvent.instanceId, "u")

			o(processElement.invocations).deepEquals([[{ events: [expectedDelete], batchId: "batch-id-3", groupId: "group-id" }]])
		})

		o("create & move == create*", async function () {
			const createEvent = createUpdate(OperationType.CREATE, "new-mail-list", "1", "u1")
			const deleteEvent = createUpdate(OperationType.DELETE, createEvent.instanceListId, createEvent.instanceId, "u2")
			const createAgainEvent = createUpdate(OperationType.CREATE, "new-mail-list-2", createEvent.instanceId, "u3")

			queue.add("batch-id-1", "group-id", [createEvent])
			queue.add("batch-id-2", "group-id", [deleteEvent, createAgainEvent])

			queue.resume()
			await lastProcess.promise

			const expectedCreate = createUpdate(OperationType.CREATE, "new-mail-list-2", "1", "u3")

			o(processElement.invocations).deepEquals([[{ events: [expectedCreate], groupId: "group-id", batchId: "batch-id-1" }]])
		})

		o("move + move == move", async function () {
			const instanceId = "new-mail"
			// Two parts of the "move" event in the firts batch
			const deleteEvent = createUpdate(OperationType.DELETE, "new-mail-list-1", instanceId, "u1")
			const createEvent = createUpdate(OperationType.CREATE, "new-mail-list-2", instanceId, "u2")
			// Two parts of the "move" event in the second batch
			const deleteAgainEvent = createUpdate(OperationType.DELETE, "new-mail-list-2", instanceId, "u3")
			const createAgainEvent = createUpdate(OperationType.CREATE, "new-mail-list-3", instanceId, "u4")

			queue.add("batch-id-1", "group-id", [deleteEvent, createEvent])
			queue.add("batch-id-2", "group-id", [deleteAgainEvent, createAgainEvent])

			queue.resume()
			await lastProcess.promise

			const expectedEvents = [
				createUpdate(OperationType.DELETE, "new-mail-list-1", instanceId, "u1"),
				createUpdate(OperationType.CREATE, "new-mail-list-3", instanceId, "u4"),
			]
			o(processElement.invocations).deepEquals([[{ events: expectedEvents, groupId: "group-id", batchId: "batch-id-1" }]])
		})

		o("update + move == delete + create", async function () {
			const instanceId = "mailId"
			const updateEvent = createUpdate(OperationType.UPDATE, "new-mail-list", instanceId, "u1")
			// Two parts of the "move" event in the second batch
			const deleteEvent = createUpdate(OperationType.DELETE, "new-mail-list", instanceId, "u2")
			const createEvent = createUpdate(OperationType.CREATE, "new-mail-list-2", instanceId, "u3")

			queue.add("batch-id-1", "group-id", [updateEvent])
			queue.add("batch-id-2", "group-id", [deleteEvent, createEvent])

			queue.resume()
			await lastProcess.promise

			const expectedDelete = createUpdate(OperationType.DELETE, "new-mail-list", instanceId, "u2")
			const expectedCreate = createUpdate(OperationType.CREATE, "new-mail-list-2", instanceId, "u3")

			o(processElement.invocations).deepEquals([
				[{ events: [expectedDelete], groupId: "group-id", batchId: "batch-id-1" }],
				[{ events: [expectedCreate], groupId: "group-id", batchId: "batch-id-2" }],
			])
		})

		o("move + update == move + update", async function () {
			const moveDeleteEvent = createUpdate(OperationType.DELETE, "old-mail-list", "1", "u0")
			const moveCreateEvent = createUpdate(OperationType.CREATE, "new-mail-list", "1", "u1")
			const updateEvent = createUpdate(OperationType.UPDATE, "new-mail-list", "1", "u2")

			queue.add("batch-id-1", "group-id", [moveDeleteEvent, moveCreateEvent])
			queue.add("batch-id-2", "group-id", [updateEvent])
			queue.resume()
			await lastProcess.promise

			o(processElement.invocations).deepEquals([
				[{ events: [moveDeleteEvent, moveCreateEvent], batchId: "batch-id-1", groupId: "group-id" }],
				[{ events: [updateEvent], batchId: "batch-id-2", groupId: "group-id" }],
			])
		})

		o("move + delete == delete", async function () {
			const instanceId = "mailId"

			// Two parts of the "move" event in the first batch
			const deleteEvent = createUpdate(OperationType.DELETE, "new-mail-list", instanceId, "u1")
			const createEvent = createUpdate(OperationType.CREATE, "new-mail-list-2", instanceId, "u2")

			const deleteEvent2 = createUpdate(OperationType.DELETE, "new-mail-list-2", instanceId, "u3")

			queue.add("batch-id-1", "group-id", [deleteEvent, createEvent])
			queue.add("batch-id-2", "group-id", [deleteEvent2])

			queue.resume()
			await lastProcess.promise

			const expectedEvents = [createUpdate(OperationType.DELETE, "new-mail-list", instanceId, "u1")]

			o(processElement.invocations).deepEquals([[{ events: expectedEvents, groupId: "group-id", batchId: "batch-id-1" }]])
		})

		o("move + update + delete == delete", async function () {
			const moveDeleteEvent = createUpdate(OperationType.DELETE, "old-mail-list", "1", "u0")
			const moveCreateEvent = createUpdate(OperationType.CREATE, "new-mail-list", "1", "u1")
			const updateEvent = createUpdate(OperationType.UPDATE, "new-mail-list", "1", "u2")
			const deleteEvent = createUpdate(OperationType.DELETE, "new-mail-list", "1", "u3")

			queue.add("batch-id-1", "group-id", [moveDeleteEvent, moveCreateEvent])
			queue.add("batch-id-2", "group-id", [updateEvent])
			queue.add("batch-id-3", "group-id", [deleteEvent])
			queue.resume()
			await lastProcess.promise

			o(processElement.invocations).deepEquals([[{ events: [moveDeleteEvent], batchId: "batch-id-1", groupId: "group-id" }]])
		})

		o("update + move + delete == delete", async function () {
			const updateEvent = createUpdate(OperationType.UPDATE, "old-mail-list", "1", "u0")
			const moveDeleteEvent = createUpdate(OperationType.DELETE, "old-mail-list", "1", "u1")
			const moveCreateEvent = createUpdate(OperationType.CREATE, "new-mail-list", "1", "u2")
			const deleteEvent = createUpdate(OperationType.DELETE, "new-mail-list", "1", "u3")

			queue.add("batch-id-1", "group-id", [updateEvent])
			queue.add("batch-id-2", "group-id", [moveDeleteEvent, moveCreateEvent])
			queue.add("batch-id-3", "group-id", [deleteEvent])
			queue.resume()
			await lastProcess.promise

			o(processElement.invocations).deepEquals([[{ events: [moveDeleteEvent], batchId: "batch-id-1", groupId: "group-id" }]])
		})

		o("move + update + move + delete == delete (from first move)", async function () {
			const moveDeleteEvent = createUpdate(OperationType.DELETE, "old-mail-list", "1", "u0")
			const moveCreateEvent = createUpdate(OperationType.CREATE, "new-mail-list", "1", "u1")
			const updateEvent = createUpdate(OperationType.UPDATE, "new-mail-list", "1", "u2")
			const move2DeleteEvent = createUpdate(OperationType.DELETE, "new-mail-list", "1", "u3")
			const move2CreateEvent = createUpdate(OperationType.CREATE, "newest-mail-list", "1", "u4")
			const deleteEvent = createUpdate(OperationType.DELETE, "newest-mail-list", "1", "u5")

			queue.add("batch-id-1", "group-id", [moveDeleteEvent, moveCreateEvent])
			queue.add("batch-id-2", "group-id", [updateEvent])
			queue.add("batch-id-3", "group-id", [move2DeleteEvent, move2CreateEvent])
			queue.add("batch-id-4", "group-id", [deleteEvent])
			queue.resume()
			await lastProcess.promise

			o(processElement.invocations).deepEquals([[{ events: [moveDeleteEvent], batchId: "batch-id-1", groupId: "group-id" }]])
		})

		o("create + move + update + delete == delete (from first move)", async function () {
			const createEvent = createUpdate(OperationType.CREATE, "old-mail-list", "1", "u0")
			const moveDeleteEvent = createUpdate(OperationType.DELETE, "old-mail-list", "1", "u1")
			const moveCreateEvent = createUpdate(OperationType.CREATE, "new-mail-list", "1", "u2")
			const updateEvent = createUpdate(OperationType.UPDATE, "new-mail-list", "1", "u4")
			const deleteEvent = createUpdate(OperationType.DELETE, "new-mail-list", "1", "u5")

			queue.add("batch-id-1", "group-id", [createEvent])
			queue.add("batch-id-2", "group-id", [moveDeleteEvent, moveCreateEvent])
			queue.add("batch-id-3", "group-id", [updateEvent])
			queue.add("batch-id-4", "group-id", [deleteEvent])
			queue.resume()
			await lastProcess.promise

			o(processElement.invocations).deepEquals([[{ events: [deleteEvent], batchId: "batch-id-4", groupId: "group-id" }]])
		})

		o("create + update + move + delete == delete (from first move)", async function () {
			const createEvent = createUpdate(OperationType.CREATE, "old-mail-list", "1", "u0")
			const updateEvent = createUpdate(OperationType.UPDATE, "old-mail-list", "1", "u1")
			const moveDeleteEvent = createUpdate(OperationType.DELETE, "old-mail-list", "1", "u2")
			const moveCreateEvent = createUpdate(OperationType.CREATE, "new-mail-list", "1", "u3")
			const deleteEvent = createUpdate(OperationType.DELETE, "new-mail-list", "1", "u4")

			queue.add("batch-id-1", "group-id", [createEvent])
			queue.add("batch-id-2", "group-id", [updateEvent])
			queue.add("batch-id-3", "group-id", [moveDeleteEvent, moveCreateEvent])
			queue.add("batch-id-4", "group-id", [deleteEvent])
			queue.resume()
			await lastProcess.promise

			o(processElement.invocations).deepEquals([[{ events: [deleteEvent], batchId: "batch-id-4", groupId: "group-id" }]])
		})

		o("delete + create == delete + create", async function () {
			// DELETE can happen after CREATE in case of custom id. We keep it as-is
			const deleteEvent = createUpdate(OperationType.DELETE, "mail-list", "1", "u0")
			const createEvent = createUpdate(OperationType.CREATE, "mail-list", "1", "u1")

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
			const deleteEvent1 = createUpdate(OperationType.DELETE, "list", "1", "u1")
			const nonEmptyEventInBetween = createUpdate(OperationType.CREATE, "list2", "2", "u1.1")
			const createEvent1 = createUpdate(OperationType.CREATE, "list", "1", "u2")

			const deleteEvent2 = createUpdate(OperationType.DELETE, "list", "1", "u3")
			const createEvent2 = createUpdate(OperationType.CREATE, "list", "1", "u4")

			queue.add("batch-id-1", "group-id", [deleteEvent1])
			queue.add("batch-id-1.1", "group-id", [nonEmptyEventInBetween])
			queue.add("batch-id-2", "group-id", [createEvent1])
			queue.add("batch-id-3", "group-id", [deleteEvent2])
			queue.add("batch-id-4", "group-id", [createEvent2])
			queue.resume()
			await lastProcess.promise

			const expectedDelete = createUpdate(OperationType.DELETE, createEvent1.instanceListId, createEvent1.instanceId, "u1")
			const expectedCreate = createUpdate(OperationType.CREATE, createEvent1.instanceListId, createEvent1.instanceId, "u4")

			o(processElement.invocations).deepEquals([
				[{ events: [expectedDelete], batchId: "batch-id-1", groupId: "group-id" }],
				[{ events: [nonEmptyEventInBetween], batchId: "batch-id-1.1", groupId: "group-id" }],
				[{ events: [expectedCreate], batchId: "batch-id-4", groupId: "group-id" }],
			])
		})

		o("same batch in two different groups", async function () {
			const createEvent1 = createUpdate(OperationType.CREATE, "old-mail-list", "1", "u0")
			const createEvent2 = createUpdate(OperationType.CREATE, "old-mail-list", "1", "u0")

			queue.add("batch-id-1", "group-id-1", [createEvent1])
			queue.add("batch-id-1", "group-id-2", [createEvent2])
			queue.resume()
			await lastProcess.promise

			o(processElement.invocations).deepEquals([
				[{ events: [createEvent1], batchId: "batch-id-1", groupId: "group-id-1" }],
				[{ events: [createEvent1], batchId: "batch-id-1", groupId: "group-id-2" }],
			])
		})

		function createUpdate(type: OperationType, listId: Id, instanceId: Id, eventId?: Id): EntityUpdate {
			let update = createTestEntity(EntityUpdateTypeRef)
			update.operation = type
			update.instanceListId = listId
			update.instanceId = instanceId
			update.type = MailTypeRef.type
			update.application = MailTypeRef.app
			if (eventId) {
				update._id = eventId
			}
			return update
		}
	})
})
