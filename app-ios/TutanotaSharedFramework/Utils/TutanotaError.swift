import Foundation

open class TutanotaError: Error {
	public let message: String
	public let underlyingError: Error?

	public init(message: String, underlyingError: Error?) {
		self.message = message
		self.underlyingError = underlyingError
	}

	public convenience init(message: String) { self.init(message: message, underlyingError: nil) }

	open var name: String { get { TUT_ERROR_DOMAIN } }

	open var localizedDescription: String { get { message } }
}
