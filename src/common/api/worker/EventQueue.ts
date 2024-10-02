import { OperationType } from "../common/TutanotaConstants.js"
import { findAllAndRemove } from "@tutao/tutanota-utils"
import { ConnectionError, ServiceUnavailableError } from "../common/error/RestError.js"
import type { EntityUpdate } from "../entities/sys/TypeRefs.js"
import { ProgrammingError } from "../common/error/ProgrammingError.js"
import { ProgressMonitorDelegate } from "./ProgressMonitorDelegate.js"

export type QueuedBatch = {
	events: EntityUpdate[]
	groupId: Id
	batchId: Id
}

export const enum EntityModificationType {
	CREATE = "CREATE",
	UPDATE = "UPDATE",
	DELETE = "DELETE",
}

type QueueAction = (nextElement: QueuedBatch) => Promise<void>

/**
 * Checks which modification is applied in the given batch for the entity id.
 * @param batch entity updates of the batch.
 * @private visibleForTests
 */
export function batchMod(batchId: Id, batch: ReadonlyArray<EntityUpdate>, entityUpdate: EntityUpdate): EntityModificationType {
	for (const batchEvent of batch) {
		if (
			entityUpdate.instanceId === batchEvent.instanceId &&
			entityUpdate.instanceListId === batchEvent.instanceListId &&
			entityUpdate.application === batchEvent.application &&
			entityUpdate.type === batchEvent.type
		) {
			switch (batchEvent.operation) {
				case OperationType.CREATE:
					return EntityModificationType.CREATE

				case OperationType.UPDATE:
					return EntityModificationType.UPDATE

				case OperationType.DELETE:
					return EntityModificationType.DELETE

				default:
					throw new ProgrammingError(`Unknown operation: ${batchEvent.operation}`)
			}
		}
	}

	throw new ProgrammingError(
		`Batch does not have events for ${entityUpdate.application}/${entityUpdate.type} ${lastOperationKey(entityUpdate)}, batchId: ${batchId}`,
	)
}

// A key for _lastOperationForEntity.
// At runtime just an element id or listId/elementId.
// Adding brand for type safety.
type LastOperationKey = string & { __brand: "lastOpeKey" }

function lastOperationKey(update: EntityUpdate): LastOperationKey {
	const typeIdentifier = `${update.application}/${update.type}`
	if (update.instanceListId) {
		return `${typeIdentifier}/${update.instanceListId}/${update.instanceId}` as LastOperationKey
	} else {
		return `${typeIdentifier}/${update.instanceId}` as LastOperationKey
	}
}

export class EventQueue {
	/** Batches to process. Oldest first. */
	private readonly eventQueue: Array<QueuedBatch>
	// the last processed operation for a given entity id
	private readonly lastOperationForEntity: Map<LastOperationKey, QueuedBatch>
	private processingBatch: QueuedBatch | null
	private paused: boolean
	private progressMonitor: ProgressMonitorDelegate | null

	/**
	 * @param tag identifier to make for better log messages
	 * @param optimizationEnabled whether the queue should try to optimize events and remove unnecessary ones with the knowledge of newer ones
	 * @param queueAction which is executed for each batch. Must *never* throw.
	 */
	constructor(private readonly tag: string, private readonly optimizationEnabled: boolean, private readonly queueAction: QueueAction) {
		this.eventQueue = []
		this.lastOperationForEntity = new Map()
		this.processingBatch = null
		this.paused = false
		this.progressMonitor = null
	}

	addBatches(batches: ReadonlyArray<QueuedBatch>) {
		for (const batch of batches) {
			this.add(batch.batchId, batch.groupId, batch.events)
		}
	}

	setProgressMonitor(progressMonitor: ProgressMonitorDelegate) {
		this.progressMonitor?.completed() // make sure any old monitor does not have pending work
		this.progressMonitor = progressMonitor
	}

	/**
	 * @return whether the batch was added (not optimized away)
	 */
	add(batchId: Id, groupId: Id, newEvents: ReadonlyArray<EntityUpdate>): boolean {
		const newBatch: QueuedBatch = {
			events: [],
			groupId,
			batchId,
		}

		if (!this.optimizationEnabled) {
			newBatch.events.push(...newEvents)
		} else {
			this.optimizingAddEvents(newBatch, batchId, groupId, newEvents)
		}

		if (newBatch.events.length !== 0) {
			this.eventQueue.push(newBatch)

			for (const update of newBatch.events) {
				this.lastOperationForEntity.set(lastOperationKey(update), newBatch)
			}
		}

		// ensures that events are processed when not paused
		this.start()
		return newBatch.events.length > 0
	}

