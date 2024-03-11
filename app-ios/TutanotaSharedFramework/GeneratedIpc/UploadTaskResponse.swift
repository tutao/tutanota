/* generated file, don't edit. */


/**
 * Result of the file upload operation done via native. 'suspensionTime' is from either 'Retry-After' or 'Suspension-Time' headers.
 */
public struct UploadTaskResponse : Codable {
	public init(
		statusCode: Int,
		errorId: String?,
		precondition: String?,
		suspensionTime: String?,
		responseBody: DataWrapper
	) {
		self.statusCode = statusCode
		self.errorId = errorId
		self.precondition = precondition
		self.suspensionTime = suspensionTime
		self.responseBody = responseBody
	}
	public let statusCode: Int
	public let errorId: String?
	public let precondition: String?
	public let suspensionTime: String?
	public let responseBody: DataWrapper
}
