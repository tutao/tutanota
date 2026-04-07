import Foundation

public protocol TutanotaError: Error {
	static var name: String { get }
	var message: String { get }
	var underlyingError: (any Error)? { get }
}

public struct GenericTutanotaError: TutanotaError {
	public static let name: String = TUT_ERROR_DOMAIN
	public let message: String
	public let underlyingError: (any Error)?
	public init(message: String, underlyingError: (any Error)?) {
		self.message = message
		self.underlyingError = underlyingError
	}
	public init(message: String) { self.init(message: message, underlyingError: nil) }
}
