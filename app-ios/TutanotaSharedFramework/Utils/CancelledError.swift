public struct CancelledError: TutanotaError {
	public static let name: String = "de.tutao.tutashared.CancelledError"
	public let message: String
	public let underlyingError: (any Error)?
	public init(message: String, underlyingError: (any Error)?) {
		self.message = message
		self.underlyingError = underlyingError
	}
	public init(message: String) { self.init(message: message, underlyingError: nil) }
}
