/* generated file, don't edit. */


/**
 * Local import mail state, to show progress during an mail import.
 */
public struct LocalImportMailState : Codable {
	public init(
		importMailStateElementId: String,
		status: Int,
		start_timestamp: Int,
		totalMails: Int,
		successfulMails: Int,
		failedMails: Int
	) {
		self.importMailStateElementId = importMailStateElementId
		self.status = status
		self.start_timestamp = start_timestamp
		self.totalMails = totalMails
		self.successfulMails = successfulMails
		self.failedMails = failedMails
	}
	public let importMailStateElementId: String
	public let status: Int
	public let start_timestamp: Int
	public let totalMails: Int
	public let successfulMails: Int
	public let failedMails: Int
}
