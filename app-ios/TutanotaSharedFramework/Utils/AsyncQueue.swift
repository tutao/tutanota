public typealias AsyncRunnable = () async -> Void

/// A queue for async tasks.
/// Runs tasks sequentially, has unbounded buffer.
public class AsyncQueue {
	private let stream: AsyncStream<AsyncRunnable>
	private let continuation: AsyncStream<AsyncRunnable>.Continuation
	private let task: Task<Void, Never>

	public init() {
		var continuation: AsyncStream<AsyncRunnable>.Continuation!
		let stream = AsyncStream<AsyncRunnable> { cont in continuation = cont }
		self.continuation = continuation

		let task = Task { for await runnable in stream { await runnable() } }
		self.stream = stream
		self.task = task
	}

	public func enqueue(_ runnable: @escaping AsyncRunnable) { self.continuation.yield(runnable) }

	public func finish() { self.continuation.finish() }

	public func waitForFinish() async { await self.task.value }

	deinit { self.task.cancel() }
}
