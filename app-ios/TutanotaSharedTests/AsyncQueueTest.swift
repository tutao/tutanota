import Testing

@testable import TutanotaSharedFramework

struct AsyncQueueTest {
	@Test func testAsyncQueue() async throws {
		let queue = AsyncQueue()
		enum Event: Equatable {
			case start(label: String)
			case end(label: String)
		}
		var result = [Event]()

		queue.enqueue {
			result.append(.start(label: "1"))
			try? await Task.sleep(nanoseconds: 1000)
			result.append(.end(label: "1"))
		}

		queue.enqueue {
			result.append(.start(label: "2"))
			try? await Task.sleep(nanoseconds: 100)
			result.append(.end(label: "2"))

		}

		queue.enqueue {
			result.append(.start(label: "3"))
			try? await Task.sleep(nanoseconds: 200)
			result.append(.end(label: "3"))
		}

		queue.finish()
		await queue.waitForFinish()

		#expect(result == [.start(label: "1"), .end(label: "1"), .start(label: "2"), .end(label: "2"), .start(label: "3"), .end(label: "3")])
	}
}
