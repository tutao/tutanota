/* generated file, don't edit. */


/**
 * When the error happens in the native we serialize it via this structure.
 */
public struct ErrorInfo : Codable {
	public init(
		name: String?,
		message: String?,
		stack: String?
	) {
		self.name = name
		self.message = message
		self.stack = stack
	}
	public let name: String?
	public let message: String?
	public let stack: String?
}
