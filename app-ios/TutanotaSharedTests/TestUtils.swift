import Combine
import Mockingbird
import Testing
import XCTest

/// Make Mockingbird work with Testing framework.
/// Note: it will stop reporting failures for XCTests so you shoudln't mix XCTest and Testing tests in one test target!
func initMockingbird() {
	struct SwiftTestFailer: TestFailer {
		func fail(message: String, isFatal: Bool, file: StaticString, line: UInt) {
			// swiftlint:disable optional_data_string_conversion
			let filename = file.withUTF8Buffer { String(decoding: $0, as: UTF8.self) }
			// swiftlint:enable optional_data_string_conversion
			Issue.record(
				Comment(stringLiteral: message),
				sourceLocation: Testing.SourceLocation(fileID: filename, filePath: filename, line: Int(line), column: 0)
			)
			if isFatal { fatalError(message) }
		}
	}

	// FIXME: we need to fix up all the other tests
	swizzleTestFailer(SwiftTestFailer())
}

struct ResolvableFuture {
	private let future: Future<Void, Never>
	private let promise: Future<Void, Never>.Promise

	init() {
		var promise: Future<Void, Never>.Promise!
		let future = Future { p in promise = p }
		self.future = future
		self.promise = promise
	}

	var value: Void { get async { await self.future.value } }

	func resolve() { self.promise(.success(())) }
}

/// A matcher for the Dictionary because the default collection matcher compares by reference
func dict<K, V>(containing entries: (key: K, value: V)...) -> [K: V] where K: Hashable, K: Equatable, V: Equatable {
	any(Dictionary<K, V>.self, where: { collection in entries.allSatisfy { entry in collection.contains { entry == $0 } } })
}
