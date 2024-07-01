import stream from "mithril/stream"
import Stream from "mithril/stream"

export type OperationId = number

export type ExposedOperationProgressTracker = Pick<OperationProgressTracker, "onProgress">

/**
 * This is a multiplexer for tracking individual remote async operations.
 * Unlike {@link ProgressTracker} does not accumulate the progress and doesn't compute the percentage from units of work.
 *
 * progress is tracked with numbers between 0 and 100
 */
export class OperationProgressTracker {
	private readonly progressPerOp: Map<OperationId, Stream<number>> = new Map()
	private operationId = 0

	/**
	 * Prepares a new operation and gives a handle for it which contains:
	 *   - id for sending updates
	 *   - progress, a stream to observe
	 *   - done, a handle to stop tracking the operation progress
	 */
	startNewOperation(): { id: OperationId; progress: Stream<number>; done: () => unknown } {
		const id = this.operationId++
		const progress = stream<number>(0)
		this.progressPerOp.set(id, progress)
		return { id, progress, done: () => this.progressPerOp.delete(id) }
	}

	/** Updates the progress for {@param operation} with {@param progressValue}. */
	async onProgress(operation: OperationId, progressValue: number): Promise<void> {
		this.progressPerOp.get(operation)?.(progressValue)
	}
}
