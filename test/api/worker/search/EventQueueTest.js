// @flow
import o from "ospec/ospec.js"
import type {FutureBatchActions, QueuedBatch} from "../../../../src/api/worker/search/EventQueue"
import {EventQueue} from "../../../../src/api/worker/search/EventQueue"
import {replaceAllMaps, spy} from "../../TestUtils"
import {createEntityUpdate} from "../../../../src/api/entities/sys/EntityUpdate"
import type {OperationTypeEnum} from "../../../../src/api/common/TutanotaConstants"
import {OperationType} from "../../../../src/api/common/TutanotaConstants"
import {defer} from "../../../../src/api/common/utils/Utils"

o.spec("EventQueueTest", function () {
	let queue: EventQueue
	let processElement: (nextElement: QueuedBatch, futureActions: FutureBatchActions) => Promise<void>
	let lastProcess: {resolve: () => void, reject: (Error) => void, promise: Promise<void>}

	const newUpdate = (type: OperationTypeEnum, instanceId: string) => {
		const update = createEntityUpdate()
		update.operation = type
		update.instanceId = instanceId
		return update
	}

	o.beforeEach(function () {
		lastProcess = defer()
		processElement = spy(() => {
			if (queue._eventQueue.length == 0) {
				lastProcess.resolve()
			}
			return Promise.resolve()
		})
		queue = new EventQueue(processElement)
	})

	o("addBatches & start", async function () {
		const groupId = "groupId"
		const batchWithOnlyDelete: QueuedBatch = {
			events: [newUpdate(OperationType.DELETE, "1")],
			groupId,
			batchId: "1"
		}
		const batchWithMove: QueuedBatch = {
			events: [newUpdate(OperationType.CREATE, "2"), newUpdate(OperationType.DELETE, "2")],
			groupId,
			batchId: "2"
		}
		const batchWithOnlyCreate: QueuedBatch = {
			events: [newUpdate(OperationType.CREATE, "3")],
			groupId,
			batchId: "3"
		}
		const batchWithDeleteAndOtherCreate: QueuedBatch = {
			events: [newUpdate(OperationType.DELETE, "4"), newUpdate(OperationType.CREATE, "5")],
			groupId,
			batchId: "4"
		}
		const batchWhichOverridesMove: QueuedBatch = {
			events: [newUpdate(OperationType.DELETE, "2"), newUpdate(OperationType.CREATE, "2")],
			groupId,
			batchId: "5"
		}

		const expectedFutureActions = {
			deleted: {
				[batchWithOnlyDelete.events[0].instanceId]: batchWithOnlyDelete.events[0],
				[batchWithDeleteAndOtherCreate.events[0].instanceId]: batchWithDeleteAndOtherCreate.events[0]
			},
			moved: {
				[batchWhichOverridesMove.events[1].instanceId]: batchWhichOverridesMove.events[1]
			}
		}

		const batches = [
			batchWithOnlyDelete,
			batchWithMove,
			batchWithOnlyCreate,
			batchWithDeleteAndOtherCreate,
			batchWhichOverridesMove
		]
		queue.addBatches(batches)
		queue.start()

		await lastProcess.promise

		o(replaceAllMaps(processElement.invocations)).deepEquals(batches.map((b) => [b, expectedFutureActions]))
	})
})