import stream from "mithril/stream"
import Stream from "mithril/stream"

export type OperationId = number

export type ExposedOperationProgressTracker = Pick<OperationProgressTracker, "onProgress">

/** This is a multiplexer for tracking individual async operations (unlike {@link ProgressTracker}). */
export class OperationProgressTracker {
	private readonly progressPerOp: Map<OperationId, Stream<number>> = new Map()
	private operationId = 0

	registerOperation(): { id: OperationId; progress: Stream<number>; done: () => unknown } {
		const id = this.operationId++
		const progress = stream<number>()
		this.progressPerOp.set(id, progress)
		return { id, progress, done: () => this.progressPerOp.delete(id) }
	}

	async onProgress(operation: OperationId, progressValue: number): Promise<void> {
		this.progressPerOp.get(operation)?.(progressValue)
	}
}