	private optimizingAddEvents(newBatch: QueuedBatch, batchId: Id, groupId: Id, newEvents: ReadonlyArray<EntityUpdate>): void {
		for (const newEvent of newEvents) {
			const lastOpKey = lastOperationKey(newEvent)
			const lastBatchForEntity = this.lastOperationForEntity.get(lastOpKey)
			if (
				lastBatchForEntity == null ||
				(this.processingBatch != null && this.processingBatch === lastBatchForEntity) ||
				groupId !== lastBatchForEntity.groupId
			) {
				// If there's no current operation, there's nothing to merge, just add
				// If current operation is already being processed, don't modify it, we cannot merge anymore and should just append.
				newBatch.events.push(newEvent)
			} else {
				const newEntityModification = batchMod(batchId, newEvents, newEvent)
				const lastEntityModification = batchMod(lastBatchForEntity.batchId, lastBatchForEntity.events, newEvent)

				if (newEntityModification === EntityModificationType.UPDATE) {
					switch (lastEntityModification) {
						case EntityModificationType.CREATE:
						// Skip create because the create was not processed yet and we will download the updated version already
						case EntityModificationType.UPDATE:
							// Skip update because the previous update was not processed yet and we will download the updated version already
							break

						case EntityModificationType.DELETE:
							throw new ProgrammingError(
								`UPDATE not allowed after DELETE. Last batch: ${lastBatchForEntity.batchId}, new batch: ${batchId}, ${newEvent.type} ${lastOpKey}`,
							)
					}
				} else if (newEntityModification === EntityModificationType.DELETE) {
					// delete all other events because they don't matter if the entity is already gone
					this.removeEventsForInstance(lastOpKey)
					// set last operation early to make sure that it's not some empty batch that is the last operation, otherwise batchMod will fail.
					// this shouldn't happen (because delete + create for the same entity in the same batch is not really a thing) and is a bit hacky,
					// but it works?
					this.lastOperationForEntity.set(lastOpKey, newBatch)
					// add delete event
					newBatch.events.push(newEvent)
				} else if (newEntityModification === EntityModificationType.CREATE) {
					if (lastEntityModification === EntityModificationType.DELETE || lastEntityModification === EntityModificationType.CREATE) {
						// It is likely custom id instance which got re-created
						newBatch.events.push(newEvent)
					} else {
						throw new ProgrammingError(
							`Impossible modification combination ${lastEntityModification} ${newEntityModification} ${JSON.stringify(newEvent)}`,
						)
					}
				} else {
					throw new ProgrammingError(
						`Impossible modification combination ${lastEntityModification} ${newEntityModification} ${JSON.stringify(newEvent)}`,
					)
				}
			}
		}
	}

	private removeEventsForInstance(operationKey: LastOperationKey, startIndex: number = 0): void {
		// We keep empty batches because we expect certain number of batches to be processed and it's easier to just keep them.
		for (let i = startIndex; i < this.eventQueue.length; i++) {
			const batchInThePast = this.eventQueue[i]
			if (this.processingBatch === batchInThePast) {
				continue
			}

			// this will remove all events for the element id from the batch
			// we keep delete events because they don't hurt generally and we also want things to be timely deleted
			findAllAndRemove(batchInThePast.events, (event) => event.operation !== OperationType.DELETE && lastOperationKey(event) === operationKey)
		}
	}

	start() {
		if (this.processingBatch) {
			return
		}

		this.processNext()
	}

	queueSize(): number {
		return this.eventQueue.length
	}

	private processNext() {
		if (this.paused) {
			return
		}

		const next = this.eventQueue[0]

		if (next) {
			this.processingBatch = next

			this.queueAction(next)
				.then(() => {
					this.eventQueue.shift()
					this.progressMonitor?.workDone(1)
					this.processingBatch = null

					// When we are done with the batch, we don't want to merge with it anymore
					for (const event of next.events) {
						const concatenatedId = lastOperationKey(event)
						if (this.lastOperationForEntity.get(concatenatedId) === next) {
							this.lastOperationForEntity.delete(concatenatedId)
						}
					}

					this.processNext()
				})
				.catch((e) => {
					console.log("EventQueue", this.tag, this.optimizationEnabled, "error", next, e)
					// processing continues if the event bus receives a new event
					this.processingBatch = null

					if (!(e instanceof ServiceUnavailableError || e instanceof ConnectionError)) {
						console.error("Uncaught EventQueue error!", e, next)
					}
				})
		}
	}

	clear() {
		this.eventQueue.splice(0)

		this.processingBatch = null

		for (const k of this.lastOperationForEntity.keys()) {
			this.lastOperationForEntity.delete(k)
		}
	}

	pause() {
		this.paused = true
	}

	resume() {
		this.paused = false
		this.start()
	}

	/** @private visibleForTesting */
	get __processingBatch(): QueuedBatch | null {
		return this.processingBatch
	}
}
