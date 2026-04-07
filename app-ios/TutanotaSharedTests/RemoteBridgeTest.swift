import Testing

@testable import TutanotaSharedFramework

struct RemoteBridgeTest {
	@Test func toResponseError_$_GenericTutanotaError() {
		let genericError = GenericTutanotaError(message: "")
		let responseError = genericError.toResponseError()
		#expect(responseError.name == TUT_ERROR_DOMAIN)
	}
	@Test func toResponseError_$_CancelledError() {
		let genericError = CancelledError(message: "")
		let responseError = genericError.toResponseError()
		#expect(responseError.name == CancelledError.name)
	}
	@Test func toResponseError_$_CancelledError_erased() {
		// Testing that even through we pass error through the erased function it
		// still gets the correct name.
		let genericError = CancelledError(message: "")
		let responseError = erasedResponseError(genericError)
		#expect(responseError.name == CancelledError.name)
	}
}

private func erasedResponseError(_ error: any Error) -> ResponseError { error.toResponseError() }

private func throwsSomeError() throws {
	if Int.random(in: 0...1) == 1 { throw CancelledError(message: "test") } else { throw PermissionError(message: "test", underlyingError: nil) }
}
