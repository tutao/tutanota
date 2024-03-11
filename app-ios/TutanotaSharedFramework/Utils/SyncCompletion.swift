import Foundation

/// Helper funciton to block current thread until block completes
func blockOn<A, B>(_ block: @escaping (@escaping (A, B) -> Void) -> Void) -> (A, B) {
	let semaphore = DispatchSemaphore(value: 0)
	var result: (A, B)?
	block { a, b in
		result = (a, b)
		semaphore.signal()
	}
	_ = semaphore.wait(timeout: .distantFuture)
	return result!
}
