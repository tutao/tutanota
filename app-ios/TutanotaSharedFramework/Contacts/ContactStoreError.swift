import Foundation

public struct ContactStoreError: TutanotaError {
	public static let name: String = "de.tutao.tutashared.ContactStoreError"
	public let message: String
	public let underlyingError: (any Error)?
	public init(message: String, underlyingError: (any Error)?) {
		self.message = message
		self.underlyingError = underlyingError
	}
}
