/* generated file, don't edit. */


/**
 * Result of the download operation done via native. 'suspensionTime' is from either 'Retry-After' or 'Suspension-Time' headers.
 */
public struct DownloadTaskResponse : Codable {
	public init(
		statusCode: Int,
		errorId: String?,
		precondition: String?,
		suspensionTime: String?,
		encryptedFileUri: String?
	) {
		self.statusCode = statusCode
		self.errorId = errorId
		self.precondition = precondition
		self.suspensionTime = suspensionTime
		self.encryptedFileUri = encryptedFileUri
	}
	public let statusCode: Int
	public let errorId: String?
	public let precondition: String?
	public let suspensionTime: String?
	public let encryptedFileUri: String?
}
