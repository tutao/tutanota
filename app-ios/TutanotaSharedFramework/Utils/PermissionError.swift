/// Thrown when we are unable to perform an action due to insufficient permissions, such as if the user denies permission to the app.
public struct PermissionError: TutanotaError {
	public static let name: String = "de.tutao.tutashared.PermissionError"
	public let message: String
	public let underlyingError: (any Error)?
	public init(message: String, underlyingError: (any Error)?) {
		self.message = message
		self.underlyingError = underlyingError
	}
	public init(message: String) { self.init(message: message, underlyingError: nil) }
}
