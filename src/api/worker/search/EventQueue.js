//@flow

import {OperationType} from "../../common/TutanotaConstants"
import {assertNotNull, containsEventOfType, getEventOfType} from "../../common/utils/Utils"
import {ConnectionError, ServiceUnavailableError} from "../../common/error/RestError"
import type {EntityUpdate} from "../../entities/sys/EntityUpdate"
import {findAllAndRemove, remove} from "../../common/utils/ArrayUtils"
import {ProgrammingError} from "../../common/error/ProgrammingError"
import {MailTypeRef} from "../../entities/tutanota/Mail"
import {isSameId} from "../../common/utils/EntityUtils"
import {isSameTypeRefByAttr} from "../../common/utils/TypeRef";

export type QueuedBatch = {
	events: EntityUpdate[], groupId: Id, batchId: Id
}


export const EntityModificationType = Object.freeze({
	CREATE: 'CREATE',
	UPDATE: 'UPDATE',
	MOVE: 'MOVE',
	DELETE: 'DELETE',
})
export type EntityModificationTypeEnum = $Values<typeof EntityModificationType>

type QueueAction = (nextElement: QueuedBatch) => Promise<void>

/**
 * Whether the entity of the event supports MOVE operation. MOVE is supposed to be immutable so we cannot apply it to all instances.
 */
function isMovableEventType(event: EntityUpdate): boolean {
	return isSameTypeRefByAttr(MailTypeRef, event.application, event.type)
}

/**
 * Checks which modification is applied in the given batch for the entity id.
 * @param batch entity updates of the batch.
 * @param entityId
 */
export function batchMod(batch: $ReadOnlyArray<EntityUpdate>, entityId: Id): EntityModificationTypeEnum {
	for (const event of batch) {
		if (isSameId(event.instanceId, entityId)) {
			switch (event.operation) {
				case OperationType.CREATE:
					return isMovableEventType(event) && containsEventOfType(batch, OperationType.DELETE, entityId)
						? EntityModificationType.MOVE
						: EntityModificationType.CREATE
				case OperationType.UPDATE:
					return EntityModificationType.UPDATE
				case OperationType.DELETE:
					return isMovableEventType(event) && containsEventOfType(batch, OperationType.CREATE, entityId)
						? EntityModificationType.MOVE
						: EntityModificationType.DELETE
				default:
					throw new ProgrammingError(`Unknown operation: ${event.operation}`)
			}
		}
	}
	throw new ProgrammingError(`Batch does not have events for ${entityId}`)
}

export class EventQueue {
	/** Batches to process. Oldest first. */
	+_eventQueue: Array<QueuedBatch>;
	+_lastOperationForEntity: Map<Id, QueuedBatch>;
	+_queueAction: QueueAction;
	+_optimizationEnabled: boolean;

	_processingBatch: ?QueuedBatch;
	_paused: boolean;

	/**
	 * @param queueAction which is executed for each batch. Must *never* throw.
	 */
	constructor(optimizationEnabled: boolean, queueAction: QueueAction) {
		this._eventQueue = []
		this._lastOperationForEntity = new Map()
		this._queueAction = queueAction
		this._optimizationEnabled = optimizationEnabled

		this._processingBatch = null
		this._paused = false

	}

	addBatches(batches: $ReadOnlyArray<QueuedBatch>) {
		for (const batch of batches) {
			this.add(batch.batchId, batch.groupId, batch.events)
		}
	}

	/**
	 * @return whether the batch was added (not optimized away)
	 */
	add(batchId: Id, groupId: Id, newEvents: $ReadOnlyArray<EntityUpdate>): boolean {
		const newBatch: QueuedBatch = {events: [], groupId, batchId}
		if (!this._optimizationEnabled) {
			newBatch.events.push(...newEvents)
		} else {
			this._optimizingAddEvents(newBatch, batchId, groupId, newEvents)
		}

		if (newBatch.events.length !== 0) {
			this._eventQueue.push(newBatch)
			for (const update of newBatch.events) {
				this._lastOperationForEntity.set(update.instanceId, newBatch)
			}
		}
		// ensures that events are processed when not paused
		this.start()
		return newBatch.events.length > 0
	}

