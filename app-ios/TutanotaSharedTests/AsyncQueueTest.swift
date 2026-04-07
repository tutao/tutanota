import Testing
import os

@testable import TutanotaSharedFramework

struct AsyncQueueTest {
	@Test func testAsyncQueue() async throws {
		enum Event: Equatable {
			case start(label: String)
			case end(label: String)
		}
		let resultLock = OSAllocatedUnfairLock(initialState: [Event]())
		@Sendable func recordTask(label: String, action: () async -> Void) async {
			resultLock.withLock { arr in arr.append(.start(label: label)) }
			await action()
			resultLock.withLock { arr in arr.append(.end(label: label)) }
		}
		let queue = AsyncQueue()

		queue.enqueue { await recordTask(label: "1") { try? await Task.sleep(nanoseconds: 1000) } }

		queue.enqueue {
			await recordTask(label: "2") { try? await Task.sleep(nanoseconds: 100) }

		}

		queue.enqueue { await recordTask(label: "3") { try? await Task.sleep(nanoseconds: 200) } }

		queue.finish()
		await queue.waitForFinish()
		let result = resultLock.withLock { $0 }
		#expect(result == [.start(label: "1"), .end(label: "1"), .start(label: "2"), .end(label: "2"), .start(label: "3"), .end(label: "3")])
	}
}
