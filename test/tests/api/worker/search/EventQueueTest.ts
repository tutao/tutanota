import o, { spy } from "@tutao/otest"
import { EventQueue, QueuedBatch } from "../../../../../src/platform-kit/network/EventQueue.js"
import { defer, delay } from "../../../../../src/platform-kit/utils"
import * as restError from "../../../../../src/platform-kit/rest-client/error"

import { MailTypeRef } from "@tutao/entities/tutanota"
import { OperationType } from "../../../../../src/platform-kit/meta"
import { EntityUpdateData } from "../../../../../src/platform-kit/instance-pipeline/utils/EntityUpdateUtils"

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
			instanceListId: "list-id",
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
		queue = new EventQueue("test!", processElement)
	})

	o("pause and resume", async function () {
		queue.pause()
		const groupId = "groupId"
		const batchWithOnlyDelete: QueuedBatch = {
			events: [newUpdate(OperationType.DELETE, "1")],
			groupId,
			batchId: "1",
			isInitialSyncDone: true,
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
			isInitialSyncDone: true,
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
			isInitialSyncDone: true,
		}
		const batchWithOnlyCreate: QueuedBatch = {
			events: [newUpdate(OperationType.CREATE, "3")],
			groupId,
			batchId: "3",
			isInitialSyncDone: true,
		}

		lastProcess = defer()
		processElement = spy(() => {
			if (queue.queueSize() === 1) {
				// the last element is removed right after processing it
				lastProcess.resolve()
			}
			return Promise.resolve()
		})
		let queue = new EventQueue("test 2!", (nextElement: QueuedBatch) => {
			if (nextElement.batchId === "2") {
				return Promise.reject(new restError.ConnectionError("no connection"))
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
})
