import XCTest

func TUTAssertThrowsErrorAsync<T>(
	_ expression: @autoclosure () async throws -> T,
	_ message: @autoclosure () -> String = "",
	file: StaticString = #filePath,
	line: UInt = #line,
	_ errorHandler: (_ error: any Error) -> Void = { _ in }
) async {
	do {
		_ = try await expression()
		XCTFail(message(), file: file, line: line)
	} catch { errorHandler(error) }
}