	_optimizingAddEvents(newBatch: QueuedBatch, batchId: Id, groupId: Id, newEvents: $ReadOnlyArray<EntityUpdate>): void {
		for (const newEvent of newEvents) {
			const elementId = newEvent.instanceId
			const lastBatchForEntity = this._lastOperationForEntity.get(elementId)
			if (lastBatchForEntity == null
				|| this._processingBatch != null && this._processingBatch === lastBatchForEntity
				|| groupId !== lastBatchForEntity.groupId
			) {
				// If there's no current operation, there's nothing to merge, just add
				// If current operation is already being processed, don't modify it, we cannot merge anymore and should just append.
				newBatch.events.push(newEvent)
			} else {
				const newEntityModification = batchMod(newEvents, elementId)
				const lastEntityModification = batchMod(lastBatchForEntity.events, elementId)


				if (newEntityModification === EntityModificationType.UPDATE) {
					switch (lastEntityModification) {
						case EntityModificationType.CREATE:
						// Skip create because the create was not processed yet and we will download the updated version already
						case EntityModificationType.UPDATE:
							// Skip update because the previous update was not processed yet and we will download the updated version already
							break;
						case EntityModificationType.MOVE:
							// Leave both, as we expect MOVE to not mutate the entity
							// We will execute this twice for DELETE and CREATE but it's fine, we need both
							newBatch.events.push(newEvent)
							break;
						case EntityModificationType.DELETE:
							throw new ProgrammingError("UPDATE not allowed after DELETE")
					}
				} else if (newEntityModification === EntityModificationType.MOVE) {
					if (newEvent.operation === OperationType.DELETE) {
						// We only want to process the CREAT event of the move operation
						continue;
					}
					switch (lastEntityModification) {
						case EntityModificationType.CREATE:
							// Replace old create with new create of the move event
							this._replace(lastBatchForEntity, newEvent)
							// ignore DELETE of move operation
							break;
						case EntityModificationType.UPDATE:
							// The instance is not at the original location anymore so we cannot leave update in because we won't be able to download
							// it but we also cannot say that it just moved so we need to actually delete and create it again
							const deleteEvent = assertNotNull(getEventOfType(newEvents, OperationType.DELETE, newEvent.instanceId))
							// Replace update with delete the old location
							this._replace(lastBatchForEntity, deleteEvent)
							newBatch.events.push(newEvent)
							break;
						case EntityModificationType.MOVE:
							// Replace move with a move from original location to the final destination
							const oldDelete = assertNotNull(getEventOfType(lastBatchForEntity.events, OperationType.DELETE, newEvent.instanceId))
							this._replace(lastBatchForEntity, newEvent)
							// replace removes all events so we need to add the old delete again
							lastBatchForEntity.events.unshift(oldDelete)
							break;
						case EntityModificationType.DELETE:
							throw new ProgrammingError("MOVE not allowed after DELETE")
					}
					// skip delete in favor of create so that we don't run the same conditions twice
				} else if (newEntityModification === EntityModificationType.DELETE) {
					// find first move or delete (at different list) operation
					const firstMoveIndex = this._eventQueue.findIndex((queuedBatch) => this._processingBatch !== queuedBatch
						&& containsEventOfType(queuedBatch.events, OperationType.DELETE, elementId))
					if (firstMoveIndex !== -1) {
						// delete CREATE of first move and keep the DELETE event
						const firstMoveBatch = this._eventQueue[firstMoveIndex]
						const createEvent = getEventOfType(firstMoveBatch.events, OperationType.CREATE, elementId)
						createEvent && remove(firstMoveBatch.events, createEvent)
					} else {
						// add delete event
						newBatch.events.push(newEvent)
					}
					// delete all other events
					this.removeEventsForInstance(elementId, firstMoveIndex + 1)
				} else if (newEntityModification === EntityModificationType.CREATE) {
					if (lastEntityModification === EntityModificationType.DELETE) {
						// It is likely custom id instance which got re-created
						newBatch.events.push(newEvent)
					} else {
						throw new ProgrammingError(`Impossible modification combination ${lastEntityModification} ${newEntityModification} ${JSON.stringify(newEvent)}`)
					}
				} else {
					throw new ProgrammingError(`Impossible modification combination ${lastEntityModification} ${newEntityModification} ${JSON.stringify(newEvent)}`)
				}
			}
		}
	}


	removeEventsForInstance(elementId: Id, startIndex: number = 0): void {
		// this will remove batches with an empty event list
		findAllAndRemove(this._eventQueue, (batchInThePast) => {
			if (this._processingBatch === batchInThePast) {
				return false
			}
			// this will remove all events for the element id from the batch
			findAllAndRemove(batchInThePast.events, (event) => isSameId(event.instanceId, elementId))
			return batchInThePast.events.length === 0
		}, startIndex)
	}

	start() {
		if (this._processingBatch) {
			return
		}
		this._processNext()
	}

	queueSize(): number {
		return this._eventQueue.length
	}

	_processNext() {
		if (this._paused) {
			return
		}
		const next = this._eventQueue[0]
		if (next) {
			this._processingBatch = next
			this._queueAction(next)
			    .then(() => {
				    this._eventQueue.shift()
				    this._processingBatch = null
				    // When we are done with the batch, we don't want to merge with it anymore
				    for (const event of next.events) {
					    if (this._lastOperationForEntity.get(event.instanceId) === next) {
						    this._lastOperationForEntity.delete(event.instanceId)
					    }
				    }
				    this._processNext()
			    })
			    .catch((e) => {
				    // processing continues if the event bus receives a new event
				    this._processingBatch = null
				    if (!(e instanceof ServiceUnavailableError || e instanceof ConnectionError)) {
					    console.error("Uncaught EventQueue error!", e)
				    }
			    })

		}
	}

	clear() {
		this._eventQueue.splice(0)
		this._processingBatch = null
		for (const k of this._lastOperationForEntity.keys()) {
			this._lastOperationForEntity.delete(k)
		}
	}

	pause() {
		this._paused = true
	}

	resume() {
		this._paused = false
		this.start()
	}

	_replace(batch: QueuedBatch, newMod: EntityUpdate) {
		batch.events = batch.events.filter((e) => e.instanceId !== newMod.instanceId)
		batch.events.push(newMod)
	}
}
