//@flow

export type QueuedBatch = {
	events: EntityUpdate[], groupId: Id, batchId: Id
}

export class EventQueue {
	queueEvents: boolean;
	eventQueue: QueuedBatch[];
	processNextQueueElement: Function;

	constructor(processNextQueueElement: Function) {
		this.queueEvents = false
		this.eventQueue = []
		this.processNextQueueElement = processNextQueueElement
	}

	queue() {
		this.queueEvents = true
	}

	processNext() {
		this.queueEvents = false
		this.processNextQueueElement()
	}

}