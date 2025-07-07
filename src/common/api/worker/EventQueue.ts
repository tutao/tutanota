import { ConnectionError, ServiceUnavailableError } from "../common/error/RestError.js"
import { ProgressMonitorDelegate } from "./ProgressMonitorDelegate.js"
import { EntityUpdateData } from "../common/utils/EntityUpdateUtils"
import { purgeSyncMetrics, syncMetrics } from "./utils/SyncMetrics"

export type QueuedBatch = {
	events: readonly EntityUpdateData[]
	groupId: Id
	batchId: Id
}

type WritableQueuedBatch = QueuedBatch & { events: EntityUpdateData[] }

type QueueAction = (nextElement: QueuedBatch) => Promise<void>

export class EventQueue {
	/** Batches to process. Oldest first. */
	public readonly eventQueue: Array<WritableQueuedBatch>
	private processingBatch: QueuedBatch | null
	private paused: boolean
	private progressMonitor: ProgressMonitorDelegate | null
	private emptyQueueEventTarget: EventTarget

	/**
	 * @param tag identifier to make for better log messages
	 * @param queueAction which is executed for each batch. Must *never* throw.
	 */
	constructor(
		private readonly tag: string,
		private readonly queueAction: QueueAction,
	) {
		this.eventQueue = []
		this.processingBatch = null
		this.paused = false
		this.progressMonitor = null
		this.emptyQueueEventTarget = new EventTarget()
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
	add(batchId: Id, groupId: Id, newEvents: ReadonlyArray<EntityUpdateData>): boolean {
		const newBatch: WritableQueuedBatch = {
			events: [],
			groupId,
			batchId,
		}

		newBatch.events.push(...newEvents)

		if (newBatch.events.length !== 0) {
			this.eventQueue.push(newBatch)
		}

		// ensures that events are processed when not **paused**
		this.start()
		return newBatch.events.length > 0
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

					// do this *before* processNext() is called
					this.processNext()
				})
				.catch((e) => {
					console.log("EventQueue", this.tag, "error", next, e)
					// processing continues if the event bus receives a new event
					this.processingBatch = null

					if (!(e instanceof ServiceUnavailableError || e instanceof ConnectionError)) {
						console.error("Uncaught EventQueue error!", e, next)
					}
				})
		} else {
			this.emptyQueueEventTarget.dispatchEvent(new Event("queueempty"))
			if (this.tag == "ws_opt" && syncMetrics) {
				console.log(syncMetrics.getResults())
				purgeSyncMetrics()
			}
		}
	}

	clear() {
		this.eventQueue.splice(0)

		this.processingBatch = null
	}

	pause() {
		this.paused = true
	}

	resume() {
		this.paused = false
		this.start()
	}

	async waitForEmptyQueue(): Promise<void> {
		if (this.processingBatch == null) {
			return
		}
		await new Promise<void>((resolve) => this.emptyQueueEventTarget.addEventListener("queueempty", () => resolve(), { once: true }))
	}

	/** @private visibleForTesting */
	get __processingBatch(): QueuedBatch | null {
		return this.processingBatch
	}

	getProgressMonitor() {
		return this.progressMonitor
	}
}
