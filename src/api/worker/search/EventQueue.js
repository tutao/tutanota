//@flow

import {OperationType} from "../../common/TutanotaConstants"
import {containsEventOfType} from "../../common/utils/Utils"
import {ConnectionError} from "../../common/error/RestError"
import {WorkerImpl} from "../WorkerImpl"

export type QueuedBatch = {
	events: EntityUpdate[], groupId: Id, batchId: Id
}


export type FutureBatchActions = {deleted: Map<Id, EntityUpdate>, moved: Map<Id, EntityUpdate>};

export class EventQueue {
	_processingActive: boolean
	_eventQueue: QueuedBatch[]
	_processNextQueueElement: (nextElement: QueuedBatch, futureActions: FutureBatchActions) => Promise<void>
	_futureActions: FutureBatchActions
	_paused: boolean
	_worker: WorkerImpl

	constructor(worker: WorkerImpl, processNextQueueElement: (nextElement: QueuedBatch, futureActions: FutureBatchActions) => Promise<void>) {
		this._worker = worker
		this._processingActive = false
		this._eventQueue = []
		this._processNextQueueElement = processNextQueueElement
		this._futureActions = {deleted: new Map(), moved: new Map()}
		this._paused = false
	}

	start() {
		if (this._processingActive) {
			return
		}
		this._processNext()
	}

	_processNext() {
		if (this._paused) {
			return
		}
		if (this._eventQueue.length > 0) {
			this._processingActive = true
			this._processNextQueueElement(this._eventQueue[0], this._futureActions)
			    .then(() => {
				    this._eventQueue.shift()
				    this._processingActive = false
				    this._processNext()
			    })
			    .catch(ConnectionError, e => {
				    // processing continues if the event bus receives a new event
				    this._processingActive = false
			    })
			    .catch(e => {
				    // processing continues if the event bus receives a new event
				    this._processingActive = false
				    this._worker.sendError(e)
			    })
		}
	}

	addBatches(batches: QueuedBatch[]) {
		for (let batch of batches) {
			for (let event of batch.events) {
				if (event.operation === OperationType.DELETE) {
					// if no create event is available the instance has been deleted
					if (!containsEventOfType(batch.events, OperationType.CREATE, event.instanceId)) {
						this._futureActions.deleted.set(event.instanceId, event)
					}
				} else if (event.operation === OperationType.CREATE) {
					// create and delete in one batch is a move operation
					if (containsEventOfType(batch.events, OperationType.DELETE, event.instanceId)) {
						this._futureActions.moved.set(event.instanceId, event)
					}
				}
			}
		}
		for (let el of batches) {
			this._eventQueue.push(el)
		}
	}

	clear() {
		this._eventQueue.splice(0)
	}

	pause() {
		this._paused = true
	}

	resume() {
		this._paused = false
		this.start()
	}
}